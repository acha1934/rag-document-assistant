import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  FileText,
  Trash2,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { Document } from "../types";
import { uploadDocument, deleteDocument } from "../api";

interface Props {
  documents: Document[];
  selectedDocIds: string[];
  onDocumentsChange: (docs: Document[]) => void;
  onSelectionChange: (ids: string[]) => void;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

export default function DocumentPanel({
  documents,
  selectedDocIds,
  onDocumentsChange,
  onSelectionChange,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  let toastId = 0;

  const addToast = (type: "success" | "error", message: string) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;
      setUploading(true);

      for (const file of accepted) {
        try {
          const result = await uploadDocument(file);
          onDocumentsChange([
            ...documents,
            { doc_id: result.doc_id, filename: result.filename },
          ]);
          addToast("success", `"${result.filename}" indexed (${result.chunk_count} chunks)`);
        } catch (err: unknown) {
          const msg =
            (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
            "Upload failed";
          addToast("error", msg);
        }
      }
      setUploading(false);
    },
    [documents, onDocumentsChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
    },
    multiple: true,
  });

  const handleDelete = async (doc: Document) => {
    try {
      await deleteDocument(doc.doc_id);
      const updated = documents.filter((d) => d.doc_id !== doc.doc_id);
      onDocumentsChange(updated);
      onSelectionChange(selectedDocIds.filter((id) => id !== doc.doc_id));
      addToast("success", `"${doc.filename}" removed`);
    } catch {
      addToast("error", "Failed to delete document");
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedDocIds.includes(id)) {
      onSelectionChange(selectedDocIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedDocIds, id]);
    }
  };

  const selectAll = () => onSelectionChange(documents.map((d) => d.doc_id));
  const clearAll = () => onSelectionChange([]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <FileText size={16} className="text-brand-400" />
          Documents
          {documents.length > 0 && (
            <span className="ml-auto text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
              {documents.length}
            </span>
          )}
        </h2>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`mx-3 mt-3 rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-brand-500 bg-brand-500/10"
            : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50"
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 size={20} className="animate-spin text-brand-400" />
            <span className="text-xs">Processing…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Upload size={20} className={isDragActive ? "text-brand-400" : ""} />
            <span className="text-xs">
              {isDragActive ? "Drop files here" : "Drop files or click to upload"}
            </span>
            <span className="text-[10px] text-slate-600">PDF · DOCX · TXT · MD</span>
          </div>
        )}
      </div>

      {/* Filter controls */}
      {documents.length > 0 && (
        <div className="px-3 pt-3 pb-1 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Filter chat to selected docs
          </span>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-[11px] text-brand-400 hover:text-brand-300"
            >
              All
            </button>
            <span className="text-slate-700">·</span>
            <button
              onClick={clearAll}
              className="text-[11px] text-brand-400 hover:text-brand-300"
            >
              None
            </button>
          </div>
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5 mt-1">
        {documents.length === 0 ? (
          <p className="text-xs text-slate-600 text-center mt-6">
            No documents yet. Upload one above.
          </p>
        ) : (
          documents.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.doc_id);
            return (
              <div
                key={doc.doc_id}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-colors group ${
                  isSelected
                    ? "bg-brand-900/40 border border-brand-700/50"
                    : "bg-slate-800/50 border border-transparent hover:bg-slate-800"
                }`}
                onClick={() => toggleSelect(doc.doc_id)}
              >
                {/* Selection indicator */}
                <div
                  className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-brand-500 border-brand-500"
                      : "border-slate-600 group-hover:border-slate-400"
                  }`}
                >
                  {isSelected && (
                    <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 8 8">
                      <path d="M1.5 4L3 5.5L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>

                <FileText size={13} className={isSelected ? "text-brand-400" : "text-slate-500"} />

                <span
                  className={`flex-1 text-xs truncate ${
                    isSelected ? "text-slate-200" : "text-slate-400"
                  }`}
                  title={doc.filename}
                >
                  {doc.filename}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(doc);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-600 hover:text-red-400 transition-all"
                  title="Remove document"
                  aria-label={`Delete ${doc.filename}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 left-4 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2 rounded-lg px-3 py-2.5 shadow-lg text-xs max-w-xs ${
              t.type === "success"
                ? "bg-emerald-900/80 text-emerald-200 border border-emerald-700/50"
                : "bg-red-900/80 text-red-200 border border-red-700/50"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            )}
            <span>{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="ml-auto flex-shrink-0 opacity-60 hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
