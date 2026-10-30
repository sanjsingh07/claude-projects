import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError } from '../services/ApiClient';
import type { InventoryItem } from '@flipper/shared';

// The AsyncStorage cache is keyed per user so one account's vault can't leak into
// another's on the same device. The active key is set by AuthContext on login and
// cleared on logout; before login it falls back to an anon bucket that never holds
// real data (every data call requires a token anyway).
let cacheKey = '@inventory_items:anon';
export const setInventoryCacheScope = (userId: number | null) => {
  cacheKey = userId ? `@inventory_items:${userId}` : '@inventory_items:anon';
};

export const initDatabase = async () => {
  return true;
};

// InventoryItem now lives in @flipper/shared, one definition shared with the
// backend. Re-exported here so existing callers (`import { InventoryItem } from
// '../database/db'`) keep working unchanged. babel-preset-expo erases both the
// type import and this re-export at runtime.
export type { InventoryItem };

export const saveItem = async (item: Partial<InventoryItem>): Promise<number> => {
  try {
    // ApiClient attaches the auth token and refreshes on 401. On success, keep the
    // local cache in sync so an offline read shows the latest.
    const data = await api.post<InventoryItem>('/inventory', item);
    const existingItems = await getItemsFromLocal();
    const updatedItems = [data, ...existingItems.filter(i => i.id !== data.id)];
    await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedItems));
    return data.id;
  } catch (error) {
    console.warn('Backend sync failed, saving locally:', error);
  }

  // Local fallback. The server assigns the real bigserial id; this Date.now() id
  // is a temporary local-only marker until the next successful sync overwrites it.
  const existingItems = await getItemsFromLocal();
  const newItem = {
    ...item,
    id: item.id || Date.now(),
    status: item.status || 'Listed',
    createdAt: item.createdAt || new Date().toISOString()
  } as InventoryItem;

  const existingIndex = existingItems.findIndex(i => i.id === newItem.id);
  const updatedItems = [...existingItems];
  if (existingIndex > -1) {
    updatedItems[existingIndex] = newItem;
  } else {
    updatedItems.unshift(newItem);
  }

  await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedItems));
  return newItem.id;
};

export const getItems = async (): Promise<InventoryItem[]> => {
  let backendError: unknown = null;
  try {
    const data = await api.get<InventoryItem[]>('/inventory');
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn('Failed to fetch from backend, loading local cache:', error);
    backendError = error;
  }

  // Offline-first: if we have a cached copy, prefer showing it over an error.
  const cached = await getItemsFromLocal();
  if (cached.length > 0) {
    return cached;
  }

  // Backend unreachable AND no cache. Throw so the caller can render a real
  // "can't reach server" state instead of a false "empty vault" — the two were
  // previously indistinguishable, which is exactly what this fixes.
  throw backendError ?? new Error('Inventory unavailable and no local cache present.');
};

const getItemsFromLocal = async (): Promise<InventoryItem[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(cacheKey);
    if (jsonValue !== null) {
      return JSON.parse(jsonValue);
    }
    return [];
  } catch (error) {
    console.error('Error fetching local items:', error);
    return [];
  }
};

export const deleteItem = async (id: number): Promise<boolean> => {
  try {
    await api.del<{ success: boolean }>(`/inventory/${id}`);
    const existingItems = await getItemsFromLocal();
    const updatedItems = existingItems.filter(item => item.id !== id);
    await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedItems));
    return true;
  } catch (error) {
    // A 404 means it's already gone server-side — treat that as success and drop
    // it from the cache. Any other error is a real failure the caller surfaces.
    if (error instanceof ApiError && error.status === 404) {
      const existingItems = await getItemsFromLocal();
      await AsyncStorage.setItem(cacheKey, JSON.stringify(existingItems.filter(i => i.id !== id)));
      return true;
    }
    console.warn('Failed to delete from backend:', error);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const data = await api.get<any>('/analytics');
    const items = await getItems(); // Fetch recent items
    return {
      totalProfit: data.hero.totalProfit,
      itemsListed: items.length,
      sellThrough: Math.round(data.secondary.sellThroughRate),
      recentScans: items.slice(0, 5)
    };
  } catch (error) {
    console.warn('Failed to fetch stats from backend, calculating from local cache:', error);
  }

  // Local calculation fallback
  const items = await getItemsFromLocal();
  const totalProfit = items.reduce((sum, item) => sum + (item.estimatedProfit || 0), 0);
  const itemsListed = items.length;
  const soldItems = items.filter(i => i.status === 'Sold').length;
  const sellThrough = itemsListed > 0 ? Math.round((soldItems / itemsListed) * 100) : 0;

  return {
    totalProfit,
    itemsListed,
    sellThrough,
    recentScans: items.slice(0, 5)
  };
};
