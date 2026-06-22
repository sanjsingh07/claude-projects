import fs from 'fs';
import path from 'path';

const INVENTORY_FILE = path.join(__dirname, '../../database/inventory.json');

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

// Initial seed data from design mockups
const SEED_ITEMS: InventoryItem[] = [
  {
    id: 5,
    productName: "Nike Air Zoom",
    category: "Apparel",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBac8rmg57Y7P9mgj1bQRMJac7fHfGHFt6mYKtbR97dYNKg4UGSaFH-n7CzzkAS3SduRKjZ8TMCleW8Hly2LQiK0C1DnHb1fuiobDT32M9Q7Bp0xMBeB5UfiPKaAEJ4TUXk9VSssQBUNsmP7v5P9vB9ARICJ11P-Lwe0npSaR4qKOGN85aLx8mtd2VwOdW8gMuNB7FAwjp0cIPIekJvfwRXLzIZR9BtG6ydDyeHLL0WNnDbTqmsO9a0kcsGRkL_queW0sJvoYiITWDn",
    condition: "LIKE NEW",
    buyPrice: 50.00,
    avgSoldPrice: 110.00,
    estimatedProfit: 45.20,
    roi: 90.4,
    verdict: "BUY",
    status: "Sold",
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2m ago
  },
  {
    id: 6,
    productName: "iPhone 13 Pro Max",
    category: "Electronics",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_cPsR8O_BGUCRZJ2aJ62jmj9iC-oIYlLD486FInP56zHZSyv3HvFQzWReVlg5zj2E-1CDDI_sAVXwIlTIDrcvgdLFbVRmsvkfZy-PJu5mlBFavWvczv3oHsMpC_QVAJQ1ZzFTW7tTKLXUfjnD93zXS7ujOhmiqJfhF38mo4nDOqQ1CMqKdSGRW0c4JDCWS2GoiCdaWHJn35EDk3VEBKbpUVm4ek0a7qUVzc_Zdmv8fY27G_tegIWPSBXVLE-43lB0EPkl-oc8Frzx",
    condition: "NEW",
    buyPrice: 800.00,
    avgSoldPrice: 980.00,
    estimatedProfit: 120.00,
    roi: 15.0,
    verdict: "BUY",
    status: "Listed",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15m ago
  },
  {
    id: 7,
    productName: "Bose QC45",
    category: "Electronics",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsuLgRwRd2lMPSN_xqsiZSH0I4n9zw3Q9AhyRudFGgoZzmqxJv9-nsV3zh4eNWuoN2THJ0AsWDlpsCT6vdHdz2jEMYT6QGtJBcIy6WddXV3ZF0dLY-kHthIB2kgmZmzNzZqeP7sT36W7ryJxbr_Vpt_vJz2aK64zi8ZQP2TrKYr680iewDd2-IqlTh4UfOJbCpGjfQwWj7aR9EQCzNhXvMuGJs7cffPVdK1HsnGRJWChlVVxF_x04HNRfETIF6Gxhc77IVTcEwtg6f",
    condition: "USED",
    buyPrice: 150.00,
    avgSoldPrice: 160.00,
    estimatedProfit: -12.00,
    roi: -8.0,
    verdict: "PASS",
    status: "Listed",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1h ago
  },
  {
    id: 1,
    productName: "PlayStation 5 Pro - Limited",
    category: "Electronics",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXkQGXGNbQ8s-sOCJ2ys0XgJcPSv1tdkBSGAx2BplbMEK0vbU4ZNZlmk4PmlnkhggI8LgEnoXfEx4yNpUb2xCtrhqo2xn9SyNUWKSf-u6ckbPQ8xCL_fhRoozM-DrDRy-557VUI4MWAIesWToU2Fsdf5jqZ3rHOZZNlE2OluyYX_xF8CsyP14EnJOAxJxElCculxEkvKky0SZbUfR-MhGAd5qlhwW93kZQpKgc6ooJ460PJ83vsDkloYPeqKAbombNery1d475Wi75",
    condition: "NEW",
    buyPrice: 699.00,
    avgSoldPrice: 1150.00,
    estimatedProfit: 340.50,
    roi: 48.7,
    verdict: "BUY",
    status: "Listed",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2h ago
  },
  {
    id: 2,
    productName: "Nike Air Jordan Retro 4",
    category: "Apparel",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVptgiffCOMFh_rVkrJsgqsWdp6fEJeCX2Hv1fnfiZwmpT4IGNKBfAhaKkA2LLuCm-eWBnnRMcHFIMyFVTuJBJzXiquTdQmL7buN9YHkLFqKdvjN8tqj3fD9UF7OksFjZ62b-B417upRXn_aYGtPMOTkpHKQnkc6MILeDiZ3_yfK7KffLWQDn2G2rSV7s88-VM_7LsNskvYtr7TpCHBLH2XZaSyqFG3u_n6ALOL0q3181_SiqOIsGnM_aswDbuQjioh10dEd9SsaQo",
    condition: "LIKE NEW",
    buyPrice: 210.00,
    avgSoldPrice: 440.00,
    estimatedProfit: 185.00,
    roi: 88.1,
    verdict: "BUY",
    status: "Sold",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1d ago
  },
  {
    id: 3,
    productName: "Vintage Seiko Chronograph",
    category: "Collectibles",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6BMTXLmR8VmuebYiEImspShZsgKQeCccSduSIzoX3ZpFMMSvIFkLQTUV7q_a_9RcR-PdT5J5GBTQzDdBer2jqHAeG8IeeVjOgkagI_S6gvTXJksjJhOPbCMCqyAnGgS3qEKkKAEBfPFONmCuC9-XRMD0AOwSIjmxCwmfQMcrayA6shGY3R8jkyhEOonQiGfrDb7yXMsMgogAcz4puNB_uvHS1vohcj74AyzmvO1TjFjUBKX9nuRK3ebFn6GyUcDD-XOcThcs0auwt",
    condition: "USED",
    buyPrice: 85.00,
    avgSoldPrice: 230.00,
    estimatedProfit: 115.00,
    roi: 135.3,
    verdict: "BUY",
    status: "Pending",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3d ago
  },
  {
    id: 4,
    productName: "Logitech G Pro Keyboard",
    category: "Electronics",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBguY0cWJ7l37XuflNDA4LnsMGQxHH4z9yXAXakKjW-FnyXxMdLf4_U0fwmiYSXY8BJ1jmhp4mIC8Lu7yg5mZZvniTLlaclPhnHcGFEzxKiUkQ6UNVUGDlO2ZSMlIXxUk32QBHFWQTSPOFSU6qUfZHN1zTAmKRQm8bMQMn-G5hrV9pzRKzN6DBW8ilNLZqYhVZk1EmiK5mOnV5fTVlaz7wYpaRDuzueJzBxkvkma_BpcsixPuSFwgBM75XS43QZ67q3nu8NCo79gXTj",
    condition: "USED",
    buyPrice: 45.00,
    avgSoldPrice: 90.00,
    estimatedProfit: 35.00,
    roi: 77.8,
    verdict: "BUY",
    status: "Sold",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1w ago
  }
];

