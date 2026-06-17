"use client";
import { useState, useEffect, useRef } from "react";
import { X, Send, MessageCircle, Clock, Shield, Star, MapPin, ChevronDown } from "lucide-react";

const API = "http://localhost:9000";

interface Message { id: string; sender_type: string; content: string; status: string; created_at: string; }

interface ChatDialogProps {
  vendor: any;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_MESSAGES = [
  "Are you available for my wedding date?",
  "What are your pricing packages?",
  "Can I see more portfolio samples?",
  "Do you travel outside the city?",
];

export default function ChatDialog({ vendor, isOpen, onClose }: ChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // Load or create conversation
  useEffect(() => {
    if (!isOpen || !vendor?.id) return;
    fetch(`${API}/api/services/chat/conversations?vendor_id=${vendor.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setConversationId(d.data.id);
          setMessages(d.data.messages || []);
          if (d.data.messages?.length > 0) setShowQuickActions(false);
        }
      })
      .catch(() => {});
  }, [isOpen, vendor?.id]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    setShowQuickActions(false);

    // Optimistic update
    const tempMsg: Message = {
      id: "temp-" + Date.now(),
      sender_type: "user",
      content: text.trim(),
      status: "sent",
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setInput("");

    try {
      const res = await fetch(`${API}/api/services/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendor.id,
          conversation_id: conversationId,
          content: text.trim(),
          sender_type: "user",
        }),
      });
      const d = await res.json();
      if (d.success) {
        if (d.data.conversation_id) setConversationId(d.data.conversation_id);
        // Replace temp message with real one
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...d.data.message, status: "sent" } : m));
      }
    } catch {
      // Keep optimistic message
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Chat Panel */}
      <div className="relative w-full sm:w-[420px] h-[85vh] sm:h-[600px] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in">
        
        {/* ── HEADER ── */}
        <div className="shrink-0 px-4 py-3 border-b border-gray-100 flex items-center gap-3" style={{ background: "#FAFAF8" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#FE6972" + "15" }}>
            <MessageCircle className="w-5 h-5" style={{ color: "#FE6972" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{vendor?.business_name}</h3>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Online
              </span>
              {vendor?.city && <span>· {vendor.city}</span>}
              <span>· ⭐ {vendor?.rating}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* ── TRUST HINTS ── */}
        <div className="shrink-0 px-4 py-2 flex gap-2 border-b border-gray-50 overflow-x-auto" style={{ background: "#FEFEFE" }}>
          {vendor?.is_verified && (
            <span className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-semibold">
              <Shield className="w-3 h-3" />Verified
            </span>
          )}
          {vendor?.response_time_hours && (
            <span className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-semibold">
              <Clock className="w-3 h-3" />Responds in {vendor.response_time_hours}h
            </span>
          )}
          {vendor?.reviews_count > 0 && (
            <span className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold">
              <Star className="w-3 h-3" />{vendor.reviews_count} reviews
            </span>
          )}
        </div>

        {/* ── MESSAGES ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "#F8F8F6" }}>
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "#FE6972" + "10" }}>
                <MessageCircle className="w-6 h-6" style={{ color: "#FE6972" }} />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Start a conversation</p>
              <p className="text-xs text-gray-400">Ask about availability, pricing, or anything else</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.sender_type === "user"
                  ? "rounded-br-md text-white"
                  : msg.sender_type === "system"
                    ? "bg-gray-100 text-gray-500 text-center mx-auto rounded-xl"
                    : "bg-white border border-gray-100 text-gray-700 rounded-bl-md shadow-sm"
              }`} style={msg.sender_type === "user" ? { background: "#FE6972" } : {}}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${msg.sender_type === "user" ? "text-white/60" : "text-gray-400"}`}>
                  {formatTime(msg.created_at)}
                  {msg.sender_type === "user" && msg.status === "seen" && " ✓✓"}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* ── QUICK ACTIONS ── */}
        {showQuickActions && (
          <div className="shrink-0 px-4 py-2 border-t border-gray-100 flex gap-2 overflow-x-auto" style={{ background: "#FEFEFE" }}>
            {QUICK_MESSAGES.map((q, i) => (
              <button key={i} onClick={() => sendMessage(q)}
                className="shrink-0 px-3 py-1.5 rounded-full border text-[11px] font-medium transition hover:shadow-sm"
                style={{ borderColor: "#FE6972" + "40", color: "#FE6972" }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* ── INPUT ── */}
        <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-pink-300 transition"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition disabled:opacity-40"
              style={{ background: "#FE6972", color: "white" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
