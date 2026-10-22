import React, { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import DocumentPanel from "./components/DocumentPanel";
import ChatPanel from "./components/ChatPanel";
import { Document } from "./types";
import { fetchDocuments } from "./api";

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load documents on mount
  useEffect(() => {
    fetchDocuments()
      .then(setDocuments)
      .catch(() => {/* server may not be up yet */});
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-950">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <BookOpen size={15} className="text-white" />
          </div>
          <span className="font-semibold text-sm text-slate-200">
            RAG Document Assistant
          </span>
        </div>

        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="ml-auto text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
          aria-label={sidebarOpen ? "Hide document panel" : "Show document panel"}
        >
          {sidebarOpen ? "Hide docs" : "Show docs"}
        </button>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document sidebar */}
        {sidebarOpen && (
          <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900/50 overflow-hidden flex flex-col">
            <DocumentPanel
              documents={documents}
              selectedDocIds={selectedDocIds}
              onDocumentsChange={setDocuments}
              onSelectionChange={setSelectedDocIds}
            />
          </aside>
        )}

        {/* Chat area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <ChatPanel
            documents={documents}
            selectedDocIds={selectedDocIds}
          />
        </main>
      </div>
    </div>
  );
}
