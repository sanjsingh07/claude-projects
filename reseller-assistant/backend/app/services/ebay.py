"""eBay API service for fetching sold listings data."""
import os
from typing import Optional, List
import httpx
from app.models.schemas import eBaySearchResult, eBaySoldItem


EBAY_SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search"
EBAY_ITEM_URL = "https://api.ebay.com/buy/browse/v1/item"


class eBayService:
    """Service for querying eBay sold listings."""

    def __init__(self, app_id: Optional[str] = None, api_key: Optional[str] = None):
        self.app_id = app_id or os.getenv("EBAY_APP_ID")
        self.api_key = api_key or os.getenv("EBAY_API_KEY")
        self._access_token: Optional[str] = None
        self._token_expiry: int = 0

    async def search_sold(self, search_terms: str, category: str = None) -> eBaySearchResult:
        """
        Search eBay for sold items matching search terms.

        Args:
            search_terms: Query string for search
            category: Optional category filter

        Returns:
            eBaySearchResult with aggregated sold data
        """
        if not self.app_id:
            # Return mock data for development
            return self._mock_search_results(search_terms)

        async with httpx.AsyncClient() as client:
            # Build search query
            params = {
                "q": search_terms,
                "filter": "soldItemsOnly:true",
                "limit": 50,
            }

            headers = {
                "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
                "Authorization": f"Bearer {await self._get_token()}"
            }

            try:
                response = await client.get(
                    EBAY_SEARCH_URL,
                    params=params,
                    headers=headers,
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                return self._parse_search_results(data)
            except Exception as e:
                # Fallback to mock data on error
                return self._mock_search_results(search_terms)

    async def _get_token(self) -> str:
        """Get or refresh eBay OAuth token."""
        import time
        if self._access_token and time.time() < self._token_expiry:
            return self._access_token

        # Token request (simplified - in production use proper OAuth flow)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.ebay.com/identity/v1/oauth2/token",
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": f"Basic {self.api_key}" if self.api_key else ""
                },
                data={
                    "grant_type": "client_credentials",
                    "scope": "https://api.ebay.com/oauth/api_scope"
                }
            )
            data = response.json()
            self._access_token = data.get("access_token")
            self._token_expiry = int(time.time()) + 3500  # Token valid ~1 hour
            return self._access_token

    def _parse_search_results(self, data: dict) -> eBaySearchResult:
        """Parse eBay API response into structured result."""
        items = data.get("itemSummaries", [])

        sold_prices = []
        sold_items = []

        for item in items:
            price_str = item.get("price", {}).get("value", "0")
            try:
                price = float(price_str) if price_str else 0
            except ValueError:
                price = 0

            sold_prices.append(price)
            sold_items.append(eBaySoldItem(
                title=item.get("title", "Unknown"),
                sold_price=price,
                sold_date=item.get("soldDate", ""),
                shipping_cost=0.0
            ))

        if not sold_prices:
            return eBaySearchResult(
                total_results=0,
                avg_sold_price=0,
                median_sold_price=0,
                min_sold_price=0,
                max_sold_price=0,
                recent_sales=[]
            )

        sold_prices.sort()
        n = len(sold_prices)
        median = sold_prices[n // 2] if n % 2 == 1 else (sold_prices[n // 2 - 1] + sold_prices[n // 2]) / 2

        return eBaySearchResult(
            total_results=len(items),
            avg_sold_price=sum(sold_prices) / len(sold_prices),
            median_sold_price=median,
            min_sold_price=min(sold_prices),
            max_sold_price=max(sold_prices),
            recent_sales=sold_items[:10]  # Last 10 sales
        )

    def _mock_search_results(self, search_terms: str) -> eBaySearchResult:
        """Return mock data for development without API key."""
        import random
        import datetime

        base_price = random.uniform(15, 150)
        num_results = random.randint(5, 50)

        sold_items = []
        prices = []

        for i in range(num_results):
            price = base_price * random.uniform(0.5, 1.5)
            prices.append(price)
            sold_items.append(eBaySoldItem(
                title=f"{search_terms} - sold item {i+1}",
                sold_price=round(price, 2),
                sold_date=(datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 90))).isoformat(),
                shipping_cost=round(random.uniform(5, 15), 2)
            ))

        prices.sort()
        n = len(prices)
        median = prices[n // 2] if n % 2 == 1 else (prices[n // 2 - 1] + prices[n // 2]) / 2

        return eBaySearchResult(
            total_results=num_results,
            avg_sold_price=sum(prices) / len(prices),
            median_sold_price=median,
            min_sold_price=min(prices),
            max_sold_price=max(prices),
            active_competition=random.randint(10, 200),
            recent_sales=sold_items[:10]
        )
