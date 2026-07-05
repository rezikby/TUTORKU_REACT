// frontend/src/app/mahasiswa/BookingDetailPage.tsx
//
// Halaman Detail Booking. Sebelumnya tombol "Detail" di BookingSayaPage.tsx
// mengarah ke page yang belum pernah dibuat ("booking/{id}"), sehingga
// langsung tidak menampilkan apa-apa (terlihat seperti "langsung hilang").
// Halaman ini dirender lewat page statis "booking-detail", dengan id booking
// yang dipilih disimpan di state `selectedBookingId` (lihat App.tsx).

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Calendar, Clock, MapPin, Video, Wallet, Copy } from "lucide-react";

type Page =
  | "landing" | "cari-tutor" | "detail-tutor" | "booking" | "live-class" | "chat"
  | "dashboard-siswa" | "forum" | "about" | "progress" | "settings" | "login"
  | "register" | "video" | "upload-video" | "admin" | "login-google-otp"
  | "tutor-registration" | "booking-saya" | "riwayat-belajar" | "favorit"
  | "notifikasi" | "platform-admin" | "tutor-login" | "admin-login" | "booking-detail";

const STATUS_LABEL_KEY: Record<string, string> = {
  pending: "bookingDetail.statusLabel.pending",
  confirmed: "bookingDetail.statusLabel.confirmed",
  completed: "bookingDetail.statusLabel.completed",
  cancelled: "bookingDetail.statusLabel.cancelled",
  rejected: "bookingDetail.statusLabel.rejected",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const PAYMENT_STATUS_LABEL_KEY: Record<string, string> = {
  pending: "bookingDetail.paymentStatus.pending",
  paid: "bookingDetail.paymentStatus.paid",
  waiting_payment: "bookingDetail.paymentStatus.waiting_payment",
  success: "bookingDetail.paymentStatus.success",
  failed: "bookingDetail.paymentStatus.failed",
  expired: "bookingDetail.paymentStatus.expired",
  cancelled: "bookingDetail.paymentStatus.cancelled",
};

// FIX 1: locale sekarang dinamis, mengikuti bahasa yang dipilih user
function formatDateLabel(iso?: string | null, locale = "id-ID") {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const getBookingStatus = (booking: any): string => {
  const status = (booking.status ?? "pending").toLowerCase();

  if (status === "pending") {
    const paymentStatus = booking.payment?.status?.toLowerCase();
    if (paymentStatus === "success" || paymentStatus === "paid") {
      return "confirmed";
    }
  }

  return status;
};

export default function BookingDetailPage({
  bookingId,
  apiFetch,
  navigate,
}: {
  bookingId: number | string | null;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  navigate: (p: Page) => void;
}) {
  // FIX 2: ambil i18n untuk mendapatkan bahasa aktif (language)
  const { t, i18n } = useTranslation();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentChecked, setPaymentChecked] = useState(false);

  // Mapping bahasa i18next ke locale BCP 47 untuk toLocaleDateString
  const dateLocale = i18n.language === "en" ? "en-US" : "id-ID";

  useEffect(() => {
    if (!bookingId) return;

    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch(`/bookings/${bookingId}`);
        if (active) setBooking(data.data ?? data);
      } catch (err: any) {
        if (active) setError(err?.message ?? t("bookingDetail.loadFailed"));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [bookingId]);

  // Determine which subject_id (if any) this booking corresponds to from tutor availabilities
  const matchedAvailabilitySubjectId = (() => {
    if (!booking) return null;
    const availabilities = booking.tutor?.availabilities ?? [];
    if (!Array.isArray(availabilities) || availabilities.length === 0) return null;

    try {
      const bookingDate = booking.date ? new Date(booking.date) : null;
      const bookingStart = booking.start_time ? booking.start_time.slice(0,5) : null;
      const bookingSubjectId = booking.subject?.id ?? null;

      for (const av of availabilities) {
        // av.subject may be null, but availability created by tutor should include subject
        const avSubjectId = av.subject?.id ?? null;

        // If both availability and booking have subjects and they differ, skip
        if (avSubjectId && bookingSubjectId && avSubjectId !== bookingSubjectId) continue;

        if (av.date) {
          if (!bookingDate) continue;
          const avDate = new Date(av.date);
          if (avDate.toDateString() !== bookingDate.toDateString()) continue;
        } else if (bookingDate) {
          const dayOfWeek = bookingDate.getDay();
          if (av.day_of_week !== dayOfWeek) continue;
        }

        // Compare times: bookingStart should be within av.start_time <= bookingStart < av.end_time
        const toMinutes = (t: string) => {
          const [h, m] = t.split(":").map(Number);
          return h * 60 + m;
        };

        const bStart = bookingStart ? toMinutes(bookingStart) : null;
        const aStart = av.start_time ? toMinutes(av.start_time.slice(0,5)) : null;
        const aEnd = av.end_time ? toMinutes(av.end_time.slice(0,5)) : null;
        if (bStart !== null && aStart !== null && aEnd !== null) {
          if (bStart >= aStart && bStart < aEnd) {
            return avSubjectId ?? bookingSubjectId ?? null;
          }
        }
      }
    } catch (e) {
      return null;
    }

    return null;
  })();

  useEffect(() => {
    if (!booking || paymentChecked) return;

    const paymentId = booking.payment?.id;
    const paymentStatus = booking.payment?.status?.toLowerCase();
    const paymentMethod = booking.payment?.method?.toLowerCase();
    const pendingStatuses = ["pending", "waiting_payment", "processing"];

    if (!paymentId || !pendingStatuses.includes(paymentStatus) || paymentMethod === "cod") {
      setPaymentChecked(true);
      return;
    }

    let active = true;
    const syncPayment = async () => {
      try {
        await apiFetch(`/payments/${paymentId}/check-status`, {
          method: "POST",
        });
        if (!active) return;

        const refreshed = await apiFetch(`/bookings/${bookingId}`);
        if (active) setBooking(refreshed.data ?? refreshed);
      } catch (err) {
        console.warn("Gagal menyinkronkan status pembayaran:", err);
      } finally {
        if (active) setPaymentChecked(true);
      }
    };

    syncPayment();

    return () => {
      active = false;
    };
  }, [booking, bookingId, paymentChecked, apiFetch]);

  const copyCode = async (code?: string) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard API tidak tersedia — abaikan secara senyap, bukan fitur inti.
    }
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t("bookingDetail.notFoundTitle")}</h2>
          <p className="text-gray-500 mb-6 text-sm">{t("bookingDetail.notFoundMessage")}</p>
          <button onClick={() => navigate("booking-saya")} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded">
            {t("bookingDetail.backToBooking")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 xs:pt-16 pb-32">
        <button
          onClick={() => navigate("booking-saya")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors"
        >
          <ChevronLeft size={16} /> {t("bookingDetail.backToBooking")}
        </button>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 p-6 text-gray-500 text-sm">{t("bookingDetail.loading")}</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600 text-sm">{error}</div>
        ) : !booking ? (
          <div className="rounded-2xl border border-gray-200 p-6 text-gray-500 text-sm">{t("bookingDetail.notFoundMessage")}</div>
        ) : (
          <div className="space-y-4">
            {/* Header: tutor + status */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {booking.tutor?.photo ? (
                  <img src={booking.tutor.photo} alt={booking.tutor?.name} className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 bg-blue-600 text-white flex items-center justify-center rounded-xl font-bold text-xl">
                    {booking.tutor?.name?.charAt(0) ?? "?"}
                  </div>
                )}
                <div>
                  <div className="text-base font-bold text-gray-900">{booking.tutor?.name ?? t("bookingDetail.tutorFallback")}</div>
                  <div className="text-sm text-gray-500">
                    {matchedAvailabilitySubjectId && booking.subject?.id === matchedAvailabilitySubjectId ? (
                      <strong>{booking.subject?.name ?? t("common.unknown")}</strong>
                    ) : (
                      booking.subject?.name ?? t("common.unknown")
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                    {t("bookingDetail.bookingCodeLabel")} {booking.code}
                    <button onClick={() => copyCode(booking.code)} className="text-gray-400 hover:text-gray-700" aria-label={t("bookingDetail.copyBookingCode")}
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap ${
                  STATUS_STYLE[getBookingStatus(booking)] ?? "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {t(STATUS_LABEL_KEY[getBookingStatus(booking)] ?? "bookingDetail.statusLabel.unknown")}
              </span>
            </div>

            {/* Jadwal */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">{t("bookingDetail.scheduleTitle")}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar size={16} className="text-gray-400" />
                  {/* FIX: dateLocale dinamis, bukan hardcode "id-ID" */}
                  {formatDateLabel(booking.date, dateLocale)}
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock size={16} className="text-gray-400" />
                  {booking.start_time ?? "-"} · {booking.duration_minutes ?? "-"} {t("bookingDetail.minutes")}
                </div>
                <div className="flex items-center gap-3 text-gray-700 capitalize">
                  {booking.mode === "online" ? <Video size={16} className="text-gray-400" /> : <MapPin size={16} className="text-gray-400" />}
                  {booking.mode ? t(`bookingDetail.mode.${booking.mode}`) : "-"}
                </div>
                {booking.mode === "offline" && (
                  <div className="pl-7 text-xs text-gray-500 space-y-2">
                    <div className="font-semibold text-gray-900">{t("bookingDetail.tutorLocation")}</div>
                    <div>
                      {booking.tutor?.location || booking.tutor?.city || booking.tutor?.province
                        ? [booking.tutor?.location, booking.tutor?.city, booking.tutor?.province]
                            .filter(Boolean)
                            .join(", ")
                        : booking.location_address
                        ? [booking.location_address, booking.location_city, booking.location_province]
                            .filter(Boolean)
                            .join(", ")
                        : "-"}
                    </div>
                    {(booking.tutor?.latitude || booking.location_latitude) && (booking.tutor?.longitude || booking.location_longitude) ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {t("bookingDetail.coordinates", {
                            lat: booking.tutor?.latitude ?? booking.location_latitude,
                            lng: booking.tutor?.longitude ?? booking.location_longitude,
                          })}
                        </span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            booking.tutor?.latitude && booking.tutor?.longitude
                              ? `${booking.tutor.latitude},${booking.tutor.longitude}`
                              : booking.location_latitude && booking.location_longitude
                              ? `${booking.location_latitude},${booking.location_longitude}`
                              : booking.tutor?.location || booking.location_address || ""
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          {t("bookingDetail.openNavigation")}
                        </a>
                      </div>
                    ) : null}
                    {(function() {
                      const gm = booking.tutor?.google_maps_url ?? null;
                      if (!gm) return null;
                      try {
                        const atMatch = gm.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                        const dMatch = gm.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
                        const coords = atMatch ? { lat: atMatch[1], lng: atMatch[2] } : dMatch ? { lat: dMatch[1], lng: dMatch[2] } : null;
                        if (!coords) return null;
                        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${coords.lat},${coords.lng}`)}`;
                        return (
                          <div>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-blue-600 hover:underline text-xs font-medium"
                            >
                              <MapPin size={14} /> {t("bookingDetail.openGoMap")}
                            </a>
                          </div>
                        );
                      } catch (e) {
                        return null;
                      }
                    })()}
                    {booking.location_note && (
                      <div className="text-xs text-gray-500">{t("bookingDetail.landmark", { note: booking.location_note })}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Pembayaran */}
            {booking.payment && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4">{t("bookingDetail.paymentTitle")}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t("bookingDetail.invoice")}</span>
                    <span className="font-medium text-gray-900">{booking.payment.invoice_number ?? "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t("bookingDetail.method")}</span>
                    <span className="font-medium text-gray-900 uppercase">{booking.payment.method ?? "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t("bookingDetail.status")}</span>
                    <span className="font-medium text-gray-900">
                      {t(PAYMENT_STATUS_LABEL_KEY[booking.payment.status ?? ""] ?? "bookingDetail.paymentStatus.unknown")}
                    </span>
                  </div>
                  {booking.payment.payment_url && booking.payment.status === "pending" && (
                    <a
                      href={booking.payment.payment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline"
                    >
                      <Wallet size={14} /> {t("bookingDetail.continuePayment")}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Ringkasan biaya */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">{t("bookingDetail.costSummaryTitle")}</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("bookingDetail.sessionFee")}</span>
                  <span className="text-gray-900">Rp {Number(booking.price ?? 0).toLocaleString(dateLocale)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("bookingDetail.serviceFee")}</span>
                  <span className="text-gray-900">Rp {Number(booking.service_fee ?? 0).toLocaleString(dateLocale)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                  <span className="font-bold text-gray-900">{t("bookingDetail.total")}</span>
                  <span className="font-bold text-blue-600">Rp {Number(booking.total_price ?? 0).toLocaleString(dateLocale)}</span>
                </div>
              </div>
            </div>

            {booking.notes && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-2">{t("bookingDetail.notesTitle")}</h3>
                <p className="text-sm text-gray-600">{booking.notes}</p>
              </div>
            )}

            {booking.status === "cancelled" && booking.cancel_reason && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-red-700 mb-2">{t("bookingDetail.cancelReasonTitle")}</h3>
                <p className="text-sm text-red-600">{booking.cancel_reason}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}