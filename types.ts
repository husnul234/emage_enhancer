
export enum ImageFileStatus {
  IDLE = 'Waiting',
  ENHANCING = 'Enhancing',
  SUCCESS = 'Success',
  ERROR = 'Error',
}

export interface ImageFile {
  id: string;
  file: File;
  originalSrc: string;
  enhancedSrc: string | null;
  status: ImageFileStatus;
  error?: string;
}
