import axios from "axios";
import { Document, ChatMessage, Source } from "./types";

const api = axios.create({ baseURL: "" });

export async function uploadDocument(file: File): Promise<{
  doc_id: string;
  filename: string;
  chunk_count: number;
  message: string;
}> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/documents/upload", form);
  return data;
}

export async function fetchDocuments(): Promise<Document[]> {
  const { data } = await api.get("/documents/");
  return data;
}

export async function deleteDocument(doc_id: string): Promise<void> {
  await api.delete(`/documents/${doc_id}`);
}

export async function sendChat(
  question: string,
  doc_ids: string[] | null,
  history: ChatMessage[]
): Promise<{ answer: string; sources: Source[]; doc_ids_used: string[] }> {
  const chat_history = history
    .filter((m) => !m.isLoading)
    .map((m) => ({ role: m.role, content: m.content }));

  const { data } = await api.post("/chat/", {
    question,
    doc_ids: doc_ids && doc_ids.length > 0 ? doc_ids : null,
    chat_history,
  });
  return data;
}
