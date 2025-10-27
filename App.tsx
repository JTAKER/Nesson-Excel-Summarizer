import React, { useState, useCallback } from 'react';
import { FileSelector } from './components/FileSelector';
import { ResultsTable } from './components/ResultsTable';
import { Spinner } from './components/Spinner';
import { processExcelFiles } from './services/excelProcessor';
import { type ProcessedData } from './types';
import { Header } from './components/Header';
import { ErrorDisplay } from './components/ErrorDisplay';

const App: React.FC = () => {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback(async (files: FileList) => {
    if (files.length === 0) {
      return;
    }
    setIsProcessing(true);
    setError(null);
    setProcessedData(null);
    setProcessingMessage('Starting analysis...');

    try {
      const result = await processExcelFiles(files, (message) => {
        setProcessingMessage(message);
      });
      setProcessedData(result);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error("Processing failed:", e);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  }, []);
  
  const handleReset = useCallback(() => {
    setProcessedData(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200">
      <Header />
      <main className="p-4 md:p-8 pt-18 md:pt-20">
        {!isProcessing && !processedData && !error && (
            <FileSelector onFilesSelected={handleFilesSelected} />
        )}

        {isProcessing && (
          <div className="text-center">
            <Spinner />
            <p className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-300 animate-pulse">{processingMessage}</p>
          </div>
        )}

        {error && (
          <ErrorDisplay message={error} onReset={handleReset} />
        )}

        {processedData && (
          <ResultsTable data={processedData} onReset={handleReset} />
        )}
      </main>
      <div className="fixed bottom-4 right-4 text-xs text-slate-300 dark:text-slate-700 font-mono select-none">
        v1.2
      </div>
    </div>
  );
};

export default App;