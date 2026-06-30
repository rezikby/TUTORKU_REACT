import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star, MapPin, Clock, BookOpen, Wallet, Loader2, Check, Video, CreditCard, QrCode, Landmark } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toastError, toastSuccess } from "../lib/swal";
import WebsiteRatingPopup from "../mahasiswa/WebsiteRatingPopup";

const API_ROOT = (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/?$/, "") ?? "https://rezi-laravel.nlabs.id";
const defaultTutorPhoto = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format";

function CalendarPicker({ availableDates, selectedDate, onSelect }: {
  availableDates: string[];
  selectedDate: string | null;
  onSelect: (d: string) => void;
}) {
  const { t } = useTranslation();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthNames = [
    t("bookingPage.calendar.months.january"),
    t("bookingPage.calendar.months.february"),
    t("bookingPage.calendar.months.march"),
    t("bookingPage.calendar.months.april"),
    t("bookingPage.calendar.months.may"),
    t("bookingPage.calendar.months.june"),
    t("bookingPage.calendar.months.july"),
    t("bookingPage.calendar.months.august"),
    t("bookingPage.calendar.months.september"),
    t("bookingPage.calendar.months.october"),
    t("bookingPage.calendar.months.november"),
    t("bookingPage.calendar.months.december"),
  ];
  const dayShortNames = [
    t("bookingPage.calendar.dayShorts.sun"),
    t("bookingPage.calendar.dayShorts.mon"),
    t("bookingPage.calendar.dayShorts.tue"),
    t("bookingPage.calendar.dayShorts.wed"),
    t("bookingPage.calendar.dayShorts.thu"),
    t("bookingPage.calendar.dayShorts.fri"),
    t("bookingPage.calendar.dayShorts.sat"),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-bold text-gray-900 text-base">{t("bookingPage.calendar.title")}</div>
          <div className="text-sm text-gray-500">{monthNames[month]} {year}</div>
        </div>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-500 rounded">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-500 rounded">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {dayShortNames.map((d, i) => (
          <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-500" : "text-gray-400"}`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isAvail = availableDates.includes(iso);
          const isSel = selectedDate === iso;
          const isSun = idx % 7 === 0;
          const isPast = new Date(iso) < new Date(today.toDateString());
          return (
            <button
              key={iso}
              disabled={!isAvail || isPast}
              onClick={() => onSelect(iso)}
              className={`
                aspect-square flex items-center justify-center text-sm w-9 h-9 transition-colors rounded
                ${isSel ? "bg-blue-600 text-white font-bold" : ""}
                ${!isSel && isAvail && !isPast ? "hover:bg-blue-50 text-gray-900 cursor-pointer" : ""}
                ${!isAvail || isPast ? "text-gray-300 cursor-not-allowed" : ""}
                ${isSun && !isSel ? "text-red-400" : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Payment method icons - using actual logo colors and styling
const PAYMENT_ICONS: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  qris: { 
    icon: <QrCode size={22} />, 
    bg: "bg-blue-50", 
    color: "text-blue-600" 
  },
  gopay: { 
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
        <circle cx="12" cy="12" r="10" fill="#00A651" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">G</text>
      </svg>
    ), 
    bg: "bg-green-50", 
    color: "text-green-600" 
  },
  ovo: { 
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
        <circle cx="12" cy="12" r="10" fill="#5C2D91" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">OVO</text>
      </svg>
    ), 
    bg: "bg-purple-50", 
    color: "text-purple-600" 
  },
  dana: { 
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
        <circle cx="12" cy="12" r="10" fill="#0088CC" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">DANA</text>
      </svg>
    ), 
    bg: "bg-blue-50", 
    color: "text-blue-500" 
  },
  shopeepay: { 
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
        <circle cx="12" cy="12" r="10" fill="#EE4D2D" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Shopee</text>
      </svg>
    ), 
    bg: "bg-orange-50", 
    color: "text-orange-500" 
  },
  virtual_account: { 
    icon: <Landmark size={22} />, 
    bg: "bg-indigo-50", 
    color: "text-indigo-600" 
  },
  cod: { 
    icon: <Wallet size={22} />, 
    bg: "bg-gray-50", 
    color: "text-gray-600" 
  },
};

export default function BookingPage(props: any) {
  const { tutor, apiFetch, navigate } = props;
  const { t } = useTranslation();
  const [fullTutor, setFullTutor] = useState<any>(tutor);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);
  const [loadingDays, setLoadingDays] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "gopay" | "ovo" | "dana" | "shopeepay" | "virtual_account" | "cod">("qris");
  const [mode, setMode] = useState<"online" | "offline">("online");
  const [locationLat, setLocationLat] = useState("");
  const [locationLng, setLocationLng] = useState("");
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showRatingPopup, setShowRatingPopup] = useState(false);

  const paymentMethods = [
    { value: "qris", label: t("bookingPage.paymentMethods.qris") },
    { value: "gopay", label: t("bookingPage.paymentMethods.gopay") },
    { value: "ovo", label: t("bookingPage.paymentMethods.ovo") },
    { value: "dana", label: t("bookingPage.paymentMethods.dana") },
    { value: "shopeepay", label: t("bookingPage.paymentMethods.shopeepay") },
    { value: "virtual_account", label: t("bookingPage.paymentMethods.virtualAccount") },
    { value: "cod", label: t("bookingPage.paymentMethods.cod") },
  ];

  // Fetch full tutor profile with location data
  useEffect(() => {
    if (!tutor?.id) return;
    const load = async () => {
      try {
        const data = await apiFetch(`/tutors/${tutor.id}`);
        const fullTutorData = data.data ?? data;
        setFullTutor(fullTutorData);
      } catch (e) {
        console.error("Gagal memuat data tutor lengkap", e);
        setFullTutor(tutor);
      }
    };
    load();
  }, [tutor?.id]);

  useEffect(() => {
    if (!fullTutor) return;
    const load = async () => {
      setLoadingDays(true);
      try {
        const data = await apiFetch(`/tutors/${fullTutor.id}/available-slots`);
        const dates = (data.days ?? [])
          .filter((d: any) => d.has_available_slot)
          .map((d: any) => d.date);
        setAvailableDates(dates);
        if (dates.length > 0) setSelectedDate(dates[0]);
      } catch (e) {
        console.error("Gagal memuat jadwal", e);
      } finally {
        setLoadingDays(false);
      }
    };
    load();
  }, [fullTutor?.id]);

  useEffect(() => {
    if (!selectedDate || !fullTutor) return;
    const load = async () => {
      setLoadingSlots(true);
      setSelectedStartTime(null);
      setSelectedEndTime(null);
      try {
        const data = await apiFetch(`/tutors/${fullTutor.id}/available-slots?date=${selectedDate}`);
        setSlots((data.slots ?? []).map((s: any) => (typeof s === 'string' ? { time: s, available: true } : s)));
      } catch (e) {
        console.error("Gagal memuat jam", e);
      } finally {
        setLoadingSlots(false);
      }
    };
    load();
  }, [selectedDate, fullTutor?.id]);

  // Show rating popup after booking completed (untuk COD)
  useEffect(() => {
    console.log("Rating popup effect: step=", step, "bookingResult=", bookingResult);
    if (step === 3 && bookingResult?.id && !showRatingPopup) {
      console.log("Triggering rating popup");
      const timer = setTimeout(() => {
        setShowRatingPopup(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, bookingResult?.id]);

  const handleTimeSelect = (time: string) => {
    if (!selectedStartTime && !selectedEndTime) {
      setSelectedStartTime(time);
      return;
    }

    if (selectedStartTime && !selectedEndTime) {
      if (time === selectedStartTime) {
        setSelectedStartTime(null);
        return;
      }
      if (time > selectedStartTime) {
        setSelectedEndTime(time);
        return;
      }
      if (time < selectedStartTime) {
        setSelectedEndTime(selectedStartTime);
        setSelectedStartTime(time);
        return;
      }
    }

    if (selectedStartTime && selectedEndTime) {
      if (time === selectedStartTime) {
        setSelectedStartTime(null);
        setSelectedEndTime(null);
        return;
      }
      if (time === selectedEndTime) {
        setSelectedEndTime(null);
        return;
      }
      if (time > selectedStartTime && time < selectedEndTime) {
        setSelectedStartTime(time);
        setSelectedEndTime(null);
        return;
      }
      if (time > selectedEndTime) {
        setSelectedEndTime(time);
        return;
      }
      if (time < selectedStartTime) {
        setSelectedStartTime(time);
        return;
      }
    }
  };

  const isTimeInRange = (time: string) => {
    if (!selectedStartTime || !selectedEndTime) return false;
    return time > selectedStartTime && time < selectedEndTime;
  };

  const getTimeButtonClass = (time: string) => {
    if (time === selectedStartTime) {
      return "bg-blue-600 text-white border-blue-600";
    }
    if (time === selectedEndTime) {
      return "bg-green-600 text-white border-green-600";
    }
    if (isTimeInRange(time)) {
      return "bg-blue-100 text-blue-700 border-blue-200";
    }
    return "bg-white border-gray-200 text-gray-700 hover:border-gray-400";
  };

  const getDurationInHours = () => {
    if (!selectedStartTime) return 0;
    if (!selectedEndTime) return 1;
    const startHour = parseInt(selectedStartTime.split(":")[0]);
    const endHour = parseInt(selectedEndTime.split(":")[0]);
    return endHour - startHour;
  };

  const getSelectedTimeDisplay = () => {
    if (!selectedStartTime) return t("bookingPage.selectTime.clickToSelect");
    if (!selectedEndTime) return t("bookingPage.selectTime.oneHour", { time: selectedStartTime });
    return t("bookingPage.selectTime.range", { start: selectedStartTime, end: selectedEndTime, hours: getDurationInHours() });
  };

  const getLocationMapUrl = () => {
    if (!locationLat || !locationLng) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${locationLat},${locationLng}`)}`;
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toastError(t("bookingPage.location.browserUnsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationLat(String(pos.coords.latitude));
        setLocationLng(String(pos.coords.longitude));
        toastSuccess(t("bookingPage.location.success"));
      },
      () => {
        toastError(t("bookingPage.location.failed"));
      },
      { enableHighAccuracy: true },
    );
  };

  const canProceedStep1 = !!selectedDate && !!selectedStartTime;

  const handleCreateBooking = async () => {
    if (!selectedDate || !selectedStartTime) {
      return;
    }

    let duration = 60;
    if (selectedEndTime) {
      const startHour = parseInt(selectedStartTime.split(":")[0]);
      const endHour = parseInt(selectedEndTime.split(":")[0]);
      duration = (endHour - startHour) * 60;
    }

    const allowed = [30, 60, 90, 120];
    const isAllowed = allowed.includes(duration);
    let sendDuration = duration;
    if (!isAllowed) {
      let nearest = allowed[0];
      let bestDiff = Math.abs(duration - nearest);
      for (let i = 1; i < allowed.length; i++) {
        const d = allowed[i];
        const diff = Math.abs(duration - d);
        if (diff < bestDiff || (diff === bestDiff && d > nearest)) {
          nearest = d;
          bestDiff = diff;
        }
      }
      sendDuration = nearest;
      toastError(t("bookingPage.booking.durationRounded", { duration, sendDuration }));
    }

    if (duration <= 0) {
      return;
    }

    setSubmitting(true);
    setPaymentProcessing(true);
    setPaymentError(null);

    try {
      const selectGateway = (method: string) => 'midtrans';

      const payload: any = {
        tutor_profile_id: tutor.id,
        date: selectedDate,
        start_time: selectedStartTime,
        end_time: selectedEndTime || selectedStartTime,
        duration_minutes: sendDuration,
        mode: mode,
        gateway: selectGateway(paymentMethod),
        method: paymentMethod,
      };

      if (mode === 'offline') {
        payload.location_latitude = locationLat ? parseFloat(locationLat) : null;
        payload.location_longitude = locationLng ? parseFloat(locationLng) : null;
      }

      const data = await apiFetch("/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const booking = data.data ?? data;
      console.log("Booking result:", booking);
      setBookingResult(booking);
      
      if (paymentMethod === "cod") {
        setStep(3);
        toastSuccess(t("bookingPage.booking.codSuccess"));
      } else {
        const payment = booking?.payment;
        const paymentUrl = payment?.payment_url;

        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          setPaymentError(t("bookingPage.booking.paymentUrlMissing"));
          toastError(t("bookingPage.booking.paymentUrlMissingToast"));
        }
      }
    } catch (e: any) {
      setPaymentError(e?.message ?? t("bookingPage.booking.createFailed"));
      toastError(e?.message ?? t("bookingPage.booking.createFailed"));
    } finally {
      setSubmitting(false);
      setPaymentProcessing(false);
    }
  };

  const photoUrl = tutor?.photo?.trim()
    ? tutor.photo.startsWith("http")
      ? tutor.photo
      : `${API_ROOT}/storage/${tutor.photo}`
    : defaultTutorPhoto;
  const subject = tutor?.subject ?? tutor?.subject_label ?? (tutor?.subjects ?? []).map((s: any) => s.name).join(" & ") ?? "";
  const tutorLocationText = fullTutor?.location ?? `${fullTutor?.city ?? ""}${fullTutor?.province ? ", " + fullTutor.province : t("bookingPage.payment.locationUnavailable")}`;
  const location = fullTutor?.city ?? fullTutor?.province ?? fullTutor?.location ?? t("bookingPage.summary.online");
  const experience = tutor?.experience_label ?? (tutor?.experience_years ? t("bookingPage.summary.experienceYears", { years: tutor.experience_years }) : "—");
  const level = tutor?.level_label ?? tutor?.level ?? t("bookingPage.summary.allLevels");
  const price = (tutor?.price_per_hour ?? tutor?.price ?? 0).toLocaleString("id-ID");

  if (!tutor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t("bookingPage.emptyTutor.title")}</h2>
          <p className="text-gray-500 mb-6 text-sm">{t("bookingPage.emptyTutor.description")}</p>
          <button onClick={() => navigate("cari-tutor")} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded">
            {t("bookingPage.emptyTutor.findTutor")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6 pb-32 lg:py-10">
        
        <button onClick={() => navigate("cari-tutor")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors">
          <ChevronLeft size={16} /> {t("common.back")}
        </button>

        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">{t("bookingPage.title")}</h1>
          <p className="text-gray-400 text-sm lg:text-base mt-1">{t("bookingPage.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2 mb-8 lg:mb-10">
          {[
            { label: t("bookingPage.steps.selectSchedule"), step: 1 },
            { label: t("bookingPage.steps.payment"), step: 2 },
            { label: t("bookingPage.steps.complete"), step: 3 },
          ].map((item, i) => (
            <React.Fragment key={item.step}>
              <div className={`w-8 h-8 flex items-center justify-center text-sm font-bold transition-colors rounded ${
                step === item.step ? "bg-blue-600 text-white" : step > item.step ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400"
              }`}>{item.step}</div>
              {i < 2 && <div className={`flex-1 h-0.5 transition-colors ${step > item.step ? "bg-green-600" : "bg-gray-100"}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          <div className="lg:col-span-3">
            {step === 1 && (
              <>
                <div className="mb-8">
                  {loadingDays ? (
                    <div className="py-8 text-center text-sm text-gray-400">{t("bookingPage.calendar.loadingSchedule")}</div>
                  ) : (
                    <CalendarPicker
                      availableDates={availableDates}
                      selectedDate={selectedDate}
                      onSelect={setSelectedDate}
                    />
                  )}
                </div>

                <div className="border-t border-gray-100 my-8" />

                <div>
                  <div className="font-bold text-gray-900 mb-3">{t("bookingPage.selectTime.title")}</div>
                  <div className="text-sm text-gray-600 mb-3 bg-gray-50 px-3 py-2 rounded">
                    {getSelectedTimeDisplay()}
                  </div>
                  <div className="text-xs text-gray-400 mb-3">
                    {!selectedStartTime && t("bookingPage.selectTime.hintSingle")}
                    {selectedStartTime && !selectedEndTime && t("bookingPage.selectTime.hintRange")}
                    {selectedStartTime && selectedEndTime && t("bookingPage.selectTime.hintAdjust")}
                  </div>
                  {loadingSlots ? (
                    <div className="text-sm text-gray-400">{t("bookingPage.calendar.loadingSlots")}</div>
                  ) : slots.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2">
                      {slots.map((slot) => {
                        const time = slot.time ?? slot;
                        const available = typeof slot === 'object' ? (slot.available ?? true) : true;
                        const disabled = !available;
                        const baseClass = disabled ? 'bg-white border-gray-200 text-gray-400' : getTimeButtonClass(time);
                        const disabledClass = disabled ? 'text-red-400 bg-red-50 border-red-200 cursor-not-allowed' : '';
                        return (
                          <button
                            key={time}
                            onClick={() => !disabled && handleTimeSelect(time)}
                            disabled={disabled}
                            className={`py-2 text-sm font-medium border transition-colors rounded ${baseClass} ${disabledClass}`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      {selectedDate ? t("bookingPage.selectTime.noSlots") : t("bookingPage.selectTime.selectDateFirst")}
                    </p>
                  )}
                </div>

                <div className="mt-8 lg:hidden">
                  <button
                    disabled={!canProceedStep1}
                    onClick={() => setStep(2)}
                    className="w-full py-3.5 bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded"
                  >
                    {t("bookingPage.actions.continueToPayment")}
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-6">
                  <div className="font-bold text-gray-900 mb-4">{t("bookingPage.payment.title")}</div>

                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">{t("bookingPage.payment.sessionMode")}</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMode('online')}
                        className={`px-4 py-2 text-sm font-medium border transition-colors rounded ${
                          mode === 'online' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Video size={16} /> {t("bookingPage.payment.online")}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('offline')}
                        className={`px-4 py-2 text-sm font-medium border transition-colors rounded ${
                          mode === 'offline' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {t("bookingPage.payment.offline")}
                      </button>
                    </div>
                    {mode === 'offline' && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">{t("bookingPage.payment.locationLabel")}</span> {tutorLocationText}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {paymentMethods.map((method) => {
                      const iconData = PAYMENT_ICONS[method.value];
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setPaymentMethod(method.value as any)}
                          className={`flex flex-col items-center gap-2 p-4 border transition-colors rounded ${
                            paymentMethod === method.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 bg-white hover:border-gray-400"
                          }`}
                        >
                          <div className={`w-12 h-12 flex items-center justify-center rounded ${iconData?.bg || 'bg-gray-50'}`}>
                            {iconData?.icon || <CreditCard size={22} />}
                          </div>
                          <span className="text-xs font-medium text-gray-700">{method.label}</span>
                          {paymentMethod === method.value && (
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {paymentError && <div className="text-sm text-red-600 mt-2">{paymentError}</div>}

                  {mode === 'offline' && (
                    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-2">{t("bookingPage.payment.tutorLocationTitle")}</div>
                        <div className="text-xs text-gray-500">{t("bookingPage.payment.tutorLocationDescription")}</div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="text-sm text-gray-700 font-medium mb-2">
                          {tutorLocationText}
                        </div>
                        {fullTutor?.latitude && fullTutor?.longitude && (
                          <div className="text-xs text-gray-500 mb-2">
                            Koordinat: {fullTutor.latitude}, {fullTutor.longitude}
                          </div>
                        )}
                        {fullTutor?.google_maps_url ? (
                          <a
                            href={fullTutor.google_maps_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition"
                          >
                            <MapPin size={14} /> Buka Navigasi Google Maps
                          </a>
                        ) : fullTutor?.latitude && fullTutor?.longitude ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${fullTutor.latitude},${fullTutor.longitude}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition"
                          >
                            <MapPin size={14} /> Buka Navigasi Google Maps
                          </a>
                        ) : null}
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-2">{t("bookingPage.payment.yourLocationTitle")}</div>
                        <div className="text-xs text-gray-500 mb-2">{t("bookingPage.payment.yourLocationDescription")}</div>
                        <button
                          type="button"
                          onClick={useCurrentLocation}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
                        >
                          <MapPin size={16} /> {t("bookingPage.payment.takeCurrentLocation")}
                        </button>
                        {locationLat && locationLng && (
                          <div className="mt-2 p-2 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-700">
                              ✓ {t("bookingPage.payment.yourLocationValue", { lat: Number(locationLat).toFixed(5), lng: Number(locationLng).toFixed(5) })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 3 && (
              <div className="bg-white border border-gray-200 p-8 text-center rounded">
                <div className="w-14 h-14 bg-green-100 flex items-center justify-center mx-auto mb-5 rounded">
                  <Check size={24} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("bookingPage.success.title")}</h2>
                <p className="text-sm text-gray-600 mb-6">{t("bookingPage.success.description")}</p>
                <button onClick={() => navigate("booking-saya")} className="w-full py-3 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors rounded">
                  {t("bookingPage.success.viewBookings")}
                </button>
              </div>
            )}
          </div>

          {/* Right sidebar - Summary */}
          <div className="lg:col-span-2">
            <div className="border border-gray-200 p-5 sticky top-20 rounded">
              <div className="font-bold text-gray-900 mb-4">{t("bookingPage.summary.title")}</div>
              
              <div className="flex gap-3 mb-4">
                {photoUrl ? (
                  <img src={photoUrl} alt={tutor.name} className="w-14 h-14 object-cover bg-gray-100 shrink-0 rounded" />
                ) : (
                  <div className="w-14 h-14 bg-blue-600 text-white flex items-center justify-center text-xl font-bold shrink-0 rounded">
                    {tutor.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{tutor.name}</div>
                  <div className="text-sm text-gray-500">{subject}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold text-gray-800">{tutor.rating ?? 0}</span>
                    <span className="text-xs text-gray-400">({tutor.reviews ?? 0})</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("bookingPage.summary.date")}</span>
                  <span className="font-medium text-gray-900">{selectedDate || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("bookingPage.summary.time")}</span>
                  <span className="font-medium text-gray-900">
                    {selectedStartTime ? (selectedEndTime ? `${selectedStartTime} - ${selectedEndTime}` : selectedStartTime) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("bookingPage.summary.duration")}</span>
                  <span className="font-medium text-gray-900">{getDurationInHours()} jam</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("bookingPage.summary.mode")}</span>
                  <span className="font-medium text-gray-900 capitalize">{mode}</span>
                </div>
                {mode === 'offline' && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                    <div className="font-medium text-gray-900">{t("bookingPage.summary.tutorLocation")}</div>
                    <div>{tutorLocationText}</div>
                    {fullTutor?.latitude && fullTutor?.longitude && (
                      <div className="mt-1 text-xs text-gray-500">
                        {t("bookingPage.summary.coordinates", { lat: tutor.latitude, lng: tutor.longitude })}
                      </div>
                    )}
                  </div>
                )}
                {step === 2 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t("bookingPage.summary.method")}</span>
                    <span className="font-medium text-gray-900 capitalize">{paymentMethod}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">{t("bookingPage.summary.total")}</span>
                  <span className="font-bold text-blue-600 text-lg">
                    Rp {((tutor.price_per_hour ?? tutor.price ?? 0) * getDurationInHours()).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">Rp {price} {t("bookingPage.summary.perHour")}</div>
              </div>
            </div>

            {step === 1 && (
              <div className="hidden lg:block mt-4">
                <button
                  disabled={!canProceedStep1}
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded"
                >
                  {t("bookingPage.actions.continueToPayment")}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => setStep(1)} 
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors rounded"
                >
                  {t("common.back")}
                </button>
                <button
                  disabled={paymentProcessing || (mode === 'offline' && (!locationLat || !locationLng))}
                  onClick={handleCreateBooking}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 rounded"
                >
                  {paymentProcessing ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> {t("bookingPage.actions.processing")}</span> : t("bookingPage.actions.pay")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Website Rating Popup */}
      {showRatingPopup && (
        <WebsiteRatingPopup
          bookingId={bookingResult?.id}
          onClose={() => setShowRatingPopup(false)}
        />
      )}
    </div>
  );
}