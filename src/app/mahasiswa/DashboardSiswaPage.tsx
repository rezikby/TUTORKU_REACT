// frontend/src/components/DashboardSiswaPage.tsx
import { useEffect, useState } from "react";
import { 
  Calendar, Clock, Heart, Award, Bell, BookMarked, GraduationCap, 
  ChevronRight, User, BarChart3, Target, TrendingUp
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  avatar?: string | null;
};

type DashboardOverview = {
  total_sessions: number;
  total_study_hours: number;
  favorite_tutor?: string | null;
  upcoming_session?: {
    booking_id?: number;
    tutor: { id?: number; name: string; avatar?: string | null; photo?: string | null };
    subject: { name: string };
    date: string;
    start_time: string;
  } | null;
  monthly_study_minutes: { label: string; minutes: number; completed_sessions: number; date?: string }[];
  achievements_count: number;
};

type Page = "landing" | "cari-tutor" | "detail-tutor" | "booking" | "live-class" | "chat" | "dashboard-siswa" | "forum" | "about" | "progress" | "settings" | "login" | "register" | "video" | "upload-video" | "admin" | "login-google-otp" | "tutor-registration" | "booking-saya" | "riwayat-belajar" | "favorit" | "notifikasi" | "platform-admin" | "tutor-login" | "admin-login";

const API_ROOT = (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/?$/, "") ?? "https://rezi-laravel.nlabs.id";
const defaultTutorPhoto = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format";

const getTutorPhotoUrl = (photo?: string | null) => {
  if (!photo) return null;
  return photo.startsWith("http") ? photo : `${API_ROOT}/storage/${photo}`;
};

