// frontend/src/app/admin/components/DashboardView.tsx
import { useEffect, useMemo, useState } from "react";
import { Users, Calendar, DollarSign, Star, Clock, TrendingUp, Award, BookOpen, UserPlus, Target, Wallet, Medal } from "lucide-react";
import { adminApiFetch } from "../adminApi";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
};

interface DashboardViewProps {
  user: User | null;
}

type BookingSession = {
  id: number;
  date: string;
  start_time: string;
  duration_minutes: number;
  mode: string;
  student: { name: string } | null;
  subject: { name?: string | null } | null;
};

type TutorOverview = {
  verification_status: string;
  registration_step: number;
  balance: number;
  rating_avg: number;
  rating_count: number;
  total_students: number;
  total_sessions: number;
  upcoming_sessions: BookingSession[];
  monthly_income: { month: string; income: number }[];
};

export default function DashboardView({ user }: DashboardViewProps) {
  const [overview, setOverview] = useState<TutorOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startingId, setStartingId] = useState<number | null>(null);

  useEffect(() => {
    adminApiFetch("/dashboard/tutor")
      .then((data) => setOverview(data.data ?? data))
      .catch((error) => console.error(error))
      .finally(() => setIsLoading(false));
  }, []);

  const handleStartSession = async (id: number) => {
    setStartingId(id);
    try {
      await adminApiFetch(`/bookings/${id}/live-session/join`, { method: "POST" });
      window.location.hash = `#/live-class-tutor?booking_id=${id}`;
    } catch (error) {
      console.error(error);
    } finally {
      setStartingId(null);
    }
  };

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }),
    [],
  );

  const currentMonthIncome = overview?.monthly_income?.length
    ? overview.monthly_income[overview.monthly_income.length - 1].income
    : 0;

  const latestActivities = overview?.upcoming_sessions.slice(0, 3) ?? [];
  const upcomingSchedules = overview?.upcoming_sessions ?? [];

  const formatDate = (date: string) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  const stats = [
    {
      label: "Murid Aktif",
      value: isLoading ? "..." : overview?.total_students ?? 0,
      icon: <Users size={20} className="text-white" />,
      bg: "bg-blue-600",
    },
    {
      label: "Total Sesi",
      value: isLoading ? "..." : overview?.total_sessions ?? 0,
      icon: <Calendar size={20} className="text-white" />,
      bg: "bg-green-600",
    },
    {
      label: "Pendapatan Bulan Ini",
      value: isLoading ? "..." : currencyFormatter.format(currentMonthIncome),
      icon: <DollarSign size={20} className="text-white" />,
      bg: "bg-yellow-600",
    },
    {
      label: "Rating Rata-rata",
      value: isLoading ? "..." : overview?.rating_avg?.toFixed(1) ?? "0.0",
      icon: <Star size={20} className="text-white" />,
      bg: "bg-purple-600",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">Selamat datang kembali, {user?.name || "Tutor"}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className={`${stat.bg} p-4 rounded`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 flex items-center justify-center">
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/80">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Aktivitas & Jadwal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aktivitas Terbaru */}
        <div className="border border-gray-200 p-5 rounded bg-white">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h3>
          {isLoading ? (
            <p className="text-sm text-gray-400">Memuat aktivitas...</p>
          ) : latestActivities.length > 0 ? (
            <div className="space-y-3">
              {latestActivities.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 p-3 border border-gray-100 hover:border-gray-200 transition-colors rounded"
                >
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Sesi dengan {session.student?.name ?? "Siswa"}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(session.date)} · {session.start_time}
                    </p>
                  </div>
                  <button className="text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors">
                    Detail
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-gray-200 p-4 text-center text-sm text-gray-400 rounded">
              Belum ada aktivitas terbaru
            </div>
          )}
        </div>

        {/* Jadwal Mendatang */}
        <div className="border border-gray-200 p-5 rounded bg-white">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Jadwal Mendatang</h3>
          {isLoading ? (
            <p className="text-sm text-gray-400">Memuat jadwal...</p>
          ) : upcomingSchedules.length > 0 ? (
            <div className="space-y-3">
              {upcomingSchedules.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 p-3 border border-gray-100 hover:border-gray-200 transition-colors rounded"
                >
                  <div className="w-10 h-10 bg-blue-100 flex items-center justify-center rounded">
                    <Clock size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{session.subject?.name ?? "Sesi Baru"}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(session.date)}, {session.start_time} · {session.duration_minutes} menit
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartSession(session.id)}
                    disabled={startingId === session.id}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {startingId === session.id ? "Memulai..." : "Mulai"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-gray-200 p-4 text-center text-sm text-gray-400 rounded">
              Tidak ada jadwal mendatang
            </div>
          )}
        </div>
      </div>

      {/* Info Tambahan - Rating & Pendapatan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
        <div className="border border-gray-200 p-5 rounded bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Rating & Ulasan</h3>
          </div>
          {isLoading ? (
            <p className="text-sm text-gray-400">Memuat data...</p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{overview?.rating_avg?.toFixed(1) ?? "0.0"}</div>
                <div className="flex items-center gap-0.5 mt-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i <= Math.round(overview?.rating_avg ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{overview?.rating_count ?? 0} ulasan</div>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">Status:</span> {overview?.verification_status === "verified" ? "Terverifikasi" : "Menunggu Verifikasi"}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">Total Sesi:</span> {overview?.total_sessions ?? 0}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border border-gray-200 p-5 rounded bg-white">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Ringkasan Pendapatan</h3>
          </div>
          {isLoading ? (
            <p className="text-sm text-gray-400">Memuat data...</p>
          ) : (
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {currencyFormatter.format(overview?.balance ?? 0)}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">Saldo tersedia</div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pendapatan bulan ini</span>
                  <span className="font-medium text-gray-900">{currencyFormatter.format(currentMonthIncome)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Total sesi</span>
                  <span className="font-medium text-gray-900">{overview?.total_sessions ?? 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}