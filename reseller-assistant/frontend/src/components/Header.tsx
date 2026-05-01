/** App header component */
import React from 'react';

interface HeaderProps {
  scanCount?: number;
  limit?: number;
}

export function Header({ scanCount = 0, limit = 10 }: HeaderProps) {
  const remaining = Math.max(0, limit - scanCount);
  const percentage = (scanCount / limit) * 100;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">ResellerPricr</h1>
            <p className="text-xs text-gray-500">AI-powered pricing assistant</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Free Tier</div>
            <div className="text-sm font-medium text-gray-700">
              {remaining} / {limit} scans left
            </div>
          </div>
        </div>

        {/* Usage bar */}
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              percentage >= 100 ? 'bg-red-500' : percentage >= 75 ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </header>
  );
}
