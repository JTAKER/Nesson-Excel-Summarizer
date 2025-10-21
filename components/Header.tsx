import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-md sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <img src="/logo.png" alt="Nesson Logo" className="h-8 w-auto" />
            <span className="ml-3 text-xl font-bold text-slate-800 dark:text-slate-100">Nesson CIFA Summarizer</span>
          </div>
        </div>
      </div>
    </header>
  );
};