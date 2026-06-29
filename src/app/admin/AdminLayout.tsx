// frontend/src/app/admin/AdminLayout.tsx
import { useState } from "react";
import DashboardView from "./components/DashboardView";
import MuridSayaView from "./components/MuridSayaView";
import ChatView from "./components/ChatView..tsx";
import VideoSayaView from "./components/VideoSayaView";
import JadwalView from "./components/JadwalView";
import PendapatanView from "./components/PendapatanView";
import ReviewView from "./components/ReviewView";
import PengaturanView from "./components/PengaturanView";
import { 
  LayoutDashboard, Users, Video, Calendar, DollarSign, 
  Settings, LogOut, Menu, X, ChevronDown, BookOpen,
  Star, MessageCircle, BarChart3, FileText, Bell,
  Home, GraduationCap, Clock, Award, TrendingUp
} from "lucide-react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
};

interface AdminLayoutProps {
  user: User | null;
  onUpdateUser?: (user: User) => void;
  logout?: () => Promise<void> | void;
  openUpload?: boolean;
}

export default function AdminLayout({ user, onUpdateUser, logout, openUpload }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState(openUpload ? "video" : "dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "murid", label: "Murid Saya", icon: <Users size={18} /> },
    { id: "chat", label: "Pesan", icon: <MessageCircle size={18} /> },
    { id: "video", label: "Video Saya", icon: <Video size={18} /> },
    { id: "jadwal", label: "Jadwal", icon: <Calendar size={18} /> },
    { id: "pendapatan", label: "Pendapatan", icon: <DollarSign size={18} /> },
    { id: "review", label: "Review", icon: <Star size={18} /> },
    { id: "pengaturan", label: "Pengaturan", icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-blue-700 transition-all duration-300 z-50 ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className="flex items-center justify-between p-4 border-b border-blue-600">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <GraduationCap size={24} className="text-white" />
              <span className="font-bold text-white">TUTORKU</span>
              <span className="text-xs text-blue-200">Tutor</span>
            </div>
          ) : (
            <GraduationCap size={24} className="text-white mx-auto" />
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-blue-600 rounded transition-all text-white"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all ${
                activeMenu === item.id 
                  ? "bg-white text-blue-700" 
                  : "text-blue-100 hover:bg-blue-600 hover:text-white"
              }`}
            >
              {item.icon}
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-600 bg-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center border border-blue-500">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || "User"} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">
                  {user?.name?.charAt(0) || "U"}
                </span>
              )}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || "Tutor"}</p>
                <p className="text-xs text-blue-200 truncate">{user?.email || "tutor@email.com"}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Dashboard Tutor</h1>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded hover:bg-gray-50 transition-all">
                <Bell size={18} className="text-gray-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button onClick={logout} className="p-2 rounded hover:bg-gray-50 transition-all">
                <LogOut size={18} className="text-gray-500" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 bg-white">
          <div className="max-w-full">
            {activeMenu === "dashboard" && <DashboardView user={user} />}
            {activeMenu === "murid" && <MuridSayaView />}
            {activeMenu === "chat" && <ChatView user={user} />}
            {activeMenu === "video" && <VideoSayaView initialShowUpload={openUpload} />}
            {activeMenu === "jadwal" && <JadwalView />}
            {activeMenu === "pendapatan" && <PendapatanView />}
            {activeMenu === "review" && <ReviewView />}
            {activeMenu === "pengaturan" && <PengaturanView />}
          </div>
        </div>
      </main>
    </div>
  );
}