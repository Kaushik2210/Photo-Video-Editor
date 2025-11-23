export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  prompt: string;
  createdAt: number;
  width?: number;
  height?: number;
  base64Data?: string; // For images re-use
}

export interface GenerationParams {
  prompt: string;
  aspectRatio: string;
  referenceImage?: string; // base64
  referenceMimeType?: string;
}

export interface AppState {
  gallery: MediaItem[];
  selectedItem: MediaItem | null;
  isGenerating: boolean;
  loadingMessage: string;
}
