import 'dotenv/config';
import vision from '@google-cloud/vision';
import path from 'path';
import fs from 'fs';

// Initialize the client only if credentials exist
let client: any = null;

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

// Run initialization
initVision();

export const identifyImage = async (base64Image: string) => {
  // If we don't have a real client, return mock data for testing the UI
  if (!client) {
    return mockIdentification();
  }

  try {
    const request = {
      image: {
        content: base64Image.replace(/^data:image\/\w+;base64,/, ""),
      },
    };

    // Performs text detection and label detection
    const [textResults] = await client.textDetection(request);
    const [labelResults] = await client.labelDetection(request);

    const detections = textResults.textAnnotations;
    const labels = labelResults.labelAnnotations;

    const detectedText = detections?.map((text: any) => text.description) || [];
    const detectedLabels = labels?.map((label: any) => label.description) || [];

    // Simple heuristic for product name: first line of text or top label
    const productName = detectedText.length > 0 
      ? detectedText[0].split('\n')[0] 
      : detectedLabels[0] || "Unknown Item";

    return {
      productName,
      detectedText: detectedText.slice(0, 10),
      category: detectedLabels[0] || "General"
    };
  } catch (error) {
    console.error('Vision API Error:', error);
    return mockIdentification();
  }
};

const mockIdentification = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    productName: "Mock Product (Add Google API Key)",
    detectedText: ["Sample", "Text", "OCR"],
    category: "Test Category"
  };
};
