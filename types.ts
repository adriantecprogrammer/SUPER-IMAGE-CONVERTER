export enum ConversionStatus {
  IDLE = 'IDLE',
  CONVERTING = 'CONVERTING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ImageItem {
  id: string;
  originalFile: File;
  previewUrl: string;
  convertedUrl: string | null;
  status: ConversionStatus;
  originalSize: number;
  convertedSize?: number;
}