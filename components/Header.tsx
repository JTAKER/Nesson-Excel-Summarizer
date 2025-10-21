import React from 'react';
import { Logo } from './Logo';

export const Header: React.FC = () => {
  return (
    <header className="backdrop-blur-sm shadow-md sticky top-0 z-50 border-b border-slate-900/10 dark:border-slate-50/10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Logo className="h-8 w-auto" />
            <span className="ml-4 text-xl font-bold text-slate-800 dark:text-slate-100">Nesson CIFA Summarizer</span>
          </div>
        </div>
      </div>
    </header>
  );
};