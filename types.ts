
export interface ViewEntry {
  viewerName: string;
  viewedAt: number;
}

export interface VideoTag {
  id: string;
  label: string;
  completed: boolean;
}

export interface VideoEntry {
  docId?: string;  //
  id: string;
  categoryId: string;
  categoryName: string;
  title: string; // Manually set title
  timestamp: number;
  videoUrl?: string; // Generic URL for either video or PDF
  type: 'video' | 'pdf'; // Type identifier
  summary: string; // AI generated summary
  score: number; // Importance or clarity score
  tags: string[];
  viewLog: ViewEntry[];
}

export interface VideoCategory {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  videoCount: number;
  progress: number;
  tags: VideoTag[];
  createdAt: number;
}

export interface AIAnalysisResult {
  feedback: string;
  score: number;
  newTagsSuggested: string[];
}
