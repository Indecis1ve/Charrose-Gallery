export interface Album {
  id: string;
  name: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  albumId?: string; // Optional linkage to an album
  width?: number;
  height?: number;
}

export interface AiAnalysisResult {
  title: string;
  description: string;
  tags: string[];
}