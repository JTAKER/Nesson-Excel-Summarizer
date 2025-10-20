
import React from 'react';

interface ErrorDisplayProps {
    message: string;
    onReset: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onReset }) => {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="max-w-2xl p-8 bg-red-50 dark:bg-red-900/20 rounded-2xl shadow-lg border border-red-200 dark:border-red-800">
                <div className="flex justify-center mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">An Error Occurred</h2>
                <p className="text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg mb-6 font-mono text-sm">
                    {message}
                </p>
                <button
                    onClick={onReset}
                    className="w-full bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 transition-all duration-300 transform hover:scale-105 shadow-md"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
};
