import React, { useState, useCallback, useEffect } from 'react';
import { FileSelector } from './components/FileSelector';
import { ResultsTable } from './components/ResultsTable';
import { ProgressBar } from './components/ProgressBar';
import { processExcelFiles } from './services/excelProcessor';
import { type ProcessedData, type ProgressUpdate } from './types';
import { Header } from './components/Header';
import { ErrorDisplay } from './components/ErrorDisplay';

const App: React.FC = () => {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processUrlData = async () => {
      try {
        const hash = window.location.hash;
        let jsonString: string | null = null;

        if (hash.startsWith('#data-gz=')) {
          // New: Handle gzipped, base64-encoded data
          const encodedUrlComponent = hash.substring(9);
          if (encodedUrlComponent) {
            const base64String = decodeURIComponent(encodedUrlComponent);
            
            const base64ToBuffer = (base64: string) => {
              const binary_string = window.atob(base64);
              const len = binary_string.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
              }
              return bytes.buffer;
            };

            const compressedBuffer = base64ToBuffer(base64String);
            const blob = new Blob([compressedBuffer]);

            const decompressionStream = new DecompressionStream('gzip');
            const decompressedStream = blob.stream().pipeThrough(decompressionStream);
            
            const decompressedBlob = await new Response(decompressedStream).blob();
            jsonString = await decompressedBlob.text();
          }
        } else if (hash.startsWith('#data=')) {
          // Old: Handle non-compressed, unicode-safe base64 for backward compatibility
          const encodedUrlComponent = hash.substring(6);
          if (encodedUrlComponent) {
            const b64ToUtf8 = (str: string) => {
              return decodeURIComponent(atob(str).split('').map((c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
            };
            const base64String = decodeURIComponent(encodedUrlComponent);
            jsonString = b64ToUtf8(base64String);
          }
        }

        if (jsonString) {
            const data = JSON.parse(jsonString) as ProcessedData;
            if (data && data.parts && data.fileIds) {
              setProcessedData(data);
            } else {
               throw new Error("Parsed data is missing required properties.");
            }
        }

      } catch (e) {
        console.error("Failed to parse data from URL:", e);
        setError("The shared analysis link is invalid or corrupted.");
      } finally {
        if (window.location.hash.startsWith('#data')) {
          window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
        }
      }
    };
    
    processUrlData();
  }, []);


  const handleFilesSelected = useCallback(async (files: FileList) => {
    if (files.length === 0) {
      return;
    }
    setIsProcessing(true);
    setError(null);
    setProcessedData(null);
    setProcessingMessage('Starting analysis...');
    setProcessingProgress(0);

    try {
      const result = await processExcelFiles(files, (update: ProgressUpdate) => {
        setProcessingMessage(update.message);
        setProcessingProgress(update.percentage);
      });
      setProcessedData(result);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error("Processing failed:", e);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
      setProcessingProgress(0);
    }
  }, []);
  
  const handleReset = useCallback(() => {
    setProcessedData(null);
    setError(null);
    setIsProcessing(false);
    setProcessingProgress(0);
    if (window.location.hash) {
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
  }, []);

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200">
      <Header />
      <main className="p-4 md:p-8 pt-18 md:pt-20">
        {!isProcessing && !processedData && !error && (
            <FileSelector onFilesSelected={handleFilesSelected} />
        )}

        {isProcessing && (
          <ProgressBar progress={processingProgress} message={processingMessage} />
        )}

        {error && (
          <ErrorDisplay message={error} onReset={handleReset} />
        )}

        {processedData && (
          <ResultsTable data={processedData} onReset={handleReset} />
        )}
      </main>
      <div className="fixed bottom-4 right-4 text-xs text-slate-300 dark:text-slate-700 font-mono select-none">
        v1.35
      </div>
    </div>
  );
};

export default App;