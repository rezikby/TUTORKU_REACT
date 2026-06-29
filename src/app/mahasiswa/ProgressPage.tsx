import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronLeft, TrendingUp, Clock, Award, Calendar, BarChart3 } from "lucide-react";

type Page = "landing" | "cari-tutor" | "detail-tutor" | "booking" | "live-class" | "chat" | "dashboard-siswa" | "forum" | "about" | "progress" | "settings" | "login" | "register" | "video" | "upload-video" | "admin" | "login-google-otp" | "tutor-registration" | "booking-saya" | "riwayat-belajar" | "favorit" | "notifikasi" | "platform-admin" | "tutor-login" | "admin-login";

interface ProgressDataItem {
  label: string;
  value: number;
}

interface ProgressPageProps {
  progressData?: ProgressDataItem[] | null;
  totalSessions?: number;
  totalHours?: number;
  streak?: number;
  navigate?: (page: Page) => void;
}

export default function ProgressPage({ 
  progressData = [], 
  totalSessions = 0,
  totalHours = 0,
  streak = 0,
  navigate 
}: ProgressPageProps) {
  const safeProgressData =
    progressData && Array.isArray(progressData) ? progressData : [];
  const hasData = safeProgressData.some(d => d && typeof d === 'object' && (d.value || 0) > 0);

  // Stats dengan safe data
  const stats = [
    { label: "Total Sesi", value: totalSessions || 0, icon: <Calendar size={16} className="text-blue-600" />, bg: "bg-blue-50" },
    { label: "Jam Belajar", value: `${totalHours || 0}h`, icon: <Clock size={16} className="text-green-600" />, bg: "bg-green-50" },
    { label: "Streak", value: `${streak || 0} hari`, icon: <Award size={16} className="text-yellow-600" />, bg: "bg-yellow-50" },
    { label: "Rata-rata", value: (totalSessions || 0) > 0 ? `${Math.round(((totalHours || 0) * 60) / (totalSessions || 1))}m` : "0m", icon: <TrendingUp size={16} className="text-purple-600" />, bg: "bg-purple-50" },
  ];

  const chartData = safeProgressData.length > 0 ? safeProgressData : [
    { label: "Sen", value: 0 },
    { label: "Sel", value: 0 },
    { label: "Rab", value: 0 },
    { label: "Kam", value: 0 },
    { label: "Jum", value: 0 },
    { label: "Sab", value: 0 },
    { label: "Min", value: 0 },
  ];

  const totalMinutes = safeProgressData.reduce((sum, d) => sum + (d?.value || 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Back */}
        {navigate && (
          <button
            onClick={() => navigate("dashboard-siswa")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ChevronLeft size={16} /> Kembali
          </button>
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Progress Belajar</h1>
          <p className="text-sm text-gray-400 mt-0.5">Pantau perkembangan belajar kamu</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className={`${stat.bg} border border-gray-200 p-3 rounded`}>
              <div className="flex items-center gap-2">
                {stat.icon}
                <div>
                  <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                  <div className="text-[10px] text-gray-500">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="border border-gray-200 p-5 rounded bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Aktivitas Belajar Mingguan</h3>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
              {hasData ? `${totalMinutes} menit` : "Belum ada data"}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="label" 
                tick={{ fill: "#9CA3AF", fontSize: 11 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fill: "#9CA3AF", fontSize: 11 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                contentStyle={{ 
                  background: "#FFFFFF", 
                  border: "1px solid #E5E7EB", 
                  borderRadius: "6px", 
                  color: "#111827", 
                  fontSize: "12px" 
                }}
                formatter={(value: number) => [`${value || 0} menit`, "Belajar"]}
                cursor={{ stroke: "#93C5FD" }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#2563EB" 
                strokeWidth={2} 
                dot={{ fill: "#2563EB", r: 4 }} 
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          {!hasData && (
            <div className="text-center text-sm text-gray-400 mt-2">
              Belum ada data belajar minggu ini
            </div>
          )}
        </div>

        {/* Info Tambahan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="border border-gray-200 p-4 rounded bg-white">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-gray-400" />
              <h4 className="text-sm font-medium text-gray-900">Total Belajar</h4>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{totalHours || 0}h</span>
              <span className="text-sm text-gray-400">{totalSessions || 0} sesi</span>
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded" 
                style={{ width: `${Math.min(((totalSessions || 0) / 10) * 100, 100)}%` }} 
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Progress menuju 10 sesi</p>
          </div>

          <div className="border border-gray-200 p-4 rounded bg-white">
            <div className="flex items-center gap-2 mb-2">
              <Award size={16} className="text-gray-400" />
              <h4 className="text-sm font-medium text-gray-900">Pencapaian</h4>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">{streak || 0}</span>
              <span className="text-sm text-gray-400">hari berturut-turut</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i <= ((streak || 0) % 7) 
                      ? "bg-blue-100 text-blue-600 border border-blue-200" 
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Streak 5 hari = 🏆</p>
          </div>
        </div>

      </div>
    </div>
  );
}