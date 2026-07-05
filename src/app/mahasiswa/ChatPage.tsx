// frontend/src/components/ChatPage.tsx
import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import twemoji from "twemoji";
import {
  Search,
  ChevronLeft,
  Paperclip,
  Send,
  Check,
  CheckCheck,
  FileText,
  Loader2,
  User,
  MessageCircle,
  Smile,
  Trash2,
  X,
} from "lucide-react";
import { getEcho } from "../lib/echo";
import { toastSuccess, toastError } from "../lib/swal";
import { clearChatMessageBadge, showChatMessageNotification } from "../lib/notifications";
import { Skeleton } from "../components/ui";

type Page = "landing" | "cari-tutor" | "detail-tutor" | "booking" | "live-class" | "chat" | "dashboard-siswa" | "forum" | "about" | "progress" | "settings" | "login" | "register" | "video" | "upload-video" | "admin" | "login-google-otp" | "tutor-registration" | "booking-saya" | "riwayat-belajar" | "favorit" | "notifikasi" | "platform-admin" | "tutor-login" | "admin-login";

type Conversation = {
  id: number;
  other_user: { id: number; name: string; avatar?: string | null; role: string };
  last_message_at?: string | null;
  last_message_preview?: string | null;
  unread_count?: number;
};

type Message = {
  id: string | number;
  sender_id: number;
  type: "text" | "image" | "file" | "voice";
  content?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  read_at?: string | null;
  created_at: string;
  is_deleted?: boolean;
  deleted_for?: "me" | "all" | null;
  deleted_by_user_id?: number | null;
};

const defaultAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format";

const Avatar = ({ name, avatar, size = "md" }: { name?: string; avatar?: string | null; size?: "sm" | "md" }) => {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
  return (
    <div className={`${dim} overflow-hidden rounded-full bg-blue-600 flex items-center justify-center font-semibold text-white`}>
      {avatar ? <img src={avatar} alt={name ?? "avatar"} className="h-full w-full object-cover" /> : <span>{name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}</span>}
    </div>
  );
};

const handleTestNotification = async (conversation?: Conversation | null) => {
  await showChatMessageNotification({
    title: "TUTORKU",
    body: "Test notification",
    icon: conversation?.other_user?.avatar || undefined,
  });
};

const getMessagePreview = (message: any, t?: (key: string, options?: any) => string) => {
  if (!message) return null;
  if (message.is_deleted) return t ? t("chat.deletedMessage") : "[Pesan dihapus]";
  if (message.type === "image") return t ? t("chat.sendImage") : "[Gambar]";
  if (message.type === "file") return t ? t("chat.sendFile") : "[File]";
  if (message.type === "voice") return t ? t("chat.sendVoice") : "[Suara]";
  return message.content ?? null;
};

const normalizeConversation = (item: any, t?: (key: string, options?: any) => string): Conversation => {
  const otherUser = item.other_user ?? item.with_user;
  return {
    id: item.id,
    other_user: {
      id: otherUser?.id ?? 0,
      name: otherUser?.name ?? (t ? t("chat.unknownUser") : "Unknown user"),
      avatar: otherUser?.avatar ?? null,
      role: otherUser?.role ?? "user",
    },
    last_message_at: item.last_message_at ?? item.last_message?.created_at,
    last_message_preview: getMessagePreview(item.last_message ?? item.last_message_preview, t) ?? item.last_message_preview ?? null,
    unread_count: item.unread_count ?? 0,
  };
};

const emojis = ["😀", "😂", "😍", "🥺", "👍", "🙏", "🎉", "❤️", "😎", "😢"];

