import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from "react";
import { X, Send, MessageCircle, Paperclip, Trash2, Pencil, Image as ImageIcon } from "lucide-react";
import { getEcho } from "../../lib/echo";
import { toastError, toastSuccess } from "../../lib/swal";

type LiveChatProps = {
  bookingId: string | null;
  onClose: () => void;
  isMobile?: boolean;
  hideHeader?: boolean;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  currentUserId: number | undefined;
  currentUserRole?: string;
  isBlocked?: boolean;
  blockedMessage?: string;
};

type BookingUser = {
  id: number;
  name?: string | null;
  avatar?: string | null;
  role?: string | null;
};

type Message = {
  id: string | number;
  conversation_id: number;
  sender_id: number;
  type: "text" | "image" | "file" | "voice" | "link";
  content?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  created_at: string;
  is_deleted?: boolean;
  deleted_for?: "me" | "all" | null;
  deleted_by_user_id?: number | null;
  read_at?: string | null;
};

type ConversationResponse = {
  id: number;
  with_user: BookingUser;
};

const formatTime = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

const getAvatarColor = (name: string) => {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-green-500 to-green-600",
    "from-red-500 to-red-600",
    "from-pink-500 to-pink-600",
    "from-indigo-500 to-indigo-600",
    "from-teal-500 to-teal-600",
    "from-orange-500 to-orange-600",
    "from-cyan-500 to-cyan-600",
    "from-rose-500 to-rose-600",
  ];
  return colors[name.length % colors.length] ?? colors[0];
};

