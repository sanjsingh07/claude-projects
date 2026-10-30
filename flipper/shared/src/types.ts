// Domain types shared by the Express backend and the Expo client.
//
// These were previously duplicated by hand on both sides — InventoryItem lived
// verbatim in both inventoryService.ts and database/db.ts, and the two copies
// had already begun to drift. A single definition here is the thing that stops
// the client and server from disagreeing about the shape of the data they pass
// over the wire.

export interface InventoryItem {
  id: number;
  productName: string;
  category: string;
  imageUrl: string;
  condition: string;
  buyPrice: number;
  avgSoldPrice: number;
  estimatedProfit: number;
  roi: number;
  verdict: 'BUY' | 'RISKY' | 'PASS';
  status: 'Listed' | 'Sold' | 'Pending';
  createdAt: string;

  // Realized-sale fields, populated when an item is marked Sold. These are what
  // Iteration 6 analytics computes real profit/trend/sourcing from — before they
  // existed the dashboard was seeded with mockup constants. All optional: an item
  // that is still Listed or Pending carries none of them.
  soldPrice?: number | null;
  soldAt?: string | null;
  actualFeesPaid?: number | null;
  shippingCostPaid?: number | null;
  sourceLocation?: string | null;
}

export interface Settings {
  ebayActive: boolean;
  amazonActive: boolean;
  mercariActive: boolean;
  defaultFee: number;
  targetRoi: number;
  priceDrops: boolean;
  highDemand: boolean;
}

// The public shape of a user — never carries the password hash.
export interface User {
  id: number;
  email: string;
  createdAt: string;
}

// Returned by POST /auth/register and /auth/login. The client stores both
// tokens; it sends the access token as `Authorization: Bearer` and uses the
// refresh token against /auth/refresh when the access token expires.
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// One ranked identification candidate. The UI offers these as "not this?"
// choices so a wrong top guess can be corrected without re-scanning.
export interface IdentificationAlternate {
  name: string;
  score: number; // 0-1, relative strength of this candidate
}

// The result of identifying a scanned photo. `productName` is the query the
// market lookup will run; `confidence` is a real signal (web-detection match +
// whether a brand/model was found), not the old hardcoded "98% MATCH".
export interface Identification {
  productName: string;
  category: string;
  confidence: number; // 0-1
  alternates: IdentificationAlternate[];
  detectedText: string[];
  brand?: string;
  model?: string;
  isMock: boolean;
}

export interface MarketComp {
  title: string;
  price: string;
  source: string;
  date: string;
  condition?: string;
  link?: string;
  icon: string;
}

export interface MarketData {
  avgSoldPrice: number;
  lowPrice: number;
  highPrice: number;
  listingCount: number;
  thumbnail: string;
  recentComps: MarketComp[];
  isMock: boolean;
  /**
   * `sold` means these are realised sale prices. `asking` means they are
   * current listing prices, which run systematically higher than what items
   * actually sell for — a max-buy-price derived from them is optimistic.
   * Never present `asking` data to the user as a sold comp.
   */
  priceBasis: 'sold' | 'asking' | 'none';
  error?: string;
}

export interface CalculationResult {
  maxBuyPrice: number;
  estimatedProfit: number;
  roi: number;
  verdict: 'BUY' | 'RISKY' | 'PASS';
  confidence: 'Strong' | 'Medium' | 'Weak';
  velocity: string;
  breakdown: {
    avgSold: number;
    fees: number;
    shipping: number;
    targetProfit: number;
    purchaseCost: number;
  };
}
