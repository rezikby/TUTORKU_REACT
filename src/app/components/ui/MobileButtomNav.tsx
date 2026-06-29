// frontend/src/app/components/ui/MobileBottomNav.tsx

import { Home, Search, MessageSquare, User } from "lucide-react";

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

interface MobileBottomNavProps {
  activePage: Page;
  navigate: (page: Page) => void;
  user: User | null;
}

export default function MobileBottomNav({
  activePage,
  navigate,
  user,
}: MobileBottomNavProps) {
  const items = [
    {
      label: "Home",
      page: "landing",
      icon: <Home size={24} strokeWidth={2} />,
    },
    {
      label: "Search",
      page: "cari-tutor",
      icon: <Search size={24} strokeWidth={2} />,
    },
    {
      label: "Chat",
      page: "chat",
      icon: <MessageSquare size={24} strokeWidth={2} />,
    },
    {
      label: "Profile",
      page: user ? "dashboard-siswa" : "login",
      icon: <User size={24} strokeWidth={2} />,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="grid grid-cols-4 h-16">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.page as Page)}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activePage === item.page
                ? "text-[#6B6B8D]"
                : "text-gray-400"
            }`}
          >
            {item.icon}

            <span className="text-xs font-medium">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}