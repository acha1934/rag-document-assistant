import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Trash2, Bot, AlertTriangle } from "lucide-react";
import ChatMessageComponent from "./ChatMessage";
import { ChatMessage, Document } from "../types";
import { sendChat } from "../api";

interface Props {
  documents: Document[];
  selectedDocIds: string[];
}

let msgIdCounter = 0;
const genId = () => String(++msgIdCounter);

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your document assistant. Upload documents using the panel on the left, then ask me anything about their content. You can also filter my search to specific documents by selecting them.",
};

export default function ChatPanel({ documents, selectedDocIds }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    if (documents.length === 0) {
      setError("Please upload at least one document before asking questions.");
      return;
    }

    setError(null);
    setInput("");

    const userMsg: ChatMessage = { id: genId(), role: "user", content: question };
    const placeholderMsg: ChatMessage = {
      id: genId(),
      role: "assistant",
      content: "",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, placeholderMsg]);
    setLoading(true);

    try {
      const result = await sendChat(
        question,
        selectedDocIds.length > 0 ? selectedDocIds : null,
        [...messages, userMsg]
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderMsg.id
            ? { ...m, content: result.answer, sources: result.sources, isLoading: false }
            : m
        )
      );
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Something went wrong. Please try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderMsg.id
            ? { ...m, content: `❌ ${detail}`, isLoading: false }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([WELCOME]);
    setError(null);
  };

  const filterLabel =
    selectedDocIds.length === 0
      ? "All documents"
      : `${selectedDocIds.length} doc${selectedDocIds.length > 1 ? "s" : ""} selected`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-brand-400" />
          <h2 className="text-sm font-semibold text-slate-200">Chat</h2>
          <span className="text-[11px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
            {filterLabel}
          </span>
        </div>
        <button
          onClick={clearChat}
          className="p-1.5 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          title="Clear conversation"
          aria-label="Clear conversation"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessageComponent key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg bg-amber-900/30 border border-amber-700/40 px-3 py-2 text-xs text-amber-300">
          <AlertTriangle size={13} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-end gap-2 bg-slate-800 rounded-xl border border-slate-700 focus-within:border-brand-600 transition-colors px-3 py-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your documents…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 resize-none outline-none min-h-[20px] leading-5"
            aria-label="Chat input"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-7 h-7 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Send message"
          >
            <Send size={13} className={loading || !input.trim() ? "text-slate-500" : "text-white"} />
          </button>
        </div>
        <p className="text-[10px] text-slate-700 mt-1.5 text-center">
          Shift+Enter for new line · Enter to send
        </p>
      </div>
    </div>
  );
}
