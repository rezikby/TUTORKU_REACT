import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { ChevronLeft, Loader2, MessageCircle, Search, Send, Paperclip, Image as ImageIcon, Smile, CheckCheck, Trash2, X } from "lucide-react";
import { getEcho } from "../../lib/echo";
import { adminApiFetch } from "../adminApi";
import { clearChatMessageBadge, showChatMessageNotification } from "../../lib/notifications";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
};

interface ChatViewProps {
  user: User | null;
}

type Conversation = {
  id: number;
  with_user: {
    id: number;
    name: string;
    avatar?: string | null;
    role?: string;
  } | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  unread_count?: number;
};

type Message = {
  id: number;
  conversation_id: number;
  sender_id: number;
  type: string;
  content?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  created_at: string;
  is_deleted?: boolean;
  deleted_for?: "me" | "all" | null;
  deleted_by_user_id?: number | null;
  read_at?: string | null;
};

const normalizeConversation = (item: any): Conversation => {
  const otherUser = item.with_user ?? item.other_user ?? item.user ?? null;
  return {
    id: item.id,
    with_user: otherUser
      ? {
          id: otherUser.id,
          name: otherUser.name ?? "Pengguna",
          avatar: otherUser.avatar ?? null,
          role: otherUser.role ?? "user",
        }
      : null,
    last_message_at: item.last_message_at,
    last_message_preview: item.last_message?.content ?? item.last_message_preview ?? null,
    unread_count: item.unread_count ?? 0,
  };
};

const normalizeMessage = (item: any): Message => ({
  id: item.id,
  conversation_id: item.conversation_id,
  sender_id: item.sender_id,
  type: item.type ?? "text",
  content: item.content ?? null,
  file_url: item.file_url ?? null,
  file_name: item.file_name ?? null,
  is_deleted: item.is_deleted ?? false,
  deleted_for: item.deleted_for ?? null,
  deleted_by_user_id: item.deleted_by_user_id ?? null,
  read_at: item.read_at ?? null,
  created_at: item.created_at,
});

const formatTime = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Hari ini";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Kemarin";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  return name.split(" ").map((c) => c[0]).join("").toUpperCase().slice(0, 2);
};