export function ChatPage({
  apiFetch,
  token,
  currentUserId,
  navigate,
  initialConversation,
}: {
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  token: string | null;
  currentUserId: number | undefined;
  navigate: (p: Page) => void;
  initialConversation?: Conversation | null;
}) {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const normalizeMessageId = (id: any) => (id === null || id === undefined ? id : String(id));
  const normalizeMessage = (message: any): Message => ({
    ...message,
    id: normalizeMessageId(message.id),
    content: message.content ?? null,
    file_url: message.file_url ?? null,
    file_name: message.file_name ?? null,
  });
  const getMessageKey = (message: Message) => {
    const id = normalizeMessageId(message.id);
    if (id !== null && id !== undefined) return `id:${id}`;
    return `content:${message.content ?? ""}|sender:${message.sender_id}|created_at:${message.created_at}`;
  };
  const addMessageIfUnique = (message: Message) => {
    setMessages((prev) => {
      const normalized = normalizeMessage(message);
      const key = getMessageKey(normalized);
      const exists = prev.some((msg) => getMessageKey(normalizeMessage(msg)) === key);
      return exists ? prev : [...prev, normalized];
    });
  };
  const upsertMessage = (message: Message) => {
    setMessages((prev) => {
      const normalized = normalizeMessage(message);
      const key = getMessageKey(normalized);
      const existingIndex = prev.findIndex((msg) => getMessageKey(normalizeMessage(msg)) === key);
      if (existingIndex === -1) {
        return [...prev, normalized];
      }
      const updated = [...prev];
      updated[existingIndex] = { ...updated[existingIndex], ...normalized };
      return updated;
    });
  };
  const [sending, setSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<any>(null);
  const sendLockRef = useRef(false);
  const [pendingUpload, setPendingUpload] = useState<{ file: File; previewUrl?: string | null; isImage: boolean } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | number | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; messageId: string | number | null }>({ open: false, messageId: null });
  const [searchQuery, setSearchQuery] = useState("");

  const sortConversations = (items: Conversation[]) =>
    [...items].sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    });

  const shouldUpdatePreview = (current: Conversation, incomingCreatedAt?: string | null) => {
    if (!incomingCreatedAt) return true;
    const currentTime = current.last_message_at ? new Date(current.last_message_at).getTime() : 0;
    const incomingTime = new Date(incomingCreatedAt).getTime();
    return incomingTime >= currentTime;
  };

  const isEmojiOnly = (value?: string | null) => {
    if (!value) return false;

    return value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .every((token) => /^(?:\p{Extended_Pictographic}|\uFE0F|\u200D)+$/u.test(token));
  };

  const TWEMOJI_BASE = "https://twemoji.maxcdn.com/v/latest/72x72/";

  const renderEmojiContent = (value?: string | null, size = "h-10 w-10") => {
    if (!value) return null;

    const tokens = value.trim().split(/\s+/).filter(Boolean);
    return (
      <div className="flex flex-wrap items-center justify-center gap-1">
        {tokens.map((token, index) => (
          <img
            key={`${token}-${index}`}
            src={`${TWEMOJI_BASE}${twemoji.convert.toCodePoint(token)}.png`}
            alt={token}
            className={`${size} object-contain`}
          />
        ))}
      </div>
    );
  };

  const updateConversationPreview = (conversationId: number, preview: string | null, createdAt: string) => {
    setConversations((prev) =>
      sortConversations(
        prev.map((c) =>
          c.id === conversationId && shouldUpdatePreview(c, createdAt)
            ? { ...c, last_message_preview: preview, last_message_at: createdAt }
            : c,
        ),
      ),
    );
    setActiveConvo((prev) =>
      prev && prev.id === conversationId && shouldUpdatePreview(prev, createdAt)
        ? { ...prev, last_message_preview: preview, last_message_at: createdAt }
        : prev,
    );
  };

  const loadConversations = async () => {
    try {
      const data = await apiFetch("/chat/conversations");
      const list = data.data ?? data;
      const normalized = Array.isArray(list)
        ? sortConversations(list.map((item) => normalizeConversation(item, t)))
        : [];
      setConversations(normalized);
      return normalized;
    } catch (error) {
      console.error("Gagal memuat percakapan", error);
      return [];
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const data = await apiFetch(`/chat/conversations/${conversationId}/messages`);
      const list: Message[] = data.data ?? data;
      setMessages([...list].reverse());
      await apiFetch(`/chat/conversations/${conversationId}/read`, { method: "POST" });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c,
        ),
      );
      if (activeConvo?.id === conversationId) {
        setActiveConvo((prev) =>
          prev ? { ...prev, unread_count: 0 } : prev,
        );
      }
      clearChatMessageBadge();
    } catch (error) {
      console.error("Gagal memuat pesan", error);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadConversations().finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (initialConversation && initialConversation.id) {
      const normalized = normalizeConversation(initialConversation, t);
      setActiveConvo(normalized);
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === normalized.id);
        if (exists) return prev;
        return [normalized, ...prev];
      });
    }
  }, [initialConversation]);

  useEffect(() => {
    if (!activeConvo || !token) return;

    loadMessages(activeConvo.id);

    const echo = getEcho(token);
    const channel = echo.private(`chat.${activeConvo.id}`);
    channelRef.current = channel;

    channel.listen(".message.sent", async (e: any) => {
      const incoming = e.message ?? e;
      const normalized = normalizeMessage(incoming);
      upsertMessage(normalized);
      setIsOtherTyping(false);
      console.debug("[chat] received message via Echo", { event: e, normalized });

      const preview = normalized.content || (normalized.type === "image" ? t("chat.sendImage") : normalized.type === "file" ? t("chat.sendFile") : t("chat.newMessage"));
      updateConversationPreview(activeConvo.id, preview, normalized.created_at);

      const senderName = e.sender_name || e.user?.name || activeConvo.other_user.name || t("chat.newMessage");
      try {
        if (String(normalized.sender_id) !== String(currentUserId)) {
          console.debug("[chat] triggering chat notification for incoming message", { senderId: normalized.sender_id, currentUserId });
          await showChatMessageNotification({
            title: senderName,
            body: preview,
            icon: activeConvo.other_user.avatar || undefined,
          });
        } else {
          console.debug("[notifications] skipping notification for own message", { senderId: normalized.sender_id, currentUserId });
        }
      } catch (notifErr) {
        console.debug('[notifications] showChatMessageNotification error', notifErr);
      }
      apiFetch(`/chat/conversations/${activeConvo.id}/read`, { method: "POST" }).catch(() => {});
    });

    channel.listen(".user.typing", (e: any) => {
      if (e.user_id !== currentUserId) {
        setIsOtherTyping(e.is_typing);
      }
    });

    return () => {
      // PENTING: jangan pakai echo.leave() di sini. echo.leave() akan
      // benar-benar unsubscribe channel "chat.{id}" dari koneksi WebSocket,
      // padahal channel yang sama juga dipakai oleh listener daftar
      // percakapan (effect di bawah). Kalau dipanggil di sini, channel itu
      // bisa ter-unsubscribe walau masih dibutuhkan listener lain, sehingga
      // pesan baru berhenti realtime sampai halaman di-refresh.
      // Cukup lepas listener milik effect ini saja.
      channel.stopListening(".message.sent");
      channel.stopListening(".user.typing");
    };
  }, [activeConvo?.id, token]);

  // Listen to all conversations for realtime updates (last_message_at, last_message_preview, unread_count)
  useEffect(() => {
    if (!token || conversations.length === 0) return;

    try {
      const echo = getEcho(token);
      const unlisteners: (() => void)[] = [];

      // Subscribe to each conversation to get realtime updates
      conversations.forEach((convo) => {
        if (activeConvo?.id === convo.id) return;

        const channel = echo.private(`chat.${convo.id}`);

        const handler = (e: any) => {
          const incoming = e.message ?? e;
          console.debug("[chat-realtime] conversation list update", { convoId: convo.id, incoming });

          setConversations((prev) =>
            sortConversations(
              prev.map((c) =>
                c.id === convo.id && shouldUpdatePreview(c, incoming.created_at)
                  ? {
                      ...c,
                      last_message_preview:
                        incoming.content ||
                        (incoming.type === "image"
                          ? t("chat.sendImage")
                          : incoming.type === "file"
                          ? t("chat.sendFile")
                          : t("chat.newMessage")),
                      last_message_at: incoming.created_at,
                      unread_count:
                        String(incoming.sender_id) !== String(currentUserId) && activeConvo?.id !== convo.id
                          ? (c.unread_count || 0) + 1
                          : 0,
                    }
                  : c,
              ),
            ),
          );
        };

        channel.listen(".message.sent", handler);

        // PENTING: jangan pakai echo.leave() di sini. Channel "chat.{id}"
        // ini bisa jadi channel yang sama dengan yang sedang dipakai effect
        // chat aktif di atas. echo.leave() akan unsubscribe channel itu
        // sepenuhnya dari WebSocket walau masih dipakai listener lain,
        // sehingga pesan baru berhenti realtime sampai halaman di-refresh.
        // Cukup lepas listener ".message.sent" milik effect ini saja.
        unlisteners.push(() => channel.stopListening(".message.sent", handler));
      });

      return () => {
        unlisteners.forEach((fn) => fn());
      };
    } catch (error) {
      console.warn("[chat-realtime] setup error", error);
    }
  }, [conversations.length, token, currentUserId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOtherTyping]);

  const notifyTyping = (isTyping: boolean) => {
    if (!activeConvo) return;
    apiFetch(`/chat/conversations/${activeConvo.id}/typing`, {
      method: "POST",
      body: JSON.stringify({ is_typing: isTyping }),
    }).catch(() => {});
  };

  const handleInputChange = (value: string) => {
    setChatInput(value);
    notifyTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => notifyTyping(false), 1500);
  };

  const addEmoji = (emoji: string) => {
    setChatInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
    setTimeout(() => chatInputRef.current?.focus(), 0);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !activeConvo || sending || sendLockRef.current) return;
    sendLockRef.current = true;
    setSending(true);
    const text = chatInput;
    setChatInput("");
    try {
      const result = await apiFetch(`/chat/conversations/${activeConvo.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ type: "text", content: text }),
      });
      const newMessage = result?.data ?? result;
      const createdAt = newMessage?.created_at ?? new Date().toISOString();
      notifyTyping(false);
      const preview = text;
      updateConversationPreview(activeConvo.id, preview, createdAt);
    } catch (error: any) {
      toastError(error.message || t("chat.sendMessageFailed"));
    } finally {
      setSending(false);
      sendLockRef.current = false;
    }
  };

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvo) return;

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
    if (!activeConvo) return;
    const formData = new FormData();
    formData.append("type", isImage ? "image" : "file");
    formData.append("file", file);

    setSending(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "https://rezi-laravel.nlabs.id/api";
      const url = `/chat/conversations/${activeConvo.id}/messages`;
      const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
      const tokenLocal = token;

      const res = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", fullUrl, true);
        xhr.withCredentials = true;

        if (tokenLocal) xhr.setRequestHeader("Authorization", `Bearer ${tokenLocal}`);
        const cookies = document.cookie.split("; ");
        const xsrf = cookies.find((c) => c.startsWith("XSRF-TOKEN="));
        if (xsrf) xhr.setRequestHeader("X-XSRF-TOKEN", decodeURIComponent(xsrf.split("=")[1]));

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setUploadProgress(pct);
          }
        };

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const text = xhr.responseText;
                const data = text ? JSON.parse(text) : null;
                resolve(data);
              } catch (err) {
                reject(new Error(t("chat.invalidJsonResponse")));
              }
            } else {
              try {
                const data = JSON.parse(xhr.responseText || "null");
                const msg = data?.message || xhr.statusText || t("chat.uploadFailed");
                reject(new Error(msg));
              } catch (e) {
                reject(new Error(xhr.statusText || t("chat.uploadFailed")));
              }
            }
          }
        };

        xhr.onerror = () => reject(new Error(t("chat.networkError")));
        xhr.send(formData);
      });

            const newMsgs = Array.isArray(res?.data) ? res.data : [res];
      newMsgs.forEach((msg: any) => addMessageIfUnique(msg));
      const previewText = isImage ? t("chat.sendImage") : t("chat.sendFile");
      const createdAt = newMsgs[0]?.created_at ?? new Date().toISOString();
      if (activeConvo?.id) {
        updateConversationPreview(activeConvo.id, previewText, createdAt);
      }
      toastSuccess(isImage ? "Gambar terkirim." : "Dokumen terkirim.");} catch (error: any) {
      setUploadError(error.message || "Gagal mengunggah file. Pastikan format & ukuran file sesuai (maks 10MB).");
      toastError(uploadError || error.message || "Gagal mengunggah file.");
    } finally {
      setSending(false);
      setTimeout(() => setUploadProgress(null), 800);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPendingUpload(null);
    }
  };

  const openDeleteConfirm = (messageId: string | number) => {
    setDeleteConfirm({ open: true, messageId });
  };

  const confirmDeleteAction = async (scope: "me" | "all") => {
    const messageId = deleteConfirm.messageId;
    if (!messageId) return;

    const previousMessage = messages.find((msg) => msg.id === messageId);
    const isLastMessage = messages[messages.length - 1]?.id === messageId;

    if (scope === "me") {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, is_deleted: true, deleted_for: "me", deleted_by_user_id: currentUserId ?? null, content: null, file_url: null, file_name: null }
            : msg,
        ),
      );
    } else {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, is_deleted: true, deleted_for: "all", deleted_by_user_id: currentUserId ?? null, content: "[Pesan dihapus]", file_url: null, file_name: null, type: "text" }
            : msg,
        ),
      );

      if (isLastMessage && activeConvo?.id) {
        updateConversationPreview(
          activeConvo.id,
          t("chat.deletedMessage"),
          previousMessage?.created_at ?? new Date().toISOString(),
        );
      }
    }

    setDeleteConfirm({ open: false, messageId: null });

    try {
      await apiFetch(`/chat/messages/${messageId}?scope=${scope}`, { method: "DELETE" });
    } catch (err) {
      console.error("Gagal menghapus pesan", err);
      if (previousMessage) {
        setMessages((prev) => prev.map((msg) => (msg.id === messageId ? previousMessage : msg)));
      }
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return t("chat.today");
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return t("chat.yesterday");
    return date.toLocaleDateString(i18n.language === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short" });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredConversations = conversations.filter((c) =>
    !searchQuery || c.other_user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden border border-gray-200 bg-white">
      <div className="flex h-full w-full">
        <aside className={`flex w-full flex-col border-r border-gray-100 md:w-72 ${activeConvo ? "hidden md:flex" : "flex"}`}>
          <div className="border-b border-gray-100 px-2 xs:px-3 sm:px-4 pb-2 xs:pb-3 pt-3 xs:pt-4">
            <div className="mb-2 xs:mb-3 flex items-center justify-between">
              <h2 className="text-sm xs:text-base font-semibold text-gray-900">{t("chat.title")}</h2>
              {conversations.length > 0 && (
                <span className="border border-gray-200 px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs font-medium text-gray-400">
                  {conversations.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 xs:gap-2 border border-gray-200 bg-gray-50 px-2 xs:px-3 py-1.5 xs:py-2 rounded">
              <Search size={12} className="flex-shrink-0 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs xs:text-sm outline-none text-gray-700 placeholder:text-gray-400"
                placeholder={t("chat.searchPlaceholder")}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col gap-3 px-2 xs:px-4 py-3 xs:py-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="px-2 xs:px-3 sm:px-4 py-6 xs:py-8 sm:py-10 text-center">
                <div className="mx-auto mb-2 xs:mb-3 flex h-9 xs:h-10 w-9 xs:w-10 items-center justify-center border border-gray-200 bg-gray-50 rounded">
                  <MessageCircle size={14} className="xs:w-4 xs:h-4 text-gray-400" />
                </div>
                <p className="text-[10px] xs:text-sm text-gray-500">{t("chat.noConversations")}</p>
              </div>
            ) : (
              <div className="py-1">
                {filteredConversations.map((c) => {
                  const isActive = activeConvo?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveConvo(c)}
                      className={`relative flex w-full items-center gap-2 xs:gap-3 px-2 xs:px-3 sm:px-4 py-2 xs:py-3 ${
                        isActive ? "bg-blue-50 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-blue-500" : ""
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar name={c.other_user.name} avatar={c.other_user.avatar} />
                        {c.other_user.role === "tutor" && <span className="absolute bottom-0 right-0 h-2 xs:h-2.5 w-2 xs:w-2.5 rounded-full border-2 border-white bg-green-400" />}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="mb-0.5 flex items-center justify-between gap-1">
                          <p className={`truncate text-xs xs:text-sm ${isActive ? "font-semibold text-blue-700" : "font-medium text-gray-900"}`}>{c.other_user.name}</p>
                          {c.last_message_at && <span className="flex-shrink-0 text-[9px] xs:text-[10px] text-gray-400">{formatTime(c.last_message_at)}</span>}
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <div className="truncate text-[11px] xs:text-xs text-gray-400">
                            {isEmojiOnly(c.last_message_preview) ? (
                              renderEmojiContent(c.last_message_preview, "h-6 w-6")
                            ) : (
                              <p className="truncate">{c.last_message_preview || t("chat.noMessages")}</p>
                            )}
                          </div>
                          {!!c.unread_count && (
                            <span className="flex-shrink-0 bg-blue-500 px-1 xs:px-1.5 py-0.5 text-[9px] xs:text-[10px] font-bold text-white rounded">
                              {c.unread_count > 9 ? "9+" : c.unread_count}
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

        <section className={`flex flex-1 min-h-0 flex-col overflow-hidden ${activeConvo ? "flex" : "hidden md:flex"}`}>
          {activeConvo ? (
            <>
              <div className="sticky top-0 z-10 flex flex-shrink-0 items-center gap-2 xs:gap-3 border-b border-gray-100 bg-white px-2 xs:px-3 sm:px-4 py-2 xs:py-3">
                <button onClick={() => setActiveConvo(null)} className="-ml-1 p-1 text-gray-500 md:hidden">
                  <ChevronLeft size={16} />
                </button>
                <div className="relative flex-shrink-0">
                  <Avatar name={activeConvo.other_user.name} avatar={activeConvo.other_user.avatar} size="sm" />
                  <span className="absolute bottom-0 right-0 h-2 xs:h-2.5 w-2 xs:w-2.5 rounded-full border-2 border-white bg-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs xs:text-sm font-semibold text-gray-900">{activeConvo.other_user.name}</p>
                  <p className="text-[10px] xs:text-xs font-medium text-green-500">{t("chat.online")}</p>
                </div>
             
              </div>

              <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-2 xs:px-3 sm:px-4 py-3 xs:py-4" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d1d5db' fill-opacity='0.10'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`, backgroundColor: "#f8fafc" }}>
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-2 xs:mb-3 flex h-9 xs:h-12 w-9 xs:w-12 items-center justify-center border border-gray-200 bg-white rounded">
                        <MessageCircle size={14} className="xs:w-4 xs:h-4 text-gray-400" />
                      </div>
                      <p className="text-xs xs:text-sm font-medium text-gray-700">{t("chat.startConversation")}</p>
                      <p className="mt-1 text-[10px] xs:text-xs text-gray-400">{t("chat.firstMessage")}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 xs:space-y-1.5">
                    {messages.map((m, index) => {
                      const isMe = m.sender_id === currentUserId;
                      const isEditing = editingMessageId === m.id;
                      const showDate = index === 0 || new Date(m.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString();
                      if (m.is_deleted && m.deleted_for === "me" && isMe) return null;
                      const isDeleted = m.deleted_for === "all";
                      const startEditLocal = () => {
                        if (!isMe || m.type !== "text") return;
                        setEditingMessageId(m.id);
                        setEditingText(m.content ?? "");
                      };
                      const cancelEditLocal = () => {
                        setEditingMessageId(null);
                        setEditingText("");
                      };
                      const saveEditLocal = async () => {
                        const newText = editingText.trim();
                        if (!newText) return;
                        setMessages((prev) => prev.map((msg) => (msg.id === m.id ? { ...msg, content: newText } : msg)));
                        setEditingMessageId(null);
                        setEditingText("");
                        try {
                          await apiFetch(`/chat/messages/${m.id}`, { method: "PATCH", body: JSON.stringify({ content: newText }) });
                        } catch (err) {
                          console.error("Gagal mengedit pesan", err);
                        }
                      };
                      return (
                        <div key={m.id}>
                          {showDate && (
                            <div className="my-3 xs:my-4 flex justify-center">
                              <span className="border border-gray-200 bg-white px-2 xs:px-3 py-0.5 xs:py-1 text-[10px] xs:text-[11px] text-gray-500 rounded">
                                {formatDate(m.created_at)}
                              </span>
                            </div>
                          )}
                          <div className={`flex items-end gap-1.5 xs:gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                            {!isMe && <Avatar name={activeConvo.other_user.name} avatar={activeConvo.other_user.avatar} size="sm" />}
                            <div className={`group relative flex max-w-[70%] xs:max-w-[65%] flex-col ${isMe ? "items-end" : "items-start"}`}>
                              <div onDoubleClick={() => !isDeleted && startEditLocal()} className={`px-2.5 xs:px-3.5 py-1.5 xs:py-2.5 text-xs xs:text-sm leading-relaxed ${isMe ? "bg-blue-600 text-white rounded-l rounded-r" : "border border-gray-200 bg-white text-gray-800 rounded-l rounded-r"} ${isDeleted ? "opacity-60" : ""}`}>
                                {m.type === "image" && m.file_url && !isDeleted && (
                                  <img src={m.file_url} alt={m.file_name ?? "image"} className="mb-1 xs:mb-1.5 max-h-[150px] xs:max-h-[200px] max-w-[150px] xs:max-w-[200px] object-contain rounded" />
                                )}
                                {m.type === "file" && m.file_url && !isDeleted && (
                                  <div className="mb-1 xs:mb-1.5 flex items-center gap-1.5 xs:gap-2">
                                    <div className={`p-1 xs:p-1.5 ${isMe ? "bg-blue-500" : "bg-gray-100"} rounded`}>
                                      <Paperclip size={11} className={isMe ? "text-white" : "text-gray-500"} />
                                    </div>
                                    <a href={m.file_url} target="_blank" rel="noreferrer" className={`text-[10px] xs:text-xs ${isMe ? "text-blue-100" : "text-blue-600"}`}>
                                      {m.file_name ?? t("chat.downloadFile")}
                                    </a>
                                  </div>
                                )}
                                {isEditing ? (
                                  <div>
                                    <input value={editingText} onChange={(e) => setEditingText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEditLocal(); if (e.key === "Escape") cancelEditLocal(); }} className="w-full border border-white/40 bg-white/20 px-1.5 xs:px-2 py-0.5 xs:py-1 text-xs xs:text-sm outline-none placeholder:text-white/60 rounded" autoFocus />
                                    <div className="mt-1 xs:mt-1.5 flex gap-1.5 xs:gap-2">
                                      <button type="button" onClick={saveEditLocal} className="text-[10px] xs:text-xs font-medium text-white/90">{t("chat.save")}</button>
                                      <button type="button" onClick={cancelEditLocal} className="text-[10px] xs:text-xs text-white/60">{t("chat.cancel")}</button>
                                    </div>
                                  </div>
                                ) : m.is_deleted && m.deleted_for === "all" ? (
                                  <p className="italic text-xs text-gray-300">{t("chat.deletedMessage")}</p>
                                ) : isEmojiOnly(m.content) ? (
                                  <div className="flex flex-wrap items-center justify-center gap-1">
                                    {renderEmojiContent(m.content)}
                                  </div>
                                ) : (
                                  m.content && <p className="whitespace-pre-wrap break-words text-xs xs:text-sm">{m.content}</p>
                                )}
                              </div>
                              <div className={`mt-0.5 xs:mt-1 flex items-center gap-0.5 px-0.5 xs:px-1 ${isMe ? "justify-end" : "justify-start"}`}>
                                <span className="text-[9px] xs:text-[10px] text-gray-400">{formatTime(m.created_at)}</span>
                                {isMe && (
                                  <CheckCheck
                                    size={10}
                                    className={m.read_at ? "text-blue-400" : "text-gray-400"}
                                  />
                                )}
                              </div>
                              {!isDeleted && !isEditing && (
                                <div className={`absolute top-0 ${isMe ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1"} flex items-center gap-0.5 opacity-100 md:opacity-0 transition-opacity md:group-hover:opacity-100`}>
                                  {isMe && m.type === "text" && (
                                    <button onClick={startEditLocal} className="p-1 text-gray-500" title={t("chat.edit")}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    </button>
                                  )}
                                  {isMe && (
                                    <button onClick={() => openDeleteConfirm(m.id)} className="p-1 text-gray-400" title={t("common.delete")}>
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            {isMe && <div className="w-8 flex-shrink-0" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <form onSubmit={(e) => { e.preventDefault(); void sendMessage(); }} className="sticky bottom-0 z-10 flex-shrink-0 border-t border-gray-200 bg-white p-2 xs:p-3">
                {uploadProgress !== null && (
                  <div className="mb-1.5 xs:mb-2">
                    <div className="mb-0.5 xs:mb-1 flex items-center justify-between text-[9px] xs:text-[10px] text-gray-500">
                      <span>{t("chat.uploading")}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-0.5 xs:h-1 w-full overflow-hidden bg-gray-100 rounded">
                      <div className="h-full bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
                {uploadError && (
                  <div className="mb-1.5 xs:mb-2 flex items-center gap-1.5 xs:gap-2 border border-red-100 bg-red-50 px-2 xs:px-3 py-1.5 xs:py-2 text-[10px] xs:text-xs text-red-600 rounded">
                    <span className="flex-1">{uploadError}</span>
                    <button type="button" onClick={() => setUploadError(null)}><X size={11} /></button>
                  </div>
                )}
                {pendingUpload && (
                  <div className="mb-1.5 xs:mb-2 flex items-center gap-2 xs:gap-3 border border-blue-100 bg-blue-50 px-2 xs:px-3 py-1.5 xs:py-2.5 rounded">
                    {pendingUpload.isImage && pendingUpload.previewUrl ? (
                      <img src={pendingUpload.previewUrl} alt="preview" className="h-8 xs:h-10 w-8 xs:w-10 flex-shrink-0 object-cover rounded" />
                    ) : (
                      <div className="flex h-8 xs:h-10 w-8 xs:w-10 flex-shrink-0 items-center justify-center bg-blue-100 rounded">
                        <Paperclip size={14} className="text-blue-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] xs:text-xs font-medium text-gray-800">{pendingUpload.file.name}</p>
                      <p className="text-[9px] xs:text-[10px] text-gray-500">{(pendingUpload.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button type="button" onClick={cancelPendingUpload} className="p-0.5 xs:p-1 text-gray-400"><X size={12} /></button>
                    <button type="button" onClick={() => performUpload(pendingUpload.file, pendingUpload.isImage)} className="bg-blue-600 px-2 xs:px-3 py-1 xs:py-1.5 text-[10px] xs:text-xs font-medium text-white rounded">{t("chat.send")}</button>
                  </div>
                )}
                <div className="flex items-end gap-1.5 xs:gap-2">
                  <div className="flex items-center gap-0.5 xs:gap-1 pb-0.5 xs:pb-1">
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending} className="p-1.5 xs:p-2 text-gray-400" title={t("chat.attachImage")}><Paperclip size={14} className="xs:w-4 xs:h-4" /></button>
                      <button type="button" onClick={() => setShowEmojiPicker((s) => !s)} className="p-1.5 xs:p-2 text-gray-400" title={t("chat.emoji")}><Smile size={14} className="xs:w-4 xs:h-4" /></button>
                    </div>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar" />
                  <div className="flex flex-1 items-end overflow-hidden border border-gray-200 bg-white rounded">
                    <input
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void sendMessage();
                        }
                      }}
                      placeholder={t("chat.messagePlaceholder")}
                      disabled={sending}
                      className="flex-1 bg-transparent px-2.5 xs:px-4 py-1.5 xs:py-2.5 text-xs xs:text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </div>
                  <button type="button" onClick={() => void sendMessage()} disabled={sending || !chatInput.trim()} className="mb-0.5 xs:mb-1 bg-blue-600 p-1.5 xs:p-2.5 text-white rounded disabled:cursor-not-allowed disabled:opacity-40"><Send size={14} className="xs:w-4 xs:h-4" /></button>
                </div>
                {showEmojiPicker && (
                  <div className="mt-1.5 xs:mt-2 grid grid-cols-5 gap-0.5 border border-gray-200 bg-white p-1.5 xs:p-2 rounded">
                    {emojis.map((emoji) => (
                      <button key={emoji} type="button" onClick={() => addEmoji(emoji)} className="p-1.5 xs:p-2 text-base xs:text-lg">{emoji}</button>
                    ))}
                  </div>
                )}
              </form>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 xs:h-16 w-12 xs:w-16 items-center justify-center bg-blue-50 rounded">
                    <MessageCircle size={20} className="xs:w-5 xs:h-5 text-blue-400" />
                  </div>
                  <p className="text-sm xs:text-base font-semibold text-gray-800">{t("chat.noConversationSelectedTitle")}</p>
                  <p className="mt-1 text-[10px] xs:text-sm text-gray-400">{t("chat.noConversationSelectedHint")}</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm overflow-hidden border border-gray-100 bg-white rounded">
            <div className="px-5 pb-4 pt-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center bg-red-50 rounded">
                  <Trash2 size={16} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{t("chat.deleteMessageTitle")}</h2>
                  <p className="text-xs text-gray-500">{t("chat.deleteMessageDescription")}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 border-t border-gray-100 px-4 py-3">
              <button onClick={() => confirmDeleteAction("me")} className="flex w-full items-center gap-3 border border-gray-200 px-3 xs:px-4 py-2 xs:py-2.5 text-[10px] xs:text-sm font-medium text-gray-800 rounded">
                <span className="flex h-6 w-6 items-center justify-center bg-gray-100 text-xs rounded">👤</span>{t("chat.deleteForMe")}
              </button>
              <button onClick={() => confirmDeleteAction("all")} className="flex w-full items-center gap-3 bg-red-500 px-3 xs:px-4 py-2 xs:py-2.5 text-[10px] xs:text-sm font-medium text-white rounded">
                <span className="flex h-6 w-6 items-center justify-center bg-red-400 text-xs rounded">🗑️</span>{t("chat.deleteForAll")}
              </button>
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <button onClick={() => setDeleteConfirm({ open: false, messageId: null })} className="w-full py-2 text-[10px] xs:text-sm font-medium text-gray-500">
                {t("chat.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;