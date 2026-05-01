/** Main application component */
import React, { useState } from 'react';
import { Header } from './components/Header';
import { CameraCapture } from './components/CameraCapture';
import { ResultsCard } from './components/ResultsCard';
import { ScanHistory } from './components/ScanHistory';
import { useScan, ScanStatus } from './hooks/useScan';
import { getHistory, clearHistory, exportHistoryToCSV, ScanHistoryItem } from './lib/api';

function App() {
  const { status, result, error, scanImageFile, reset } = useScan();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>(getHistory);
  const [showHistory, setShowHistory] = useState(false);

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleImageError = (errorMsg: string) => {
    alert(errorMsg);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    await scanImageFile(selectedFile);
  };

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  const handleExport = () => {
    const csv = exportHistoryToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = status === 'uploading' || status === 'analyzing';

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Scan Section */}
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Scan Item</h2>
          <CameraCapture
            onImageSelect={handleImageSelect}
            onError={handleImageError}
          />

          {selectedFile && !result && (
            <div className="mt-4">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Item'
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={reset}
                className="mt-2 text-sm underline"
              >
                Try again
              </button>
            </div>
          )}

          {result && (
            <div className="mt-4">
              <ResultsCard result={result} />
              <button
                onClick={reset}
                className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Scan Another Item
              </button>
            </div>
          )}
        </section>

        {/* History Toggle */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full bg-white rounded-lg shadow p-4 text-center font-medium text-gray-700 hover:bg-gray-50"
        >
          {showHistory ? 'Hide' : 'Show'} Scan History ({history.length})
        </button>

        {/* History Section */}
        {showHistory && (
          <section className="bg-white rounded-lg shadow p-4">
            <ScanHistory
              items={history}
              onClear={handleClear}
              onExport={handleExport}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-400 text-xs">
        <p>Free tier: 10 scans/day</p>
        <p className="mt-1">Powered by AI • Real eBay sold data</p>
      </footer>
    </div>
  );
}

export default App;