const getAvatarLabel = (name?: string | null) => {
  if (!name) return "U";
  return name
    .trim()
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export default function LiveChat({
  bookingId,
  onClose,
  isMobile = false,
  hideHeader = false,
  apiFetch,
  currentUserId,
  isBlocked = false,
  blockedMessage,
}: LiveChatProps) {
  const showHeader = !hideHeader;
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [otherUser, setOtherUser] = useState<BookingUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingUpload, setPendingUpload] = useState<{ file: File; previewUrl?: string | null; isImage: boolean } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | number | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizeMessage = (message: any): Message => ({
    id: message.id,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    type: message.type,
    content: message.content ?? null,
    file_url: message.file_url ?? null,
    file_name: message.file_name ?? null,
    created_at: message.created_at,
    is_deleted: message.is_deleted ?? false,
    deleted_for: message.deleted_for ?? null,
    deleted_by_user_id: message.deleted_by_user_id ?? null,
    read_at: message.read_at ?? null,
  });

  const parseLinkPreview = (content?: string | null) => {
    if (!content) return null;
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as { title?: string; type?: string; url?: string };
      }
    } catch {
      return null;
    }
    return null;
  };

  const renderLinkPreview = (message: Message) => {
    const preview = parseLinkPreview(message.content);
    if (!preview || !preview.url) {
      return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
    }

    return (
      <a
        href={preview.url}
        target="_blank"
        rel="noreferrer"
        className="group block rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white transition hover:border-blue-400 hover:bg-blue-500/10"
      >
        <div className="mb-1 text-xs uppercase tracking-[0.1em] text-blue-300">Materi</div>
        <div className="font-semibold text-white">{preview.title ?? "Pratinjau materi"}</div>
        {preview.type && <div className="mt-1 text-xs text-gray-300">Tipe: {preview.type.toUpperCase()}</div>}
        <div className="mt-2 truncate text-xs text-blue-200">{preview.url}</div>
      </a>
    );
  };

  const addMessageIfUnique = (message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => String(m.id) === String(message.id))) return prev;
      return [...prev, message];
    });
  };

  const upsertMessage = (message: Message) => {
    setMessages((prev) => {
      const index = prev.findIndex((m) => String(m.id) === String(message.id));
      if (index === -1) return [...prev, message];
      const updated = [...prev];
      updated[index] = { ...updated[index], ...message };
      return updated;
    });
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherTyping]);

  const notifyTyping = (typing: boolean) => {
    if (!conversationId) return;
    apiFetch(`/chat/conversations/${conversationId}/typing`, {
      method: "POST",
      body: JSON.stringify({ is_typing: typing }),
    }).catch(() => {});
  };

  const loadMessages = async (conversationId: number) => {
    setLoadingMessages(true);
    try {
      const data = await apiFetch(`/chat/conversations/${conversationId}/messages`);
      const list = Array.isArray(data.data ?? data) ? (data.data ?? data) : [];
      setMessages([...list].reverse().map(normalizeMessage));
      await apiFetch(`/chat/conversations/${conversationId}/read`, { method: "POST" });
    } catch (error) {
      console.error("Gagal memuat pesan live chat", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const initializeConversation = async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const bookingResponse = await apiFetch(`/bookings/${bookingId}`);
      const booking = bookingResponse.data ?? bookingResponse;
      const student = booking?.student;
      const tutor = booking?.tutor;
      const tutorUser = {
        id: tutor?.user_id ?? tutor?.id,
        name: tutor?.name ?? tutor?.user?.name ?? tutor?.user?.full_name ?? null,
        avatar: tutor?.photo ?? tutor?.user?.avatar ?? null,
        role: "tutor",
      };
      const isCurrentTutor = currentUserId === tutorUser.id;
      const other = isCurrentTutor ? student : tutorUser;

      if (other?.id) {
        setOtherUser({ id: other.id, name: other.name, avatar: other.avatar ?? null, role: isCurrentTutor ? "student" : "tutor" });
      }

      const response = await apiFetch("/chat/conversations/start", {
        method: "POST",
        body: JSON.stringify({ user_id: other?.id ?? 0, booking_id: Number(bookingId) }),
      });
      const conversation: ConversationResponse = response.data ?? response;
      setConversationId(conversation.id);
      if (conversation.with_user) {
        setOtherUser({ id: conversation.with_user.id, name: conversation.with_user.name, avatar: conversation.with_user.avatar ?? null, role: conversation.with_user.role ?? null });
      }
      await loadMessages(conversation.id);
    } catch (error: any) {
      console.error("Gagal menyiapkan live chat", error);
      setLoadError(error?.message ?? "Gagal menyiapkan live chat. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!bookingId || !currentUserId) {
      setLoading(false);
      return;
    }

    let active = true;
    if (active) {
      initializeConversation();
    }

    return () => {
      active = false;
    };
  }, [bookingId, currentUserId]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const token = localStorage.getItem("TUTORKU_token");
    const echo = getEcho(token);
    const conversationChannel = echo.private(`chat.${conversationId}`);
    const userChannel = echo.private(`chat-messages.${currentUserId}`);

    const handleMessage = (e: any) => {
      const incoming = e.message ?? e;
      if (incoming.conversation_id !== conversationId) return;
      addMessageIfUnique(normalizeMessage(incoming));
    };

    const handleTyping = (e: any) => {
      if (e.user_id === currentUserId) return;
      setIsOtherTyping(e.is_typing);
    };

    conversationChannel.listen(".message.sent", handleMessage);
    conversationChannel.listen(".user.typing", handleTyping);
    userChannel.listen(".message.sent", handleMessage);

    return () => {
      conversationChannel.stopListening(".message.sent", handleMessage);
      conversationChannel.stopListening(".user.typing", handleTyping);
      userChannel.stopListening(".message.sent", handleMessage);
    };
  }, [conversationId, currentUserId]);

  const handleInputChange = (value: string) => {
    setChatInput(value);
    setIsTyping(true);
    notifyTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      notifyTyping(false);
    }, 1500);
  };

  const clearTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    notifyTyping(false);
  };

  const sendTextMessage = async () => {
    if (isBlocked || !chatInput.trim() || sending || !conversationId) return;
    const content = chatInput.trim();
    setChatInput("");
    clearTyping();
    setSending(true);
    try {
      const response = await apiFetch(`/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ type: "text", content }),
      });
      const newMessage = normalizeMessage(response?.data ?? response);
      addMessageIfUnique(newMessage);
    } catch (error: any) {
      console.error("Gagal mengirim pesan", error);
      toastError(error?.message || "Gagal mengirim pesan. Silakan coba lagi.");
      setChatInput(content);
    } finally {
      setSending(false);
    }
  };

  const selectFile = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : null;
    setPendingUpload({ file, previewUrl, isImage });
  };

  const cancelUpload = () => {
    if (pendingUpload?.previewUrl) URL.revokeObjectURL(pendingUpload.previewUrl);
    setPendingUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFile = async (file: File, isImage: boolean) => {
    if (!conversationId) return;
    setSending(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("type", isImage ? "image" : "file");
      formData.append("file", file);
      const response = await apiFetch(`/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        body: formData,
      });
      const newMessage = normalizeMessage(response?.data ?? response);
      addMessageIfUnique(newMessage);
      cancelUpload();
    } catch (error: any) {
      const message = error?.message ?? "Gagal mengunggah file";
      setUploadError(message);
      toastError(message);
    } finally {
      setSending(false);
    }
  };

  const startEdit = (message: Message) => {
    if (message.sender_id !== currentUserId || message.type !== "text") return;
    setEditingMessageId(message.id);
    setEditingText(message.content ?? "");
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const saveEdit = async () => {
    if (!editingMessageId || !editingText.trim()) return;
    const messageId = editingMessageId;
    const newText = editingText.trim();
    setEditingMessageId(null);
    setEditingText("");
    setMessages((prev) => prev.map((msg) => (String(msg.id) === String(messageId) ? { ...msg, content: newText } : msg)));
    try {
      await apiFetch(`/chat/messages/${messageId}`, {
        method: "PATCH",
        body: JSON.stringify({ content: newText }),
      });
    } catch (error: any) {
      console.error("Gagal mengedit pesan", error);
      toastError(error?.message || "Gagal mengedit pesan. Silakan coba lagi.");
    }
  };

  const deleteMessage = async (messageId: string | number, scope: "me" | "all") => {
    try {
      await apiFetch(`/chat/messages/${messageId}?scope=${scope}`, { method: "DELETE" });
      if (scope === "all") {
        toastSuccess("Pesan berhasil dihapus untuk semua.");
      } else {
        toastSuccess("Pesan berhasil dihapus untuk Anda.");
      }
    } catch (error: any) {
      console.error("Gagal menghapus pesan", error);
      toastError(error?.message || "Gagal menghapus pesan. Silakan coba lagi.");
    }
  };

  const confirmDelete = async (message: Message) => {
    const scope = window.confirm("Hapus pesan untuk semua orang? Tekan OK untuk semua, Batal untuk hanya saya.") ? "all" : "me";
    if (!message.id) return;
    if (scope === "me") {
      setMessages((prev) => prev.map((msg) => (String(msg.id) === String(message.id) ? { ...msg, is_deleted: true, deleted_for: "me" } : msg)));
    } else {
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg.id) === String(message.id)
            ? ({ ...msg, is_deleted: true, deleted_for: "all", content: "[Pesan dihapus]", file_url: null, file_name: null } as Message)
            : msg,
        ),
      );
    }
    await deleteMessage(message.id, scope);
  };

  useEffect(() => {
    if (!isMobile) {
      inputRef.current?.focus();
    }
  }, [isMobile]);

  if (!currentUserId) {
    return (
      <div className="min-h-[320px] p-6 bg-[#1E1F22] text-white">
        <p>Anda harus login untuk menggunakan live chat.</p>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? "fixed inset-0 z-50 flex items-stretch bg-black/60 backdrop-blur-sm" : "h-full min-h-0 flex flex-col bg-[#1E1F22]"}`}>
      <div className={`${isMobile ? "ml-auto h-full w-full max-w-[720px] bg-[#2B2D31] shadow-2xl border-l border-[#3F4147] flex flex-col" : "flex-1 min-h-0 h-full flex flex-col"}`}>
        {showHeader && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#3F4147] bg-[#2B2D31] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-blue-400" />
                <div>
                  <div className="text-sm font-semibold text-white">Room Chat</div>
                  <div className="text-[11px] text-gray-400">{otherUser ? `Bersama ${otherUser.name}` : "Memuat..."}</div>
                </div>
              </div>
            </div>
            {isMobile && (
              <button
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#3F4147] text-[#B5BAC1] hover:bg-[#4A4D54] hover:text-white transition"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-[#3F4147] scrollbar-track-transparent bg-[#1E1F22]">
          {loadError ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center text-red-300">
              <div className="mb-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
                {loadError}
              </div>
              <button
                onClick={initializeConversation}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Coba lagi
              </button>
            </div>
          ) : loading || loadingMessages ? (
            <div className="flex h-full min-h-[240px] items-center justify-center text-gray-400">Memuat chat...</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center text-gray-400">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white">
                <MessageCircle size={20} />
              </div>
              <p className="text-sm font-semibold text-white">Belum ada pesan.</p>
              <p className="text-xs text-gray-400">Mulai percakapan dengan mengirim pesan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isMe = message.sender_id === currentUserId;
                const isDeleted = message.is_deleted && message.deleted_for === "all";
                const showActions = isMe && message.type === "text" && !isDeleted;
                return (
                  <div key={String(message.id)} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%]">
                      <div className={`group relative rounded-2xl p-3 text-sm transition-all duration-150 ${isMe ? "bg-blue-600 text-white" : "bg-[#2B2D31] text-gray-100"}`}>
                        {!isDeleted && message.type === "image" && message.file_url ? (
                          <img src={message.file_url} alt={message.file_name ?? "image"} className="max-h-56 w-full rounded-lg object-contain" />
                        ) : !isDeleted && message.type === "file" && message.file_url ? (
                          <a href={message.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/10">
                            <Paperclip size={14} />
                            <span>{message.file_name ?? "Unduh file"}</span>
                          </a>
                        ) : !isDeleted && message.type === "link" ? (
                          renderLinkPreview(message)
                        ) : (
                          <p className={`whitespace-pre-wrap break-words ${isDeleted ? "text-gray-400 italic" : ""}`}>
                            {isDeleted ? "[Pesan dihapus]" : message.content}
                          </p>
                        )}

                        {showActions && (
                          <div className="absolute right-2 top-2 hidden items-center gap-1 group-hover:flex">
                            <button
                              type="button"
                              onClick={() => startEdit(message)}
                              className="rounded-full p-1 text-white/70 hover:text-white"
                              title="Edit pesan"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(message)}
                              className="rounded-full p-1 text-white/70 hover:text-white"
                              title="Hapus pesan"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className={`mt-1 flex items-center ${isMe ? "justify-end" : "justify-start"} gap-2 text-[10px] text-gray-400`}>
                        <span>{formatTime(message.created_at)}</span>
                      </div>
                      {editingMessageId === message.id && (
                        <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#23252b] p-3">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={3}
                            className="w-full resize-none rounded border border-[#3F4147] bg-[#1E1F22] px-3 py-2 text-sm text-white outline-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={saveEdit} className="rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Simpan</button>
                            <button onClick={cancelEdit} className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white">Batal</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {isOtherTyping && (
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span>{otherUser?.name ?? "Partner"} sedang mengetik...</span>
            </div>
          )}
        </div>

        <div className="border-t border-[#3F4147] px-4 py-3 bg-[#2B2D31] flex-shrink-0">
          {uploadError && <div className="mb-2 text-xs text-red-400">{uploadError}</div>}
          {isBlocked && (
            <div className="mb-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {blockedMessage || "Chat sedang diblokir oleh tutor."}
            </div>
          )}
          {pendingUpload && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100">
              <div className="flex min-w-0 items-center gap-3">
                {pendingUpload.isImage ? <ImageIcon size={18} /> : <Paperclip size={18} />}
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="truncate font-medium">{pendingUpload.file.name}</div>
                  <div className="text-xs text-gray-400">{(pendingUpload.file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <button onClick={cancelUpload} className="rounded-full bg-white/10 px-3 py-2 text-xs text-gray-200">Batal</button>
                <button onClick={() => uploadFile(pendingUpload.file, pendingUpload.isImage)} className="rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Kirim</button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => selectFile("image/*")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-200 hover:bg-white/10"
              title="Unggah gambar"
            >
              <ImageIcon size={18} />
            </button>
            <button
              type="button"
              onClick={() => selectFile(".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-200 hover:bg-white/10"
              title="Unggah file"
            >
              <Paperclip size={18} />
            </button>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={chatInput}
                disabled={isBlocked}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendTextMessage();
                  }
                }}
                placeholder={isBlocked ? "Chat diblokir" : "Ketik pesan..."}
                className="w-full rounded-full border border-white/10 bg-[#1E1F22] px-4 py-2 text-sm text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            <button
              type="button"
              onClick={sendTextMessage}
              disabled={sending || isBlocked || !chatInput.trim()}
              className="inline-flex h-10 items-center justify-center rounded-full bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
        </div>
      </div>
    </div>
  );
}
