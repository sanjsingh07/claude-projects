import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(__dirname, '../../database/settings.json');

// Initialize settings file if it doesn't exist
const initSettings = () => {
  if (!fs.existsSync(path.dirname(SETTINGS_FILE))) {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
      ebayActive: true,
      amazonActive: true,
      mercariActive: false,
      defaultFee: 13.5,
      targetRoi: 45.0,
    }));
  }
};

initSettings();

export const getSettings = () => {
  const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
  return JSON.parse(data);
};

export const updateSettings = (newSettings: any) => {
  const current = getSettings();
  const updated = { ...current, ...newSettings };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2));
  return updated;
};
