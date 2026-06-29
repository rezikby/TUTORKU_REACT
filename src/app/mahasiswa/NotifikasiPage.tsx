import { useEffect, useState } from "react";
import { Bell, ChevronLeft, Check, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { confirmAction, toastSuccess, toastError } from "../lib/swal";

type Page = "landing" | "cari-tutor" | "detail-tutor" | "booking" | "live-class" | "chat" | "dashboard-siswa" | "forum" | "about" | "progress" | "settings" | "login" | "register" | "video" | "upload-video" | "admin" | "login-google-otp" | "tutor-registration" | "booking-saya" | "riwayat-belajar" | "favorit" | "notifikasi" | "platform-admin" | "tutor-login" | "admin-login";

type NotificationItem = {
  id: string | number;
  title?: string | null;
  message?: string | null;
  read_at?: string | null;
  created_at?: string | null;
};

export default function NotifikasiPage({ apiFetch, navigate }: { apiFetch: (path: string, options?: RequestInit) => Promise<any>; navigate: (page: Page) => void; }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const getTimeAgo = (time?: string) => {
    if (!time) return "";
    const date = new Date(time);
    if (isNaN(date.getTime())) return time;
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

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/notifications?per_page=50&exclude_chat=1");
      const items = data.data ?? data ?? [];
      if (Array.isArray(items)) {
        setNotifications(items);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error(t("notifications.loadFailed"), error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id: string | number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n)),
    );
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "POST" });
    } catch (error) {
      console.error(t("notifications.markReadFailed"), error);
      toastError(t("notifications.markReadFailed"));
    }
  };

  const markAllRead = async () => {
    const confirmed = await confirmAction(
      t("notifications.markAllReadConfirm"),
      t("notifications.markAllReadDescription")
    );
    if (!confirmed) return;

    setNotifications((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    try {
      await apiFetch("/notifications/read-all?exclude_chat=1", { method: "POST" });
      toastSuccess(t("notifications.markAllReadSuccess"));
    } catch (error) {
      console.error(t("notifications.markAllReadFailed"), error);
      toastError(t("notifications.markAllReadFailed"));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Back */}
        <button
          onClick={() => navigate?.("dashboard-siswa")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> {t("common.back")}
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">{t("notifications.title")}</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-400 mt-0.5">{t("notifications.unreadCount", { count: unreadCount })}</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="border border-gray-200 p-8 text-center rounded">
            <Bell size={32} className="text-gray-300 mx-auto mb-3" />
            <div className="text-sm text-gray-400">{t("notifications.noNotifications")}</div>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 border ${
                  n.read_at ? "border-gray-200 bg-white" : "border-blue-200 bg-blue-50"
                } rounded transition-colors`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 flex items-center justify-center shrink-0 rounded ${
                  n.read_at ? "bg-gray-100 text-gray-400" : "bg-blue-100 text-blue-600"
                }`}>
                  <Bell size={16} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${n.read_at ? "text-gray-700" : "text-gray-900"}`}>
                    {n.title || t("notifications.notificationLabel")}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">{n.message}</div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {getTimeAgo(n.created_at || n.time)}
                    </span>
                    {!n.read && (
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                        {t("notifications.newLabel")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                {!n.read_at && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
            {t("notifications.countLabel", { count: notifications.length })}
          </div>
        )}

      </div>
    </div>
  );
}