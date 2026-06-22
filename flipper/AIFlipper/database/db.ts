import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/Config';

const STORAGE_KEY = '@inventory_items';

export const initDatabase = async () => {
  return true;
};

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
}

export const saveItem = async (item: Partial<InventoryItem>): Promise<number> => {
  try {
    // 1. Attempt to sync with backend
    const response = await fetch(`${Config.API_URL}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });

    if (response.ok) {
      const data = await response.json();
      // Keep local storage in sync as local cache
      const existingItems = await getItemsFromLocal();
      const updatedItems = [data, ...existingItems.filter(i => i.id !== data.id)];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      return data.id;
    }
  } catch (error) {
    console.warn('Backend sync failed, saving locally:', error);
  }

  // Local fallback
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
  
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
  return newItem.id;
};

export const getItems = async (): Promise<InventoryItem[]> => {
  try {
    const response = await fetch(`${Config.API_URL}/inventory`);
    if (response.ok) {
      const data = await response.json();
      // Cache in local storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (error) {
    console.warn('Failed to fetch from backend, loading local cache:', error);
  }

  return getItemsFromLocal();
};

const getItemsFromLocal = async (): Promise<InventoryItem[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
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
    const response = await fetch(`${Config.API_URL}/inventory/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      // Sync local cache
      const existingItems = await getItemsFromLocal();
      const updatedItems = existingItems.filter(item => item.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      return true;
    }
  } catch (error) {
    console.warn('Failed to delete from backend, deleting locally:', error);
  }

  try {
    const existingItems = await getItemsFromLocal();
    const updatedItems = existingItems.filter(item => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
    return true;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await fetch(`${Config.API_URL}/analytics`);
    if (response.ok) {
      const data = await response.json();
      const items = await getItems(); // Fetch recent items
      return {
        totalProfit: data.hero.totalProfit,
        itemsListed: items.length,
        sellThrough: Math.round(data.secondary.sellThroughRate),
        recentScans: items.slice(0, 5)
      };
    }
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
