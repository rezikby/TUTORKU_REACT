import React from "react";
import { ChevronLeft, Calendar, Clock, BookOpen, User, Award } from "lucide-react";

type Page = "landing" | "cari-tutor" | "detail-tutor" | "booking" | "live-class" | "chat" | "dashboard-siswa" | "forum" | "about" | "progress" | "settings" | "login" | "register" | "video" | "upload-video" | "admin" | "login-google-otp" | "tutor-registration" | "booking-saya" | "riwayat-belajar" | "favorit" | "notifikasi" | "platform-admin" | "tutor-login" | "admin-login";

export default function RiwayatBelajarPage(props: any) {
  const { history = [], navigate } = props;

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-50 text-green-600 border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-600 border-red-200";
      case "pending":
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
      case "pending":
        return "Menunggu";
      default:
        return status || "Selesai";
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Calculate total stats
  const totalSessions = history.length;
  const totalMinutes = history.reduce((acc: number, h: any) => acc + (h.duration || 0), 0);
  const totalHours = Math.round(totalMinutes / 60);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Back */}
        <button
          onClick={() => navigate?.("dashboard-siswa")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> Kembali
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Riwayat Belajar</h1>
          <p className="text-sm text-gray-400 mt-0.5">Riwayat sesi belajar kamu</p>
        </div>

        {/* Stats */}
        {totalSessions > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="border border-gray-200 p-3 text-center rounded">
              <div className="text-xl font-extrabold text-gray-900">{totalSessions}</div>
              <div className="text-xs text-gray-400">Sesi</div>
            </div>
            <div className="border border-gray-200 p-3 text-center rounded">
              <div className="text-xl font-extrabold text-gray-900">{totalHours}</div>
              <div className="text-xs text-gray-400">Jam</div>
            </div>
            <div className="border border-gray-200 p-3 text-center rounded">
              <div className="text-xl font-extrabold text-gray-900">{totalMinutes}</div>
              <div className="text-xs text-gray-400">Menit</div>
            </div>
          </div>
        )}

        {/* List */}
        {history.length === 0 ? (
          <div className="border border-gray-200 p-8 text-center rounded">
            <BookOpen size={32} className="text-gray-300 mx-auto mb-3" />
            <div className="text-sm text-gray-400">Belum ada riwayat belajar</div>
            <button
              onClick={() => navigate?.("cari-tutor")}
              className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors rounded"
            >
              Cari Tutor
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((h: any) => (
              <div
                key={h.id}
                className="border border-gray-200 p-4 hover:border-gray-300 transition-colors rounded"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Subject & Tutor */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {h.subject?.name || h.subject || "Mata Pelajaran"}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-sm text-gray-600">{h.tutor?.name || "Tutor"}</span>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(h.date) || h.date || "-"}
                      </span>
                      {h.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {h.start_time}
                          {h.end_time && ` - ${h.end_time}`}
                        </span>
                      )}
                      {h.duration && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {h.duration} menit
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    {h.status && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium border mt-1.5 ${getStatusColor(
                          h.status
                        )}`}
                      >
                        {getStatusLabel(h.status)}
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  {h.tutor?.id && (
                    <button
                      onClick={() => navigate?.("detail-tutor", { tutorId: h.tutor.id })}
                      className="shrink-0 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors rounded"
                    >
                      Lihat Tutor
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {history.length > 0 && (
          <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
            {history.length} sesi belajar
          </div>
        )}

      </div>
    </div>
  );
}