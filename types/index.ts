export type SourceType = "pdf" | "txt" | "docx" | "url";

export interface Document {
  id: string;
  name: string;
  type: SourceType;
  chunkCount: number;
  createdAt: string;
}

export interface SourceChunk {
  docId: string;
  docName: string;
  chunkIndex: number;
  totalChunks: number;
  content: string;
  sourceType: SourceType;
  pageNumber?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
}

export interface IngestResult {
  docId: string;
  docName: string;
  chunkCount: number;
}

export interface ApiError {
  error: string;
  status?: number;
}
