// frontend/src/app/components/ui/Navbar.tsx

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Menu,
  X,
  Bell,
  ChevronDown,
  GraduationCap,
  Settings,
  LogOut,
  LogIn,
  PlusCircle,
  Home,
  MessageCircle,
  MessageSquare,
  Video,
  BellRing,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import { ID, GB } from "country-flag-icons/react/3x2";

type Page =
  | "landing"
  | "cari-tutor"
  | "detail-tutor"
  | "booking"
  | "live-class"
  | "chat"
  | "dashboard-siswa"
  | "forum"
  | "about"
  | "progress"
  | "settings"
  | "login"
  | "register"
  | "video"
  | "upload-video"
  | "admin"
  | "login-google-otp"
  | "tutor-registration"
  | "booking-saya"
  | "riwayat-belajar"
  | "favorit"
  | "notifikasi"
  | "platform-admin"
  | "tutor-login"
  | "admin-login"
  | "reminder-settings"
  | "booking-detail";

type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  avatar?: string | null;
};

interface NavbarProps {
  activePage: Page;
  navigate: (page: Page) => void;
  user: User | null;
  unreadCount: number;
  logout: () => Promise<void>;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  setUnreadCount: (updater: number | ((c: number) => number)) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
}

export default function Navbar({
  activePage,
  navigate,
  user,
  unreadCount,
  logout,
  apiFetch,
  setUnreadCount,
  searchQuery = "",
  setSearchQuery,
  language,
  onLanguageChange,
}: NavbarProps) {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const navItems = [
    { label: t("navbar.home"), page: "landing", icon: Home },
    { label: t("navbar.findTutor"), page: "cari-tutor", icon: Search },
    { label: t("navbar.chat"), page: "chat", icon: MessageCircle },
    { label: t("navbar.forum"), page: "forum", icon: MessageSquare },
    { label: t("navbar.video"), page: "video", icon: Video },
  ];

  const languages = [
    { code: "id", label: "Indonesia", flag: ID },
    { code: "en", label: "English", flag: GB },
  ];

  const currentLang =
    languages.find((l) => l.code === language) || languages[0];
  const CurrentFlag = currentLang.flag;

  // Fungsi untuk handle klik avatar di mobile
  const handleAvatarClick = () => {
    if (user) {
      navigate("settings");
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 overflow-visible">
      <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 lg:px-6 xl-2xl:px-8 overflow-visible">
        <div className="flex items-center justify-between h-14 xs:h-16 overflow-visible">
          {/* Logo */}
          <button
            onClick={() => navigate("landing")}
            className="flex items-center justify-center flex-shrink-0 overflow-visible"
          >
            <img
              src="/img/logo1.png"
              alt="TUTORKU Logo"
              className="h-40 xs:h-44 w-auto object-contain block translate-y-2 xs:translate-y-1"
            />
          </button>

          {/* Search */}
          <div className="hidden xl:flex flex-1 max-w-xs mx-4 xl:mx-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (setSearchQuery) {
                  navigate("cari-tutor");
                }
              }}
              className="w-full flex items-center bg-gray-100 rounded-lg px-3 py-2"
            >
              <Search size={16} className="text-gray-500" />

              <input
                type="text"
                placeholder={t("navbar.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => {
                  if (setSearchQuery) {
                    setSearchQuery(e.target.value);
                  }
                }}
                className="w-full bg-transparent ml-2 text-sm outline-none text-gray-700"
              />
            </form>
          </div>

          {/* Menu */}
          <div className="hidden xl:flex items-center gap-0.5">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => navigate(item.page as Page)}
                className={`relative group overflow-hidden px-3 xl-2xl:px-4 py-2 text-xs xl-2xl:text-sm font-medium transition-colors duration-200 ease-in-out ${
                  activePage === item.page
                    ? "text-white"
                    : "text-gray-700 hover:text-white"
                }`}
              >
                <span
                  className={`absolute inset-0 transform origin-bottom transition-transform duration-200 ${
                    activePage === item.page
                      ? "scale-y-100"
                      : item.page === "chat"
                      ? "scale-y-0 group-hover:scale-y-100 duration-300"
                      : "scale-y-0 group-hover:scale-y-100"
                  } bg-[#2563EB] -z-10`}
                />

                <span className="relative z-10 leading-none">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-0.5 xs:gap-1">
            {/* Language Switcher - Desktop */}
            <div className="hidden xl:flex items-center">
              <div className="relative">
                <button
                  onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                  className="flex items-center hover:opacity-80 transition-opacity p-1 w-9 h-7"
                  aria-label={t("navbar.language")}
                >
                  <CurrentFlag className="w-full h-full" />
                </button>

                {isLanguageOpen && (
                  <div className="absolute right-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[60px]">
                    {languages.map((lang) => {
                      const FlagComponent = lang.flag;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => {
                            onLanguageChange(lang.code);
                            setIsLanguageOpen(false);
                          }}
                          className={`w-full px-3 py-2 flex items-center justify-center hover:bg-gray-50 ${
                            language === lang.code ? "bg-blue-50" : ""
                          }`}
                        >
                          <FlagComponent className="w-8 h-6" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* MOBILE */}
            <div className="flex xl:hidden items-center gap-0.5 xs:gap-1">
              {user && (
                <>
                  <NotificationBell
                    apiFetch={apiFetch}
                    navigate={navigate}
                    unreadCount={unreadCount}
                    setUnreadCount={setUnreadCount}
                    iconClassName="text-black"
                    buttonClassName="relative w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center"
                    iconSize={16}
                  />

                  {/* Avatar Mobile - klik langsung ke settings */}
                  <button
                    onClick={handleAvatarClick}
                    className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center"
                    aria-label="Settings"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-6 h-6 xs:w-7 xs:h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 xs:w-7 xs:h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[9px] xs:text-[10px] font-semibold">
                        {user.name?.charAt(0)}
                      </div>
                    )}
                  </button>
                </>
              )}

              {!user && (
                <button
                  onClick={() => navigate("login")}
                  className="text-[11px] xs:text-xs font-medium text-gray-700 px-2"
                >
                  {t("navbar.login")}
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center"
              >
                {mobileMenuOpen ? (
                  <X size={20} className="xs:w-5 xs:h-5 text-black" />
                ) : (
                  <Menu size={20} className="xs:w-5 xs:h-5 text-black" />
                )}
              </button>
            </div>

            {/* DESKTOP */}
            <div className="hidden xl:flex items-center gap-1 xs:gap-2">
              {!user ? (
                <button
                  onClick={() => navigate("login")}
                  className="flex items-center gap-2 text-gray-700 text-sm font-medium hover:text-black"
                >
                  <LogIn size={18} />
                  <span>{t("navbar.login")}</span>
                </button>
              ) : (
                <>
                  <NotificationBell
                    apiFetch={apiFetch}
                    navigate={navigate}
                    unreadCount={unreadCount}
                    setUnreadCount={setUnreadCount}
                    iconClassName="text-gray-700"
                    buttonClassName="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100"
                    iconSize={18}
                  />

                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-sm font-semibold">
                          {user.name?.charAt(0)}
                        </div>
                      )}

                      <ChevronDown size={16} className="text-gray-500" />
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-0 w-56 xl-2xl:w-64 overflow-hidden rounded-lg border border-gray-200 bg-white ring-1 ring-black/5">
                        <div className="px-4 py-3 xs:py-4 border-b border-gray-100 bg-white">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {user.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {user.email}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            navigate("dashboard-siswa");
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Home
                            size={18}
                            className="text-gray-500 flex-shrink-0"
                          />
                          <span className="truncate">
                            {t("navbar.dashboardMenu")}
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            navigate("settings");
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Settings
                            size={18}
                            className="text-gray-500 flex-shrink-0"
                          />
                          <span className="truncate">
                            {t("navbar.settingsMenu")}
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            navigate("reminder-settings");
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <BellRing
                            size={18}
                            className="text-gray-500 flex-shrink-0"
                          />
                          <span className="truncate">
                            {t("navbar.remindersMenu")}
                          </span>
                        </button>

                        {user.role !== "tutor" && (
                          <button
                            onClick={() => {
                              navigate("tutor-registration");
                              setIsUserMenuOpen(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <PlusCircle
                              size={18}
                              className="text-gray-500 flex-shrink-0"
                            />
                            <span className="truncate">
                              {t("navbar.becomeTutorMenu")}
                            </span>
                          </button>
                        )}

                        <button
                          onClick={async () => {
                            await logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50"
                        >
                          <LogOut size={18} className="flex-shrink-0" />
                          <span className="truncate">{t("navbar.logout")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* MOBILE MENU */}
          <div
            className={`xl:hidden fixed inset-x-0 top-14 xs:top-16 bottom-0 bg-white z-40 transition-all duration-300 ease-out ${
              mobileMenuOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            <div className="px-3 xs:px-4 sm:px-6 pt-4 xs:pt-6 pb-24">
              {/* Mobile Search */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (setSearchQuery) {
                    navigate("cari-tutor");
                    setMobileMenuOpen(false);
                  }
                }}
                className="mb-4 xs:mb-6 flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5"
              >
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    if (setSearchQuery) {
                      setSearchQuery(e.target.value);
                    }
                  }}
                  placeholder={t("navbar.searchTutorOrSubject")}
                  className="bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none w-full"
                />
              </form>

              {/* Mobile Language Switcher - Flag only */}
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">
                  {t("navbar.language")}:
                </span>
                <div className="flex items-center gap-2">
                  {languages.map((lang) => {
                    const FlagComponent = lang.flag;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => onLanguageChange(lang.code)}
                        className={`flex items-center hover:opacity-80 transition-opacity w-9 h-7 ${
                          language === lang.code ? "opacity-100" : "opacity-40"
                        }`}
                        aria-label={lang.label}
                      >
                        <FlagComponent className="w-full h-full" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Menu */}
              <div className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => {
                      navigate(item.page as Page);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 xs:px-4 py-2.5 xs:py-3 rounded-lg transition-all duration-200 text-sm ${
                      activePage === item.page
                        ? "bg-blue-50 text-[#2563EB] font-semibold"
                        : "text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                {user && (
                  <>
                    <button
                      onClick={() => {
                        navigate("dashboard-siswa");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 xs:px-4 py-2.5 xs:py-3 rounded-lg transition-all duration-200 text-sm ${
                        activePage === "dashboard-siswa"
                          ? "bg-blue-50 text-[#2563EB] font-semibold"
                          : "text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      {t("navbar.dashboardMenu")}
                    </button>
                    <button
                      onClick={() => {
                        navigate("settings");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 xs:px-4 py-2.5 xs:py-3 rounded-lg transition-all duration-200 text-sm ${
                        activePage === "settings"
                          ? "bg-blue-50 text-[#2563EB] font-semibold"
                          : "text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Settings size={16} className="text-gray-500" />
                        {t("navbar.settingsMenu")}
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        navigate("reminder-settings");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 xs:px-4 py-2.5 xs:py-3 rounded-lg transition-all duration-200 text-sm ${
                        activePage === "reminder-settings"
                          ? "bg-blue-50 text-[#2563EB] font-semibold"
                          : "text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      {t("navbar.remindersMenu")}
                    </button>
                  </>
                )}
              </div>

              {/* Buttons */}
              <div className="mt-4 xs:mt-6 pt-4 xs:pt-6 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2 xs:gap-3">
                  {!user ? (
                    <>
                      <button
                        onClick={() => {
                          navigate("login");
                          setMobileMenuOpen(false);
                        }}
                        className="h-10 xs:h-12 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-semibold transition-all hover:bg-gray-50"
                      >
                        {t("navbar.login")}
                      </button>

                      <button
                        onClick={() => {
                          navigate("cari-tutor");
                          setMobileMenuOpen(false);
                        }}
                        className="h-10 xs:h-12 rounded-lg bg-[#2563EB] text-white text-sm font-semibold transition-all hover:opacity-90"
                      >
                        {t("navbar.findTutor")}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          navigate("cari-tutor");
                          setMobileMenuOpen(false);
                        }}
                        className="h-10 xs:h-12 rounded-lg bg-[#2563EB] text-white text-sm font-semibold transition-all hover:opacity-90"
                      >
                        {t("navbar.findTutor")}
                      </button>

                      <button
                        onClick={async () => {
                          await logout();
                          setMobileMenuOpen(false);
                        }}
                        className="h-10 xs:h-12 rounded-lg border border-red-200 text-red-500 text-sm font-semibold transition-all hover:bg-red-50"
                      >
                        {t("navbar.logout")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}