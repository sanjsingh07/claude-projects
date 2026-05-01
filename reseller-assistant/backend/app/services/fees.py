"""Fee calculation service for resale profit analysis."""
from app.models.schemas import FeeBreakdown


# Platform fee structures (as of 2024)
PLATFORM_FEES = {
    "ebay": {
        "percentage": 0.129,  # 12.9% average
        "fixed": 0.30,  # $0.30 per order
        "name": "eBay"
    },
    "poshmark": {
        "percentage": 0.20,  # 20% flat
        "fixed": 0.0,
        "name": "Poshmark"
    },
    "mercari": {
        "percentage": 0.10,  # 10%
        "fixed": 0.0,
        "name": "Mercari"
    },
    "facebook": {
        "percentage": 0.05,  # 5% for shipping, 0% for local
        "fixed": 0.0,
        "name": "Facebook Marketplace"
    }
}

# Shipping estimates by category
SHIPPING_ESTIMATES = {
    "electronics": 12.99,
    "clothing": 8.99,
    "home": 15.99,
    "collectible": 9.99,
    "other": 10.99
}


def calculate_fees(
    sale_price: float,
    platform: str = "ebay",
    category: str = "other",
    purchase_price: float = 0.0,
    custom_shipping: float = None
) -> FeeBreakdown:
    """
    Calculate platform fees and ROI for a potential sale.

    Args:
        sale_price: Expected selling price
        platform: Platform name (ebay, poshmark, mercari, facebook)
        category: Item category for shipping estimate
        purchase_price: What the item costs to acquire
        custom_shipping: Override shipping estimate

    Returns:
        FeeBreakdown with all fee components and ROI
    """
    fees = PLATFORM_FEES.get(platform, PLATFORM_FEES["ebay"])
    shipping = custom_shipping or SHIPPING_ESTIMATES.get(category, 10.99)

    # Calculate fees
    percentage_fee = sale_price * fees["percentage"]
    fixed_fee = fees["fixed"]
    total_fees = percentage_fee + fixed_fee

    # Net after all fees and shipping
    # (assuming seller pays shipping as cost)
    net_after_fees = sale_price - total_fees - shipping

    # ROI calculation
    total_cost = purchase_price if purchase_price > 0 else 0.01  # Avoid division by zero
    profit = net_after_fees - purchase_price
    roi = (profit / total_cost) * 100

    return FeeBreakdown(
        platform=fees["name"],
        sale_price=round(sale_price, 2),
        percentage_fee=round(percentage_fee, 2),
        fixed_fee=round(fixed_fee, 2),
        shipping_estimate=round(shipping, 2),
        net_after_fees=round(net_after_fees, 2),
        roi_percentage=round(roi, 2)
    )


def calculate_break_even(
    platform: str = "ebay",
    category: str = "other",
    target_roi: float = 0.0,
    custom_shipping: float = None
) -> dict:
    """
    Calculate break-even purchase price for a target sale price.

    Returns dict with max purchase price at various sale price points.
    """
    fees = PLATFORM_FEES.get(platform, PLATFORM_FEES["ebay"])
    shipping = custom_shipping or SHIPPING_ESTIMATES.get(category, 10.99)

    results = []
    for sale_price in [10, 20, 50, 100, 200, 500]:
        # net = sale_price - (sale_price * pct) - fixed - shipping
        net = sale_price * (1 - fees["percentage"]) - fees["fixed"] - shipping
        max_purchase = net / (1 + target_roi / 100)
        results.append({
            "sale_price": sale_price,
            "max_purchase": round(max(0, max_purchase), 2),
            "net_profit": round(net, 2)
        })

    return {"break_even_table": results}
