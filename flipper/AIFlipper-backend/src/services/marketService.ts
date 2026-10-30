import axios from 'axios';
import { MarketComp, MarketData } from '@flipper/shared';

// SerpApi's eBay engine returns price as either a single value or a range.
// Ranges have no top-level `extracted`, so the single-value path alone drops
// every auction and multi-variant listing from the sample.
const extractPrice = (price: any): number | null => {
  if (!price) return null;

  if (typeof price.extracted === 'number' && Number.isFinite(price.extracted) && price.extracted > 0) {
    return price.extracted;
  }

  const from = typeof price.from?.extracted === 'number' ? price.from.extracted : null;
  const to = typeof price.to?.extracted === 'number' ? price.to.extracted : null;
  if (from !== null && to !== null) return (from + to) / 2;
  if (from !== null) return from;
  if (to !== null) return to;

  return parseRawPrice(price.raw) ?? parseRawPrice(price.from?.raw);
};

// Stripping every non-digit turns "$24.60 to $30.00" into "24.6030.00" -> 24.603,
// and "€1.234,56" into "1.234.56" -> 1.23. Both are wrong finite numbers, so a
// `> 0` filter keeps them. Reject anything that isn't a single unambiguous value.
const parseRawPrice = (raw: unknown): number | null => {
  if (typeof raw !== 'string') return null;
  if (/\bto\b|--|–|—/i.test(raw)) return null;

  const cleaned = raw.replace(/[^0-9.]/g, '');
  if ((cleaned.match(/\./g) || []).length > 1) return null;

  const value = parseFloat(cleaned);
  return Number.isFinite(value) && value > 0 ? value : null;
};

// A single mispriced listing (a "for parts" shell, a bundle of ten) moves a mean
// enough to flip the verdict. Median resists that; trimming the tails resists it
// further once the sample is large enough for trimming to be meaningful.
const trimmedMedian = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const trim = sorted.length >= 10 ? Math.floor(sorted.length * 0.1) : 0;
  const kept = trim > 0 ? sorted.slice(trim, sorted.length - trim) : sorted;

  const mid = Math.floor(kept.length / 2);
  return kept.length % 2 === 0 ? (kept[mid - 1] + kept[mid]) / 2 : kept[mid];
};

const round2 = (value: number): number => parseFloat(value.toFixed(2));

const SERPAPI_TIMEOUT_MS = 25000;

/**
 * Whether to attempt a sold-listings lookup before falling back to asking prices.
 *
 * Off by default, and deliberately so. `show_only=Sold` is the correct and only
 * documented sold filter, but as of this writing SerpApi's eBay engine returns
 * zero results for it on every query tested ("We couldn't get valid results for
 * this search"), and the attempt takes 60-90s before failing. eBay has been
 * restricting sold-listing access. Turning this on today buys nothing and makes
 * every scan unusably slow.
 *
 * Set SERPAPI_TRY_SOLD=true to re-test — if SerpApi's sold path recovers, sold
 * comps are strictly better input than asking prices and this should become the
 * default again.
 */
const TRY_SOLD_FIRST = process.env.SERPAPI_TRY_SOLD === 'true';

const searchEbay = async (query: string, apiKey: string, soldOnly: boolean) => {
  const params: Record<string, string | number> = {
    engine: 'ebay',
    _nkw: query,
    ebay_domain: 'ebay.com',
    _ipg: 60, // Widen the sample; the default page is small.
    api_key: apiKey
  };

  // The previous `_lh: 1` is not a parameter of this engine at all — SerpApi
  // dropped it silently and returned active listings, so every price in the app
  // was an asking price presented to the user as "eBay - Sold".
  if (soldOnly) params.show_only = 'Sold';

  return axios.get('https://serpapi.com/search.json', { params, timeout: SERPAPI_TIMEOUT_MS });
};