export function DashboardSiswaPage({
  overview,
  user,
  unreadCount,
  apiFetch,
  navigate,
}: {
  overview: DashboardOverview | null;
  user: User | null;
  unreadCount: number;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  navigate: (p: Page) => void;
}) {
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState<"this" | "last">("this");
  const [chartData, setChartData] = useState<DashboardOverview['monthly_study_minutes']>(overview?.monthly_study_minutes ?? []);
  const [loadingChart, setLoadingChart] = useState(false);

  const normalizeChartData = (items: any): DashboardOverview['monthly_study_minutes'] =>
    (items ?? []).map((item: any) => ({
      label: item?.label ?? "",
      minutes: Number(item?.minutes) || 0,
      completed_sessions: Number(item?.completed_sessions) || 0,
      date: item?.date ?? "",
    }));

  useEffect(() => {
    const loadMonthStudyData = async () => {
      setLoadingChart(true);
      try {
        const data = await apiFetch(`/dashboard/siswa?month=${selectedMonth}`);
        const overviewData = data.data ?? data;
        setChartData(normalizeChartData(overviewData.monthly_study_minutes));
      } catch (error) {
        console.error("Gagal memuat data grafik", error);
        if (selectedMonth === "this" && overview?.monthly_study_minutes) {
          setChartData(overview.monthly_study_minutes);
        } else {
          setChartData([]);
        }
      } finally {
        setLoadingChart(false);
      }
    };

    loadMonthStudyData();
  }, [selectedMonth, apiFetch, overview]);

  const upcoming = overview?.upcoming_session;
  const monthlyData = chartData;
  const totalMinutes = monthlyData.reduce((acc, item) => acc + item.minutes, 0);
  const studyTimeLabel = totalMinutes > 0
    ? totalMinutes < 60
      ? `${totalMinutes} Menit`
      : `${Math.floor(totalMinutes / 60)} Jam`
    : "Tidak ada jam belajar";

  const selectedMonthName = (() => {
    const today = new Date();
    const monthDate = selectedMonth === "last"
      ? new Date(today.getFullYear(), today.getMonth() - 1, 1)
      : new Date(today.getFullYear(), today.getMonth(), 1);
    return monthDate.toLocaleDateString("id-ID", { month: "long" });
  })();

  const monthlyLabels = monthlyData.map((item) => {
    if (!item?.date) {
      return item.label;
    }

    const today = new Date();
    const itemDate = new Date(item.date);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (sameDay(itemDate, today)) {
      return t("dashboard.timeAgo.today");
    }
    if (sameDay(itemDate, yesterday)) {
      return t("dashboard.timeAgo.yesterday");
    }

    return item.label;
  });

  const studyHoursLabel = overview?.total_study_hours
    ? overview.total_study_hours < 1
      ? `${Math.round(overview.total_study_hours * 60)} Menit`
      : `${Math.round(overview.total_study_hours)} Jam`
    : "Tidak ada jam belajar";

  const stats = [
    { 
      label: t("dashboard.stats.totalSessions"), 
      value: `${overview?.total_sessions ?? 0}`, 
      icon: <Calendar size={18} />, 
      color: "text-white",
      bg: "bg-blue-600",
      cardBg: "bg-blue-600",
      cardText: "text-white",
      cardBorder: "border-blue-600/20"
    },
    { 
      label: t("dashboard.stats.studyHours"), 
      value: studyHoursLabel, 
      icon: <Clock size={18} />, 
      color: "text-white",
      bg: "bg-green-600",
      cardBg: "bg-green-600",
      cardText: "text-white",
      cardBorder: "border-green-600/20"
    },
    { 
      label: t("dashboard.stats.favoriteTutor"), 
      value: `${overview?.favorite_tutor ?? t("dashboard.noFavoriteTutor")}`, 
      icon: <Heart size={18} />, 
      color: "text-white",
      bg: "bg-pink-600",
      cardBg: "bg-pink-600",
      cardText: "text-white",
      cardBorder: "border-pink-600/20"
    },
    { 
      label: t("dashboard.stats.achievements"), 
      value: `${overview?.achievements_count ?? 0}`, 
      icon: <Award size={18} />, 
      color: "text-white",
      bg: "bg-yellow-500",
      cardBg: "bg-yellow-500",
      cardText: "text-white",
      cardBorder: "border-yellow-500/20"
    },
  ];

  const quickMenu: { label: string; icon: React.ReactNode; page: Page }[] = [
    { label: t("dashboard.quickMenu.bookings"), icon: <Calendar size={16} />, page: "booking-saya" },
    { label: t("dashboard.quickMenu.studyHistory"), icon: <BookMarked size={16} />, page: "riwayat-belajar" },
    { label: t("dashboard.quickMenu.favorites"), icon: <Heart size={16} />, page: "favorit" },
    { label: t("dashboard.quickMenu.notifications"), icon: <Bell size={16} />, page: "notifikasi" },
    { label: t("dashboard.quickMenu.becomeTutor"), icon: <GraduationCap size={16} />, page: "tutor-registration" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6 pb-32">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg xs:text-2xl font-extrabold text-gray-900">{t("dashboard.title")}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{t("dashboard.welcome", { name: user?.name ?? t("dashboard.student") })}</p>
          </div>
          <button
            onClick={() => navigate("notifikasi")}
            className="relative w-9 h-9 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors rounded"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded">
                {unreadCount > 9 ? "9+" : unreadCount}
              </div>
            )}
          </button>
        </div>

        {/* Quick Menu */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 xs:gap-3 mb-6">
          {quickMenu.map((m) => (
            <button
              key={m.page}
              onClick={() => navigate(m.page)}
              className="flex items-center gap-2 xs:gap-3 p-2 xs:p-3 border border-gray-200 hover:border-gray-300 transition-colors rounded"
            >
              <div className="text-blue-600">{m.icon}</div>
              <span className="text-[10px] xs:text-xs font-medium text-gray-700">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 xs:gap-3 mb-6">
          {stats.map((s) => (
            <div key={s.label} className={`border ${s.cardBorder ?? 'border-gray-200'} p-2 xs:p-4 rounded ${s.cardBg ?? ''}`}>
              <div className={`w-9 h-9 ${s.bg} flex items-center justify-center mb-2 rounded`}>
                <span className={s.color}>{s.icon}</span>
              </div>
              <div className={`text-lg xs:text-xl font-extrabold ${s.cardText ?? 'text-gray-900'}`}>{s.value}</div>
              <div className={`text-[10px] xs:text-xs ${s.cardText ? 'text-white/80' : 'text-gray-400'}`}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Chart + Upcoming */}
        <div className="grid md:grid-cols-3 gap-2 xs:gap-3 md:gap-4 mb-6">
          {/* Chart */}
          <div className="md:col-span-2 border border-gray-200 p-3 xs:p-4 rounded">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs xs:text-sm font-semibold text-gray-900">{t("dashboard.monthlyStudyWithMonth", { month: selectedMonthName })}</h3>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMonth("this")}
                    className={`px-3 py-1 text-[10px] rounded transition ${selectedMonth === "this" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {t("dashboard.monthThis")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMonth("last")}
                    className={`px-3 py-1 text-[10px] rounded transition ${selectedMonth === "last" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {t("dashboard.monthLast")}
                  </button>
                </div>
              </div>
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{studyTimeLabel}</span>
            </div>
            {loadingChart ? (
              <div className="h-[140px] flex items-center justify-center text-sm text-gray-400">
                {t("dashboard.loading")}
              </div>
            ) : monthlyData.length ? (
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart
              data={monthlyData.map((item, index) => ({
                ...item,
                label: monthlyLabels[index] ?? item.label,
              }))}
            >
                  <defs>
                    <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", color: "#111827", fontSize: "12px" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload as { minutes: number; completed_sessions: number };
                      return (
                        <div className="bg-white border border-gray-200 rounded p-2 text-xs text-slate-800">
                          <div className="font-semibold mb-1">{label}</div>
                          <div>{data.minutes} menit belajar</div>
                          <div>{data.completed_sessions} sesi selesai</div>
                        </div>
                      );
                    }}
                    cursor={{ stroke: "#93C5FD" }}
                  />
                  <Area type="monotone" dataKey="minutes" stroke="#2563EB" strokeWidth={2} fill="url(#studyGrad)" dot={{ fill: "#2563EB", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-sm text-gray-400">
                {t("dashboard.noStudyData")}
              </div>
            )}
          </div>

          {/* Upcoming Session */}
          <div className="border border-gray-200 p-3 xs:p-4 rounded">
            <h3 className="text-xs xs:text-sm font-semibold text-gray-900 mb-4">{t("dashboard.upcomingSession")}</h3>
            {upcoming ? (
              <div className="flex items-start gap-2 xs:gap-3 p-2 xs:p-3 bg-gray-50 border border-gray-100 rounded">
                <img 
                  src={getTutorPhotoUrl(upcoming.tutor?.avatar ?? upcoming.tutor?.photo) ?? defaultTutorPhoto} 
                  alt={upcoming.tutor?.name ?? t("dashboard.tutorFallback")} 
                  className="w-10 xs:w-12 h-10 xs:h-12 object-cover bg-gray-100 shrink-0 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs xs:text-sm font-semibold text-gray-900 truncate">{upcoming.tutor?.name ?? t("dashboard.tutorFallback")}</div>
                  <div className="text-[10px] xs:text-xs text-gray-500 truncate">{upcoming.subject?.name ?? t("dashboard.subject")}</div>
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400">
                    <Calendar size={10} /> {upcoming.date} · {upcoming.start_time}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 p-4 text-sm text-gray-400 text-center rounded">
                {t("dashboard.noUpcomingSession")}
              </div>
            )}
            {upcoming?.booking_id ? (
              <button
                onClick={() => {
                  window.location.hash = `#/live-class?booking_id=${upcoming.booking_id}`;
                }}
                className="w-full mt-3 py-2 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors rounded"
              >
                {t("dashboard.joinSession")}
              </button>
            ) : (
              <button
                onClick={() => navigate(upcoming ? "booking-saya" : "cari-tutor")}
                className="w-full mt-3 py-2 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors rounded"
              >
                {upcoming ? t("dashboard.viewAllBookings") : t("dashboard.findTutor")}
              </button>
            )}
          </div>
        </div>

        {/* Ringkasan & Pencapaian */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Ringkasan */}
          <div className="border border-gray-200 p-4 rounded">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">{t("dashboard.summary")}</h3>
              <button onClick={() => navigate("dashboard-siswa")} className="text-xs text-blue-600 hover:text-blue-700 transition-colors">
                {t("dashboard.refresh")}
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">{t("dashboard.totalCompletedSessions")}</span>
                <span className="font-semibold text-gray-900">{overview?.total_sessions ?? 0}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">{t("dashboard.totalStudyHours")}</span>
                <span className="font-semibold text-gray-900">{studyHoursLabel}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">{t("dashboard.achievementsCount")}</span>
                <span className="font-semibold text-gray-900">{overview?.achievements_count ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("dashboard.favoriteTutorLabel")}</span>
                <span className="font-semibold text-gray-900">{overview?.favorite_tutor ?? t("dashboard.noFavoriteTutor")}</span>
              </div>
            </div>
          </div>

          {/* Pencapaian */}
          <div className="border border-gray-200 p-4 rounded">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">{t("dashboard.achievementsTitle")}</h3>
              <button onClick={() => navigate("progress")} className="text-xs text-blue-600 hover:text-blue-700 transition-colors">
                {t("dashboard.viewAllAchievements")}
              </button>
            </div>
            {overview?.achievements_count ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 xs:gap-2 mb-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="bg-blue-50 border border-blue-100 p-2 xs:p-3 flex flex-col items-center text-center gap-1 rounded">
                    <Award size={20} className="text-blue-600" />
                    <span className="text-[10px] xs:text-[11px] font-medium text-gray-700">{t("dashboard.achievement")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-gray-200 p-4 text-sm text-gray-400 text-center rounded">
                {t("dashboard.noAchievements")}
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{t("dashboard.monthlyTarget")}</span>
                <span className="font-semibold text-gray-900">{overview?.total_sessions ?? 0}/25 sesi</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded" 
                  style={{ width: `${Math.min(((overview?.total_sessions ?? 0) / 25) * 100, 100)}%` }} 
                />
              </div>
              <p className="text-[10px] text-gray-400">
                {t("dashboard.sessionsLeft", { count: Math.max(25 - (overview?.total_sessions ?? 0), 0) })}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardSiswaPage;