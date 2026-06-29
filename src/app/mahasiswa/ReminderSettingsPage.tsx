import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Bell, MessageSquare, Smartphone, Check, Loader2, Trash2, Plus } from "lucide-react";
import { alertError, alertSuccess, confirmAction } from "../lib/swal";

type Page =
  | "landing" | "cari-tutor" | "detail-tutor" | "booking" | "live-class" | "chat"
  | "dashboard-siswa" | "forum" | "about" | "progress" | "settings" | "login"
  | "register" | "video" | "upload-video" | "admin" | "login-google-otp"
  | "tutor-registration" | "booking-saya" | "riwayat-belajar" | "favorit"
  | "notifikasi" | "platform-admin" | "tutor-login" | "admin-login" | "booking-detail"
  | "reminder-settings";

type FcmToken = {
  id: number;
  token: string;
  device_name?: string;
  device_type?: string;
  created_at: string;
};

export default function ReminderSettingsPage({
  apiFetch,
  navigate,
}: {
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  navigate: (p: Page) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [reminderTime, setReminderTime] = useState(15); // menit sebelum sesi
  const [fcmTokens, setFcmTokens] = useState<FcmToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const { t } = useTranslation();
  const vapidKey = (import.meta as any).env.VITE_FIREBASE_PUBLIC_KEY;

  useEffect(() => {
    // Check browser support untuk push notifications
    const supported = 'serviceWorker' in navigator && 'Notification' in window;
    setBrowserSupported(supported);
    
    loadSettings();
    loadFcmTokens();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiFetch('/settings');
      const settings = data.data ?? data;
      setNotifEmail(false);
      setNotifWhatsapp(settings.notif_whatsapp ?? true);
      setNotifPush(settings.notif_push ?? true);
      setReminderTime(settings.reminder_time ?? 15);
    } catch (error) {
      console.error(t("reminderSettings.loadFailed"), error);
    }
  };

  const loadFcmTokens = async () => {
    setLoadingTokens(true);
    try {
      const data = await apiFetch('/fcm-tokens');
      setFcmTokens(data.data ?? []);
    } catch (error) {
      console.error(t("reminderSettings.loadTokensFailed"), error);
    } finally {
      setLoadingTokens(false);
    }
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await apiFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify({
          notif_email: notifEmail,
          notif_whatsapp: notifWhatsapp,
          notif_push: notifPush,
          reminder_time: reminderTime,
        }),
      });
      alertSuccess(t("reminderSettings.settingsSaved"));
    } catch (error) {
      console.error('Gagal menyimpan pengaturan', error);
      alertError(t("reminderSettings.saveFailed"));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const requestPushNotificationPermission = async () => {
    if (!browserSupported) {
      alertError(t("reminderSettings.browserUnsupported"));
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Register service worker
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/sw.js');
          
          // Subscribe ke push
          const vapidKey = (import.meta as any).env.VITE_FIREBASE_PUBLIC_KEY;
          if (!vapidKey) {
            alertError(t("reminderSettings.pushNotConfigured"));
            return;
          }

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });

          const token = subscription.endpoint.split('/').pop();
          if (token) {
            // Register token ke backend
            await apiFetch('/fcm-tokens', {
              method: 'POST',
              body: JSON.stringify({
                token,
                device_name: `${navigator.userAgent.substring(0, 50)}`,
                device_type: 'web',
              }),
            });

            await loadFcmTokens();
            setPushEnabled(true);
            alertSuccess(t("reminderSettings.pushActivated"));
          }
        }
      } else if (permission === 'denied') {
        alertError(t("reminderSettings.pushDenied"));
      }
    } catch (error) {
      console.error('Gagal mengaktifkan push notification', error);
      alertError(t("reminderSettings.requestPushFailed"));
    }
  };

  const removeFcmToken = async (token: string) => {
    if (!(await confirmAction(t("reminderSettings.removeDeviceConfirm"), t("reminderSettings.removeDeviceWarning"))) ) return;

    try {
      await apiFetch(`/fcm-tokens/${token}`, { method: 'DELETE' });
      await loadFcmTokens();
      alertSuccess(t("reminderSettings.removeDeviceSuccess"));
    } catch (error) {
      console.error('Gagal menghapus token', error);
      alertError(t("reminderSettings.removeDeviceFailed"));
    }
  };

  const removeAllFcmTokens = async () => {
    if (!(await confirmAction(t("reminderSettings.removeAllDevicesConfirm"), t("reminderSettings.removeAllDevicesWarning")))) return;

    try {
      await apiFetch('/fcm-tokens', { method: 'DELETE' });
      await loadFcmTokens();
      setPushEnabled(false);
      alertSuccess(t("reminderSettings.removeAllDevicesSuccess"));
    } catch (error) {
      console.error('Gagal menghapus semua token', error);
      alertError(t("reminderSettings.removeAllDevicesFailed"));
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Header */}
        <button
          onClick={() => navigate('settings')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> {t("settings.back")}
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={28} className="text-blue-600" />
            {t("reminderSettings.title")}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t("reminderSettings.description")}</p>
        </div>

        <div className="space-y-6">
          {/* Notification Channels */}
          <div className="border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("reminderSettings.channelsTitle")}</h2>
            
            <div className="space-y-3">
              {/* WhatsApp */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare size={20} className="text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">{t("reminderSettings.whatsapp")}</div>
                    <div className="text-xs text-gray-500">{t("reminderSettings.whatsappDesc")}</div>
                  </div>
                </div>
                <button
                  onClick={() => setNotifWhatsapp(!notifWhatsapp)}
                  className={`w-12 h-7 rounded-full transition-colors ${
                    notifWhatsapp ? 'bg-green-600' : 'bg-gray-300'
                  } flex items-center ${notifWhatsapp ? 'justify-end' : 'justify-start'} px-1`}
                >
                  <div className="w-5 h-5 bg-white rounded-full" />
                </button>
              </div>

              {/* Browser Notification */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone size={20} className="text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">{t("reminderSettings.browserNotification")}</div>
                    <div className="text-xs text-gray-500">{t("reminderSettings.browserNotificationDesc")}</div>
                  </div>
                </div>
                <button
                  onClick={() => setNotifPush(!notifPush)}
                  className={`w-12 h-7 rounded-full transition-colors ${
                    notifPush ? 'bg-purple-600' : 'bg-gray-300'
                  } flex items-center ${notifPush ? 'justify-end' : 'justify-start'} px-1`}
                >
                  <div className="w-5 h-5 bg-white rounded-full" />
                </button>
              </div>
            </div>
          </div>

          {/* Reminder Timing */}
          <div className="border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("reminderSettings.timingTitle")}</h2>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("reminderSettings.timingLabel")}
              </label>
              <div className="flex gap-2 flex-wrap">
                {[15, 30, 60].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => setReminderTime(minutes)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      reminderTime === minutes
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t("reminderSettings.minutes", { minutes })}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t("reminderSettings.timingNote", { minutes: reminderTime })}
              </p>
            </div>
          </div>

          {/* Push Notification Devices */}
          {browserSupported && (
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t("reminderSettings.pushDevicesTitle")}</h2>
                {fcmTokens.length > 0 && (
                  <button
                    onClick={removeAllFcmTokens}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    {t("common.deleteAll")}
                  </button>
                )}
              </div>

              {loadingTokens ? (
                <div className="text-center py-4">
                  <Loader2 size={20} className="animate-spin mx-auto text-gray-400" />
                </div>
              ) : fcmTokens.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {fcmTokens.map((token) => (
                    <div key={token.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {token.device_name || t("reminderSettings.unnamedDevice")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {token.device_type ? token.device_type.toUpperCase() : t("common.unknown")} · 
                          {new Date(token.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFcmToken(token.token)}
                        className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">{t("reminderSettings.noDevices")}</p>
              )}

              {!vapidKey && (
                <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                  {t("reminderSettings.pushNotConfigured")}
                </div>
              )}

              <button
                onClick={requestPushNotificationPermission}
                disabled={!vapidKey}
                className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  vapidKey
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Plus size={16} />
                {t("reminderSettings.registerDevice")}
              </button>
            </div>
          )}

          {!browserSupported && (
            <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-4">
              <p className="text-sm text-yellow-800">
                {t("reminderSettings.browserUnsupported")}
              </p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex gap-3">
            <button
              onClick={saveSettings}
              disabled={isSavingSettings}
              className="flex-1 px-6 py-3 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSavingSettings ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {isSavingSettings ? t("reminderSettings.saving") : t("reminderSettings.saveSettings")}
            </button>
            <button
              onClick={() => navigate('settings')}
              className="px-6 py-3 bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors rounded-lg"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