const initInventory = () => {
  const dir = path.dirname(INVENTORY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(INVENTORY_FILE)) {
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(SEED_ITEMS, null, 2));
  }
};

initInventory();

export const getInventoryItems = (): InventoryItem[] => {
  initInventory();
  const data = fs.readFileSync(INVENTORY_FILE, 'utf-8');
  return JSON.parse(data);
};

export const saveInventoryItem = (item: Partial<InventoryItem>): InventoryItem => {
  const items = getInventoryItems();
  
  const newItem: InventoryItem = {
    id: item.id || Date.now(),
    productName: item.productName || 'Unknown Item',
    category: item.category || 'General',
    imageUrl: item.imageUrl || '',
    condition: item.condition || 'LIKE NEW',
    buyPrice: item.buyPrice || 0,
    avgSoldPrice: item.avgSoldPrice || 0,
    estimatedProfit: item.estimatedProfit || 0,
    roi: item.roi || 0,
    verdict: item.verdict || 'BUY',
    status: item.status || 'Listed',
    createdAt: item.createdAt || new Date().toISOString()
  };

  const existingIndex = items.findIndex(i => i.id === newItem.id);
  if (existingIndex > -1) {
    items[existingIndex] = newItem;
  } else {
    items.unshift(newItem);
  }

  fs.writeFileSync(INVENTORY_FILE, JSON.stringify(items, null, 2));
  return newItem;
};

export const deleteInventoryItem = (id: number): boolean => {
  const items = getInventoryItems();
  const filtered = items.filter(i => i.id !== id);
  if (items.length === filtered.length) {
    return false;
  }
  fs.writeFileSync(INVENTORY_FILE, JSON.stringify(filtered, null, 2));
  return true;
};
