import { Router } from 'express';
import { identifyProduct } from '../services/visionService';
import { lookupPrice } from '../services/priceService';
import { analyzeDeal } from '../services/analysisService';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // 1. Identify product
    const productInfo = await identifyProduct(imageBuffer);
    if (!productInfo) {
      return res.status(500).json({ error: 'Failed to identify product' });
    }

    // 2. Lookup price
    const pricing = await lookupPrice(productInfo.productName);

    // 3. Analyze deal
    const analysis = analyzeDeal(pricing.avgPrice);

    res.json({
      product: productInfo,
      pricing,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Scan Route Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/generate-listing', async (req, res) => {
  try {
    const { productName, condition, brand } = req.body;
    if (!productName) {
      return res.status(400).json({ error: 'Product name required' });
    }

    const prompt = `You are a professional flipper and expert eBay seller. Write an extremely optimized, high-converting listing title and product description for the following item:
Product Name: ${productName}
Brand: ${brand || 'N/A'}
Condition: ${condition || 'Like New'}

Requirements:
1. Title must be under 80 characters, keyword-rich, and eye-catching.
2. Description should be professional, outline key features, specify condition details accurately, and encourage fast purchase.
3. Return the response as a JSON object with 'title', 'description', and 'tags' (array of strings).`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: "You are an expert e-commerce copywriter." }, { role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    res.json(content ? JSON.parse(content) : { title: productName, description: `Excellent ${condition} ${productName}.`, tags: [] });
  } catch (error) {
    console.error('Generate Listing Error:', error);
    res.json({
      title: `🔥 ${productName} - ${condition || 'Great Condition'}!`,
      description: `High-quality ${productName} by ${brand || 'brand'}. Condition is ${condition || 'Used'}. Shipped securely and fast!`,
      tags: ['electronics', 'resell', 'flip']
    });
  }
});

export default router;
