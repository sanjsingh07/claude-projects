"""Scan route handlers."""
import uuid
import base64
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.models.schemas import ScanResult, VisionAnalysis, FeeBreakdown
from app.services.vision import VisionService
from app.services.ebay import eBayService
from app.services.fees import calculate_fees

router = APIRouter(prefix="/api/scan", tags=["scan"])

# Global services (initialized on first use)
_vision_service: VisionService = None
_ebay_service: eBayService = None


def get_vision_service() -> VisionService:
    global _vision_service
    if _vision_service is None:
        _vision_service = VisionService()
    return _vision_service


def get_ebay_service() -> eBayService:
    global _ebay_service
    if _ebay_service is None:
        _ebay_service = eBayService()
    return _ebay_service


@router.post("/", response_model=ScanResult)
async def scan_item(
    image: UploadFile = File(...),
    purchase_price: float = Form(default=0.0)
):
    """
    Analyze an item image and return pricing data.

    1. Image is sent to vision model for identification
    2. Search terms are used to query eBay sold listings
    3. Fees are calculated for ROI estimation
    """
    # Read and encode image
    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image file")

    image_base64 = base64.b64encode(contents).decode()
    image_type = image.content_type or "image/jpeg"

    try:
        # Step 1: Vision analysis
        vision_service = get_vision_service()
        vision_result = await vision_service.analyze_image(image_base64, image_type)

        # Check confidence threshold
        if vision_result.confidence < 0.3:
            raise HTTPException(
                status_code=400,
                detail="Could not identify item with sufficient confidence"
            )

        # Step 2: eBay sold data
        ebay_service = get_ebay_service()
        ebay_data = await ebay_service.search_sold(
            search_terms=vision_result.search_terms,
            category=vision_result.category
        )

        # Step 3: Fee calculation (use median sold price as estimate)
        sale_price = ebay_data.median_sold_price if ebay_data.median_sold_price > 0 else 0
        fee_breakdown = None
        if sale_price > 0:
            fee_breakdown = calculate_fees(
                sale_price=sale_price,
                platform="ebay",
                category=vision_result.category,
                purchase_price=purchase_price
            )

        return ScanResult(
            vision=vision_result,
            ebay_data=ebay_data,
            fee_breakdown=fee_breakdown,
            scan_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


@router.get("/health")
async def health_check():
    """Check if scan service is available."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
