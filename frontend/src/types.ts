export interface Document {
  doc_id: string;
  filename: string;
}

export interface Source {
  filename: string;
  page: number | null;
  doc_id: string;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  isLoading?: boolean;
}
