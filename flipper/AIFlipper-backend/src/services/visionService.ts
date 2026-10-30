import 'dotenv/config';
import vision from '@google-cloud/vision';
import fs from 'fs';
import type { Identification, IdentificationAlternate } from '@flipper/shared';

// Identification via Google Vision. The old implementation made two separate
// calls (textDetection + labelDetection) and then took the product name to be
// `detectedText[0].split('\n')[0]` — the first line of OCR text. On a real
// thrift-store photo that is usually a care label or a barcode fragment, not the
// product. This rewrite:
//   - makes ONE batched annotateImage call (web + logo + text + label), halving
//     cost and latency versus two round trips;
//   - uses WEB_DETECTION (reverse image search) as the primary signal — its
//     bestGuessLabels is Google's own guess at the entity, far better resale
//     signal than a generic label like "Product";
//   - extracts a model number from OCR (the single highest-value token for an
//     eBay comp search, e.g. WH-1000XM5);
//   - returns a real confidence score and ranked alternates so the UI can offer
//     "not this?" instead of locking the user into a wrong guess.

type VisionClient = InstanceType<typeof vision.ImageAnnotatorClient>;
let client: VisionClient | null = null;

const initVision = () => {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyPath && fs.existsSync(keyPath)) {
    try {
      client = new vision.ImageAnnotatorClient();
      console.log('Vision Client initialized successfully.');
    } catch (e) {
      console.error('Failed to initialize Vision Client:', e);
      client = null;
    }
  } else {
    console.log('No Google credentials found at:', keyPath, '. Operating in MOCK MODE.');
  }
};

initVision();

// A model/style number is an alphanumeric token that contains at least one digit
// and one letter (WH-1000XM5, A1502, GA-40). Pure words (SONY) and pure numbers
// (a price, a year) are excluded — those are caught by brand/label detection and
// would only add noise to a comp search. Hyphens inside a token are kept.
const MODEL_TOKEN = /\b(?=[A-Z0-9-]*[A-Z])(?=[A-Z0-9-]*[0-9])[A-Z0-9]+(?:-[A-Z0-9]+)*\b/gi;

const extractModelNumber = (ocrText: string): string | undefined => {
  const matches = ocrText.toUpperCase().match(MODEL_TOKEN);
  if (!matches) return undefined;
  // Prefer longer tokens — "WH-1000XM5" over an incidental "5G". Require length
  // >= 4 so two-character noise ("2A", "V8") doesn't win.
  const candidates = matches.filter((m) => m.replace(/-/g, '').length >= 4);
  if (candidates.length === 0) return undefined;
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0];
};

const titleCase = (s: string): string =>
  s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

export const identifyImage = async (base64Image: string): Promise<Identification> => {
  if (!client) {
    return mockIdentification();
  }

  try {
    const request = {
      image: {
        content: base64Image.replace(/^data:image\/\w+;base64,/, ''),
      },
      features: [
        { type: 'WEB_DETECTION' as const },
        { type: 'LOGO_DETECTION' as const },
        { type: 'TEXT_DETECTION' as const },
        { type: 'LABEL_DETECTION' as const },
      ],
    };

    // One batched call for all four feature types instead of two separate calls.
    const [result] = await client.annotateImage(request);

    const web = result.webDetection ?? {};
    const logos = result.logoAnnotations ?? [];
    const labels = result.labelAnnotations ?? [];
    const textAnnotations = result.textAnnotations ?? [];

    const bestGuess = web.bestGuessLabels?.[0]?.label?.trim() || '';
    const webEntities = (web.webEntities ?? [])
      .filter((e: any) => e.description && e.description.trim().length > 0)
      .map((e: any) => ({ name: e.description!.trim(), score: e.score ?? 0 }));

    const topLogo = logos[0]?.description?.trim() || '';
    const topLabel = labels[0]?.description?.trim() || '';

    // Full OCR text lives in textAnnotations[0]; the rest are per-word boxes.
    const fullText = textAnnotations[0]?.description ?? '';
    const detectedText = textAnnotations
      .slice(1, 11)
      .map((t: any) => t.description ?? '')
      .filter(Boolean);

    const model = extractModelNumber(fullText);

    // --- Query-building priority chain ---
    // Start from the best available entity name, then enrich with a brand the
    // name doesn't already mention and the model number (the strongest comp
    // search token). This is the string the market lookup will actually run.
    const parts: string[] = [];
    const base = bestGuess || webEntities[0]?.name || topLabel || '';

    if (base) parts.push(base);

    if (topLogo && !new RegExp(`\\b${escapeRegExp(topLogo)}\\b`, 'i').test(base)) {
      parts.unshift(topLogo); // brand leads the query
    }

    if (model && !parts.some((p) => p.toUpperCase().includes(model))) {
      parts.push(model);
    }

    const productName = parts.join(' ').trim() || 'Unknown Item';
    const category = topLabel || (webEntities[0]?.name ?? 'General');

    // --- Confidence ---
    // Web-detection best-guess is the strongest signal; a matched brand or model
    // raises it further. Normalised to 0-1. No detection at all floors at ~0.1.
    const webScore = webEntities[0]?.score ?? 0;
    // webEntity scores are unbounded relevance values (often 0.5-5+); squash.
    const normalizedWeb = webScore > 0 ? Math.min(1, webScore / 2) : 0;
    let confidence = bestGuess ? Math.max(0.55, normalizedWeb) : normalizedWeb;
    if (topLogo) confidence += 0.15;
    if (model) confidence += 0.15;
    if (!bestGuess && webEntities.length === 0 && !topLabel) confidence = 0.1;
    confidence = Math.max(0.05, Math.min(0.99, confidence));

    // --- Ranked alternates (for "not this?") ---
    // Distinct candidate names other than the one we chose, best first.
    const seen = new Set([productName.toLowerCase(), base.toLowerCase()]);
    const alternates: IdentificationAlternate[] = [];
    for (const entity of webEntities) {
      const key = entity.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      alternates.push({ name: titleCase(entity.name), score: Math.min(1, entity.score / 2) });
      if (alternates.length >= 4) break;
    }

    return {
      productName,
      category,
      confidence: parseFloat(confidence.toFixed(2)),
      alternates,
      detectedText,
      brand: topLogo || undefined,
      model: model || undefined,
      isMock: false,
    };
  } catch (error) {
    console.error('Vision API Error:', error);
    return mockIdentification();
  }
};

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Kept so the UI is developable without Google credentials. `isMock` lets the
// client label these as sample results rather than presenting them as a real
// identification.
const mockIdentification = async (): Promise<Identification> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    productName: 'Sample Item (add Google Vision credentials)',
    category: 'Test Category',
    confidence: 0.1,
    alternates: [],
    detectedText: ['Sample', 'OCR', 'Text'],
    isMock: true,
  };
};
