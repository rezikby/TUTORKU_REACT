/**
 * FILE: frontend/src/app/admin/platform/PlatformBookings.tsx
 * STATUS: BARU
 */

import React, { useEffect, useState } from "react";
import { 
  ChevronDown, 
  X, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar, 
  CreditCard 
} from "lucide-react";
import { adminApiFetch } from "../adminApi";
import { alertError } from "../../lib/swal";

type BookingItem = {
  id: number;
  code: string;
  student: { name: string };
  tutor: { name: string };
  date: string;
  start_time: string;
  end_time?: string;
  status: string;
  total_price: number;
  created_at?: string;
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const statusIcon: Record<string, React.ReactNode> = {
  pending: <Clock size={12} className="text-yellow-600" />,
  confirmed: <CheckCircle size={12} className="text-blue-600" />,
  completed: <CheckCircle size={12} className="text-green-600" />,
  cancelled: <X size={12} className="text-red-600" />,
  rejected: <AlertCircle size={12} className="text-red-600" />,
};

const statusLabel: Record<string, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
};

const statusOptions = [
  { value: "", label: "Semua Status" },
  { value: "pending", label: "Menunggu" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

export default function PlatformBookings() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = status ? `?status=${status}` : "";
      const data = await adminApiFetch(`/admin/bookings${params}`);
      setBookings(data.data ?? data);
    } catch (e) {
      console.error("Gagal memuat booking", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const cancelBooking = async (id: number) => {
    if (!reason.trim()) {
      alertError("Alasan pembatalan wajib diisi.");
      return;
    }
    try {
      await adminApiFetch(`/admin/bookings/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setCancelingId(null);
      setReason("");
      load();
    } catch (e: any) {
      alertError(e.message || "Gagal membatalkan booking.");
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", { 
      day: "numeric", 
      month: "short", 
      year: "numeric" 
    });
  };

  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

  const statsData = [
    { label: "Total", value: totalBookings, color: "text-blue-600", bg: "bg-blue-50" },
    { 
      label: "Menunggu", 
      value: bookings.filter(b => b.status === "pending").length, 
      color: "text-yellow-600", 
      bg: "bg-yellow-50" 
    },
    { 
      label: "Dikonfirmasi", 
      value: bookings.filter(b => b.status === "confirmed").length, 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
    { 
      label: "Selesai", 
      value: bookings.filter(b => b.status === "completed").length, 
      color: "text-green-600", 
      bg: "bg-green-50" 
    },
  ];

  const getStatusLabel = (statusKey: string) => {
    return statusLabel[statusKey] || statusKey;
  };

  const getStatusColor = (statusKey: string) => {
    return statusColor[statusKey] || "bg-gray-50 text-gray-600 border-gray-200";
  };

  const getStatusIcon = (statusKey: string) => {
    return statusIcon[statusKey] || null;
  };

  const isCancellable = (statusKey: string) => {
    return statusKey !== "cancelled" && 
           statusKey !== "completed" && 
           statusKey !== "rejected";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Data Booking</h2>
          <p className="text-sm text-gray-400 mt-0.5">Kelola semua booking yang terjadi</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{totalBookings}</span> booking
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">
              Rp {totalRevenue.toLocaleString("id-ID")}
            </span> total
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statsData.map((stat) => (
          <div key={stat.label} className={`${stat.bg} border border-gray-200 p-3 rounded`}>
            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="relative">
        <button
          onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-300 transition-colors rounded"
        >
          {status ? statusOptions.find(s => s.value === status)?.label : "Semua Status"}
          <ChevronDown 
            size={14} 
            className={`transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} 
          />
        </button>
        
        {showStatusDropdown && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 shadow-sm z-10 rounded">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setStatus(opt.value);
                  setShowStatusDropdown(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  status === opt.value ? "bg-blue-50 text-blue-600" : "text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="border border-gray-200 p-8 text-center text-sm text-gray-400 rounded">
          Memuat booking...
        </div>
      ) : bookings.length === 0 ? (
        <div className="border border-gray-200 p-8 text-center text-sm text-gray-400 rounded">
          Tidak ada booking
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div 
              key={b.id} 
              className="border border-gray-200 p-4 hover:border-gray-300 transition-colors rounded"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{b.code}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-sm text-gray-700">{b.student?.name}</span>
                    <span className="text-xs text-gray-400">→</span>
                    <span className="text-sm text-gray-700">{b.tutor?.name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(b.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {b.start_time} {b.end_time && `- ${b.end_time}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard size={12} />
                      Rp {b.total_price?.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium border ${getStatusColor(b.status)}`}>
                    {getStatusIcon(b.status)}
                    {getStatusLabel(b.status)}
                  </span>
                  
                  {isCancellable(b.status) && (
                    <button
                      onClick={() => {
                        setCancelingId(cancelingId === b.id ? null : b.id);
                        setReason("");
                      }}
                      className="px-3 py-1 bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors border border-red-200 rounded"
                    >
                      Batalkan
                    </button>
                  )}
                </div>
              </div>

              {/* Cancel Form */}
              {cancelingId === b.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Alasan pembatalan..."
                    className="flex-1 px-3 py-2 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 transition-colors rounded"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => cancelBooking(b.id)}
                      className="px-4 py-2 bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors rounded"
                    >
                      Konfirmasi Batal
                    </button>
                    <button
                      onClick={() => {
                        setCancelingId(null);
                        setReason("");
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors rounded"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {bookings.length > 0 && (
        <div className="text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
          {bookings.length} booking · Total Rp {totalRevenue.toLocaleString("id-ID")}
        </div>
      )}
    </div>
  );
}