const Avatar = ({ name, avatar, size = "md" }: { name?: string | null; avatar?: string | null; size?: "sm" | "md" }) => {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
  return (
    <div className={`${dim} flex-shrink-0 flex items-center justify-center rounded-full bg-blue-600 font-semibold text-white overflow-hidden`}>
      {avatar ? (
        <img src={avatar} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
};

export default function ChatView({ user }: ChatViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingUpload, setPendingUpload] = useState<{
    file: File;
    previewUrl?: string | null;
    isImage: boolean;
  } | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; messageId: number | null }>({ open: false, messageId: null });
  const [searchQuery, setSearchQuery] = useState("");

  const loadConversations = async () => {
    try {
      const response = await adminApiFetch("/chat/conversations");
      const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      const normalized = list.map(normalizeConversation);
      setConversations(normalized);
      return normalized;
    } catch (error) {
      console.error("Gagal memuat percakapan chat", error);
      return [] as Conversation[];
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const normalized = await loadConversations();
      if (!activeConversation && normalized[0]) setActiveConversation(normalized[0]);
      setLoading(false);
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!activeConversation?.id) return;
    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const response = await adminApiFetch(`/chat/conversations/${activeConversation.id}/messages`);
        const items = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        setMessages(items.map(normalizeMessage).reverse());
        await adminApiFetch(`/chat/conversations/${activeConversation.id}/read`, { method: "POST" });
        clearChatMessageBadge();
        setConversations((prev) =>
          prev.map((item) => (item.id === activeConversation.id ? { ...item, unread_count: 0 } : item))
        );
      } catch (error) {
        console.error("Gagal memuat riwayat chat", error);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();
    try {
      const token = localStorage.getItem("TUTORKU_token");
      const echo = getEcho(token);
      const channel = echo.private(`chat.${activeConversation.id}`);
      channel.listen(".message.sent", async (e: any) => {
        const incoming = e.message ?? e;
        const normalized = normalizeMessage(incoming);
        const senderName = e.sender_name || e.user?.name || activeConversation?.with_user?.name || "Pesan baru";
        const preview = normalized.content || (normalized.type === "image" ? "Mengirim gambar" : normalized.type === "file" ? "Mengirim file" : "Pesan baru");
        setMessages((prev) => {
          if (prev.find((m) => m.id === normalized.id)) return prev;
          return [...prev, normalized];
        });
        if (normalized.sender_id !== user?.id) {
          await showChatMessageNotification({
            title: senderName,
            body: preview,
            icon: activeConversation?.with_user?.avatar || undefined,
          });
        }
      });
      return () => { try { echo.leave(`chat.${activeConversation.id}`); } catch {} };
    } catch {}
  }, [activeConversation?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!input.trim() || !activeConversation || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      const response = await adminApiFetch(`/chat/conversations/${activeConversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ type: "text", content: text }),
      });
      const newMessage = normalizeMessage(response?.data ?? response);
      setMessages((prev) => [...prev, newMessage]);
      setConversations((prev) =>
        prev.map((item) =>
          item.id === activeConversation.id
            ? { ...item, last_message_preview: text, last_message_at: newMessage.created_at }
            : item
        )
      );
    } catch (error) {
      console.error("Gagal mengirim pesan", error);
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;
    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : null;
    setPendingUpload({ file, previewUrl, isImage });
  };

  const cancelPendingUpload = () => {
    if (pendingUpload?.previewUrl) URL.revokeObjectURL(pendingUpload.previewUrl);
    setPendingUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const performUpload = async (file: File, isImage: boolean) => {
    if (!activeConversation) return;
    const formData = new FormData();
    formData.append("type", isImage ? "image" : "file");
    formData.append("file", file);
    setSending(true);
    setUploadError(null);
    setUploadProgress(0);
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "https://rezi-laravel.nlabs.id/api";
      const url = `/chat/conversations/${activeConversation.id}/messages`;
      const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
      const token = localStorage.getItem("TUTORKU_token");
      const res = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", fullUrl, true);
        xhr.withCredentials = true;
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        const cookies = document.cookie.split("; ");
        const xsrf = cookies.find((c) => c.startsWith("XSRF-TOKEN="));
        if (xsrf) xhr.setRequestHeader("X-XSRF-TOKEN", decodeURIComponent(xsrf.split("=")[1]));
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try { resolve(xhr.responseText ? JSON.parse(xhr.responseText) : null); }
              catch { reject(new Error("Invalid JSON response")); }
            } else {
              try { const d = JSON.parse(xhr.responseText || "null"); reject(new Error(d?.message || xhr.statusText || "Upload gagal")); }
              catch { reject(new Error(xhr.statusText || "Upload gagal")); }
            }
          }
        };
        xhr.onerror = () => reject(new Error("Network error saat mengunggah file"));
        xhr.send(formData);
      });
      const newMessage = normalizeMessage(res?.data ?? res);
      setMessages((prev) => [...prev, newMessage]);
      setConversations((prev) =>
        prev.map((item) =>
          item.id === activeConversation.id
            ? { ...item, last_message_preview: isImage ? "[Gambar]" : "[File]", last_message_at: newMessage.created_at }
            : item
        )
      );
    } catch (err: any) {
      setUploadError(err?.message ?? "Gagal mengunggah file");
    } finally {
      setSending(false);
      setTimeout(() => setUploadProgress(null), 800);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPendingUpload(null);
    }
  };

  const emojis = ["😀","😂","😍","🥺","👍","🙏","🎉","❤️","😎","😢","😁","😅","😊","😉","🤔","😴","😡","😇","🤩","🤗"];
  const addEmoji = (emoji: string) => { setInput((prev) => prev + emoji); setShowEmojiPicker(false); };
  const triggerFileSelect = (accept: string) => { if (!fileInputRef.current) return; fileInputRef.current.accept = accept; fileInputRef.current.click(); };

  const startEdit = (message: Message) => {
    if (message.sender_id !== user?.id || message.type !== "text") return;
    setEditingMessageId(message.id);
    setEditingText(message.content ?? "");
  };

  const cancelEdit = () => { setEditingMessageId(null); setEditingText(""); };

  const saveEdit = async (messageId: number) => {
    const newText = editingText.trim();
    if (!newText) return;
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, content: newText } : m)));
    setEditingMessageId(null);
    setEditingText("");
    try {
      await adminApiFetch(`/chat/messages/${messageId}`, { method: "PATCH", body: JSON.stringify({ content: newText }) });
    } catch {}
  };

  const confirmDeleteAction = async (scope: "me" | "all") => {
    const messageId = deleteConfirm.messageId;
    setDeleteConfirm({ open: false, messageId: null });
    if (!messageId) return;
    if (scope === "me") {
      setMessages((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, is_deleted: true, deleted_for: "me", deleted_by_user_id: user?.id ?? null } : msg));
    } else {
      setMessages((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, is_deleted: true, deleted_for: "all", deleted_by_user_id: user?.id ?? null, content: "[Pesan dihapus]" } : msg));
    }
    try {
      await adminApiFetch(`/chat/messages/${messageId}?scope=${scope}`, { method: "DELETE" });
    } catch {}
  };

  const filteredConversations = conversations.filter((c) =>
    !searchQuery || c.with_user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] border border-gray-200 bg-white overflow-hidden">
      <div className="flex h-full">

        <aside className={`w-full md:w-72 flex flex-col border-r border-gray-100 ${activeConversation ? "hidden md:flex" : "flex"}`}>

          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Pesan</h2>
              {conversations.length > 0 && (
                <span className="text-xs font-medium text-gray-400 border border-gray-200 px-2 py-0.5">
                  {conversations.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded">
              <Search size={13} className="text-gray-400 flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
                placeholder="Cari percakapan..."
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex h-32 items-center justify-center gap-2 text-sm text-gray-400">
                <Loader2 size={15} className="animate-spin" />
                <span>Memuat...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto mb-3 h-10 w-10 border border-gray-200 bg-gray-50 flex items-center justify-center rounded">
                  <MessageCircle size={18} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Belum ada percakapan</p>
              </div>
            ) : (
              <div className="py-1">
                {filteredConversations.map((conversation) => {
                  const isActive = activeConversation?.id === conversation.id;
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setActiveConversation(conversation)}
                      className={`flex w-full items-center gap-3 px-4 py-3 relative ${
                        isActive
                          ? "bg-blue-50 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-blue-500"
                          : ""
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar name={conversation.with_user?.name} avatar={conversation.with_user?.avatar} />
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-400" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className={`truncate text-sm ${isActive ? "font-semibold text-blue-700" : "font-medium text-gray-900"}`}>
                            {conversation.with_user?.name ?? "Pengguna"}
                          </p>
                          {conversation.last_message_at && (
                            <span className="text-[10px] text-gray-400 flex-shrink-0">
                              {formatTime(conversation.last_message_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-xs text-gray-400">
                            {conversation.last_message_preview || "Belum ada pesan"}
                          </p>
                          {(conversation.unread_count ?? 0) > 0 && (
                            <span className="flex-shrink-0 bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white rounded">
                              {(conversation.unread_count ?? 0) > 9 ? "9+" : conversation.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className={`flex-1 min-h-0 flex flex-col overflow-hidden ${activeConversation ? "flex" : "hidden md:flex"}`}>
          {activeConversation ? (
            <>
              <div className="flex-shrink-0 flex items-center gap-3 border-b border-gray-100 px-4 py-3 bg-white">
                <button
                  className="md:hidden -ml-1 p-1 text-gray-500"
                  onClick={() => setActiveConversation(null)}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="relative flex-shrink-0">
                  <Avatar name={activeConversation.with_user?.name} avatar={activeConversation.with_user?.avatar} size="sm" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {activeConversation.with_user?.name ?? "Pengguna"}
                  </p>
                  <p className="text-xs text-green-500 font-medium">Online</p>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 min-h-0 overflow-y-auto px-4 py-4"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d1d5db' fill-opacity='0.10'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundColor: "#f8fafc",
                }}
              >
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-400">
                    <Loader2 size={15} className="animate-spin" />
                    <span>Memuat pesan...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-3 h-12 w-12 border border-gray-200 bg-white flex items-center justify-center rounded">
                        <MessageCircle size={20} className="text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Mulai percakapan</p>
                      <p className="text-xs text-gray-400 mt-1">Kirim pesan pertamamu</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {messages.map((message, index) => {
                      const isMine = message.sender_id === user?.id;
                      const isEditing = editingMessageId === message.id;
                      const showDate =
                        index === 0 ||
                        new Date(message.created_at).toDateString() !==
                          new Date(messages[index - 1].created_at).toDateString();

                      if (message.deleted_for === "me" && message.deleted_by_user_id === user?.id) return null;

                      const isDeleted = message.deleted_for === "all";

                      return (
                        <div key={message.id}>
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded">
                                {formatDate(message.created_at)}
                              </span>
                            </div>
                          )}

                          <div className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                            {!isMine && (
                              <Avatar
                                name={activeConversation.with_user?.name}
                                avatar={activeConversation.with_user?.avatar}
                                size="sm"
                              />
                            )}

                            <div
                              className={`group relative max-w-[65%] ${isMine ? "items-end" : "items-start"} flex flex-col`}
                            >
                              <div
                                onDoubleClick={() => !isDeleted && startEdit(message)}
                                className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                                  isMine
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-800 border border-gray-200"
                                } ${isDeleted ? "opacity-60" : ""}`}
                              >
                                {message.type === "image" && message.file_url && !isDeleted && (
                                  <img
                                    src={message.file_url}
                                    alt={message.file_name ?? "image"}
                                    className="max-w-[200px] max-h-[200px] object-contain mb-1.5 rounded"
                                  />
                                )}

                                {message.type === "file" && message.file_url && !isDeleted && (
                                  <div className="mb-1.5 flex items-center gap-2">
                                    <div className={`p-1.5 ${isMine ? "bg-blue-500" : "bg-gray-100"} rounded`}>
                                      <Paperclip size={12} className={isMine ? "text-white" : "text-gray-500"} />
                                    </div>
                                    <a
                                      href={message.file_url}
                                      download={message.file_name ?? "file"}
                                      className={`text-xs ${isMine ? "text-blue-100" : "text-blue-600"}`}
                                    >
                                      {message.file_name ?? "Unduh file"}
                                    </a>
                                  </div>
                                )}

                                {isEditing ? (
                                  <div>
                                    <input
                                      value={editingText}
                                      onChange={(e) => setEditingText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") saveEdit(message.id);
                                        if (e.key === "Escape") cancelEdit();
                                      }}
                                      className="w-full bg-white/20 text-sm px-2 py-1 outline-none border border-white/40 placeholder:text-white/60 rounded"
                                      autoFocus
                                    />
                                    <div className="mt-1.5 flex gap-2">
                                      <button type="button" onClick={() => saveEdit(message.id)} className="text-xs text-white/90 font-medium">
                                        Simpan
                                      </button>
                                      <button type="button" onClick={cancelEdit} className="text-xs text-white/60">
                                        Batal
                                      </button>
                                    </div>
                                  </div>
                                ) : message.is_deleted && message.deleted_for === "all" ? (
                                  <p className="italic text-xs text-gray-300">Pesan telah dihapus</p>
                                ) : (
                                  message.content && (
                                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                  )
                                )}
                              </div>

                              <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? "justify-end" : "justify-start"}`}>
                                <span className="text-[10px] text-gray-400">{formatTime(message.created_at)}</span>
                                {isMine && message.read_at && (
                                  <CheckCheck size={11} className="text-blue-400" />
                                )}
                              </div>

                              {!isDeleted && !isEditing && (
                                <div className={`absolute top-0 ${isMine ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1"} hidden items-center gap-0.5`}>
                                  {isMine && message.type === "text" && (
                                    <button
                                      onClick={() => startEdit(message)}
                                      className="p-1 text-gray-500"
                                      title="Edit"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setDeleteConfirm({ open: true, messageId: message.id })}
                                    className="p-1 text-gray-400"
                                    title="Hapus"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {isMine && <div className="w-8 flex-shrink-0" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <form onSubmit={handleSend} className="sticky bottom-0 z-10 flex-shrink-0 border-t border-gray-200 bg-white p-3">

                {uploadProgress !== null && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                      <span>Mengunggah...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-gray-100 overflow-hidden rounded">
                      <div className="h-full bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="mb-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded">
                    <span className="flex-1">{uploadError}</span>
                    <button type="button" onClick={() => setUploadError(null)}>
                      <X size={12} />
                    </button>
                  </div>
                )}

                {pendingUpload && (
                  <div className="mb-2 flex items-center gap-3 bg-blue-50 border border-blue-100 px-3 py-2.5 rounded">
                    {pendingUpload.isImage && pendingUpload.previewUrl ? (
                      <img src={pendingUpload.previewUrl} alt="preview" className="h-10 w-10 object-cover flex-shrink-0 rounded" />
                    ) : (
                      <div className="h-10 w-10 bg-blue-100 flex items-center justify-center flex-shrink-0 rounded">
                        <Paperclip size={16} className="text-blue-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{pendingUpload.file.name}</p>
                      <p className="text-[10px] text-gray-500">{(pendingUpload.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button type="button" onClick={cancelPendingUpload} className="p-1 text-gray-400">
                      <X size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => performUpload(pendingUpload.file, pendingUpload.isImage)}
                      className="bg-blue-600 text-white px-3 py-1.5 text-xs font-medium"
                    >
                      Kirim
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-1 pb-1">
                    <button
                      type="button"
                      onClick={() => triggerFileSelect("image/*")}
                      className="p-2 text-gray-400"
                      title="Kirim gambar"
                    >
                      <ImageIcon size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerFileSelect("*")}
                      className="p-2 text-gray-400"
                      title="Lampirkan file"
                    >
                      <Paperclip size={17} />
                    </button>
                  </div>
                  <input ref={fileInputRef as any} onChange={handleFileSelected} type="file" className="hidden" />

                  <div className="flex-1 flex items-end border border-gray-200 bg-white overflow-hidden rounded">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Tulis pesan... (Enter untuk kirim)"
                      rows={1}
                      className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-900 px-4 py-2.5 max-h-32"
                      style={{ lineHeight: "1.5" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((s) => !s)}
                      className="p-2.5 text-gray-400 self-end"
                    >
                      <Smile size={17} />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="mb-0.5 p-2.5 bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                  </button>
                </div>

                {showEmojiPicker && (
                  <div className="mt-2 grid grid-cols-10 gap-0.5 bg-white border border-gray-200 p-2 rounded">
                    {emojis.map((em) => (
                      <button key={em} type="button" onClick={() => addEmoji(em)} className="p-1.5 text-base">
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 bg-blue-50 flex items-center justify-center rounded">
                  <MessageCircle size={28} className="text-blue-400" />
                </div>
                <p className="text-base font-semibold text-gray-800">Belum ada percakapan dipilih</p>
                <p className="text-sm text-gray-400 mt-1">Pilih percakapan di sebelah kiri untuk mulai</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-80 bg-white border border-gray-100 overflow-hidden rounded">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 bg-red-50 flex items-center justify-center rounded">
                  <Trash2 size={16} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Hapus Pesan</h2>
                  <p className="text-xs text-gray-500">Pilih opsi penghapusan</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 px-4 py-3 space-y-2">
              <button
                onClick={() => confirmDeleteAction("me")}
                className="w-full flex items-center gap-3 border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 rounded"
              >
                <span className="h-6 w-6 bg-gray-100 flex items-center justify-center text-xs rounded">👤</span>
                Hapus untuk saya
              </button>
              <button
                onClick={() => confirmDeleteAction("all")}
                className="w-full flex items-center gap-3 bg-red-500 px-4 py-2.5 text-sm font-medium text-white rounded"
              >
                <span className="h-6 w-6 bg-red-400 flex items-center justify-center text-xs rounded">🗑️</span>
                Hapus untuk semua orang
              </button>
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <button
                onClick={() => setDeleteConfirm({ open: false, messageId: null })}
                className="w-full py-2 text-sm text-gray-500 font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}