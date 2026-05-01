/** Scan history component with CSV export */
import React from 'react';
import { ScanHistoryItem } from '../lib/api';

interface ScanHistoryProps {
  items: ScanHistoryItem[];
  onClear: () => void;
  onExport: () => void;
}

export function ScanHistory({ items, onClear, onExport }: ScanHistoryProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No scan history yet</p>
        <p className="text-sm mt-1">Your scanned items will appear here</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700">Scan History</h3>
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Export CSV
          </button>
          <button
            onClick={onClear}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.scan_id}
            className="bg-white rounded-lg shadow p-3 border-l-4 border-blue-500"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800">{item.item_name}</p>
                <p className="text-sm text-gray-500">
                  {item.brand} • {item.category}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-700">
                  ${item.est_value?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(item.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
