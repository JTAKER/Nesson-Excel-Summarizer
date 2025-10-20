
import { type ProcessedData, type PartData, type Tier } from '../types';
import { POSSIBLE_SHEET_NAMES, TIER1_PART_NUMBERS, CIFA_COL_INDEX, QTY_COL_INDEX, DESC_COL_INDEX, START_ROW } from '../constants';

// Since SheetJS is loaded from a CDN, we declare it as a global to satisfy TypeScript.
declare const XLSX: any;

interface LocalPartData {
    [partKey: string]: {
        quantity: number;
        description: string | null;
    };
}

interface SingleFileResult {
    fileId: string;
    localPartData: LocalPartData;
    success: boolean;
}

const getIdFromCellValue = (cellValue: any): string | null => {
    if (!cellValue) return null;
    const sValue = String(cellValue).trim();

    let match = sValue.match(/JB000(\d{7})/i);
    if (match) return "JB" + match[1];

    match = sValue.match(/(\d{7})$/);
    if (match) return "JB" + match[1];

    return null;
};

const processSingleFile = async (file: File): Promise<SingleFileResult> => {
    let fileId: string | null = null;
    let success = false;
    const localPartData: LocalPartData = {};

    try {
        const match = file.name.match(/(\d{7})/);
        if (match) {
            fileId = "JB" + match[0];
        }

        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });

        if (!fileId) {
            if (workbook.SheetNames.includes("Survey Data")) {
                const sheet = workbook.Sheets["Survey Data"];
                const cell = sheet['C7'];
                fileId = getIdFromCellValue(cell ? cell.v : null);
            }
            if (!fileId && workbook.SheetNames.includes("Enter Details")) {
                const sheet = workbook.Sheets["Enter Details"];
                const cell = sheet['I4'];
                fileId = getIdFromCellValue(cell ? cell.v : null);
            }
        }
        
        let sheetToUse: string | null = null;
        for (const sName of POSSIBLE_SHEET_NAMES) {
            if (workbook.SheetNames.includes(sName)) {
                sheetToUse = sName;
                break;
            }
        }

        if (!sheetToUse) {
            for (const sName of workbook.SheetNames) {
                if (sName.toUpperCase().includes("BOM")) {
                    sheetToUse = sName;
                    break;
                }
            }
        }

        if (sheetToUse) {
            success = true;
            const sheet = workbook.Sheets[sheetToUse];
            const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            for (let i = START_ROW - 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                const cifaPartNumber = row[CIFA_COL_INDEX];
                const qty = row[QTY_COL_INDEX];
                const description = row[DESC_COL_INDEX];

                if (cifaPartNumber && qty !== null && qty !== undefined) {
                    try {
                        const numericQty = parseInt(String(parseFloat(String(qty))), 10);
                        if (!isNaN(numericQty) && numericQty !== 0) {
                            const partKey = String(cifaPartNumber);
                            if (!localPartData[partKey]) {
                                localPartData[partKey] = { quantity: 0, description: null };
                            }
                            localPartData[partKey].quantity += numericQty;
                            if (localPartData[partKey].description === null) {
                                localPartData[partKey].description = description || null;
                            }
                        }
                    } catch (e) {
                        // Ignore rows where quantity is not a valid number
                    }
                }
            }
        }
    } catch (e) {
        console.error(`Error processing file ${file.name}:`, e);
        // Fallback fileId is set outside the try block
    }
    
    if (!fileId) {
        fileId = file.name;
    }

    return { fileId, localPartData, success };
};

export const processExcelFiles = async (
    files: FileList,
    onProgress: (message: string) => void
): Promise<ProcessedData> => {
    const excelFiles = Array.from(files).filter(
        file => file.name.endsWith('.xlsx') || file.name.endsWith('.xlsm')
    );

    if (excelFiles.length === 0) {
      throw new Error("No .xlsx or .xlsm files were found in the selected folder.");
    }

    const allPromises = excelFiles.map((file, index) => {
        onProgress(`Processing file ${index + 1} of ${excelFiles.length}: ${file.name}`);
        return processSingleFile(file);
    });
    
    const results = await Promise.all(allPromises);

    onProgress('Merging results...');

    const finalPartData: { [partNumber: string]: PartData } = {};
    const fileIds = new Set<string>();

    for (const result of results) {
        fileIds.add(result.fileId);
        for (const [partKey, data] of Object.entries(result.localPartData)) {
            if (!finalPartData[partKey]) {
                finalPartData[partKey] = {
                    description: null,
                    total_quantity: 0,
                    file_quantities: {},
                    tier: 'Tier 2'
                };
            }
            finalPartData[partKey].total_quantity += data.quantity;
            finalPartData[partKey].file_quantities[result.fileId] = (finalPartData[partKey].file_quantities[result.fileId] || 0) + data.quantity;
            
            if (finalPartData[partKey].description === null) {
                finalPartData[partKey].description = data.description;
            }

            if (TIER1_PART_NUMBERS.has(partKey)) {
                finalPartData[partKey].tier = 'Tier 1';
            }
        }
    }

    if (Object.keys(finalPartData).length === 0) {
        throw new Error("No valid BOM data found to summarize across the provided files.");
    }

    return {
        parts: finalPartData,
        fileIds: Array.from(fileIds).sort()
    };
};
