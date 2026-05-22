export type ClassificationTaskStatus =
  | "idle"
  | "preparing"
  | "analyzing"
  | "grouping"
  | "reviewing"
  | "applying"
  | "done"
  | "error";

export type PhotoAnalysis = {
  photoId: string;
  title: string;
  description: string;
  tags: string[];
  scene: string;
  people?: "none" | "one" | "multiple" | "unknown";
  locationType?: "indoor" | "outdoor" | "unknown";
  categoryCandidates: string[];
  qualityFlags?: string[];
  confidence?: number;
};

export type AlbumSuggestion = {
  albumId: string;
  name: string;
  description: string;
  reason: string;
  photoIds: string[];
  tags: string[];
  confidence: number;
};

export interface Album {
  id: string;
  name: string;
  description?: string;
  reason?: string;
  photoIds: string[];
  tags?: string[];
  createdBy?: "ai" | "user";
  createdAt: string;
  updatedAt?: string;
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
  qualityFlags?: string[];
}

export interface UserPreference {
  id: string;
  triggerKeyword: string; // keyword, pattern, or tag to match (e.g., "landscape", "blurry", "food")
  targetAlbumName: string; // target album name (e.g., "Nature", "Review", "Gourmet")
  matchType: "tag_or_title" | "quality_flag" | "any";
  createdAt: string;
}

export type ClassificationState = {
  taskId: string;
  status: ClassificationTaskStatus;
  totalPhotos: number;
  analyzedCount: number;
  analyses: PhotoAnalysis[];
  suggestions: AlbumSuggestion[];
  error?: string;
};
