
import React, { useRef } from 'react';

interface FileSelectorProps {
  onFilesSelected: (files: FileList) => void;
}

export const FileSelector: React.FC<FileSelectorProps> = ({ onFilesSelected }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesSelected(event.target.files);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="max-w-2xl p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">Process Excel BOM Files</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Click the button below to select the folder containing your <code>.xlsx</code> and <code>.xlsm</code> files. The application will scan and summarize the data locally in your browser.
        </p>
        <button
          onClick={handleButtonClick}
          className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300 transform hover:scale-105 shadow-md"
        >
          Select Folder to Process
        </button>
        <input
          type="file"
          ref={inputRef}
          onChange={handleChange}
          className="hidden"
          // @ts-ignore
          webkitdirectory="true"
          directory="true"
          multiple
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
            Your files are processed on your device and are never uploaded.
        </p>
      </div>
    </div>
  );
};
