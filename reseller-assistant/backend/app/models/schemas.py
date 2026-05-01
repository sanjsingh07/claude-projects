"""Pydantic models for request/response schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class VisionAnalysis(BaseModel):
    """Output from vision model analysis."""
    brand: str = Field(default="Unknown")
    category: str = Field(default="other")
    item_name: str
    search_terms: str
    era: str = Field(default="modern")
    condition_notes: str = Field(default="")
    confidence: float = Field(ge=0.0, le=1.0)


class eBaySoldItem(BaseModel):
    """Single sold item from eBay."""
    title: str
    sold_price: float
    sold_date: str
    shipping_cost: float = 0.0


class eBaySearchResult(BaseModel):
    """Aggregated eBay search results."""
    total_results: int
    avg_sold_price: float
    median_sold_price: float
    min_sold_price: float
    max_sold_price: float
    active_competition: int = 0
    recent_sales: List[eBaySoldItem] = Field(default_factory=list)


class FeeBreakdown(BaseModel):
    """Platform fee calculation."""
    platform: str
    sale_price: float
    percentage_fee: float
    fixed_fee: float
    shipping_estimate: float
    net_after_fees: float
    roi_percentage: float


class ScanResult(BaseModel):
    """Complete scan result returned to frontend."""
    vision: VisionAnalysis
    ebay_data: Optional[eBaySearchResult] = None
    fee_breakdown: Optional[FeeBreakdown] = None
    scan_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ScanHistoryItem(BaseModel):
    """Item stored in scan history."""
    scan_id: str
    item_name: str
    brand: str
    category: str
    est_value: float
    timestamp: datetime
    image_path: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
    code: str = "unknown_error"
