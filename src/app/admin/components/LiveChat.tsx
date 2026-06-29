import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, User, Mic, MicOff } from "lucide-react";

type LiveChatProps = {
  bookingId: string | null;
  onClose: () => void;
};

export default function LiveChat({ bookingId, onClose }: LiveChatProps) {
  const [messages, setMessages] = useState([
    { from: "student", text: "Halo, saya sudah siap belajar.", time: "10:32" },
    { from: "tutor", text: "Baik, mari kita mulai dengan ringkasan materi.", time: "10:33" },
    { from: "student", text: "Siap! Saya sudah baca materinya sebelumnya.", time: "10:34" },
  ]);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!draft.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { from: "tutor", text: draft, time }]);
    setDraft("");
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-black/40 backdrop-blur-sm">
      <div className="ml-auto h-full w-full max-w-[720px] bg-[#2B2D31] shadow-2xl border-l border-[#3F4147] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3F4147]">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#B5BAC1]">Live Chat</div>
            <div className="text-lg font-semibold text-[#DBDEE1]">Chat Sesi {bookingId ? `#${bookingId}` : ""}</div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#3F4147] text-[#B5BAC1] hover:bg-[#4A4D54] hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin scrollbar-thumb-[#3F4147] scrollbar-track-transparent bg-[#1E1F22]">
          {messages.map((message, index) => {
            const isTutor = message.from === "tutor";
            return (
              <div
                key={index}
                className={`flex items-start gap-2.5 ${isTutor ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isTutor ? "bg-[#5865F2] text-white" : "bg-[#3F4147] text-[#B5BAC1]"
                }`}>
                  {isTutor ? "T" : "S"}
                </div>
                <div className={`max-w-[75%] ${isTutor ? "items-end" : ""}`}>
                  <div className={`px-4 py-2.5 rounded-lg text-sm ${
                    isTutor 
                      ? "bg-[#5865F2] text-white rounded-tr-sm" 
                      : "bg-[#3F4147] text-[#DBDEE1] rounded-tl-sm"
                  }`}>
                    {message.text}
                  </div>
                  <div className={`text-[10px] text-[#B5BAC1] mt-0.5 ${isTutor ? "text-right" : "text-left"}`}>
                    {message.time}
                  </div>
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                T
              </div>
              <div className="bg-[#3F4147] px-4 py-2.5 rounded-lg rounded-tl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#B5BAC1] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-[#B5BAC1] rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
                  <span className="w-2 h-2 bg-[#B5BAC1] rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[#3F4147] px-5 py-4 bg-[#2B2D31]">
          <div className="flex gap-3">
            <input
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setIsTyping(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan..."
              className="flex-1 rounded-full border border-[#3F4147] bg-[#1E1F22] px-4 py-3 text-sm text-[#DBDEE1] placeholder:text-[#B5BAC1] outline-none focus:border-[#5865F2] transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!draft.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-[#5865F2] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4752C4] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} /> Kirim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}