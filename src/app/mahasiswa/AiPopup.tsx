"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { Bot, Send, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const API_BASE = (env.VITE_API_URL ?? "http://localhost:8000/api").replace(/\/?$/, "");
const GROQ_API_KEY = (env.VITE_GROQ_API_KEY || env.GROQ_API_KEY || "").trim();
const GROQ_MODEL = (env.VITE_GROQ_MODEL || env.GROQ_MODEL || "mixtral-8x7b-32768").trim();
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function AiPopup({ compact }: { compact?: boolean } = {}) {
  const [open, setOpen] = React.useState(false);
  const { t, i18n } = useTranslation();
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      role: "assistant",
      text: t("aiPopup.initialAssistant"),
    },
  ]);
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const callAi = async (prompt: string) => {
    const isGroqConfigured = Boolean(GROQ_API_KEY);
    const endpoint = isGroqConfigured ? GROQ_URL : `${API_BASE}/ai/chat`;
    const payload = isGroqConfigured
      ? {
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant for TUTORKU.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 600,
        }
      : { message: prompt };

    const headers: Record<string, string> = isGroqConfigured
      ? {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        }
      : {
          "Content-Type": "application/json",
          Accept: "application/json",
        };

    const resp = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errorBody = await resp.text();
      throw new Error(`AI request failed: ${resp.status} ${errorBody}`);
    }

    const json = await resp.json();
    return isGroqConfigured
      ? json?.choices?.[0]?.message?.content || "AI tidak mengembalikan respons yang valid."
      : json?.reply || json?.message || json?.response || json?.content || "AI tidak mengembalikan respons yang valid.";
  };

  const translateText = async (text: string, targetLang: string) => {
    try {
      const translated = await callAi(`Translate the following text to ${targetLang}:\n\n${text}`);
      return translated.trim();
    } catch (e) {
      console.warn("Translation failed:", e);
      return text;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedInput = input.trim();
    if (!trimmedInput) {
      setError(t("aiPopup.enterQuestion"));
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      text: trimmedInput,
    };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const output = await callAi(`Kamu adalah Smart Matching AI yang membantu siswa memilih tutor di TUTORKU.
Buat rekomendasi tutor terbaik berdasarkan kebutuhan belajar siswa.

Berikan:
1. 3 rekomendasi tutor yang paling cocok,
2. alasan mengapa masing-masing cocok,
3. jika memungkinkan, sampaikan estimasi harga atau paket belajar yang relevan.

Tulis jawaban dalam bahasa Indonesia yang ringkas dan mudah dibaca.

Pertanyaan pengguna: ${trimmedInput}`);

      const userLang = i18n?.language || (typeof window !== "undefined" ? localStorage.getItem("TUTORKU_lang") || "id" : "id");
      let finalText = output.trim();

      try {
        if (userLang && userLang !== "id") {
          const translated = await translateText(finalText, userLang);
          finalText = translated || finalText;
        }
      } catch (e) {
        console.warn("Auto-translation failed:", e);
      }

      setMessages((current) => [...current, { role: "assistant", text: finalText }]);
    } catch (err) {
      console.error(err);
      setError(t("aiPopup.fetchFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant={compact ? "ghost" : "secondary"}
        size={compact ? "icon" : "default"}
        className={
          compact
            ? "h-14 w-14 rounded-full bg-white text-slate-900 shadow-xl ring-1 ring-slate-200 hover:scale-105 transition-transform"
            : ""
        }
        onClick={() => setOpen(true)}
        aria-label={t("aiPopup.ariaLabel")}
      >
        <Bot size={20} />
        {!compact && t("aiPopup.title")}
      </Button>

      {/* Modal - Room Chat dengan Pattern */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg bg-white overflow-hidden relative shadow-2xl">
            {/* Tombol Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-white/90 hover:bg-white rounded-full shadow-md backdrop-blur-sm"
            >
              <X size={18} />
            </button>

            {/* Room Chat */}
            <div className="flex h-[550px] flex-col bg-white">
              {/* Header Chat - Background Biru dengan Pattern */}
              <div className="relative flex items-center gap-2 bg-[#2563EB] px-4 py-3 text-white overflow-hidden">
                {/* Pattern overlay */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                                     radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%),
                                     radial-gradient(circle at 50% 80%, rgba(255,255,255,0.06) 0%, transparent 30%)`,
                  }}
                />
                <div 
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
                <div className="relative z-10 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t("aiPopup.title")}</p>
                    <p className="text-xs text-white/80">{t("aiPopup.subtitle")}</p>
                  </div>
                </div>
              </div>
              
              {/* Messages - Background Putih dengan Pattern Halus */}
              <div 
                className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563EB' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundColor: "#fafbfc",
                }}
              >
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[85%] ${
                      message.role === "assistant"
                        ? "rounded-[22px] rounded-br-none bg-[#2563EB] text-white px-4 py-3 shadow-sm"
                        : "ml-auto rounded-[22px] rounded-bl-none bg-white text-gray-800 px-4 py-3 shadow-sm border border-gray-100"
                    }`}
                  >
                    {message.text}
                  </div>
                ))}
                {isLoading && (
                  <div className="max-w-[85%] rounded-[22px] rounded-br-none bg-[#2563EB] text-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/60"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "0.2s" }}></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "0.4s" }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-white/95 backdrop-blur-sm p-3 border-t border-gray-100">
                {error && (
                  <p className="text-sm text-red-500 mb-2">{error}</p>
                )}
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <Textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={t("aiPopup.placeholder")}
                    className="min-h-[50px] max-h-[100px] flex-1 rounded-2xl border border-gray-200 bg-white/90 px-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#2563EB] focus:ring-[#2563EB]/20 resize-none backdrop-blur-sm"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e as any);
                      }
                    }}
                  />
                  <Button 
                    type="submit" 
                    className="h-10 w-10 flex-shrink-0 rounded-full bg-[#2563EB] hover:bg-[#1a4db8] p-0 shadow-md hover:shadow-lg transition-all"
                    disabled={isLoading || !input.trim()}
                  >
                    <Send size={16} className="text-white" />
                  </Button>
                </form>
                <p className="text-xs text-gray-400 mt-2 text-right">{t("aiPopup.description")}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}