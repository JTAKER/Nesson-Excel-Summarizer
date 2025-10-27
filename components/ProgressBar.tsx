import React from 'react';
import { Spinner } from './Spinner';

interface ProgressBarProps {
  progress: number;
  message: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, message }) => {
  const roundedProgress = Math.round(progress);

  return (
    <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto animate-fade-in">
      <Spinner />
      <p className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-300 w-full truncate px-4">
        {message}
      </p>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 mt-4 shadow-inner overflow-hidden">
        <div
          className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${roundedProgress}%` }}
        >
        </div>
      </div>
       <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
        {roundedProgress}% Complete
      </p>
    </div>
  );
};
