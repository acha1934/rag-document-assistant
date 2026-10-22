import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { ChatMessage as ChatMessageType } from "../types";

interface Props {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: Props) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={`flex gap-3 ${isAssistant ? "flex-row" : "flex-row-reverse"}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isAssistant
            ? "bg-brand-600"
            : "bg-slate-700"
        }`}
        aria-hidden="true"
      >
        {isAssistant ? (
          <Bot size={14} className="text-white" />
        ) : (
          <User size={14} className="text-slate-300" />
        )}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-1.5 max-w-[80%] ${isAssistant ? "" : "items-end"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ${
            isAssistant
              ? "bg-slate-800 text-slate-200 rounded-tl-sm"
              : "bg-brand-600 text-white rounded-tr-sm"
          }`}
        >
          {message.isLoading ? (
            <span className="flex gap-1 items-center h-4">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources */}
        {isAssistant && message.sources && message.sources.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setSourcesOpen((o) => !o)}
              className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
              aria-expanded={sourcesOpen}
            >
              <FileText size={11} />
              {message.sources.length} source{message.sources.length > 1 ? "s" : ""}
              {sourcesOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {sourcesOpen && (
              <div className="mt-1.5 space-y-1.5">
                {message.sources.map((src, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText size={11} className="text-brand-400 flex-shrink-0" />
                      <span className="text-[11px] font-medium text-slate-300 truncate">
                        {src.filename}
                      </span>
                      {src.page && (
                        <span className="ml-auto text-[10px] text-slate-600 flex-shrink-0">
                          p.{src.page}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                      {src.excerpt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
