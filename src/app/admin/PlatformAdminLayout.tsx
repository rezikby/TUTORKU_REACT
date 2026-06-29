import { useState } from "react";
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
} from "lucide-react";
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

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "users", label: "Pengguna", icon: <Users size={18} /> },
  { id: "tutors", label: "Tutor", icon: <UserCheck size={18} /> },
  { id: "bookings", label: "Booking", icon: <Calendar size={18} /> },
  { id: "payments", label: "Pembayaran", icon: <CreditCard size={18} /> },
  { id: "reports", label: "Laporan", icon: <FileText size={18} /> },
  { id: "withdrawals", label: "Pencairan", icon: <DollarSign size={18} /> },
  { id: "settings", label: "Pengaturan", icon: <Settings size={18} /> },
];

export default function PlatformAdminLayout({ user, logout }: PlatformAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return <PlatformDashboard />;
      case "users":
        return <PlatformUsers />;
      case "tutors":
        return <PlatformTutors />;
      case "bookings":
        return <PlatformBookings />;
      case "payments":
        return <PlatformPayments />;
      case "reports":
        return <PlatformReports />;
      case "withdrawals":
        return <PlatformWithdrawals />;
      case "settings":
        return (
          <div className="bg-card border border-border rounded-2xl p-6 text-white">
            <h2 className="text-xl font-semibold mb-3">Pengaturan Platform</h2>
            <p className="text-sm text-muted-foreground">
              Halaman pengaturan admin belum tersedia. Tambahkan fitur ini ke backend dan frontend jika diperlukan.
            </p>
          </div>
        );
      default:
        return <PlatformDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`fixed top-0 left-0 h-full bg-card border-r border-border transition-all duration-300 z-50 ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <Shield size={24} className="text-primary" />
              <span className="font-bold text-white">TUTORKU</span>
              <span className="text-xs text-primary font-medium">Admin</span>
            </div>
          ) : (
            <Shield size={24} className="text-primary mx-auto" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-white/10 rounded-lg transition-all"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activeMenu === item.id
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.icon}
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || "Admin"} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-primary">{user?.name?.charAt(0) || "A"}</span>
              )}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || "Admin"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "admin@TUTORKU.com"}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-white">Platform Admin</h1>
              <p className="text-sm text-muted-foreground">
                Kelola pengguna, tutor, booking, pembayaran, laporan, dan pencairan dana.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-sm hover:bg-white/5 transition-all">
                <Bell size={18} className="text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button onClick={logout} className="p-2 rounded-sm hover:bg-white/5 transition-all">
                <LogOut size={18} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">{renderContent()}</div>
      </main>
    </div>
  );
}
