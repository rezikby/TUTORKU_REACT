// frontend/src/components/DashboardSiswaPage.tsx
import { useEffect, useState } from "react";
import { 
  Calendar, Clock, Heart, Award, Bell, BookMarked, GraduationCap, 
  ChevronRight, User, BarChart3, Target, TrendingUp, MapPin, Video
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
    mode?: "online" | "offline" | null;
    location_address?: string | null;
    location_city?: string | null;
    location_province?: string | null;
    location_latitude?: number | null;
    location_longitude?: number | null;
    tutor: { id?: number; name: string; avatar?: string | null; photo?: string | null; google_maps_url?: string | null };
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
        console.error(t("dashboard.errorLoadingChart"), error);
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
  }, [selectedMonth, apiFetch, overview, t]);

  const upcoming = overview?.upcoming_session;
  const monthlyData = chartData;
  const totalMinutes = monthlyData.reduce((acc, item) => acc + item.minutes, 0);
  const studyTimeLabel = totalMinutes > 0
    ? totalMinutes < 60
      ? t("dashboard.timeMinutes", { count: totalMinutes })
      : t("dashboard.timeHours", { count: Math.floor(totalMinutes / 60) })
    : t("dashboard.noStudyHours");

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
      ? t("dashboard.timeMinutes", { count: Math.round(overview.total_study_hours * 60) })
      : t("dashboard.timeHours", { count: Math.round(overview.total_study_hours) })
    : t("dashboard.noStudyHours");

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
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-32">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg md:text-2xl font-extrabold text-gray-900 truncate">{t("dashboard.title")}</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">{t("dashboard.welcome", { name: user?.name ?? t("dashboard.student") })}</p>
          </div>
          <button
            onClick={() => navigate("notifikasi")}
            className="relative w-8 h-8 sm:w-9 sm:h-9 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors rounded flex-shrink-0 ml-2"
          >
            <Bell size={16} className="sm:w-[18px] sm:h-[18px]" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded">
                {unreadCount > 9 ? "9+" : unreadCount}
              </div>
            )}
          </button>
        </div>

        {/* Quick Menu */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4 sm:mb-6">
          {quickMenu.map((m) => (
            <button
              key={m.page}
              onClick={() => navigate(m.page)}
              className="flex flex-col items-center gap-1.5 p-2 sm:p-3 border border-gray-200 hover:border-gray-300 transition-colors rounded text-center"
            >
              <div className="text-blue-600 flex-shrink-0">{m.icon}</div>
              <span className="text-[9px] sm:text-xs font-medium text-gray-700 line-clamp-2">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          {stats.map((s, idx) => (
            <div
              key={s.label}
              onClick={() => {
                if (idx === 0) {
                  navigate("riwayat-sesi");
                }
              }}
              className={`border ${s.cardBorder ?? 'border-gray-200'} p-2 sm:p-3 rounded ${s.cardBg ?? ''} ${idx === 0 ? 'cursor-pointer' : ''}`}
            >
              <div className={`w-7 h-7 sm:w-9 sm:h-9 ${s.bg} flex items-center justify-center mb-1 sm:mb-2 rounded flex-shrink-0`}>
                <span className={s.color} style={{ fontSize: '14px' }}>{s.icon}</span>
              </div>
              <div className={`text-sm sm:text-lg font-extrabold ${s.cardText ?? 'text-gray-900'} line-clamp-1`}>{s.value}</div>
              <div className={`text-[9px] sm:text-xs ${s.cardText ? 'text-white/80' : 'text-gray-400'} line-clamp-1`}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Chart + Upcoming */}
        <div className="grid lg:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
          {/* Chart */}
          <div className="lg:col-span-2 border border-gray-200 p-2 sm:p-3 rounded">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900">{t("dashboard.monthlyStudyWithMonth", { month: selectedMonthName })}</h3>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMonth("this")}
                    className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] rounded transition whitespace-nowrap ${selectedMonth === "this" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {t("dashboard.monthThis")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMonth("last")}
                    className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] rounded transition whitespace-nowrap ${selectedMonth === "last" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {t("dashboard.monthLast")}
                  </button>
                </div>
              </div>
              <span className="text-[9px] sm:text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded whitespace-nowrap">{studyTimeLabel}</span>
            </div>
            {loadingChart ? (
              <div className="h-[100px] sm:h-[140px] flex items-center justify-center text-sm text-gray-400">
                {t("dashboard.loading")}
              </div>
            ) : monthlyData.length ? (
              <ResponsiveContainer width="100%" height={100} className="sm:h-[140px]">
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
                  <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 9 }} width={30} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", color: "#111827", fontSize: "11px" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload as { minutes: number; completed_sessions: number };
                      return (
                        <div className="bg-white border border-gray-200 rounded p-1.5 text-xs text-slate-800">
                          <div className="font-semibold mb-0.5">{label}</div>
                          <div>{t("dashboard.tooltipStudyMinutes", { count: data.minutes })}</div>
                          <div>{t("dashboard.tooltipCompletedSessions", { count: data.completed_sessions })}</div>
                        </div>
                      );
                    }}
                    cursor={{ stroke: "#93C5FD" }}
                  />
                  <Area type="monotone" dataKey="minutes" stroke="#2563EB" strokeWidth={2} fill="url(#studyGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[100px] sm:h-[140px] flex items-center justify-center text-sm text-gray-400">
                {t("dashboard.noStudyData")}
              </div>
            )}
          </div>

          {/* Upcoming Session */}
          <div className="border border-gray-200 p-2 sm:p-3 rounded">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3">{t("dashboard.upcomingSession")}</h3>
            {upcoming ? (
              <div className="flex items-start gap-2 p-2 bg-gray-50 border border-gray-100 rounded">
                <img 
                  src={getTutorPhotoUrl(upcoming.tutor?.avatar ?? upcoming.tutor?.photo) ?? defaultTutorPhoto} 
                  alt={upcoming.tutor?.name ?? t("dashboard.tutorFallback")} 
                  className="w-9 h-9 sm:w-10 sm:h-10 object-cover bg-gray-100 shrink-0 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{upcoming.tutor?.name ?? t("dashboard.tutorFallback")}</div>
                  <div className="text-[9px] sm:text-xs text-gray-500 truncate">{upcoming.subject?.name ?? t("dashboard.subject")}</div>
                  <div className="flex items-center gap-1 mt-0.5 text-[8px] sm:text-[10px] text-gray-400 truncate">
                    <Calendar size={9} className="flex-shrink-0" /> {upcoming.date} · {upcoming.start_time}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 p-3 text-xs text-gray-400 text-center rounded">
                {t("dashboard.noUpcomingSession")}
              </div>
            )}
            {upcoming?.booking_id ? (
              (() => {
                const coords = upcoming.location_latitude && upcoming.location_longitude
                  ? { lat: upcoming.location_latitude, lng: upcoming.location_longitude }
                  : null;
                const gmUrl = upcoming.tutor?.google_maps_url ?? null;
                const mapUrl = coords
                  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${coords.lat},${coords.lng}`)}`
                  : gmUrl
                    ? (() => {
                        const atMatch = gmUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                        if (atMatch) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${atMatch[1]},${atMatch[2]}`)}`;
                        const dMatch = gmUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
                        if (dMatch) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${dMatch[1]},${dMatch[2]}`)}`;
                        return null;
                      })()
                    : null;

                if (upcoming.mode === "offline") {
                  return (
                    <a
                      href={mapUrl ?? "#/booking-saya"}
                      target={mapUrl ? "_blank" : undefined}
                      rel={mapUrl ? "noreferrer" : undefined}
                      className="w-full mt-2 py-1.5 sm:py-2 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors rounded inline-flex items-center justify-center gap-1.5"
                    >
                      <MapPin size={12} />
                      <span>{t("booking.goMap")}</span>
                    </a>
                  );
                }

                return (
                  <button
                    onClick={() => {
                      window.location.hash = `#/pretest?booking_id=${upcoming.booking_id}`;
                    }}
                    className="w-full mt-2 py-1.5 sm:py-2 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors rounded inline-flex items-center justify-center gap-1.5"
                  >
                    <Video size={12} />
                    <span>{t("dashboard.joinSession")}</span>
                  </button>
                );
              })()
            ) : (
              <button
                onClick={() => navigate(upcoming ? "booking-saya" : "cari-tutor")}
                className="w-full mt-2 py-1.5 sm:py-2 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors rounded"
              >
                {upcoming ? t("dashboard.viewAllBookings") : t("dashboard.findTutor")}
              </button>
            )}
          </div>
        </div>

        {/* Ringkasan & Pencapaian */}
        <div className="grid lg:grid-cols-2 gap-2 sm:gap-3">
          {/* Ringkasan */}
          <div className="border border-gray-200 p-2.5 sm:p-3 rounded">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900">{t("dashboard.summary")}</h3>
              <button onClick={() => navigate("dashboard-siswa")} className="text-[9px] sm:text-xs text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0">
                {t("dashboard.refresh")}
              </button>
            </div>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-gray-500">{t("dashboard.totalCompletedSessions")}</span>
                <span className="font-semibold text-gray-900">{overview?.total_sessions ?? 0}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-gray-500">{t("dashboard.totalStudyHours")}</span>
                <span className="font-semibold text-gray-900">{studyHoursLabel}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-gray-500">{t("dashboard.achievementsCount")}</span>
                <span className="font-semibold text-gray-900">{overview?.achievements_count ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("dashboard.favoriteTutorLabel")}</span>
                <span className="font-semibold text-gray-900 truncate ml-2">{overview?.favorite_tutor ?? t("dashboard.noFavoriteTutor")}</span>
              </div>
            </div>
          </div>

          {/* Pencapaian */}
          <div className="border border-gray-200 p-2.5 sm:p-3 rounded">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900">{t("dashboard.achievementsTitle")}</h3>
              <button onClick={() => navigate("progress")} className="text-[9px] sm:text-xs text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0">
                {t("dashboard.viewAllAchievements")}
              </button>
            </div>
            {overview?.achievements_count ? (
              <div className="grid grid-cols-3 gap-1 mb-3">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="bg-blue-50 border border-blue-100 p-1.5 sm:p-2 flex flex-col items-center text-center gap-0.5 rounded">
                    <Award size={14} className="sm:w-[16px] sm:h-[16px] text-blue-600 flex-shrink-0" />
                    <span className="text-[8px] sm:text-[9px] font-medium text-gray-700 line-clamp-1">{t("dashboard.achievement")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-gray-200 p-2 text-xs text-gray-400 text-center rounded mb-3">
                {t("dashboard.noAchievements")}
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[9px] sm:text-xs">
                <span className="text-gray-500">{t("dashboard.monthlyTarget")}</span>
                <span className="font-semibold text-gray-900 flex-shrink-0">{overview?.total_sessions ?? 0}/25</span>
              </div>
              <div className="h-1 bg-gray-100 rounded overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded" 
                  style={{ width: `${Math.min(((overview?.total_sessions ?? 0) / 25) * 100, 100)}%` }} 
                />
              </div>
              <p className="text-[8px] sm:text-[9px] text-gray-400">
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