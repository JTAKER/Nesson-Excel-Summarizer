import React, { useState, useMemo, useCallback } from 'react';
import { type ProcessedData, type PartData, type Tier } from '../types';

interface ResultsTableProps {
  data: ProcessedData;
  onReset: () => void;
}

type SortableKeys = 'partNumber' | 'tier' | 'total_quantity' | 'description' | string;

interface SortConfig {
  key: SortableKeys;
  direction: 'ascending' | 'descending';
}

const SortableHeader: React.FC<{
  columnKey: SortableKeys;
  title: string;
  sortConfig: SortConfig | null;
  onSort: (key: SortableKeys) => void;
  className?: string;
}> = ({ columnKey, title, sortConfig, onSort, className }) => {
  const isSorted = sortConfig?.key === columnKey;
  const directionIcon = isSorted ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '';

  return (
    <th
      scope="col"
      className={`px-4 py-3 whitespace-nowrap cursor-pointer select-none ${className || ''}`}
      onClick={() => onSort(columnKey)}
    >
      {title} <span className="text-xs">{directionIcon}</span>
    </th>
  );
};


export const ResultsTable: React.FC<ResultsTableProps> = ({ data, onReset }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'tier', direction: 'ascending' });
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  const handleSort = useCallback((key: SortableKeys) => {
    setSortConfig(current => {
      if (current?.key === key && current.direction === 'ascending') {
        return { key, direction: 'descending' };
      }
      return { key, direction: 'ascending' };
    });
  }, []);
  
  const partList = useMemo(() => Object.entries(data.parts).map(([partNumber, partDetails]) => ({
      partNumber,
      ...partDetails,
    })), [data.parts]);

  const sortedParts = useMemo(() => {
    let sortableItems = [...partList];
    
    // Default secondary sort
    sortableItems.sort((a, b) => {
      if (a.tier === 'Tier 1' && b.tier !== 'Tier 1') return -1;
      if (a.tier !== 'Tier 1' && b.tier === 'Tier 1') return 1;
      return b.total_quantity - a.total_quantity;
    });

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: string | number | null;
        let bValue: string | number | null;

        if (data.fileIds.includes(sortConfig.key)) {
            aValue = a.file_quantities[sortConfig.key] || 0;
            bValue = b.file_quantities[sortConfig.key] || 0;
        } else {
            // FIX: Explicitly cast sortConfig.key to the known sortable property names.
            // This prevents TypeScript from inferring that `sortConfig.key` could be 'file_quantities',
            // which holds an object and would cause a type error. The `if` block above
            // correctly handles sorting by dynamic fileId columns.
            const key = sortConfig.key as 'partNumber' | 'tier' | 'total_quantity' | 'description';
            aValue = a[key];
            bValue = b[key];
        }

        // Primary sort logic
        let result = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          result = aValue - bValue;
        } else if (aValue !== null && bValue !== null) {
          result = String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
        } else {
          result = 0;
        }

        // If primary sort results in a tie, use the default secondary sort
        if (result === 0) {
            if (a.tier === 'Tier 1' && b.tier !== 'Tier 1') return -1;
            if (a.tier !== 'Tier 1' && b.tier === 'Tier 1') return 1;
            return b.total_quantity - a.total_quantity;
        }

        return sortConfig.direction === 'ascending' ? result : -result;
      });
    }

    return sortableItems;
  }, [partList, sortConfig, data.fileIds]);
  
  const handleDownload = useCallback(() => {
    const headers = ['Part Number', 'Tier', 'Total Quantity', 'Description', ...data.fileIds];
    const csvRows = [headers.join(',')];
    for (const part of sortedParts) {
      const row = [
        `"${part.partNumber.replace(/"/g, '""')}"`,
        part.tier,
        part.total_quantity,
        `"${part.description?.replace(/"/g, '""') || ''}"`,
        ...data.fileIds.map(fileId => part.file_quantities[fileId] || 0)
      ];
      csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `${dateStr}_BOM_Summary.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [sortedParts, data.fileIds]);
  
  const handleRowClick = (partNumber: string) => {
    setSelectedRow(current => current === partNumber ? null : partNumber);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Analysis Results</h2>
          <p className="text-slate-500 dark:text-slate-400">Found {partList.length} unique parts across {data.fileIds.length} files.</p>
        </div>
        <div className="flex gap-2">
           <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download CSV
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7V9a1 1 0 01-2 0V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.546A5.002 5.002 0 0014.001 13V11a1 1 0 112 0v6a1 1 0 01-1 1h-6a1 1 0 110-2h2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.546-1.276z" clipRule="evenodd" />
            </svg>
            Process Again
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 relative max-h-[70vh]">
        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
          <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 sticky top-0 z-20">
            <tr>
                <SortableHeader columnKey="partNumber" title="Part Number" sortConfig={sortConfig} onSort={handleSort} className="sticky left-0 z-30 bg-slate-100 dark:bg-slate-700 min-w-[150px]" />
                <SortableHeader columnKey="tier" title="Tier" sortConfig={sortConfig} onSort={handleSort} className="sticky left-[150px] z-30 bg-slate-100 dark:bg-slate-700 min-w-[100px]" />
                <SortableHeader columnKey="total_quantity" title="Total Qty" sortConfig={sortConfig} onSort={handleSort} className="sticky left-[250px] z-30 bg-slate-100 dark:bg-slate-700 min-w-[120px] border-r-2 border-slate-300 dark:border-slate-600" />
                <SortableHeader columnKey="description" title="Description" sortConfig={sortConfig} onSort={handleSort} className="min-w-[300px]" />
                {data.fileIds.map(fileId => (
                    <SortableHeader key={fileId} columnKey={fileId} title={fileId} sortConfig={sortConfig} onSort={handleSort} className="min-w-[120px]" />
                ))}
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-200 dark:divide-slate-700'>
            {sortedParts.map((part) => (
              <tr 
                key={part.partNumber}
                onClick={() => handleRowClick(part.partNumber)}
                className={`bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors duration-150
                    ${selectedRow === part.partNumber ? '!bg-blue-100 dark:!bg-blue-800/50' : ''}`
                }
              >
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap sticky left-0 z-10 bg-inherit">{part.partNumber}</td>
                <td className="px-4 py-3 sticky left-[150px] z-10 bg-inherit">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${part.tier === 'Tier 1' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200'}`}>
                    {part.tier}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-center sticky left-[250px] z-10 bg-inherit border-r-2 border-slate-300 dark:border-slate-600">{part.total_quantity}</td>
                <td className="px-4 py-3 min-w-[250px] max-w-[400px] truncate" title={part.description || ''}>{part.description}</td>
                {data.fileIds.map(fileId => (
                  <td key={fileId} className="px-4 py-3 text-center">
                    {part.file_quantities[fileId] || 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
