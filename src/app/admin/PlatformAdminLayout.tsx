import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Shield,
  UserCheck,
  Calendar,
  CreditCard,
  FileText,
  TrendingUp,
  Award,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  UserCog,
  GraduationCap,
  BookOpen,
  Layers,
  Video,
  Monitor,
  MessageSquare,
  Megaphone,
  Newspaper,
  Image,
  HelpCircle,
  BarChart3,
  Globe,
  User,
  Database,
  HardDrive,
  FileClock,
  UsersRound,
  VideoIcon,
  Mic,
  MonitorCheck,
  Clock as ClockIcon,
  Bot,
  History,
  Zap,
  Receipt,
  RotateCcw,
  Notebook,
  FolderOpen,
  Minimize2,
} from "lucide-react";
import { adminApiFetch } from "./adminApi";
import PlatformDashboard from "./platform/PlatformDashboard";
import PlatformUsers from "./platform/PlatformUsers";
import PlatformTutors from "./platform/PlatformTutors";
import PlatformBookings from "./platform/PlatformBookings";
import PlatformPayments from "./platform/PlatformPayments";
import PlatformReports from "./platform/PlatformReports";
import PlatformWithdrawals from "./platform/PlatformWithdrawals";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
};

interface PlatformAdminLayoutProps {
  user: User | null;
  logout?: () => Promise<void> | void;
}

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: MenuItem[];
};

const menuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  {
    id: "users",
    label: "Pengguna",
    icon: <Users size={18} />,
    children: [
      { id: "tutor-list", label: "Tutor", icon: <GraduationCap size={16} /> },
      { id: "siswa", label: "Siswa", icon: <User size={16} /> },
      { id: "verifikasi-tutor", label: "Verifikasi Tutor", icon: <UserCheck size={16} /> },
    ],
  },
  {
    id: "akademik",
    label: "Akademik",
    icon: <BookOpen size={18} />,
    children: [
      { id: "mata-pelajaran", label: "Mata Pelajaran", icon: <Layers size={16} /> },
      { id: "kategori", label: "Kategori", icon: <FolderOpen size={16} /> },
      { id: "jadwal-tutor", label: "Jadwal Tutor", icon: <Calendar size={16} /> },
    ],
  },
  {
    id: "booking",
    label: "Booking",
    icon: <Calendar size={18} />,
    children: [
      { id: "semua-booking", label: "Semua Booking", icon: <FileText size={16} /> },
      { id: "booking-berlangsung", label: "Berlangsung", icon: <Clock size={16} /> },
      { id: "riwayat", label: "Riwayat", icon: <History size={16} /> },
    ],
  },
  {
    id: "sesi-online",
    label: "Sesi Online",
    icon: <Video size={18} />,
    children: [
      { id: "live-session", label: "Live Session", icon: <Monitor size={16} /> },
      { id: "rekaman", label: "Rekaman", icon: <VideoIcon size={16} /> },
      { id: "monitoring", label: "Monitoring", icon: <MonitorCheck size={16} /> },
    ],
  },
  {
    id: "keuangan",
    label: "Keuangan",
    icon: <DollarSign size={18} />,
    children: [
      { id: "transaksi", label: "Transaksi", icon: <Receipt size={16} /> },
      { id: "pencairan", label: "Pencairan", icon: <CreditCard size={16} /> },
      { id: "refund", label: "Refund", icon: <RotateCcw size={16} /> },
    ],
  },
  {
    id: "komunikasi",
    label: "Komunikasi",
    icon: <MessageSquare size={18} />,
    children: [
      { id: "chat", label: "Chat", icon: <MessageSquare size={16} /> },
      { id: "pengumuman", label: "Pengumuman", icon: <Megaphone size={16} /> },
      { id: "notifikasi", label: "Notifikasi", icon: <Bell size={16} /> },
    ],
  },
  {
    id: "konten",
    label: "Konten",
    icon: <Newspaper size={18} />,
    children: [
      { id: "artikel", label: "Artikel", icon: <Notebook size={16} /> },
      { id: "banner", label: "Banner", icon: <Image size={16} /> },
      { id: "faq", label: "FAQ", icon: <HelpCircle size={16} /> },
    ],
  },
  {
    id: "laporan",
    label: "Laporan",
    icon: <BarChart3 size={18} />,
    children: [
      { id: "laporan-pendapatan", label: "Pendapatan", icon: <TrendingUp size={16} /> },
      { id: "laporan-tutor", label: "Tutor", icon: <GraduationCap size={16} /> },
      { id: "laporan-siswa", label: "Siswa", icon: <UsersRound size={16} /> },
      { id: "export", label: "Export", icon: <FileText size={16} /> },
    ],
  },
  {
    id: "pengaturan",
    label: "Pengaturan",
    icon: <Settings size={18} />,
    children: [
      { id: "website", label: "Website", icon: <Globe size={16} /> },
      { id: "profil", label: "Profil", icon: <UserCog size={16} /> },
      { id: "api", label: "API", icon: <Database size={16} /> },
      { id: "backup", label: "Backup", icon: <HardDrive size={16} /> },
      { id: "log", label: "Log", icon: <FileClock size={16} /> },
    ],
  },
];

