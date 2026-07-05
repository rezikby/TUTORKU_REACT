// frontend/src/app/admin/components/JadwalView.tsx
import { useEffect, useState } from "react";
import { 
  Clock, Calendar, MapPin, Video, Trash2, Plus, CheckCircle, XCircle, 
  RefreshCw, Search, CalendarCheck, CheckSquare, Layers
} from "lucide-react";
import { adminApiFetch } from "../adminApi";
import { alertError } from "../../lib/swal";
import { Skeleton } from "../../components/ui";

interface BookingSchedule {
  id: number;
  code?: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  mode: "online" | "offline";
  status: string;
  student: { name: string; email?: string; phone?: string } | null;
  subject: { name?: string | null } | null;
  payment?: { id?: number; method?: string | null; status?: string | null; amount?: number | null } | null;
  created_at?: string;
}

interface AvailabilityItem {
  id: number;
  date?: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAY_LABELS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusIcon: Record<string, React.ReactNode> = {
  pending: <Clock size={12} className="text-yellow-600" />,
  confirmed: <CheckCircle size={12} className="text-blue-600" />,
  completed: <CheckCircle size={12} className="text-green-600" />,
  cancelled: <XCircle size={12} className="text-red-600" />,
};

const statusLabel: Record<string, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const modeIcon: Record<string, React.ReactNode> = {
  online: <Video size={14} className="text-blue-500" />,
  offline: <MapPin size={14} className="text-orange-500" />,
};

const modeLabel: Record<string, string> = {
  online: "Online",
  offline: "Offline",
};

export default function JadwalView() {
  const [schedules, setSchedules] = useState<BookingSchedule[]>([]);
  const [availabilities, setAvailabilities] = useState<AvailabilityItem[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [isLoadingAvailabilities, setIsLoadingAvailabilities] = useState(true);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [bookingActionId, setBookingActionId] = useState<number | null>(null);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [checkingPaymentId, setCheckingPaymentId] = useState<number | null>(null);
  const [newAvailability, setNewAvailability] = useState<{ date: string; day_of_week: number; start_time: string; end_time: string; subject_id?: number | null }>({ date: new Date().toISOString().slice(0, 10), day_of_week: new Date().getDay(), start_time: "08:00", end_time: "09:00", subject_id: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const refreshBookings = () =>
    adminApiFetch("/bookings?per_page=50")
      .then((data) => setSchedules(data.data ?? data))
      .catch((error) => console.error(error));

  useEffect(() => {
    refreshBookings().finally(() => setIsLoadingSchedules(false));
    adminApiFetch("/tutor/availabilities")
      .then((data) => setAvailabilities(data.data ?? data))
      .catch((error) => console.error(error))
      .finally(() => setIsLoadingAvailabilities(false));

    // load subjects for availability creation
    adminApiFetch("/subjects")
      .then((data) => {
        const list = data.data ?? data;
        if (Array.isArray(list)) {
          setSubjects(list.map((s: any) => ({ id: s.id, name: s.name })));
          if (list.length > 0) {
            setNewAvailability((prev) => ({ ...prev, subject_id: list[0].id }));
          }
        }
      })
      .catch(() => {})
  }, []);

  useEffect(() => {
    const hasPendingPayment = schedules.some(
      (s) => s.status === "pending" && s.payment?.status !== "paid" && s.payment?.method !== "cod"
    );
    if (!hasPendingPayment) return;
    const interval = setInterval(refreshBookings, 10000);
    return () => clearInterval(interval);
  }, [schedules]);

  const today = new Date().toISOString().split("T")[0];

  const filteredSchedules = schedules.filter((schedule) => {
    const matchStatus = filterStatus === "all" || schedule.status === filterStatus;
    const matchSearch = !searchTerm || 
      schedule.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const upcomingSchedules = filteredSchedules
    .filter(
      (schedule) =>
        ["confirmed", "pending"].includes(schedule.status) && schedule.date >= today,
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));

  const completedSchedules = filteredSchedules
    .filter((schedule) => schedule.status === "completed")
    .sort((a, b) => b.date.localeCompare(a.date) || b.start_time.localeCompare(a.start_time));

  const handleCancelSchedule = async (id: number) => {
    setCancellingId(id);
    try {
      const updated = await adminApiFetch(`/bookings/${id}/cancel`, { method: "POST" });
      setSchedules((current) =>
        current.map((schedule) =>
          schedule.id === id ? { ...schedule, status: updated.data?.status ?? updated.status } : schedule,
        ),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setCancellingId(null);
    }
  };

  const handleConfirmBooking = async (id: number) => {
    setBookingActionId(id);
    try {
      await adminApiFetch(`/bookings/${id}/confirm`, { method: "POST" });
      await refreshBookings();
    } catch (error) {
      console.error(error);
    } finally {
      setBookingActionId(null);
    }
  };

  const handleRejectBooking = async (id: number) => {
    setBookingActionId(id);
    try {
      const updated = await adminApiFetch(`/bookings/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: "Tutor rejected booking" }),
      });
      setSchedules((current) =>
        current.map((schedule) =>
          schedule.id === id ? { ...schedule, status: updated.data?.status ?? updated.status } : schedule,
        ),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setBookingActionId(null);
    }
  };

  const handleStartSession = async (id: number) => {
    setStartingId(id);
    try {
      await adminApiFetch(`/bookings/${id}/live-session`);
      await adminApiFetch(`/bookings/${id}/live-session/join`, { method: "POST" });
      window.location.hash = `#/live-class-tutor?booking_id=${id}`;
    } catch (error) {
      console.error(error);
    } finally {
      setStartingId(null);
    }
  };

  const formatDateLabel = (date?: string | null, dayOfWeek?: number) => {
    if (date) {
      const dateObj = new Date(date);
      if (!Number.isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    }

    if (dayOfWeek !== undefined) {
      return DAY_LABELS[dayOfWeek] ?? "-";
    }

    return "-";
  };

  const handleCreateAvailability = async () => {
    setSavingAvailability(true);
    try {
      const payload: Record<string, any> = {
        start_time: newAvailability.start_time,
        end_time: newAvailability.end_time,
      };

      if (newAvailability.date) {
        payload.date = newAvailability.date;
      } else {
        payload.day_of_week = newAvailability.day_of_week;
      }

      // include subject_id (required by backend)
      if (newAvailability.subject_id) {
        payload.subject_id = Number(newAvailability.subject_id);
      }

      const createdAvailability = await adminApiFetch("/tutor/availabilities", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAvailabilities((current) => [...current, createdAvailability.data ?? createdAvailability]);
      setNewAvailability({ date: new Date().toISOString().slice(0, 10), day_of_week: new Date().getDay(), start_time: "08:00", end_time: "09:00", subject_id: subjects[0]?.id ?? null });
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleDeleteAvailability = async (id: number) => {
    try {
      await adminApiFetch(`/tutor/availabilities/${id}`, { method: "DELETE" });
      setAvailabilities((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      alertError("Gagal menghapus ketersediaan.");
    }
  };

  const formatEndTime = (start: string, duration: number) => {
    const [hour, minute] = start.split(":").map(Number);
    const date = new Date();
    date.setHours(hour, minute);
    date.setMinutes(date.getMinutes() + duration);
    return date.toTimeString().slice(0, 5);
  };

  const handleCheckPaymentStatus = async (schedule: BookingSchedule) => {
    if (!schedule.payment) return;
    setCheckingPaymentId(schedule.id);
    try {
      const paymentId = (schedule.payment as { id?: number }).id;
      if (paymentId) {
        const result = await adminApiFetch(`/payments/${paymentId}/check-status`, { method: "POST" });
        const newPaymentStatus = result.data?.status ?? result.status;
        setSchedules((current) =>
          current.map((s) =>
            s.id === schedule.id
              ? { ...s, payment: { ...s.payment, status: newPaymentStatus } }
              : s,
          ),
        );
        if (newPaymentStatus === "paid") {
          const data = await adminApiFetch("/bookings?per_page=50");
          setSchedules(data.data ?? data);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingPaymentId(null);
    }
  };

  const canConfirmBooking = (schedule: BookingSchedule) => {
    const method = schedule.payment?.method;
    const paymentStatus = schedule.payment?.status;
    return method === "cod" || paymentStatus === "paid";
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const summaryCards = [
    { label: "Kelas Mendatang", value: schedules.filter(s => ["confirmed", "pending"].includes(s.status) && s.date >= today).length, icon: <CalendarCheck size={18} className="text-white" />, bg: "bg-blue-500" },
    { label: "Selesai", value: schedules.filter(s => s.status === "completed").length, icon: <CheckSquare size={18} className="text-white" />, bg: "bg-green-500" },
    { label: "Total", value: schedules.length, icon: <Layers size={18} className="text-white" />, bg: "bg-gray-500" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Jadwal Tutor</h2>
          <p className="text-sm text-gray-400">Kelola jadwal dan booking tutor</p>
        </div>
        <button
          onClick={refreshBookings}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors rounded"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {summaryCards.map((card) => (
          <div key={card.label} className={`${card.bg} px-4 py-3 rounded`}>
            <div className="flex items-center justify-between">
              <div className={`text-xl font-bold text-white`}>{card.value}</div>
              {card.icon}
            </div>
            <div className="text-xs text-white/80">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari pemesanan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 rounded"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:border-blue-400 rounded"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="confirmed">Dikonfirmasi</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Kelola Ketersediaan */}
          <div className="border border-gray-200 p-5 rounded">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Kelola Ketersediaan</h3>

            <div className="grid gap-3 sm:grid-cols-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mata Pelajaran</label>
                <select
                  value={newAvailability.subject_id ?? ""}
                  onChange={(e) => setNewAvailability((prev) => ({ ...prev, subject_id: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-400 rounded"
                >
                  {subjects.length === 0 ? <option value="">Memuat...</option> : null}
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={newAvailability.date}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    const dateObj = new Date(dateValue);
                    setNewAvailability((prev) => ({
                      ...prev,
                      date: dateValue,
                      day_of_week: Number.isNaN(dateObj.getDay()) ? prev.day_of_week : dateObj.getDay(),
                    }));
                  }}
                  className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-400 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mulai</label>
                <input
                  type="time"
                  step="600"
                  value={newAvailability.start_time}
                  onChange={(e) => setNewAvailability((prev) => ({ ...prev, start_time: e.target.value }))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-400 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Selesai</label>
                <input
                  type="time"
                  step="600"
                  value={newAvailability.end_time}
                  onChange={(e) => setNewAvailability((prev) => ({ ...prev, end_time: e.target.value }))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-400 rounded"
                />
              </div>
            </div>

            <button
              disabled={savingAvailability}
              onClick={handleCreateAvailability}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors rounded disabled:opacity-50"
            >
              <Plus size={16} />
              {savingAvailability ? "Menyimpan..." : "Tambah Ketersediaan"}
            </button>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Ketersediaan Saat Ini</h4>
              {isLoadingAvailabilities ? (
                <div className="text-sm text-gray-400">
                  <Skeleton className="h-4 w-40 mx-auto" />
                </div>
              ) : availabilities.length === 0 ? (
                <div className="border border-gray-200 p-4 text-center text-sm text-gray-400 rounded">
                  Belum ada ketersediaan
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availabilities.map((item) => (
                    <div key={item.id} className="border border-gray-200 p-2 rounded">
                      <div className="text-xs font-medium text-gray-900">
                        {item.date ? formatDateLabel(item.date) : DAY_LABELS[item.day_of_week]}
                      </div>
                      <div className="text-[10px] text-gray-500">{item.start_time} - {item.end_time}</div>
                      <button
                        onClick={() => handleDeleteAvailability(item.id)}
                        className="mt-1 text-xs text-red-500 hover:text-red-700"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Kelas Mendatang */}
          <div className="border border-gray-200 p-5 rounded">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Kelas Mendatang</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {upcomingSchedules.length}
              </span>
            </div>
            {isLoadingSchedules ? (
              <div className="text-sm text-gray-400">
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            ) : upcomingSchedules.length > 0 ? (
              <div className="space-y-3">
                {upcomingSchedules.map((schedule) => (
                  <div key={schedule.id} className="border border-gray-200 p-4 rounded">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{schedule.student?.name ?? "Siswa"}</span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-500">{schedule.subject?.name ?? "Tanpa subjek"}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-gray-400" />
                            {formatDate(schedule.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-gray-400" />
                            {schedule.start_time} - {formatEndTime(schedule.start_time, schedule.duration_minutes)}
                          </span>
                          <span className="flex items-center gap-1">
                            {modeIcon[schedule.mode]}
                            {modeLabel[schedule.mode]}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded ${statusColor[schedule.status]}`}>
                        {statusIcon[schedule.status]}
                        {statusLabel[schedule.status]}
                      </span>
                    </div>

                    <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-gray-200">
                      {schedule.status === "confirmed" ? (
                        <>
                          <button
                            disabled={startingId === schedule.id}
                            onClick={() => handleStartSession(schedule.id)}
                            className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 rounded disabled:opacity-50"
                          >
                            {startingId === schedule.id ? "Memulai..." : "Mulai Kelas"}
                          </button>
                          <button
                            disabled={cancellingId === schedule.id}
                            onClick={() => handleCancelSchedule(schedule.id)}
                            className="px-4 py-1.5 bg-red-600 text-white text-xs font-medium hover:bg-red-700 rounded disabled:opacity-50"
                          >
                            Batalkan
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            disabled={bookingActionId === schedule.id}
                            onClick={() => handleConfirmBooking(schedule.id)}
                            className="px-4 py-1.5 bg-green-600 text-white text-xs font-medium hover:bg-green-700 rounded disabled:opacity-50"
                          >
                            {bookingActionId === schedule.id ? "Menyetujui..." : "Setujui"}
                          </button>
                          <button
                            disabled={bookingActionId === schedule.id}
                            onClick={() => handleRejectBooking(schedule.id)}
                            className="px-4 py-1.5 bg-orange-600 text-white text-xs font-medium hover:bg-orange-700 rounded disabled:opacity-50"
                          >
                            {bookingActionId === schedule.id ? "Menolak..." : "Tolak"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-gray-200 p-4 text-center text-sm text-gray-400 rounded">
                Tidak ada kelas mendatang
              </div>
            )}
          </div>

          {/* Riwayat Kelas */}
          <div className="border border-gray-200 p-5 rounded">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Riwayat Kelas</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {completedSchedules.length}
              </span>
            </div>
            {isLoadingSchedules ? (
              <div className="text-sm text-gray-400">
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            ) : completedSchedules.length > 0 ? (
              <div className="space-y-2">
                {completedSchedules.slice(0, 5).map((schedule) => (
                  <div key={schedule.id} className="border border-gray-200 p-3 rounded">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{schedule.student?.name ?? "Siswa"}</span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-500">{schedule.subject?.name ?? "Tanpa subjek"}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {formatDate(schedule.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {schedule.start_time}
                          </span>
                          <span className="flex items-center gap-1">
                            {modeIcon[schedule.mode]}
                            {modeLabel[schedule.mode]}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded ${statusColor[schedule.status]}`}>
                        {statusIcon[schedule.status]}
                        {statusLabel[schedule.status]}
                      </span>
                    </div>
                  </div>
                ))}
                {completedSchedules.length > 5 && (
                  <div className="text-center text-xs text-gray-400 pt-1">
                    +{completedSchedules.length - 5} lainnya
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-gray-200 p-4 text-center text-sm text-gray-400 rounded">
                Belum ada riwayat kelas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}