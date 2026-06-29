// frontend/src/app/components/ui/NotificationBell.tsx
//
// Popup notifikasi yang muncul di dekat ikon bel (bukan pindah halaman).
// Dipakai oleh Navbar.tsx menggantikan onClick={() => navigate("notifikasi")}.
//
// Catatan: halaman penuh "Notifikasi" (NotifikasiPage.tsx) TETAP ada dan masih
// bisa diakses lewat tombol "Lihat semua notifikasi" di bagian bawah popup ini,
// jadi tidak ada fungsi yang dihapus — hanya menambah cara baru untuk melihat
// notifikasi secara cepat tanpa pindah halaman.

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Check, ChevronRight, Clock, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Skeleton } from "./skeleton";

type NotificationItem = {
  id: string | number;
  category?: string;
  title?: string | null;
  message?: string | null;
  action_url?: string | null;
  read_at?: string | null;
  created_at?: string | null;
};

type Page =
  | "landing" | "cari-tutor" | "detail-tutor" | "booking" | "live-class" | "chat"
  | "dashboard-siswa" | "forum" | "about" | "progress" | "settings" | "login"
  | "register" | "video" | "upload-video" | "admin" | "login-google-otp"
  | "tutor-registration" | "booking-saya" | "riwayat-belajar" | "favorit"
  | "notifikasi" | "platform-admin" | "tutor-login" | "admin-login";

// timeAgo moved into component to use i18n

// Category icon mapping
const getCategoryIcon = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'booking':
    case 'payment':
      return <Clock size={14} className="text-blue-600" />;
    case 'class':
    case 'live':
      return <div className="text-green-600 text-xs font-bold">L</div>;
    case 'system':
      return <div className="text-gray-600 text-xs font-bold">S</div>;
    default:
      return <Bell size={14} className="text-gray-500" />;
  }
};

export default function NotificationBell({
  apiFetch,
  navigate,
  unreadCount,
  setUnreadCount,
  iconClassName = "text-gray-600",
  buttonClassName = "relative flex items-center justify-center w-9 h-9 hover:bg-gray-100",
  iconSize = 18,
}: {
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  navigate: (p: Page) => void;
  unreadCount: number;
  setUnreadCount: (updater: number | ((c: number) => number)) => void;
  iconClassName?: string;
  buttonClassName?: string;
  iconSize?: number;
}) {
  const { t } = useTranslation();

  const timeAgo = (iso?: string | null) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return t("notifications.justNow");
    if (minutes < 60) return t("notifications.minutesAgo", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("notifications.hoursAgo", { hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t("notifications.daysAgo", { days });
    const weeks = Math.floor(days / 7);
    return t("notifications.weeksAgo", { weeks });
  };
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const hasLoadedOnce = useRef(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Load actual unread count from server
      const countData = await apiFetch("/notifications/unread-count?exclude_chat=1");
      const actualUnreadCount = countData.unread_count ?? 0;
      setUnreadCount(actualUnreadCount);
      
      // Load notifications list
      const data = await apiFetch("/notifications?per_page=8&exclude_chat=1");
      const list = data.data ?? data ?? [];
      const filtered = Array.isArray(list)
        ? list.filter((n: NotificationItem) =>
            Boolean(n.title?.trim() || n.message?.trim() || n.action_url),
          )
        : [];
      setNotifications(filtered);
    } catch (error) {
      console.error(t("notifications.loadFailed"), error);
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  };

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const markRead = async (id: string | number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "POST" });
    } catch (error) {
      console.error(t("notifications.markReadFailed"), error);
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => {
      const unreadToClear = prev.filter((n) => !n.read_at).length;
      if (unreadToClear > 0) {
        setUnreadCount((c) => Math.max(0, c - unreadToClear));
      }
      return prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() }));
    });
    try {
      await apiFetch(`/notifications/read-all?exclude_chat=1`, { method: "POST" });
    } catch (error) {
      console.error(t("notifications.markAllReadFailed"), error);
    }
  };

  const deleteAllNotifications = async () => {
    const ids = notifications.map((n) => n.id);
    if (ids.length === 0) return;

    setNotifications((prev) => {
      const unreadToRemove = prev.filter((n) => !n.read_at).length;
      if (unreadToRemove > 0) {
        setUnreadCount((c) => Math.max(0, c - unreadToRemove));
      }
      return [];
    });

    try {
      await Promise.allSettled(
        ids.map((id) => apiFetch(`/notifications/${id}`, { method: "DELETE" }))
      );
    } catch (error) {
      console.error(t("notifications.deleteAllFailed"), error);
    }
  };

  const deleteNotification = async (id: string | number) => {
    setNotifications((prev) => {
      const deleted = prev.find((n) => n.id === id);
      if (deleted && !deleted.read_at) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
    try {
      await apiFetch(`/notifications/${id}`, { method: "DELETE" });
    } catch (error) {
      console.error(t("notifications.deleteFailed"), error);
    }
  };

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read_at) markRead(n.id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
        <button className={buttonClassName} aria-label={t("notifications.title")}>
          <Bell size={iconSize} className={iconClassName} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-80 max-h-[440px] overflow-y-auto p-0 bg-white border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900">{t("notifications.title")}</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              {t("notifications.markAllRead")}
            </button>
            <button
              onClick={deleteAllNotifications}
              className="text-xs font-medium text-red-600 hover:text-red-700"
            >
              {t("common.deleteAll")}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-100">
          {loading && !hasLoadedOnce.current ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              <div className="space-y-2">
                <Skeleton className="h-3 w-3/4 mx-auto" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Tidak ada notifikasi</div>
            ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                  !n.read_at ? "bg-orange-50" : ""
                }`}
              >
                <button
                  onClick={() => handleItemClick(n)}
                  className="flex-1 flex items-start gap-3 text-left"
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 flex items-center justify-center shrink-0 border border-gray-200 ${
                    !n.read_at ? "border-orange-200 bg-orange-100" : "bg-gray-50"
                  }`}>
                    {getCategoryIcon(n.category)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${!n.read_at ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                      {n.title ?? t("notifications.notificationLabel")}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-2">{n.message}</div>
                    <div className="text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at)}</div>
                  </div>
                </button>

                <button
                  onClick={() => deleteNotification(n.id)}
                  className="inline-flex items-center justify-center p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50"
                  aria-label={t("notifications.deleteAria")}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100">
          <button
            onClick={() => {
              setOpen(false);
              navigate("notifikasi");
            }}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 py-1"
          >
            {t("notifications.viewAll")} <ChevronRight size={14} />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}