// Menu tambahan untuk fitur video call
const videoCallMenu: MenuItem[] = [
  {
    id: "video-call",
    label: "Video Call",
    icon: <Video size={18} />,
    children: [
      { id: "monitoring-live", label: "Monitoring Live", icon: <MonitorCheck size={16} /> },
      { id: "sesi-aktif", label: "Sesi Aktif", icon: <ClockIcon size={16} /> },
      { id: "peserta-online", label: "Peserta Online", icon: <UsersRound size={16} /> },
      { id: "penggunaan-kamera", label: "Penggunaan Kamera", icon: <VideoIcon size={16} /> },
      { id: "penggunaan-mikrofon", label: "Penggunaan Mikrofon", icon: <Mic size={16} /> },
      { id: "screen-sharing", label: "Screen Sharing", icon: <Monitor size={16} /> },
      { id: "durasi-sesi", label: "Durasi Sesi", icon: <Clock size={16} /> },
    ],
  },
];

// Menu tambahan untuk AI
const aiMenu: MenuItem[] = [
  {
    id: "ai",
    label: "AI Assistant",
    icon: <Bot size={18} />,
    children: [
      { id: "riwayat-percakapan", label: "Riwayat Percakapan", icon: <History size={16} /> },
      { id: "prompt", label: "Prompt", icon: <Zap size={16} /> },
      { id: "pengaturan-ai", label: "Pengaturan AI", icon: <Settings size={16} /> },
    ],
  },
];

