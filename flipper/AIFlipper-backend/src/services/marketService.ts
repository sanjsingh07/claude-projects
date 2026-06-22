import axios from 'axios';

export const getMarketData = async (query: string) => {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    console.log('SERPAPI_KEY not found. Returning mock market data.');
    return mockMarketData();
  }

  try {
    // SerpApi eBay Search parameters for Sold items
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'ebay',
        _nkw: query,
        ebay_domain: 'ebay.com',
        _lh: 1, // Sold items
        api_key: apiKey
      }
    });

    const listings = response.data.organic_results || response.data.shopping_results || [];
    
    if (listings.length === 0) {
      return {
        avgSoldPrice: 0,
        lowPrice: 0,
        highPrice: 0,
        listingCount: 0,
        thumbnail: '',
        recentComps: [],
        isMock: false,
        error: "No listings found for this item."
      };
    }

    // Extract prices and calculate average
    const prices = listings
      .map((l: any) => {
        const priceStr = l.price?.extracted || l.price?.raw || "0";
        return parseFloat(priceStr.toString().replace(/[^0-9.]/g, ''));
      })
      .filter((p: number) => p > 0);

    if (prices.length === 0) return mockMarketData();

    const avgSoldPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
    const lowPrice = Math.min(...prices);
    const highPrice = Math.max(...prices);
    
    // Extract thumbnail from first listing
    const thumbnail = listings[0]?.thumbnail || '';
    
    // Extract recent comps
    const recentComps = listings.slice(0, 3).map((l: any) => ({
      title: l.title,
      price: l.price?.raw || "$0.00",
      source: 'eBay - Sold',
      date: 'Recent',
      icon: 'shopping_bag'
    }));

    return {
      avgSoldPrice: parseFloat(avgSoldPrice.toFixed(2)),
      lowPrice: parseFloat(lowPrice.toFixed(2)),
      highPrice: parseFloat(highPrice.toFixed(2)),
      listingCount: prices.length,
      thumbnail,
      recentComps,
      isMock: false
    };
  } catch (error) {
    console.error('Market Service Error:', error);
    return mockMarketData();
  }
};

const mockMarketData = () => {
  return {
    avgSoldPrice: 240.00,
    lowPrice: 155.00,
    highPrice: 280.00,
    listingCount: 14,
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDFdhG9qGjboYErApeh6XHAdUaWDMxldPAYIjJs7FF0vTXdiT5q_0tfNGXlng6Ka-9iZr8OSd5iOfiliFDEOCEwNcIXEISSoCO8YkOYoqDq3J-t08ioWgt4udoVbVuJLWCW4ed8iaB31iynDmcXcPpBwTwwDx3o7WOD0-rcymrejLoa4drjF7ToY8058jKbSeS-9e9Cu8W8deGsB3zOrP6c6ezX0w2j_-IxpR38eR8iAu9YNj6Vu43Id7iK2b5xGSIXDqbZd3CWhoW',
    recentComps: [
      { title: 'Sony WH-1000XM5 Black...', price: '$245.00', source: 'eBay - Sold', date: '2 days ago', icon: 'shopping_bag' },
      { title: 'Sony Headphones XM5 New', price: '$242.00', source: 'StockX - Payout', date: '5 days ago', icon: 'token' },
      { title: 'Sony WH-1000XM5 Like New', price: '$215.00', source: 'Mercari - Sold', date: '1 week ago', icon: 'storefront' }
    ],
    isMock: true
  };
};
