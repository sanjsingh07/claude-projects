/** Results card displaying scan results */
import React from 'react';
import { ScanResult } from '../lib/api';

interface ResultsCardProps {
  result: ScanResult;
  onAddToHistory?: () => void;
}

export function ResultsCard({ result, onAddToHistory }: ResultsCardProps) {
  const { vision, ebay_data, fee_breakdown } = result;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <h2 className="text-lg font-semibold">{vision.item_name}</h2>
        <p className="text-blue-100 text-sm">
          {vision.brand} • {vision.category}
        </p>
        <div className="flex items-center mt-2 text-xs">
          <span className={`font-medium ${getConfidenceColor(vision.confidence)}`}>
            {(vision.confidence * 100).toFixed(0)}% confidence
          </span>
          {vision.era !== 'modern' && (
            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded">
              {vision.era}
            </span>
          )}
        </div>
      </div>

      {/* Pricing Data */}
      {ebay_data && (
        <div className="p-4 border-b">
          <h3 className="font-medium text-gray-700 mb-3">Market Data</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500">Avg Sold</p>
              <p className="text-lg font-semibold">
                {formatCurrency(ebay_data.avg_sold_price)}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500">Median</p>
              <p className="text-lg font-semibold">
                {formatCurrency(ebay_data.median_sold_price)}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500">Range</p>
              <p className="text-sm font-medium">
                {formatCurrency(ebay_data.min_sold_price)} - {formatCurrency(ebay_data.max_sold_price)}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500">Sales Found</p>
              <p className="text-lg font-semibold">{ebay_data.total_results}</p>
            </div>
          </div>
        </div>
      )}

      {/* Fee Breakdown */}
      {fee_breakdown && (
        <div className="p-4 border-b">
          <h3 className="font-medium text-gray-700 mb-3">Profit Analysis</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Est. Sale Price</span>
              <span className="font-medium">{formatCurrency(fee_breakdown.sale_price)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Platform Fees</span>
              <span>-{formatCurrency(fee_breakdown.percentage_fee + fee_breakdown.fixed_fee)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Est. Shipping</span>
              <span>-{formatCurrency(fee_breakdown.shipping_estimate)}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Net Profit</span>
                <span className={fee_breakdown.net_after_fees >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(fee_breakdown.net_after_fees)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500 text-sm">ROI</span>
                <span className={`text-sm font-medium ${fee_breakdown.roi_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fee_breakdown.roi_percentage >= 0 ? '+' : ''}{fee_breakdown.roi_percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Terms */}
      <div className="p-4 bg-gray-50">
        <p className="text-xs text-gray-500 mb-1">AI Search Terms</p>
        <p className="text-sm font-mono text-gray-700 break-words">{vision.search_terms}</p>
      </div>
    </div>
  );
}
