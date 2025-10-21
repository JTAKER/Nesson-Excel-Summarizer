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

const generateHtmlContent = (parts: any[], fileIds: string[]): string => {
    const analysisDate = new Date().toLocaleString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const colWidths = {
        partNumber: 150,
        tier: 100,
        totalQty: 120,
    };

    const tableHeaders = ['Part Number', 'Tier', 'Total Quantity', 'Description', ...fileIds];
    
    const headerHtml = tableHeaders.map((h, index) => {
        let classes = '';
        if (index < 3) classes += ` sticky-col sticky-col-${index + 1}`;
        if (index === 2) classes += ' sticky-col-last';
        return `<th class="${classes.trim()}" onclick="sortTable(${index})">${h}</th>`;
    }).join('');

    const rowsHtml = parts.map(part => {
        interface Cell {
            content: any;
            isSticky: boolean;
            isLastSticky?: boolean;
            col?: number;
            className?: string;
        }

        const cells: Cell[] = [
            { content: part.partNumber, isSticky: true, isLastSticky: false, col: 1 },
            { content: `<span class="tier tier-${part.tier.replace(' ', '')}">${part.tier}</span>`, isSticky: true, isLastSticky: false, col: 2 },
            { content: `<strong>${part.total_quantity}</strong>`, isSticky: true, isLastSticky: true, col: 3, className: 'num' },
            { content: part.description || '', isSticky: false },
            ...fileIds.map(fileId => ({ content: part.file_quantities[fileId] || 0, isSticky: false, className: 'num' }))
        ];
        
        const cellHtml = cells.map((cell) => {
            let classes = cell.className || '';
            if (cell.isSticky && cell.col !== undefined) {
                classes += ` sticky-col sticky-col-${cell.col}`;
                if (cell.isLastSticky) {
                    classes += ' sticky-col-last';
                }
            }
            return `<td class="${classes.trim()}">${cell.content}</td>`;
        }).join('');

        return `<tr>${cellHtml}</tr>`;
    }).join('');

    const css = `
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            margin: 2rem; 
            background-color: #ffffff; 
            color: #111827;
            line-height: 1.5;
        }
        @media (prefers-color-scheme: dark) {
            body { 
                background-color: #1f2937;
                color: #d1d5db;
            }
            .table-wrapper { border-color: #4b5563; }
            th, td { border-color: #4b5563; }
            thead { background-color: #374151; }
            tbody tr:nth-child(even) { background-color: #374151; }
            th:hover { background-color: #4b5563 !important; }
            .sticky-col-last { border-right-color: #4b5563; }
            /* Dark mode sticky backgrounds */
            .sticky-col { background-color: #1f2937; }
            tr:nth-child(even) .sticky-col { background-color: #374151; }
            thead .sticky-col { background-color: #374151; }
            thead .sticky-col:hover { background-color: #4b5563 !important; }
            .tier-Tier1 { background-color: #78350f; color: #fef3c7; }
            .tier-Tier2 { background-color: #374151; color: #d1d5db; }
            tr.selected td, tr.selected .sticky-col { background-color: #263c6b !important; }
        }
        h1 { font-size: 2em; margin-bottom: 0.5em; }
        p { color: #6b7280; margin-bottom: 0.5em; }
        p.date { margin-bottom: 2em; font-style: italic; font-size: 0.9em; }
        .table-wrapper {
            overflow-x: auto;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
            border-radius: 0.5rem;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
        }
        th, td { 
            padding: 0.75rem 1rem; 
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
            white-space: nowrap;
            transition: background-color 0.15s ease-in-out;
        }
        thead { 
            background-color: #f9fafb;
            font-weight: 600;
        }
        th {
            cursor: pointer;
            user-select: none;
            transition: background-color 0.15s ease-in-out;
        }
        th:hover { background-color: #f3f4f6; }
        tbody tr { cursor: pointer; }
        tbody tr:nth-child(even) { background-color: #f9fafb; }
        .num { text-align: center; }
        .tier { padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 500; border-radius: 9999px; }
        .tier-Tier1 { background-color: #fef3c7; color: #78350f; }
        .tier-Tier2 { background-color: #e5e7eb; color: #1f2937; }
        tr.selected td, tr.selected .sticky-col { background-color: #dbeafe !important; }

        /* --- STICKY COLUMN STYLES --- */
        .sticky-col {
            position: sticky;
            z-index: 1;
            background-color: #ffffff; /* Default light mode background */
        }
        tr:nth-child(even) .sticky-col {
            background-color: #f9fafb; /* Light mode alternating row */
        }
        thead .sticky-col {
            z-index: 2;
            background-color: #f9fafb; /* Header background */
        }
        thead .sticky-col:hover {
             background-color: #f3f4f6 !important;
        }
        .sticky-col-1 { left: 0px; min-width: ${colWidths.partNumber}px; }
        .sticky-col-2 { left: ${colWidths.partNumber}px; min-width: ${colWidths.tier}px; }
        .sticky-col-3 { left: ${colWidths.partNumber + colWidths.tier}px; min-width: ${colWidths.totalQty}px; }
        .sticky-col-last { border-right: 2px solid #e5e7eb; }
    `;

    const script = `
        let sortState = { colIndex: -1, direction: 'ascending' };

        function sortTable(colIndex) {
            const table = document.querySelector('table');
            const tbody = table.querySelector('tbody');
            const headers = Array.from(table.querySelectorAll('thead th'));
            const rows = Array.from(tbody.querySelectorAll('tr'));

            let direction = 'ascending';
            if (sortState.colIndex === colIndex) {
                direction = sortState.direction === 'ascending' ? 'descending' : 'ascending';
            }
            
            sortState = { colIndex, direction };

            rows.sort((a, b) => {
                const aText = a.children[colIndex].innerText.trim();
                const bText = b.children[colIndex].innerText.trim();

                const aNum = parseFloat(aText.replace(/,/g, ''));
                const bNum = parseFloat(bText.replace(/,/g, ''));

                let comparison = 0;
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    comparison = aNum - bNum;
                } else {
                    comparison = aText.localeCompare(bText, undefined, { numeric: true, sensitivity: 'base' });
                }
                
                return direction === 'ascending' ? comparison : -comparison;
            });

            headers.forEach(th => {
                th.innerHTML = th.innerHTML.replace(/ ▲| ▼/, '');
            });

            const currentHeader = headers[colIndex];
            currentHeader.innerHTML += direction === 'ascending' ? ' ▲' : ' ▼';
            
            tbody.innerHTML = '';
            rows.forEach(row => tbody.appendChild(row));
        }

        const tbody = document.querySelector('tbody');
        if (tbody) {
            let selectedRow = null;
            tbody.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                if (!row) return;

                if (selectedRow) {
                    selectedRow.classList.remove('selected');
                }

                if (selectedRow !== row) {
                    row.classList.add('selected');
                    selectedRow = row;
                } else {
                    selectedRow = null;
                }
            });
        }
    `;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>BOM Summary</title>
            <style>${css}</style>
        </head>
        <body>
            <h1>Analysis Results</h1>
            <p>Found ${parts.length} unique parts across ${fileIds.length} files.</p>
            <p class="date">Analysis run on: ${analysisDate}</p>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>${headerHtml}</tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
            <script>${script}<\/script>
        </body>
        </html>
    `;
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
  
  const partList = useMemo(() => Object.entries(data.parts).map(([partNumber, partDetails]) => {
    const details = partDetails as PartData;
    return {
      partNumber,
      description: details.description,
      total_quantity: details.total_quantity,
      file_quantities: details.file_quantities,
      tier: details.tier,
    };
  }), [data.parts]);

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
            const key = sortConfig.key as 'partNumber' | 'tier' | 'total_quantity' | 'description';
            aValue = a[key];
            bValue = b[key];
        }

        let result = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          result = aValue - bValue;
        } else if (aValue !== null && bValue !== null) {
          result = String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
        } else {
          result = 0;
        }

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

  const handleDownloadHTML = useCallback(() => {
    const htmlContent = generateHtmlContent(sortedParts, data.fileIds);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `${dateStr}_BOM_Summary.html`);
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
        <div className="flex flex-wrap gap-2 justify-center">
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
            onClick={handleDownloadHTML}
            className="flex items-center gap-2 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download HTML
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
            </svg>
            Process Again
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 relative max-h-[80vh]">
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