export const getMarketData = async (query: string): Promise<MarketData> => {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    return mockMarketData('SERPAPI_KEY is not configured — showing sample data, not real comps.');
  }

  let listings: any[] = [];
  let priceBasis: 'sold' | 'asking' = 'sold';

  if (TRY_SOLD_FIRST) {
    try {
      const soldResponse = await searchEbay(query, apiKey, true);
      listings = soldResponse.data?.organic_results ?? [];
    } catch {
      // Fall through to asking prices rather than failing the whole scan.
      listings = [];
    }
  }

  if (listings.length === 0) {
    priceBasis = 'asking';
    try {
      const activeResponse = await searchEbay(query, apiKey, false);
      listings = activeResponse.data?.organic_results ?? [];
    } catch (error) {
      return mockMarketData(describeRequestFailure(error));
    }
  }

  if (listings.length === 0) {
    return emptyMarketData('No eBay listings found for this item.');
  }

  const prices = listings
    .map((listing) => extractPrice(listing.price))
    .filter((price): price is number => price !== null);

  if (prices.length === 0) {
    return {
      ...emptyMarketData('Found listings but could not read a usable price from any of them.'),
      thumbnail: listings[0]?.thumbnail ?? ''
    };
  }

  const sourceLabel = priceBasis === 'sold' ? 'eBay - Sold' : 'eBay - Asking';

  const recentComps: MarketComp[] = listings.slice(0, 3).map((listing) => ({
    title: listing.title ?? 'Untitled listing',
    price: listing.price?.raw ?? formatPrice(extractPrice(listing.price)),
    source: sourceLabel,
    date: listing.date ?? '',
    condition: listing.condition ?? undefined,
    link: listing.link ?? undefined,
    icon: 'shopping_bag'
  }));

  return {
    avgSoldPrice: round2(trimmedMedian(prices)),
    lowPrice: round2(Math.min(...prices)),
    highPrice: round2(Math.max(...prices)),
    listingCount: prices.length,
    thumbnail: listings[0]?.thumbnail ?? '',
    recentComps,
    isMock: false,
    priceBasis,
    error: priceBasis === 'asking'
      ? 'These are current asking prices, not completed sales. Real sale prices run lower, so treat the max buy price as an optimistic ceiling.'
      : undefined
  };
};

const emptyMarketData = (error: string): MarketData => ({
  avgSoldPrice: 0,
  lowPrice: 0,
  highPrice: 0,
  listingCount: 0,
  thumbnail: '',
  recentComps: [],
  isMock: false,
  priceBasis: 'none',
  error
});

const formatPrice = (value: number | null): string =>
  value === null ? 'Price unavailable' : `$${value.toFixed(2)}`;

// A revoked key, a quota wall, and a dead network all used to collapse into the
// same fabricated Sony headphone comps. Name the failure so the app can say so.
const describeRequestFailure = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    console.error('Market Service Error:', error);
    return 'Market lookup failed unexpectedly — showing sample data, not real comps.';
  }

  const status = error.response?.status;
  if (status === 401 || status === 403) {
    console.error('Market Service: SerpApi rejected the API key.');
    return 'SerpApi rejected the API key — showing sample data, not real comps.';
  }
  if (status === 429) {
    console.error('Market Service: SerpApi rate limit or quota exhausted.');
    return 'SerpApi quota exhausted — showing sample data, not real comps.';
  }
  if (error.code === 'ECONNABORTED') {
    console.error('Market Service: SerpApi request timed out.');
    return 'Market lookup timed out — showing sample data, not real comps.';
  }

  console.error('Market Service Error:', status ?? error.code ?? error.message);
  return 'Could not reach the market data service — showing sample data, not real comps.';
};

// Kept so the UI is developable without an API key. Every caller must check
// `isMock` before presenting these numbers as real; they are not.
const mockMarketData = (error: string): MarketData => {
  console.log(`Market Service: ${error}`);

  return {
    avgSoldPrice: 240.00,
    lowPrice: 155.00,
    highPrice: 280.00,
    listingCount: 14,
    thumbnail: '',
    recentComps: [
      { title: 'Sample listing — not a real comp', price: '$245.00', source: 'Sample data', date: '', icon: 'shopping_bag' },
      { title: 'Sample listing — not a real comp', price: '$242.00', source: 'Sample data', date: '', icon: 'shopping_bag' },
      { title: 'Sample listing — not a real comp', price: '$215.00', source: 'Sample data', date: '', icon: 'shopping_bag' }
    ],
    isMock: true,
    priceBasis: 'none',
    error
  };
};
