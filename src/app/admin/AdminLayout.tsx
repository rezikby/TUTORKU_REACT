// frontend/src/app/admin/AdminLayout.tsx
import { useEffect, useState } from "react";
import DashboardView from "./components/DashboardView";
import MuridSayaView from "./components/MuridSayaView";
import ChatView from "./components/ChatView..tsx";
import VideoSayaView from "./components/VideoSayaView";
import JadwalView from "./components/JadwalView";
import PendapatanView from "./components/PendapatanView";
import ReviewView from "./components/ReviewView";
import PengaturanView from "./components/PengaturanView";
import { adminApiFetch } from "./adminApi";
import { 
  LayoutDashboard, 
  Users, 
  Video, 
  Calendar, 
  DollarSign, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  MessageCircle,
  Star, 
  GraduationCap, 
  Bell,
  TrendingUp,
  UserCheck,
  Clock,
  Award
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
  const [stats, setStats] = useState<{ income: number; students: number } | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await adminApiFetch("/dashboard/tutor");
        const overview = data.data ?? data;
        setStats({
          income: overview?.monthly_income?.slice(-1)[0]?.income ?? 0,
          students: overview?.total_students ?? 0,
        });
      } catch (error) {
        console.error("Gagal memuat statistik tutor", error);
      }
    };
    loadStats();
  }, []);

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

  const getActiveMenuLabel = () => {
    const item = menuItems.find(item => item.id === activeMenu);
    return item ? item.label : "Dashboard";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-blue-700 to-blue-900 transition-all duration-300 z-50 shadow-2xl ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-blue-600/50">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-white/10 rounded-xl flex-shrink-0">
                <GraduationCap size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-white text-lg tracking-tight block truncate">TUTORKU</span>
                <span className="block text-[10px] text-blue-200 font-medium tracking-wider">TUTOR PANEL</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto p-2 bg-white/10 rounded-xl">
              <GraduationCap size={20} className="text-white" />
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-blue-600/50 rounded-lg transition-all text-white/70 hover:text-white flex-shrink-0 focus:outline-none"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-140px)]">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors focus:outline-none ${
                activeMenu === item.id 
                  ? "bg-white text-blue-700" 
                  : "text-blue-100 hover:bg-blue-600/50 hover:text-white"
              }`}
            >
              <span className="flex-shrink-0">
                {item.icon}
              </span>
              {sidebarOpen && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
              {!sidebarOpen && activeMenu === item.id && (
                <div className="absolute right-0 w-1 h-6 bg-white" />
              )}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-600/50 bg-blue-800/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center border-2 border-blue-400/30 shadow-lg">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user?.name || "User"} 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {user?.name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-blue-700" />
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

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100/80 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  {getActiveMenuLabel()}
                </h1>
                <p className="text-sm text-gray-500 hidden sm:block truncate">
                  Kelola aktivitas mengajar Anda
                </p>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-600 text-white rounded-full shadow-md hidden sm:inline-block flex-shrink-0">
                TUTOR
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Stats Quick View */}
              <div className="hidden md:flex items-center gap-4 text-gray-700">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-blue-600" />
                  <span className="text-xs font-medium">
                    {stats ? `Rp ${stats.income.toLocaleString("id-ID")}` : "..."}
                  </span>
                </div>
                <span className="block h-4 w-px bg-slate-300" />
                <div className="flex items-center gap-1.5">
                  <UserCheck size={14} className="text-blue-600" />
                  <span className="text-xs font-medium">
                    {stats ? stats.students : "..."}
                  </span>
                </div>
              </div>

              <button className="relative p-2 rounded-xl hover:bg-blue-50 transition-all focus:outline-none">
                <Bell size={18} className="text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              </button>
              <button 
                onClick={logout} 
                className="p-2 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all text-gray-600 focus:outline-none"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
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