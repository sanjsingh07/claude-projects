import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerSchema,
  settingsSchema,
  inventoryItemSchema,
  identifySchema,
} from './schemas';

test('registerSchema rejects a short password', () => {
  const r = registerSchema.safeParse({ email: 'a@b.com', password: 'short' });
  assert.equal(r.success, false);
});

test('registerSchema accepts a valid pair and trims the email', () => {
  const r = registerSchema.safeParse({ email: '  a@b.com ', password: 'longenough' });
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.email, 'a@b.com');
});

test('settingsSchema rejects an unknown key (no mass assignment)', () => {
  const r = settingsSchema.safeParse({ isAdmin: true });
  assert.equal(r.success, false);
});

test('settingsSchema allows a partial update with a legitimate 0% fee', () => {
  const r = settingsSchema.safeParse({ defaultFee: 0 });
  assert.equal(r.success, true);
});

test('settingsSchema rejects an out-of-range fee', () => {
  const r = settingsSchema.safeParse({ defaultFee: 250 });
  assert.equal(r.success, false);
});

test('inventoryItemSchema rejects an unknown verdict', () => {
  const r = inventoryItemSchema.safeParse({ verdict: 'MAYBE' });
  assert.equal(r.success, false);
});

test('inventoryItemSchema accepts null sold fields (not recorded)', () => {
  const r = inventoryItemSchema.safeParse({
    status: 'Sold',
    soldPrice: null,
    actualFeesPaid: null,
    sourceLocation: null,
  });
  assert.equal(r.success, true);
});

test('inventoryItemSchema accepts a recorded $0 fee distinct from null', () => {
  const r = inventoryItemSchema.safeParse({ status: 'Sold', actualFeesPaid: 0 });
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.actualFeesPaid, 0);
});

test('identifySchema requires either image or productName', () => {
  assert.equal(identifySchema.safeParse({}).success, false);
  assert.equal(identifySchema.safeParse({ productName: 'Sony WH-1000XM5' }).success, true);
  assert.equal(identifySchema.safeParse({ image: 'base64data' }).success, true);
});
