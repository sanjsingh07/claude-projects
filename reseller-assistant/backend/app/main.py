"""
Visual AI Reseller Pricing Assistant - Backend API

A FastAPI application that provides image-based product identification
and marketplace price research for resellers.
"""
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.scan import router as scan_router
from app.middleware.rate_limit import RateLimitMiddleware

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Reseller Pricing Assistant API",
    description="AI-powered product identification and price research for resellers",
    version="0.1.0"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting (free tier: 10 scans per day)
free_tier_limit = int(os.getenv("FREE_TIER_LIMIT", "10"))
app.add_middleware(RateLimitMiddleware, limit=free_tier_limit)

# Include routers
app.include_router(scan_router)


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "Reseller Pricing Assistant API",
        "version": "0.1.0",
        "endpoints": {
            "scan": "/api/scan/",
            "health": "/api/scan/health",
            "docs": "/docs"
        }
    }


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


# Main entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