export default function PlatformAdminLayout({ user, logout }: PlatformAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    users: true,
  });
  const [adminStats, setAdminStats] = useState<{
    total_users: number;
    total_siswa: number;
    total_tutor: number;
    tutor_verified: number;
    tutor_pending: number;
    total_bookings: number;
    total_bookings_completed: number;
    total_revenue: number;
    monthly_revenue: { month: string; revenue: number }[];
    open_reports: number;
    new_contact_messages: number;
  } | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await adminApiFetch("/admin/dashboard");
        setAdminStats(data);
      } catch (error) {
        console.error("Gagal memuat statistik admin", error);
      }
    };

    loadStats();
  }, []);

  const totalPlatformUsers = adminStats ? adminStats.total_siswa + adminStats.total_tutor : null;

  // Gabungkan semua menu
  const allMenus = [...menuItems, ...videoCallMenu, ...aiMenu];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  // Fungsi untuk menutup semua dropdown
  const closeAllDropdowns = () => {
    setExpandedMenus({});
  };

  const renderContent = () => {
    // Untuk sementara, semua menu baru akan menampilkan placeholder
    const placeholderPages = [
      "admin", "tutor-list", "siswa", "verifikasi-tutor",
      "mata-pelajaran", "kategori", "jadwal-tutor",
      "semua-booking", "booking-berlangsung", "riwayat",
      "live-session", "rekaman", "monitoring",
      "transaksi", "refund",
      "chat", "pengumuman", "notifikasi",
      "artikel", "banner", "faq",
      "laporan-pendapatan", "laporan-tutor", "laporan-siswa", "export",
      "website", "profil", "api", "backup", "log",
      "monitoring-live", "sesi-aktif", "peserta-online", "penggunaan-kamera",
      "penggunaan-mikrofon", "screen-sharing", "durasi-sesi",
      "riwayat-percakapan", "prompt", "pengaturan-ai"
    ];

    if (activeMenu === "dashboard") {
      return <PlatformDashboard onSelectMenu={(menu) => setActiveMenu(menu)} />;
    }

    if (activeMenu === "users") {
      return <PlatformUsers mode="users" />;
    }

    if (activeMenu === "siswa") {
      return <PlatformUsers mode="siswa" />;
    }

    if (activeMenu === "tutor-list") {
      return <PlatformTutors defaultFilter="verified" forceDelete={true} />;
    }

    if (activeMenu === "verifikasi-tutor") {
      return <PlatformTutors defaultFilter="pending" forceDelete={false} />;
    }
    
    if (activeMenu === "semua-booking" || activeMenu === "booking-berlangsung" || activeMenu === "riwayat") {
      return <PlatformBookings />;
    }
    
    if (activeMenu === "pencairan") {
      return <PlatformWithdrawals />;
    }
    
    if (activeMenu === "laporan-pendapatan" || activeMenu === "laporan-tutor" || 
        activeMenu === "laporan-siswa" || activeMenu === "export") {
      return <PlatformReports />;
    }

    if (placeholderPages.includes(activeMenu)) {
      const allItems = allMenus.flatMap(m => [m, ...(m.children || [])]);
      const menuItem = allItems.find(c => c.id === activeMenu);
      return (
        <div className="border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 border border-blue-200 bg-blue-50">
              {menuItem?.icon || <LayoutDashboard size={20} className="text-blue-600" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {menuItem?.label || activeMenu}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Halaman ini sedang dalam pengembangan.
              </p>
              <div className="mt-3 flex items-center gap-2 p-2 border border-yellow-200 bg-yellow-50">
                <AlertCircle size={16} className="text-yellow-600" />
                <span className="text-xs text-yellow-700">Fitur segera hadir</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <PlatformDashboard />;
  };

  const getActiveMenuLabel = () => {
    const allItems = allMenus.flatMap(m => [m, ...(m.children || [])]);
    const item = allItems.find(item => item.id === activeMenu);
    return item ? item.label : "Dashboard";
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.id];
    const isActive = activeMenu === item.id;
    const isChildActive = item.children?.some(child => child.id === activeMenu);

    return (
      <div key={item.id} className="w-full">
        <button
          onClick={() => {
            setActiveMenu(item.id);
            if (hasChildren) {
              toggleMenu(item.id);
            }
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 transition-colors focus:outline-none ${
            isActive || isChildActive
              ? "bg-white text-blue-700"
              : "text-blue-100 hover:bg-blue-600/50 hover:text-white"
          }`}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          <span className="flex-shrink-0">
            {item.icon}
          </span>
          {sidebarOpen && (
            <>
              <span className="text-sm font-medium flex-1 text-left truncate">{item.label}</span>
              {hasChildren && (
                <span className="text-blue-200 flex-shrink-0">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              )}
            </>
          )}
          {!sidebarOpen && isActive && (
            <div className="absolute right-0 w-1 h-6 bg-white" />
          )}
        </button>
        
        {hasChildren && isExpanded && sidebarOpen && (
          <div className="ml-4">
            {item.children!.map((child) => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
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
                <Shield size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-white text-lg tracking-tight block truncate">TUTORKU</span>
                <span className="block text-[10px] text-blue-200 font-medium tracking-wider">ADMIN PANEL</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto p-2 bg-white/10 rounded-xl">
              <Shield size={20} className="text-white" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-blue-600/50 rounded-lg transition-all text-white/70 hover:text-white flex-shrink-0 focus:outline-none"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Tombol Tutup Semua Dropdown */}
        {sidebarOpen && (
          <div className="px-3 pt-2">
            <button
              onClick={closeAllDropdowns}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-blue-200 hover:text-white hover:bg-blue-600/50 transition-colors focus:outline-none"
            >
              <Minimize2 size={14} />
              <span>Tutup Semua Menu</span>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-2 space-y-0.5 overflow-y-auto h-[calc(100vh-180px)]">
          {allMenus.map((item) => renderMenuItem(item))}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-600/50 bg-blue-800/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center border-2 border-blue-400/30 shadow-lg">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user?.name || "Admin"} 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {user?.name?.charAt(0) || "A"}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-blue-700" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || "Admin"}</p>
                <p className="text-xs text-blue-200 truncate">{user?.email || "admin@tutorku.com"}</p>
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
                  Kelola seluruh aspek platform TUTORKU
                </p>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-600 text-white rounded-full shadow-md hidden sm:inline-block flex-shrink-0">
                ADMIN
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-4 text-gray-700">
                <div className="flex items-center gap-1.5">
                  <Users size={16} className="text-blue-600" />
                  <span className="text-sm font-semibold">
                    {totalPlatformUsers !== null ? totalPlatformUsers : "..."}
                  </span>
                </div>
                <span className="block h-4 w-px bg-slate-300" />
                <div className="flex items-center gap-1.5">
                  <Award size={16} className="text-blue-600" />
                  <span className="text-sm font-semibold">
                    {adminStats ? adminStats.tutor_pending : "..."}
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
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}