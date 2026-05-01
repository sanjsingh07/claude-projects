/** Custom hook for managing scan workflow state */
import { useState, useCallback } from 'react';
import { scanImage, saveToHistory, ScanResult, ScanHistoryItem } from '../lib/api';

export type ScanStatus = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';

export interface UseScanResult {
  status: ScanStatus;
  result: ScanResult | null;
  error: string | null;
  scanImageFile: (file: File, purchasePrice?: number) => Promise<void>;
  reset: () => void;
}

export function useScan(): UseScanResult {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanImageFile = useCallback(async (file: File, purchasePrice: number = 0) => {
    try {
      setStatus('uploading');
      setError(null);
      setResult(null);

      // Convert file to base64 for preview
      const reader = new FileReader();

      const scanPromise = scanImage(file, purchasePrice);

      setStatus('analyzing');
      const scanResult = await scanPromise;

      setResult(scanResult);
      setStatus('complete');

      // Save to history
      const historyItem: ScanHistoryItem = {
        scan_id: scanResult.scan_id,
        item_name: scanResult.vision.item_name,
        brand: scanResult.vision.brand,
        category: scanResult.vision.category,
        est_value: scanResult.fee_breakdown?.net_after_fees || 0,
        timestamp: scanResult.timestamp,
      };
      saveToHistory(historyItem);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    result,
    error,
    scanImageFile,
    reset,
  };
}
