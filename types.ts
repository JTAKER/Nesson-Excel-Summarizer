
export type Tier = 'Tier 1' | 'Tier 2';

export interface PartData {
  description: string | null;
  total_quantity: number;
  file_quantities: { [fileId: string]: number };
  tier: Tier;
}

export interface ProcessedData {
  parts: { [partNumber: string]: PartData };
  fileIds: string[];
}
