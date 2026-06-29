import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "../components/ui";
import { Calendar, Clock, MapPin, ChevronRight, X, Video, CheckCircle, Clock as ClockIcon, AlertCircle, ChevronDown, Trash2, Check } from "lucide-react";
import { alertError, confirmAction } from "../lib/swal";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "rejected";

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_ICONS: Record<BookingStatus, React.ReactNode> = {
  pending: <ClockIcon size={14} className="text-yellow-600" />,
  confirmed: <CheckCircle size={14} className="text-blue-600" />,
  completed: <CheckCircle size={14} className="text-green-600" />,
  cancelled: <X size={14} className="text-red-600" />,
  rejected: <AlertCircle size={14} className="text-red-600" />,
};

const API_ROOT = (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/?$/, "") ?? "http://localhost:8000";

export default function BookingSayaPage(props: any) {
  const { apiFetch, navigate, onSelectBooking } = props;
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "en" ? "en-US" : "id-ID";

  const getStatusLabel = (status: BookingStatus) =>
    t(`booking.status.${status}`);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");
  const [showFilter, setShowFilter] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/bookings');
      setBookings(data.data ?? data ?? []);
    } catch (error) {
      console.error(t('booking.loadFailed'), error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelBooking = async (id: number) => {
    if (!(await confirmAction(t("booking.cancelConfirm"), t("booking.cancelWarning")))) return;
    try {
      await apiFetch(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({}) });
      setBookings((prev) => prev.filter((b) => b.id !== id));
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    } catch (error: any) {
      console.error(t('booking.cancelFailed'), error);
      const msg = error?.message || (error?.toString && error.toString()) || t("booking.cancelFailed");
      alertError(t("booking.cancelFailed"), msg);
    }
  };

  const hideBooking = async (id: number) => {
    if (!(await confirmAction(t("booking.hideConfirm"), t("booking.hideWarning")))) return;
    setDeletingIds((prev) => [...prev, id]);
    try {
      await apiFetch(`/bookings/${id}`, { method: 'DELETE' });
      setBookings((prev) => prev.filter((b) => b.id !== id));
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    } catch (error) {
      console.error(t("booking.removeFailed"), error);
    } finally {
      setDeletingIds((prev) => prev.filter((pid) => pid !== id));
    }
  };

  const bulkHideBookings = async () => {
    if (selectedIds.length === 0) return;
    if (!(await confirmAction(t("booking.bulkHideConfirm", { count: selectedIds.length }), t("booking.bulkHideWarning")))) return;
    
    setDeletingIds(selectedIds);
    try {
      await apiFetch('/bookings/bulk-destroy', {
        method: 'POST',
        body: JSON.stringify({ booking_ids: selectedIds }),
      });
      setBookings((prev) => prev.filter((b) => !selectedIds.includes(b.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error(t("booking.removeFailed"), error);
    } finally {
      setDeletingIds([]);
    }
  };

  const toggleSelectBooking = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const selectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredBookings.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const getStatus = (b: any): BookingStatus => {
    const bookingStatus = (b.status?.toLowerCase() as BookingStatus) || "pending";

    if (bookingStatus === "pending") {
      const paymentStatus = b.payment?.status?.toLowerCase();
      if (paymentStatus === "success" || paymentStatus === "paid") {
        return "confirmed";
      }
    }

    return bookingStatus;
  };

  const getPhotoUrl = (tutor: any) => {
    if (!tutor?.photo) return null;
    return tutor.photo.startsWith("http") ? tutor.photo : `${API_ROOT}/storage/${tutor.photo}`;
  };

  const filteredBookings = bookings.filter((b) => {
    const status = getStatus(b);
    if (filter === "all") return true;
    if (filter === "upcoming") return status === "pending" || status === "confirmed";
    if (filter === "completed") return status === "completed";
    if (filter === "cancelled") return status === "cancelled" || status === "rejected";
    return true;
  });

  const canCancel = (b: any) => {
    const status = getStatus(b);
    if (!(status === "pending" || status === "confirmed")) return false;
    if (!b.created_at) return false;
    const created = new Date(b.created_at);
    const minutes = (Date.now() - created.getTime()) / 60000;
    return minutes <= 5;
  };

  const canJoinSession = (b: any) => {
    const status = getStatus(b);
    return status === "confirmed" && b.live_session?.status === "ongoing";
  };

  const canWaitForTutor = (b: any) => {
    const status = getStatus(b);
    return status === "confirmed" && b.live_session?.status !== "ongoing";
  };

  const openLiveClass = (bookingId: number | string) => {
    window.location.hash = `#/live-class?booking_id=${bookingId}`;
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString(dateLocale, { 
      day: "numeric", 
      month: "short", 
      year: "numeric" 
    });
  };

  const filterLabels = {
    all: t("booking.filter.all"),
    upcoming: t("booking.filter.upcoming"),
    completed: t("booking.filter.completed"),
    cancelled: t("booking.filter.cancelled"),
  };

  const filterTabs = [
    { key: "all", label: filterLabels.all },
    { key: "upcoming", label: filterLabels.upcoming },
    { key: "completed", label: filterLabels.completed },
    { key: "cancelled", label: filterLabels.cancelled },
  ];

  return (
    <div className="min-h-screen bg-white pt-14 xs:pt-16">
      <div className="max-w-4xl mx-auto px-2 xs:px-3 sm:px-4 lg:px-6 py-4 xs:py-6 pb-32">
        {/* Header */}
        <div className="mb-4 xs:mb-6">
          <h1 className="text-lg xs:text-2xl font-extrabold text-gray-900">{t("booking.title")}</h1>
          <p className="text-xs xs:text-sm text-gray-400 mt-0.5">{t("booking.description")}</p>
        </div>

        {/* Mobile Filter Dropdown */}
        <div className="sm:hidden mb-4">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs bg-white border border-gray-200"
          >
            <span className="font-medium text-gray-700">{filterLabels[filter]}</span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform shrink-0 ${showFilter ? 'rotate-180' : ''}`} />
          </button>
          {showFilter && (
            <div className="border border-gray-200 border-t-0 bg-white">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setFilter(tab.key as any);
                    setShowFilter(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    filter === tab.key
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                  {tab.key === "all" && bookings.length > 0 && (
                    <span className="ml-2 text-[10px] text-gray-400">({bookings.length})</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Filter Tabs */}
        <div className="hidden sm:flex gap-0.5 xs:gap-1 mb-4 xs:mb-6 border-b border-gray-100 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-2 xs:px-4 py-2 xs:py-2.5 text-xs xs:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                filter === tab.key
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              {tab.key === "all" && bookings.length > 0 && (
                <span className="ml-1 xs:ml-1.5 px-1 xs:px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] xs:text-[10px] font-semibold inline-block rounded">
                  {bookings.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="bg-white border border-gray-200 p-4 xs:p-6 text-center text-xs xs:text-sm text-gray-400">
            <div className="space-y-3">
              <Skeleton className="h-3 xs:h-4 w-1/3 mx-auto" />
              <Skeleton className="h-5 xs:h-6 w-full" />
              <Skeleton className="h-5 xs:h-6 w-full" />
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white border border-gray-200 p-6 xs:p-8 text-center">
            <div className="text-gray-400 text-xs xs:text-sm">
              {filter === "all" ? t("booking.noBookingsAll") : t("booking.noBookingsCategory")}
            </div>
            {filter === "all" && (
              <button
                onClick={() => navigate("cari-tutor")}
                className="mt-4 px-4 xs:px-5 py-1.5 xs:py-2 bg-[#2563EB] text-white text-xs xs:text-sm font-medium hover:bg-[#1D4ED8] transition-colors"
              >
                {t("navbar.findTutor")}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
              <div className="mb-4 p-2 xs:p-3 bg-blue-50 border border-blue-200 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 xs:gap-3">
                <div className="flex items-center gap-2 xs:gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredBookings.length}
                    onChange={(e) => selectAll(e.target.checked)}
                    className="w-4 xs:w-5 h-4 xs:h-5 border-2 border-gray-300 rounded cursor-pointer accent-[#2563EB]"
                  />
                  <span className="text-xs xs:text-sm font-medium text-gray-700">
                    {t("booking.selectedCount", { count: selectedIds.length })}
                  </span>
                </div>
                <button
                  onClick={bulkHideBookings}
                  disabled={deletingIds.length > 0}
                  className="w-full xs:w-auto px-3 xs:px-4 py-1.5 text-xs xs:text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center justify-center xs:justify-start gap-1.5 xs:gap-2"
                >
                  <Trash2 size={14} className="xs:w-4 xs:h-4" />
                  <span className="hidden xs:inline">{t("common.deleteAll")}</span>
                  <span className="xs:hidden">{t("common.delete")}</span>
                </button>
              </div>
            )}

            <div className="space-y-3">
              {filteredBookings.map((b: any) => {
                const status = getStatus(b);
                const photoUrl = getPhotoUrl(b.tutor);
                const isPending = status === "pending";
                const isSelected = selectedIds.includes(b.id);
                const isDeleting = deletingIds.includes(b.id);
                
                return (
                  <div
                    key={b.id}
                    className={`border ${isPending ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-200 bg-white'} ${
                      isSelected ? 'ring-2 ring-[#2563EB]' : ''
                    } p-4 transition-all`}
                  >
                    {/* Top row: Avatar + Info + Status + Checkbox */}
                    <div className="flex items-start gap-2 xs:gap-3">
                      {/* Avatar */}
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={b.tutor?.name}
                          className="w-10 xs:w-12 h-10 xs:h-12 object-cover bg-gray-100 shrink-0 rounded"
                        />
                      ) : (
                        <div className="w-10 xs:w-12 h-10 xs:h-12 bg-[#2563EB] text-white flex items-center justify-center text-base xs:text-lg font-bold shrink-0 rounded">
                          {b.tutor?.name?.charAt(0)?.toUpperCase() || t("booking.tutorInitial")}
                        </div>
                      )}
                      
                      {/* Info - flex-1 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          {/* Nama & Subject */}
                          <div className="min-w-0">
                            <div className="text-xs xs:text-sm font-semibold text-gray-900 truncate">
                              {b.tutor?.name || t("booking.tutor")}
                            </div>
                            <div className="text-[11px] xs:text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {b.subject?.name || t("booking.unknownSubject")} · {b.tutor?.city || t("booking.cityUnknown")}
                            </div>
                          </div>
                          
                          {/* Status + Checkbox */}
                          <div className="flex items-center gap-2 xs:gap-3 flex-shrink-0">
                            <span
                              className={`inline-flex items-center gap-0.5 xs:gap-1 px-1.5 xs:px-2 py-0.5 text-[9px] xs:text-[10px] font-medium border rounded shrink-0 ${STATUS_COLORS[status]}`}
                            >
                              {STATUS_ICONS[status]}
                              <span className="hidden xs:inline">{getStatusLabel(status)}</span>
                            </span>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectBooking(b.id)}
                              className="w-5 h-5 border-2 border-gray-300 rounded-md cursor-pointer accent-[#2563EB] hover:border-[#2563EB] transition-colors focus:ring-2 focus:ring-[#2563EB]/20 focus:outline-none"
                            />
                          </div>
                        </div>
                        
                        {/* Date & Time */}
                        <div className="flex flex-wrap items-center gap-2 xs:gap-3 mt-1.5 text-[10px] xs:text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{formatDate(b.date) || b.date}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} className="text-gray-400" />
                            <span>{b.start_time} {b.end_time ? `- ${b.end_time}` : ""}</span>
                          </span>
                          {b.mode && (
                            <span className="flex items-center gap-1">
                              {b.mode === "online" ? <Video size={14} className="text-gray-400" /> : <MapPin size={14} className="text-gray-400" />}
                              <span>{b.mode === "online" ? t("booking.mode.online") : t("booking.mode.offline")}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => (onSelectBooking ? onSelectBooking(b.id) : navigate("booking-detail"))}
                        className="px-2 xs:px-4 py-1.5 text-xs font-medium text-[#2563EB] border border-[#2563EB]/30 hover:bg-[#2563EB]/5 transition-colors"
                      >
                        {t("booking.detail")}
                      </button>
                      {canJoinSession(b) ? (
                        <button
                          onClick={() => openLiveClass(b.id)}
                          className="px-2 xs:px-4 py-1.5 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors"
                        >
                          {t("booking.join")}
                        </button>
                      ) : canWaitForTutor(b) ? (
                        <button
                          disabled
                          className="px-2 xs:px-4 py-1.5 text-xs font-medium text-white bg-gray-400 cursor-not-allowed transition-colors"
                        >
                          {t("booking.waiting")}
                        </button>
                      ) : getStatus(b) === "completed" ? (
                        <button
                          onClick={() => openLiveClass(b.id)}
                          className="px-2 xs:px-4 py-1.5 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors"
                        >
                          {t("booking.view")}
                        </button>
                      ) : null}
                      {b.mode === "offline" && b.tutor?.google_maps_url && (
                        <a
                          href={b.tutor.google_maps_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 xs:px-4 py-1.5 text-xs font-medium text-[#2563EB] border border-[#2563EB]/30 hover:bg-[#2563EB]/5 transition-colors inline-flex items-center justify-center gap-1"
                        >
                          <MapPin size={12} className="xs:w-3 xs:h-3" />
                          <span className="hidden xs:inline">{t("booking.goMap")}</span>
                        </a>
                      )}
                      {canCancel(b) && (
                        <button
                          onClick={() => cancelBooking(b.id)}
                          className="px-2 xs:px-4 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                        >
                          {t("booking.cancel")}
                        </button>
                      )}
                      <button
                        onClick={() => hideBooking(b.id)}
                        disabled={isDeleting}
                        className="px-2 xs:px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                        title={t("booking.hideTooltip")}
                      >
                        {isDeleting ? (
                          <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></span>
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}