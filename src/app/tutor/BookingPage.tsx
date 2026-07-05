import React, { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Star, MapPin, Clock, BookOpen, Wallet, Loader2, Check, Video, CreditCard, QrCode, Landmark } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toastError, toastSuccess } from "../lib/swal";
import WebsiteRatingPopup from "../mahasiswa/WebsiteRatingPopup";

const API_ROOT = (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/?$/, "") ?? "https://rezi-laravel.nlabs.id";
const defaultTutorPhoto = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format";

function CalendarPicker({ availableDates, selectedDate, onSelect }: {
  availableDates: string[];
  selectedDate: string | null;
  onSelect: (d: string | null) => void;
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
          return (
            <button
              key={iso}
              disabled={!isAvail && !isSel}
              onClick={() => onSelect(isSel ? null : iso)}
              className={
                `
                  aspect-square flex items-center justify-center text-sm w-9 h-9 transition-colors rounded
                  ${isSel ? "bg-blue-600 text-white font-bold" : ""}
                  ${!isSel && isAvail ? "hover:bg-blue-50 text-gray-900 cursor-pointer" : ""}
                  ${!isAvail && !isSel ? "text-gray-300 cursor-not-allowed" : "text-gray-900"}
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
  const [timeViewMode, setTimeViewMode] = useState<"hourly" | "minute">("hourly");
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
  const socketRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const WS_URL = (import.meta as any).env?.VITE_WS_URL ?? null;

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
        const days = (data.data?.days ?? data.days ?? []) as any[];
        const dates = days
          .filter((d: any) => d.has_available_slot || d.has_schedule)
          .map((d: any) => {
            const date = new Date(d.date);
            if (Number.isNaN(date.getTime())) return null;
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          })
          .filter((d: string | null): d is string => !!d);
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
    fetchSlotsForDate(selectedDate);
  }, [selectedDate, fullTutor?.id]);

  // fetch slots for a specific date (used on mount and after booking)
  const fetchSlotsForDate = async (date: string | null) => {
    if (!date || !fullTutor) return;
    setLoadingSlots(true);
    setSelectedStartTime(null);
    setSelectedEndTime(null);
    try {
      const data = await apiFetch(`/tutors/${fullTutor.id}/available-slots?date=${date}`);
      const slots = (data.data?.slots ?? data.slots ?? []) as any[];
      setSlots(slots.map((s: any) => (typeof s === 'string' ? { time: s, available: true } : s)));
    } catch (e) {
      console.error("Gagal memuat jam", e);
    } finally {
      setLoadingSlots(false);
    }
  };

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

  // WebSocket: subscribe to slot updates from server and refresh slots
  useEffect(() => {
    if (!WS_URL || !fullTutor || !selectedDate) return;
    try {
      const url = `${WS_URL}`;
      const ws = new WebSocket(url);
      socketRef.current = ws;
      ws.onopen = () => {
        setWsConnected(true);
        // optionally send a subscribe message for this tutor
        try {
          ws.send(JSON.stringify({ action: 'subscribe', tutor_profile_id: fullTutor.id }));
        } catch (e) {}
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          // expected message: { type: 'slots.updated', tutor_profile_id, date }
          if (msg?.type === 'slots.updated') {
            if (msg.tutor_profile_id && String(msg.tutor_profile_id) !== String(fullTutor.id)) return;
            if (!msg.date || msg.date === selectedDate) {
              fetchSlotsForDate(selectedDate).catch(() => {});
            }
          }
        } catch (e) {
          // ignore parse errors
        }
      };
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);

      return () => {
        try { ws.close(); } catch (e) {}
        socketRef.current = null;
        setWsConnected(false);
      };
    } catch (e) {
      // if WS fails, fall back to periodic fetch
      const id = setInterval(() => { fetchSlotsForDate(selectedDate).catch(()=>{}); }, 15000);
      return () => clearInterval(id);
    }
  }, [WS_URL, fullTutor?.id, selectedDate]);

  const parseTimeToMinutes = (time: string) => {
    const [hourPart, minutePart] = time.split(":");
    const hour = parseInt(hourPart, 10);
    const minute = minutePart ? parseInt(minutePart, 10) : 0;
    if (Number.isNaN(hour) || Number.isNaN(minute)) return 0;
    return hour * 60 + minute;
  };

  const isDateTimeInPast = (dateIso: string | null, time: string) => {
    if (!dateIso) return false;
    try {
      // construct local datetime from date and time (HH:mm)
      const dt = new Date(`${dateIso}T${time}:00`);
      return dt.getTime() < Date.now();
    } catch (e) {
      return false;
    }
  };

  const isBefore = (a: string, b: string) => {
    if (!a || !b) return false;
    return parseTimeToMinutes(a) < parseTimeToMinutes(b);
  };

  const isAfter = (a: string, b: string) => {
    if (!a || !b) return false;
    return parseTimeToMinutes(a) > parseTimeToMinutes(b);
  };

  const handleTimeSelect = (time: string) => {
    if (selectedStartTime && selectedEndTime && isTimeInSelectedRange(time)) {
      return;
    }

    if (!selectedStartTime && !selectedEndTime) {
      setSelectedStartTime(time);
      return;
    }

    if (selectedStartTime && !selectedEndTime) {
      if (time === selectedStartTime) {
        setSelectedStartTime(null);
        return;
      }
      if (isAfter(time, selectedStartTime)) {
        setSelectedEndTime(time);
        return;
      }
      if (isBefore(time, selectedStartTime)) {
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
      if (isAfter(time, selectedStartTime) && isBefore(time, selectedEndTime)) {
        setSelectedStartTime(time);
        setSelectedEndTime(null);
        return;
      }
      if (isAfter(time, selectedEndTime)) {
        setSelectedEndTime(time);
        return;
      }
      if (isBefore(time, selectedStartTime)) {
        setSelectedStartTime(time);
        return;
      }
      if (time === selectedEndTime) {
        setSelectedEndTime(null);
        return;
      }
    }
  };

  const isTimeInRange = (time: string) => {
    if (!selectedStartTime || !selectedEndTime) return false;
    return isAfter(time, selectedStartTime) && isBefore(time, selectedEndTime);
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

  const hourlyGroups = React.useMemo(() => {
    // Build groups per hour including availability info
    const groups = new Map<string, { times: string[]; availTimes: string[] }>();
    slots.forEach((slot) => {
      const time = typeof slot === 'object' ? slot.time : slot;
      const available = typeof slot === 'object' ? (slot.available ?? true) : true;
      const hour = time.slice(0, 2);
      const item = groups.get(hour) ?? { times: [], availTimes: [] };
      if (!item.times.includes(time)) item.times.push(time);
      if (available && !item.availTimes.includes(time)) item.availTimes.push(time);
      groups.set(hour, item);
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
      .map(([hour, data]) => {
        const allTimes = data.times.sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
        const availTimes = data.availTimes.sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
        // filter out past times relative to the selected date
        const availTimesFiltered = availTimes.filter((t) => !isDateTimeInPast(selectedDate, t));
        const firstAny = allTimes[0] ?? null;
        const firstAvailable = availTimesFiltered[0] ?? null;
        const availableCount = availTimesFiltered.length;
        return {
          hour,
          first: firstAvailable ?? firstAny,
          firstAny,
          firstAvailable,
          availableCount,
          totalCount: allTimes.length,
          hasAvailable: availableCount > 0,
        };
      });
  }, [slots, selectedDate]);

  const isTimeInSelectedRange = (time: string) => {
    if (!selectedStartTime || !selectedEndTime) return false;
    const minutes = parseTimeToMinutes(time);
    const start = parseTimeToMinutes(selectedStartTime);
    const end = parseTimeToMinutes(selectedEndTime);
    return minutes > start && minutes < end;
  };

  const getDurationInMinutes = () => {
    if (!selectedStartTime) return 0;
    const start = parseTimeToMinutes(selectedStartTime);
    const end = selectedEndTime ? parseTimeToMinutes(selectedEndTime) : start + 60;
    return Math.max(0, end - start);
  };

  const getDurationInHours = () => {
    const minutes = getDurationInMinutes();
    return minutes / 60;
  };

  const formatDurationLabel = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours} jam ${mins} menit`;
    }
    if (hours > 0) {
      return `${hours} jam`;
    }
    return `${mins} menit`;
  };

  const getSelectedTimeDisplay = () => {
    if (!selectedStartTime) return t("bookingPage.selectTime.clickToSelect");
    if (!selectedEndTime) return t("bookingPage.selectTime.oneHour", { time: selectedStartTime });
    return `${selectedStartTime} - ${selectedEndTime} (${formatDurationLabel(getDurationInMinutes())})`;
  };

  // Remove booked slots from local state so they cannot be selected again
  const removeBookedSlotsFromState = (start: string | null, end: string | null) => {
    if (!start) return;
    const s = parseTimeToMinutes(start);
    const e = end ? parseTimeToMinutes(end) : s + 10;
    setSlots((prev) => prev.filter((slot) => {
      const time = (slot.time ?? slot) as string;
      const m = parseTimeToMinutes(time);
      // remove slots that start at or after start, up to (but not including) end
      return !(m >= s && m < e);
    }));
    setSelectedStartTime(null);
    setSelectedEndTime(null);
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

    const duration = getDurationInMinutes();
    if (duration <= 0) {
      return;
    }
    const sendDuration = duration;

    setSubmitting(true);
    setPaymentProcessing(true);
    setPaymentError(null);

    try {
      const selectGateway = (method: string) => 'midtrans';

      const selectedSubjectId = matchedAvailabilitySubjectIds.size > 0 ? Array.from(matchedAvailabilitySubjectIds)[0] : null;
      console.log("Booking payload subject check", {
        selectedSubjectId,
        matchedAvailabilitySubjectIds: Array.from(matchedAvailabilitySubjectIds),
        selectedDate,
        selectedStartTime,
        selectedEndTime,
        fullTutorSubjects: fullTutor?.subjects?.map((s: any) => ({ id: s.id, name: s.name })) ?? [],
        availabilities: fullTutor?.availabilities?.map((av: any) => ({ id: av.id, subject: av.subject?.name, date: av.date, day_of_week: av.day_of_week, start_time: av.start_time, end_time: av.end_time })) ?? [],
      });
      const payload: any = {
        tutor_profile_id: tutor.id,
        subject_id: selectedSubjectId,
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
      // make booked slots unavailable in the current UI immediately
      removeBookedSlotsFromState(selectedStartTime, selectedEndTime || selectedStartTime);
      // re-fetch slots from server to ensure consistency across users
      try {
        await fetchSlotsForDate(selectedDate);
      } catch (err) {
        // ignore - fetchSlotsForDate logs errors
      }
      
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
  // Determine selected availability subject ids from tutor availabilities matching chosen date/time range
  const matchedAvailabilitySubjectIds = React.useMemo(() => {
    if (!fullTutor || !selectedDate || !selectedStartTime) return new Set<number | string>();
    const availabilities = fullTutor.availabilities ?? [];
    if (!Array.isArray(availabilities) || availabilities.length === 0) return new Set<number | string>();

    const parseMinutes = (time: string) => {
      const [hour, minute] = time.slice(0, 5).split(":").map(Number);
      return (Number.isNaN(hour) || Number.isNaN(minute)) ? null : hour * 60 + minute;
    };

    const start = parseMinutes(selectedStartTime);
    const end = parseMinutes(selectedEndTime ?? selectedStartTime);
    if (start === null || end === null) return new Set<number | string>();

    const normalizedEnd = end > start ? end : start + 1;
    const selectedDay = new Date(selectedDate).getDay();
    const matchedIds = new Set<number | string>();

    for (const av of availabilities) {
      const avSubjectId = av.subject?.id ?? null;
      if (!avSubjectId) continue;

      if (av.date) {
        if (av.date !== selectedDate) continue;
      } else if (av.day_of_week !== selectedDay) {
        continue;
      }

      const avStart = av.start_time ? parseMinutes(av.start_time) : null;
      const avEnd = av.end_time ? parseMinutes(av.end_time) : null;
      if (avStart === null || avEnd === null) continue;

      if (normalizedEnd > avStart && start < avEnd) {
        matchedIds.add(avSubjectId);
      }
    }

    return matchedIds;
  }, [fullTutor, selectedDate, selectedStartTime, selectedEndTime]);
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
                    <div>
                      <CalendarPicker
                        availableDates={availableDates}
                        selectedDate={selectedDate}
                        onSelect={(d) => {
                          setSelectedDate(d ?? null);
                        }}
                      />
                      {selectedDate ? (
                        <div className="mt-3">
                          <button
                            onClick={() => setSelectedDate(null)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Batal pilih tanggal
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 my-8" />

                <div>
                  <div className="font-bold text-gray-900 mb-3">{t("bookingPage.selectTime.title")}</div>
                  <div className="text-sm text-gray-600 mb-3 bg-gray-50 px-3 py-2 rounded">
                    {getSelectedTimeDisplay()}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setTimeViewMode('hourly')}
                      className={`px-3 py-1 text-xs font-semibold rounded ${timeViewMode === 'hourly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      Per Jam
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeViewMode('minute')}
                      className={`px-3 py-1 text-xs font-semibold rounded ${timeViewMode === 'minute' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      Per Menit
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {timeViewMode === 'hourly'
                      ? 'Default per jam. Klik "Per Menit" untuk melihat detil waktu.'
                      : t("bookingPage.selectTime.intervalNote")}
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
                      {(timeViewMode === 'minute' ? slots.map((slot) => {
                        const time = slot.time ?? slot;
                        const available = typeof slot === 'object' ? (slot.available ?? true) : true;
                        const inSelectedRange = !!selectedStartTime && !!selectedEndTime && isTimeInSelectedRange(time);
                        const isSelectedStart = time === selectedStartTime;
                        const isSelectedEnd = time === selectedEndTime && !!selectedStartTime && !!selectedEndTime;
                        const disabled = !available || isDateTimeInPast(selectedDate, time);
                        const baseClass = !available || isDateTimeInPast(selectedDate, time)
                          ? 'bg-red-50 text-red-400 border-red-200'
                          : isSelectedEnd
                            ? 'bg-green-600 text-white border-green-600'
                            : isSelectedStart
                              ? 'bg-blue-600 text-white border-blue-600'
                              : inSelectedRange
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : getTimeButtonClass(time);
                        const pointerClass = disabled ? 'cursor-not-allowed' : 'cursor-pointer';

                        return (
                          <button
                            key={time}
                            onClick={() => !disabled && handleTimeSelect(time)}
                            disabled={disabled}
                            className={`py-2 text-sm font-medium border transition-colors rounded ${baseClass} ${pointerClass}`}
                          >
                            {time}
                          </button>
                        );
                      }) : hourlyGroups.map((group) => {
                        const time = group.first;
                        const isSelectedStart = time === selectedStartTime;
                        const inSelectedRange = !!selectedStartTime && !!selectedEndTime && isTimeInSelectedRange(time);
                        const baseClass = isSelectedStart
                          ? 'bg-blue-600 text-white border-blue-600'
                          : inSelectedRange
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400';
                        const disabled = !group.hasAvailable || !time;
                        return (
                          <button
                            key={group.hour}
                            onClick={() => {
                              if (!group.hasAvailable || !time) return;
                              const defaultEnd = `${String((parseInt(group.hour, 10) + 1) % 24).padStart(2, '0')}:00`;
                              // toggle: if this hour is already the selected start, clear selection
                              if (group.first === selectedStartTime && !selectedEndTime) {
                                setSelectedStartTime(null);
                                setSelectedEndTime(null);
                              } else if (group.first === selectedStartTime && selectedEndTime === defaultEnd) {
                                // also allow clearing when end matches default
                                setSelectedStartTime(null);
                                setSelectedEndTime(null);
                              } else {
                                setSelectedStartTime(group.first);
                                setSelectedEndTime(defaultEnd);
                              }
                            }}
                            disabled={disabled}
                            className={`py-3 text-sm font-medium border transition-colors rounded ${baseClass} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div>{group.hour}:00</div>
                            <div className="text-[10px] text-gray-500">{group.availableCount} slot{group.availableCount > 1 ? ' tersedia' : ''}</div>
                          </button>
                        );
                      }))}
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
                        {(function() {
                          const gm = fullTutor?.google_maps_url ?? null;
                          if (!gm) return null;
                          try {
                            const atMatch = gm.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                            const dMatch = gm.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
                            const coords = atMatch ? { lat: atMatch[1], lng: atMatch[2] } : dMatch ? { lat: dMatch[1], lng: dMatch[2] } : null;
                            if (!coords) return null;
                            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${coords.lat},${coords.lng}`)}`;
                            return (
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition"
                              >
                                <MapPin size={14} /> {t("bookingPage.payment.openMaps")}
                              </a>
                            );
                          } catch (e) { return null; }
                        })()}
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
                  <div className="text-sm text-gray-500">
                    {Array.isArray(fullTutor?.subjects) && fullTutor.subjects.length > 0 ? (
                      fullTutor.subjects.map((s: any, idx: number) => {
                        const isSelectedSubject = s?.id && matchedAvailabilitySubjectIds.has(s.id);
                        return (
                          <React.Fragment key={s.id ?? idx}>
                            <span className={isSelectedSubject ? "text-blue-600" : "text-gray-500"}>
                              {s.name}
                            </span>
                            {idx < fullTutor.subjects.length - 1 ? <span className="text-gray-500"> &amp; </span> : null}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      subject
                    )}
                  </div>
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
                    {selectedStartTime ? (selectedEndTime ? `${selectedStartTime} - ${selectedEndTime}` : `${selectedStartTime} (${formatDurationLabel(getDurationInMinutes())})`) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("bookingPage.summary.duration")}</span>
                  <span className="font-medium text-gray-900">{formatDurationLabel(getDurationInMinutes())}</span>
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
                    Rp {Math.round(((tutor.price_per_hour ?? tutor.price ?? 0) * getDurationInMinutes()) / 60).toLocaleString("id-ID")}
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