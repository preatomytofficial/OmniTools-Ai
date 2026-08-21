export type ToolType =
  | 'upscale'
  | 'watermark'
  | 'object'
  | 'video_mp3'
  | 'video_trim'
  | 'csv_json'
  | 'pdf_editor'
  | 'pdf_epub'
  | 'api_hub';

export interface ToolModule {
  id: string;
  title: string;
  file: string;
  downloadUrl: string;
  description: string;
  icon: string;
  isDoc?: boolean;
  externalUrl?: string;
  isExternal?: boolean;
}

export interface ProcessResult {
  success: boolean;
  outputUrl?: string;
  base64Data?: string;
  filename?: string;
  details?: Record<string, any>;
  error?: string;
}
