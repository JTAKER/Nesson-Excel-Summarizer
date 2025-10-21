import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  alt?: string;
}

export const Logo: React.FC<LogoProps> = ({ className, alt = "Nesson CIFA Summarizer Logo" }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold rounded-md select-none ${className || ''}`}
        role="img"
        aria-label={alt}
      >
        <span>NC</span>
      </div>
    );
  }

  return (
    <img
      src="logo.png"
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};
