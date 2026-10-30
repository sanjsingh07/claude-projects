import { z } from 'zod';

// Runtime validation for every write endpoint. TypeScript checks the code that
// handles req.body, but req.body itself is `any` off the wire — nothing stopped
// a client sending a string where a number belongs, an unknown verdict, or a
// 5MB notes field. These schemas are the runtime counterpart to the shared
// types: a request that doesn't match is rejected with 400 before it reaches a
// service, so the services can trust their inputs.
//
// `.strict()` is deliberate on settings/inventory: an unknown key is a client
// bug or an injection attempt, not something to silently drop. Auth stays
// non-strict so a future field on the login form doesn't 400 older clients.

const money = z.number().finite().nonnegative();
const moneyNullable = money.nullable();

export const registerSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// Every field optional: /settings is a partial update that merges over the
// stored row (see settingsService.updateSettings). Ranges match the clamps the
// service already applies, so an out-of-range value is a 400 rather than a
// silent clamp — the client learns it sent something wrong.
export const settingsSchema = z
  .object({
    ebayActive: z.boolean(),
    amazonActive: z.boolean(),
    mercariActive: z.boolean(),
    defaultFee: z.number().finite().min(0).max(100),
    targetRoi: z.number().finite().min(0).max(1000),
    priceDrops: z.boolean(),
    highDemand: z.boolean(),
  })
  .partial()
  .strict();

const VERDICTS = ['BUY', 'RISKY', 'PASS'] as const;
const STATUSES = ['Listed', 'Sold', 'Pending'] as const;

// Mirrors the shared InventoryItem. Client-computed fields (buyPrice, roi, ...)
// are validated as numbers; the service still re-derives what it must. id is
// optional (present only when editing). The sold_* fields are the Iteration 6
// realized-sale capture — nullable because "not recorded" is distinct from 0.
export const inventoryItemSchema = z
  .object({
    id: z.number().int().positive(),
    productName: z.string().trim().min(1).max(300),
    category: z.string().trim().max(120),
    imageUrl: z.string().max(2048),
    condition: z.string().trim().max(60),
    buyPrice: money,
    avgSoldPrice: money,
    estimatedProfit: z.number().finite(),
    roi: z.number().finite(),
    verdict: z.enum(VERDICTS),
    status: z.enum(STATUSES),
    createdAt: z.string().max(40),
    soldPrice: moneyNullable,
    soldAt: z.string().max(40).nullable(),
    actualFeesPaid: moneyNullable,
    shippingCostPaid: moneyNullable,
    sourceLocation: z.string().trim().max(200).nullable(),
  })
  .partial()
  .strict();

// /identify accepts either a base64 image (fresh scan) or a productName (manual
// entry / "not this?" correction). Exactly the two shapes the route handles.
export const identifySchema = z
  .object({
    image: z.string().min(1).max(15_000_000),
    productName: z.string().trim().min(1).max(300),
  })
  .partial()
  .refine((v) => !!v.image || !!v.productName, {
    message: 'Provide either an image or a productName',
  });

export const generateListingSchema = z.object({
  productName: z.string().trim().min(1).max(300),
  category: z.string().trim().max(120).optional(),
  condition: z.string().trim().max(60).optional(),
});
