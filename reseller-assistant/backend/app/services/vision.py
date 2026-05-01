"""Vision service using Claude API for product identification."""
import base64
import json
import os
from typing import Optional
from anthropic import Anthropic
from app.models.schemas import VisionAnalysis


# Category mapping for validation
VALID_CATEGORIES = ["electronics", "clothing", "home", "collectible", "other"]

VISION_PROMPT = """You are an expert product identifier for resale research. Analyze this image and identify what object is shown.

Return a JSON object with these exact fields:
- brand: The manufacturer/brand (or "Unknown" if not identifiable)
- category: One of: electronics, clothing, home, collectible, other
- item_name: Concise 3-5 word description (e.g., "Vintage Pyrex Mixing Bowl Set")
- search_terms: eBay-optimized search query (brand + model + key descriptors, no punctuation)
- era: Decade if vintage (e.g., "1960s", "1970s") or "modern"
- condition_notes: Any visible wear, damage, or notable features
- confidence: Your confidence level 0.0-1.0

Focus on:
- Brand logos, labels, tags, or distinctive design elements
- Materials and construction quality
- Age indicators (patina, wear patterns, style cues)
- Any visible model numbers or identifying marks

Return ONLY valid JSON, no other text."""


class VisionService:
    """Service for analyzing product images with Claude."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY required for VisionService")
        self.client = Anthropic(api_key=self.api_key)

    async def analyze_image(self, image_base64: str, image_type: str = "image/jpeg") -> VisionAnalysis:
        """
        Analyze product image and return structured identification.

        Args:
            image_base64: Base64 encoded image data
            image_type: MIME type of image

        Returns:
            VisionAnalysis with identified product details
        """
        try:
            # Decode base64 for Claude
            image_data = base64.b64decode(image_base64)

            # Call Claude API
            message = self.client.messages.create(
                model="claude-sonnet-4-6-20250929",
                max_tokens=500,
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "data": base64.b64encode(image_data).decode(),
                                "media_type": image_type,
                            }
                        },
                        {
                            "type": "text",
                            "text": VISION_PROMPT
                        }
                    ]
                }]
            )

            # Parse response
            response_text = message.content[0].text

            # Extract JSON from response
            json_str = self._extract_json(response_text)
            if not json_str:
                raise ValueError("No valid JSON in response")

            data = json.loads(json_str)

            # Validate and normalize
            category = data.get("category", "other")
            if category not in VALID_CATEGORIES:
                category = "other"

            return VisionAnalysis(
                brand=data.get("brand", "Unknown"),
                category=category,
                item_name=data.get("item_name", "Unidentified Item"),
                search_terms=data.get("search_terms", "vintage item"),
                era=data.get("era", "modern"),
                condition_notes=data.get("condition_notes", ""),
                confidence=float(data.get("confidence", 0.5))
            )

        except Exception as e:
            # Return fallback analysis
            return VisionAnalysis(
                brand="Unknown",
                category="other",
                item_name="Item requiring identification",
                search_terms="vintage collectible",
                confidence=0.3
            )

    def _extract_json(self, text: str) -> Optional[str]:
        """Extract JSON object from text response."""
        # Try to find JSON object in response
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return text[start:end]
        return None
