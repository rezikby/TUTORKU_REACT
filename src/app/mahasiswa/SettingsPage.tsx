import { useState, useEffect } from "react";
import { User, Shield, Bell, Settings, ShieldCheck, MessageSquare, ChevronLeft, Globe, Moon, Mail, Phone, BellRing, Key, HelpCircle, LogOut } from "lucide-react";
import { toastError } from "../lib/swal";
import ProfileSection from "./settings/ProfileSection";
import AccountSection from "./settings/AccountSection";
import AppearanceSection from "./settings/AppearanceSection";
import PrivacySection from "./settings/PrivacySection";
import HelpSection from "./settings/HelpSection";

type Settings = { 
  language: string; 
  dark_mode: boolean; 
  notif_email: boolean; 
  notif_whatsapp: boolean; 
  notif_push: boolean 
};

type Page = "landing" | "cari-tutor" | "detail-tutor" | "booking" | "live-class" | "chat" | "dashboard-siswa" | "forum" | "about" | "progress" | "settings" | "reminder-settings" | "login" | "register" | "video" | "upload-video" | "admin" | "login-google-otp" | "tutor-registration" | "booking-saya" | "riwayat-belajar" | "favorit" | "notifikasi" | "platform-admin" | "tutor-login" | "admin-login";

import { useTranslation } from "react-i18next";

export default function SettingsPage({ 
  user, 
  apiFetch, 
  navigate,
  onUpdateUser,
  language,
  onLanguageChange,
}: { 
  user: any | null; 
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  navigate: (p: Page) => void;
  onUpdateUser: (user: any | null) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
}) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string>("Profile");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch("/settings");
        setSettings(data.data ?? data);
      } catch (error) {
        console.error("Gagal memuat pengaturan", error);
      }
    };
    load();
  }, []);

  const toggleSetting = async (key: keyof Settings) => {
    if (!settings) return;
    const newValue = !settings[key];
    setSettings({ ...settings, [key]: newValue });
    setSavingKey(key);
    try {
      await apiFetch("/settings", { method: "PUT", body: JSON.stringify({ [key]: newValue }) });
    } catch (error) {
      setSettings({ ...settings, [key]: !newValue });
      toastError("Gagal menyimpan pengaturan.");
    } finally {
      setSavingKey(null);
    }
  };

    const menuItems = [
    { key: "Profile", label: t("settings.profile"), icon: <User size={14} className="xs:w-4 xs:h-4" />, desc: t("settings.profileDesc") },
    { key: "Account", label: t("settings.account"), icon: <Shield size={14} className="xs:w-4 xs:h-4" />, desc: t("settings.accountDesc") },
    { key: "Appearance", label: t("settings.appearance"), icon: <Settings size={14} className="xs:w-4 xs:h-4" />, desc: t("settings.appearanceDesc") },
    { key: "Privacy", label: t("settings.privacy"), icon: <ShieldCheck size={14} className="xs:w-4 xs:h-4" />, desc: t("settings.privacyDesc") },
    { key: "Reminders", label: t("settings.reminders"), icon: <BellRing size={14} className="xs:w-4 xs:h-4" />, desc: t("settings.remindersDesc") },
    { key: "Help", label: t("settings.help"), icon: <HelpCircle size={14} className="xs:w-4 xs:h-4" />, desc: t("settings.helpDesc") },
  ];

  const menuContent = {
    Profile: <ProfileSection user={user} apiFetch={apiFetch} onUpdateUser={onUpdateUser} />,
    Account: <AccountSection />,
    Appearance: <AppearanceSection settings={settings} toggleSetting={toggleSetting} savingKey={savingKey} language={language} onLanguageChange={onLanguageChange} />,
    Privacy: <PrivacySection />,
    Help: <HelpSection />,
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-2 xs:px-3 sm:px-4 py-4 xs:py-6">

        {/* Back */}
        <button
          onClick={() => navigate?.("dashboard-siswa")}
          className="flex items-center gap-1.5 text-xs xs:text-sm text-gray-500 hover:text-gray-900 mb-4 xs:mb-6 transition-colors"
        >
          <ChevronLeft size={14} className="xs:w-4 xs:h-4" /> {t("common.back")}
        </button>

        {/* Header */}
        <div className="mb-4 xs:mb-6">
          <h1 className="text-lg xs:text-2xl font-extrabold text-gray-900">{t("settings.title")}</h1>
          <p className="text-xs xs:text-sm text-gray-400 mt-0.5">{t("settings.profileDesc")}</p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-3 xs:gap-4 sm:gap-6">
          {/* Sidebar Menu */}
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  if (item.key === "Reminders") {
                    navigate("reminder-settings");
                  } else {
                    setActiveMenu(item.key);
                  }
                }}
                className={`w-full flex items-center gap-2 xs:gap-3 px-2 xs:px-3 py-2 xs:py-2.5 text-xs xs:text-sm transition-colors ${
                  activeMenu === item.key
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className={activeMenu === item.key ? "text-blue-600" : "text-gray-400"}>
                  {item.icon}
                </span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-[10px] xs:text-xs text-gray-400">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="border border-gray-200 p-3 xs:p-4 sm:p-6 rounded">
            {menuContent[activeMenu as keyof typeof menuContent] || menuContent.Profile}
          </div>
        </div>

      </div>
    </div>
  );
}