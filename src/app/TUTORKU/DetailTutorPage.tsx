import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  Star,
  MapPin,
  Clock,
  Play,
  MessageCircle,
  Shield,
  Heart,
  Share2,
  Flag,
  Users,
} from "lucide-react";
import { toastSuccess, toastError } from "../lib/swal";

const API_ROOT = (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/?$/, "") ?? "https://rezi-laravel.nlabs.id";

const DAY_LABEL_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const DAY_NUMBER_MAP: Record<number, string> = {
  1: "monday", 2: "tuesday", 3: "wednesday",
  4: "thursday", 5: "friday", 6: "saturday", 7: "sunday"
};

const DAY_STRING_MAP: Record<string, string> = {
  monday: "monday", tuesday: "tuesday", wednesday: "wednesday",
  thursday: "thursday", friday: "friday", saturday: "saturday", sunday: "sunday",
  senin: "monday", selasa: "tuesday", rabu: "wednesday",
  kamis: "thursday", jumat: "friday", sabtu: "saturday", minggu: "sunday",
  mon: "monday", tue: "tuesday", wed: "wednesday",
  thu: "thursday", fri: "friday", sat: "saturday", sun: "sunday",
};

export default function DetailTutorPage(props: any) {
  const { t, i18n } = useTranslation();
  const { tutorId, apiFetch, navigate, user, onBooking, onChat } = props;
  const DAYS = DAY_LABEL_KEYS.map((key) => t(`bookingPage.calendar.dayShorts.${key}`));
  const [tutor, setTutor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingTutor, setLoadingTutor] = useState(true);
  const [activeTab, setActiveTab] = useState<"tentang" | "jadwal" | "ulasan">("tentang");

  const loadTutor = async () => {
    if (!tutorId) return;
    setLoadingTutor(true);
    try {
      const data = await apiFetch(`/tutors/${tutorId}`);
      const payload = data.data ?? data;
      const isFavorited = data.is_favorited ?? payload.is_favorited ?? false;
      setTutor({ ...payload, is_favorited: isFavorited });
      setReviews(data.reviews?.data ?? data.reviews ?? []);
      const rawSchedules = payload.schedules ?? payload.availabilities ?? data.schedules ?? data.availabilities ?? [];
      setSchedules(Array.isArray(rawSchedules) ? rawSchedules : []);
    } catch (error) {
      console.error("Gagal memuat detail tutor", error);
    } finally {
      setLoadingTutor(false);
    }
  };

  useEffect(() => {
    loadTutor();
  }, [tutorId]);

  const getPhotoUrl = (photo?: string) => {
    if (!photo) return null;
    return photo.startsWith("http") ? photo : `${API_ROOT}/storage/${photo}`;
  };

  const resolveDay = (rawDay: any): string => {
    if (rawDay === null || rawDay === undefined) return "";
    if (typeof rawDay === "number") return DAY_NUMBER_MAP[rawDay] ?? "";
    if (typeof rawDay === "string") return DAY_STRING_MAP[rawDay.toLowerCase().trim()] ?? rawDay.toLowerCase().trim();
    return "";
  };

  const formatTime = (time: any): string => {
    if (!time) return "";
    const str = String(time);
    return str.length >= 5 ? str.substring(0, 5) : str;
  };

  const locale = i18n.language?.startsWith("en") ? "en-US" : "id-ID";

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString(locale, {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const scheduleMap: Record<string, string[]> = {};
  DAY_KEYS.forEach(day => { scheduleMap[day] = []; });

  schedules.forEach((s: any) => {
    const rawDay = s.day ?? s.day_of_week ?? s.weekday ?? "";
    const time = s.time ?? s.start_time ?? s.hour ?? s.slot ?? "";
    const key = resolveDay(rawDay);
    const formatted = formatTime(time);
    if (scheduleMap[key] !== undefined && formatted) {
      if (!scheduleMap[key].includes(formatted)) {
        scheduleMap[key].push(formatted);
      }
    }
  });

  DAY_KEYS.forEach(key => {
    scheduleMap[key].sort();
  });

  const maxSlots = Math.max(1, ...DAY_KEYS.map(d => scheduleMap[d].length));
  const hasAnySchedule = DAY_KEYS.some(d => scheduleMap[d].length > 0);

  const photoUrl = getPhotoUrl(tutor?.photo);
  const location = tutor?.city ?? tutor?.province ?? t("detailTutor.online");
  const pricePerHour = tutor?.price_per_hour ?? tutor?.price ?? 0;
  const rating = tutor?.rating ?? 0;
  const reviewsCount = tutor?.reviews_count ?? reviews.length ?? 0;
  const studentsCount = tutor?.students_count ?? tutor?.total_students ?? 64;

  const handleFavorite = async () => {
    if (!user) {
      toastError(t("detailTutor.favoriteLogin"));
      return;
    }
    try {
      const data = await apiFetch(`/tutors/${tutor.id}/favorite`, { method: "POST" });
      setTutor((prev: any) => ({ ...prev, is_favorited: data.favorited }));
      toastSuccess(data.message);
    } catch (err: any) {
      toastError(err.message ?? t("detailTutor.unexpectedError"));
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/tutor/${tutor.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: tutor.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toastSuccess(t("detailTutor.shareSuccess"));
      }
    } catch {}
  };

  if (!tutorId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-6">
          <h2 className="text-lg xs:text-xl font-bold text-gray-900 mb-2">{t("detailTutor.tutorNotFound")}</h2>
          <button onClick={() => navigate("cari-tutor")} className="px-3 xs:px-5 py-2 xs:py-2.5 bg-blue-600 text-white text-[10px] xs:text-sm font-medium rounded">
            {t("detailTutor.back")}
          </button>
        </div>
      </div>
    );
  }

  if (loadingTutor || !tutor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400 text-sm">{t("detailTutor.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-2 xs:px-3 sm:px-6 py-3 xs:py-4 sm:py-6">

        {/* Back */}
        <button
          onClick={() => navigate("cari-tutor")}
          className="flex items-center gap-1.5 text-xs xs:text-sm text-gray-500 hover:text-gray-900 mb-3 xs:mb-4 sm:mb-6 transition-colors"
        >
          <ChevronLeft size={14} className="xs:w-4 xs:h-4" /> {t("detailTutor.back")}
        </button>

        {/* ── TUTOR CARD ── */}
        <div className="border border-gray-200 p-3 xs:p-4 sm:p-6 mb-3 xs:mb-4 sm:mb-6 rounded">

          {/* ===== DESKTOP ===== */}
          <div className="hidden sm:flex gap-3 xs:gap-4 md:gap-5">
            <img src={photoUrl ?? undefined} alt={tutor.name} className="w-16 xs:w-20 h-16 xs:h-20 object-cover bg-gray-100 shrink-0 rounded" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1 xs:gap-2">
                <h1 className="text-base xs:text-2xl font-extrabold text-gray-900">{tutor.name}</h1>
                {tutor.is_verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    <Shield size={11} /> {t("detailTutor.verified")}
                  </span>
                )}
                {tutor.is_top && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    <Star size={11} className="fill-amber-400" /> {t("detailTutor.topTutor")}
                  </span>
                )}
                {tutor.is_booked_by_me ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-white bg-green-600 px-2 py-0.5 rounded">
                    <Users size={11} /> {t("detailTutor.bookedByYou")}
                  </span>
                ) : tutor.has_bookings ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    <Users size={11} /> {t("detailTutor.currentlyBooked")}
                  </span>
                ) : null}
              </div>
              <div className="text-xs xs:text-sm text-gray-500 mt-0.5">
                {tutor.subject_label ?? tutor.subject ?? t("detailTutor.unknownSubject")} · {tutor.level_label ?? tutor.level ?? t("detailTutor.allLevels")}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 xs:gap-x-4 gap-y-0.5 xs:gap-y-1 mt-1.5 text-xs xs:text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-800">{rating}</span>
                  <span className="text-gray-400 text-[11px] xs:text-xs">({reviewsCount} {t("detailTutor.reviews")})</span>
                </span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {location}</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {tutor.experience_years ?? tutor.experience ?? 0} {t("detailTutor.years")}</span>
                <span className="flex items-center gap-1"><Users size={14} /> {studentsCount}+ {t("detailTutor.students")}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 xs:gap-3 mt-3 xs:mt-4 pt-3 xs:pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-gray-900 text-base xs:text-lg">{formatCurrency(pricePerHour)}</span>
                  <span className="text-xs xs:text-sm text-gray-400">{t("detailTutor.perSession")}</span>
                </div>
                <div className="flex-1"></div>
                <button onClick={() => onBooking?.(tutor.id)} className="px-3 xs:px-5 py-1.5 xs:py-2 bg-blue-600 text-white text-xs xs:text-sm font-medium hover:bg-blue-700 transition-colors rounded">
                  {t("detailTutor.bookNow")}
                </button>
                <button onClick={() => onChat?.(tutor.user_id)} className="px-2 xs:px-4 py-1.5 xs:py-2 border border-gray-300 text-gray-700 text-xs xs:text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1 xs:gap-1.5 rounded">
                  <MessageCircle size={14} /> {t("pesan")}
                </button>
                <button onClick={handleFavorite} className="px-2 xs:px-3 py-1.5 xs:py-2 border border-gray-300 hover:bg-gray-50 transition-colors rounded">
                  <Heart size={14} className={tutor.is_favorited ? "fill-red-500 text-red-500" : "text-gray-400"} />
                </button>
                <button onClick={handleShare} className="px-2 xs:px-3 py-1.5 xs:py-2 border border-gray-300 hover:bg-gray-50 transition-colors rounded">
                  <Share2 size={14} className="text-gray-400" />
                </button>
                <button className="px-2 xs:px-3 py-1.5 xs:py-2 border border-gray-300 hover:bg-gray-50 transition-colors rounded">
                  <Flag size={14} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* ===== MOBILE ===== */}
          <div className="sm:hidden">
            {/* Row 1: Avatar + Name + Info */}
              <div className="flex gap-2 xs:gap-3">
              {photoUrl ? (
                <img src={photoUrl} alt={tutor.name} className="w-12 xs:w-16 h-12 xs:h-16 object-cover bg-gray-100 shrink-0 rounded" />
              ) : (
                <div className="w-12 xs:w-16 h-12 xs:h-16 bg-blue-600 text-white flex items-center justify-center text-lg xs:text-xl font-bold shrink-0 rounded">
                  {tutor.name?.charAt(0)?.toUpperCase() || "T"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-0.5 xs:gap-1">
                  <h1 className="text-sm xs:text-base font-extrabold text-gray-900">{tutor.name}</h1>
                  {tutor.is_verified && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                      <Shield size={9} /> {t("detailTutor.verified")}
                    </span>
                  )}
                  {tutor.is_top && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      <Star size={9} className="fill-amber-400" /> {t("detailTutor.topTutor")}
                    </span>
                  )}
                  {tutor.is_booked_by_me ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-white bg-green-600 px-2 py-0.5 rounded">
                      <Users size={10} /> {t("detailTutor.bookedByYou")}
                    </span>
                  ) : tutor.has_bookings ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      <Users size={10} /> {t("detailTutor.currentlyBooked")}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {tutor.subject_label ?? tutor.subject ?? t("detailTutor.unknownSubject")} · {tutor.level_label ?? tutor.level ?? t("detailTutor.allLevels")}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] xs:text-xs text-gray-500">
                  <span className="flex items-center gap-0.5">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-800">{rating}</span>
                      <span className="text-gray-400">({reviewsCount} {t("detailTutor.reviews")})</span>
                  </span>
                  <span className="flex items-center gap-0.5"><MapPin size={12} /> {location}</span>
                  <span className="flex items-center gap-0.5"><Clock size={12} /> {tutor.experience_years ?? tutor.experience ?? 0} {t("detailTutor.yearsShort")}</span>
                  <span className="flex items-center gap-0.5"><Users size={12} /> {studentsCount}+ {t("detailTutor.studentsShort")}</span>
                </div>
              </div>
            </div>

            {/* Row 2: Price */}
            <div className="flex items-center gap-1 mt-2 xs:mt-3 pt-2 xs:pt-3 border-t border-gray-100">
              <span className="font-bold text-gray-900 text-sm xs:text-base">{formatCurrency(pricePerHour)}</span>
              <span className="text-[10px] xs:text-xs text-gray-400">{t("detailTutor.perSession")}</span>
            </div>

            {/* Row 3: Booking & Chat */}
              <div className="flex gap-1.5 xs:gap-2 mt-2 xs:mt-3">
              <button
                onClick={() => onBooking?.(tutor.id)}
                className="flex-1 py-2 xs:py-2.5 bg-blue-600 text-white text-xs xs:text-sm font-medium hover:bg-blue-700 transition-colors rounded"
              >
                {t("detailTutor.bookNow")}
              </button>
              <button
                onClick={() => onChat?.(tutor.user_id)}
                className="flex-1 py-2 xs:py-2.5 border border-gray-300 text-gray-700 text-xs xs:text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 xs:gap-1.5 rounded"
              >
                <MessageCircle size={14} className="xs:w-4 xs:h-4" /> {t("detailTutor.chat")}
              </button>
            </div>

            {/* Row 4: Favorite, Share, Report */}
            <div className="flex items-center justify-around gap-1 mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={handleFavorite}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Heart size={14} className={tutor.is_favorited ? "fill-red-500 text-red-500" : "text-gray-400"} />
                <span>{t("detailTutor.favorite")}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Share2 size={14} className="text-gray-400" />
                <span>{t("detailTutor.share")}</span>
              </button>
              <button
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Flag size={14} className="text-gray-400" />
                <span>{t("detailTutor.report")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-3 xs:gap-4 sm:gap-6 border-b border-gray-200 mb-3 xs:mb-4 sm:mb-6 overflow-x-auto">
          {[
            { key: "tentang", label: t("detailTutor.tabs.about") },
            { key: "jadwal", label: t("detailTutor.tabs.schedule") },
            { key: "ulasan", label: t("detailTutor.tabs.reviews", { count: reviewsCount }) },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-2 xs:pb-2.5 sm:pb-3 text-xs xs:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}
        <div>

          {/* ===== TENTANG ===== */}
          {activeTab === "tentang" && (
            <div className="space-y-3 xs:space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-xs xs:text-sm font-semibold text-gray-900 mb-1 xs:mb-2">{t("detailTutor.aboutTitle")}</h3>
                <p className="text-xs xs:text-sm text-gray-600 leading-relaxed">
                  {tutor.bio || tutor.about || tutor.description || t("detailTutor.defaultBio")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 xs:gap-3 sm:gap-6">
                {((tutor.educations && tutor.educations.length > 0) || tutor.education) && (
                  <div>
                    <h3 className="text-xs xs:text-sm font-semibold text-gray-900 mb-1 xs:mb-2 sm:mb-3">{t("detailTutor.educationTitle")}</h3>
                    <div className="space-y-1 xs:space-y-2 sm:space-y-3">
                      {(tutor.educations || [tutor.education]).filter(Boolean).map((edu: any, idx: number) => (
                        <div key={idx}>
                          <div className="text-xs xs:text-sm font-semibold text-gray-900">{edu.degree || edu.institution}</div>
                          <div className="text-[10px] xs:text-xs text-gray-500">{edu.institution || edu.degree}{edu.year ? ` · ${edu.year}` : ""}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {((tutor.certificates && tutor.certificates.length > 0) || tutor.certificate) && (
                  <div>
                    <h3 className="text-xs xs:text-sm font-semibold text-gray-900 mb-1 xs:mb-2 sm:mb-3">{t("detailTutor.certificatesTitle")}</h3>
                    <div className="space-y-1 xs:space-y-2 sm:space-y-3">
                      {(tutor.certificates || [tutor.certificate]).filter(Boolean).map((cert: any, idx: number) => (
                        <div key={idx}>
                          <div className="text-xs xs:text-sm font-semibold text-gray-900">{cert.name}</div>
                          <div className="text-[10px] xs:text-xs text-gray-500">{cert.issuer}{cert.year ? ` · ${cert.year}` : ""}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Video Perkenalan */}
              <div>
                <h3 className="text-xs xs:text-sm font-semibold text-gray-900 mb-1 xs:mb-2 sm:mb-3">{t("detailTutor.introVideoTitle")}</h3>
                <div className="relative aspect-video bg-gray-100 border border-gray-200 flex items-center justify-center rounded overflow-hidden">
                  {(tutor.intro_video_url || tutor.intro_video_path || tutor.introduction_video) ? (
                    <video
                      src={tutor.intro_video_url || tutor.intro_video_path || tutor.introduction_video}
                      controls
                      className="w-full h-full object-cover"
                      poster={tutor.introduction_video_thumbnail || undefined}
                    />
                  ) : (
                    <>
                      <div className="w-10 xs:w-14 sm:w-16 h-10 xs:h-14 sm:h-16 bg-blue-600 text-white flex items-center justify-center rounded">
                        <Play size={20} className="xs:size-24 sm:size-28 ml-1" />
                      </div>
                      <p className="absolute bottom-3 left-3 text-xs text-gray-500">{t("detailTutor.introVideoLabel")}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== JADWAL ===== */}
          {activeTab === "jadwal" && (
            <div>
              <h3 className="text-xs xs:text-sm font-semibold text-gray-900 mb-2 xs:mb-3 sm:mb-4">{t("detailTutor.scheduleTitle")}</h3>
              {!hasAnySchedule ? (
                <div className="border border-gray-200 p-4 xs:p-6 sm:p-10 text-center text-xs xs:text-sm text-gray-400 rounded">
                  {t("detailTutor.noSchedule")}
                </div>
              ) : (
                <div className="border border-gray-200 overflow-hidden rounded">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {DAYS.map((day, idx) => {
                          const hasSlots = scheduleMap[DAY_KEYS[idx]].length > 0;
                          return (
                            <th key={day} className={`py-1.5 xs:py-2 sm:py-3 px-1 xs:px-2 text-center text-[10px] xs:text-xs font-semibold border-r border-gray-200 last:border-r-0 ${hasSlots ? "text-blue-600" : "text-gray-400"}`}>
                              {day}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: maxSlots }).map((_, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-gray-100 last:border-b-0">
                          {DAY_KEYS.map((key) => {
                            const slot = scheduleMap[key][rowIdx];
                            return (
                              <td key={key} className="py-1.5 xs:py-2 sm:py-2.5 px-1 xs:px-2 text-center text-[10px] xs:text-xs text-gray-700 border-r border-gray-100 last:border-r-0">
                                {slot || "—"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===== ULASAN ===== */}
          {activeTab === "ulasan" && (
            <div>
              <div className="flex flex-col sm:flex-row items-center gap-3 xs:gap-4 sm:gap-6 mb-3 xs:mb-4 sm:mb-6 pb-3 xs:pb-4 sm:pb-6 border-b border-gray-100">
                <div className="text-center shrink-0">
                  <div className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-gray-900">{rating}</div>
                  <div className="flex items-center justify-center gap-0.5 mt-0.5 xs:mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={12}
                        className={`xs:size-3 sm:size-4 ${i <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] xs:text-xs text-gray-400 mt-0.5">{reviewsCount} {t("detailTutor.reviews")}</div>
                </div>
                <div className="flex-1 w-full space-y-0.5 xs:space-y-1 sm:space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter((r: any) => Math.round(r.rating ?? 0) === star).length;
                    const pct = reviewsCount > 0 ? Math.round((count / reviewsCount) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                        <span className="text-[10px] xs:text-xs text-gray-500 w-2 xs:w-3 text-right">{star}</span>
                        <Star size={9} className="xs:size-2 sm:size-3 fill-yellow-400 text-yellow-400 shrink-0" />
                        <div className="flex-1 h-1 xs:h-1.5 bg-gray-100 rounded">
                          <div className="h-full bg-yellow-400 rounded" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] xs:text-xs text-gray-400 w-5 xs:w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-2 xs:space-y-3 sm:space-y-4">
                  {reviews.map((review: any, idx: number) => (
                    <div key={idx} className="border border-gray-100 p-2 xs:p-3 sm:p-4 rounded">
                      <div className="flex items-start gap-1.5 xs:gap-2 sm:gap-3">
                        <div className="w-6 xs:w-7 sm:w-8 h-6 xs:h-7 sm:h-8 bg-gray-200 flex items-center justify-center text-[10px] xs:text-xs sm:text-sm font-medium text-gray-600 shrink-0 rounded">
                          {review.user?.name?.charAt(0)?.toUpperCase() || t("detailTutor.userFallbackInitial")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 xs:gap-2">
                            <div className="text-xs xs:text-sm font-medium text-gray-900">{review.user?.name || t("detailTutor.userFallback")}</div>
                            <span className="text-[10px] xs:text-xs text-gray-400 shrink-0">
                              {review.created_at ? formatDate(review.created_at) : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-0.5 xs:mt-1 mb-0.5 xs:mb-1 sm:mb-1.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={10}
                                className={`xs:size-2 sm:size-3 ${s <= (review.rating ?? 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                              />
                            ))}
                          </div>
                          <p className="text-xs xs:text-sm text-gray-600 leading-relaxed">{review.comment || review.content || "-"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-gray-200 p-6 xs:p-8 sm:p-10 text-center rounded">
                  <div className="text-gray-400 text-xs xs:text-sm">{t("detailTutor.noReviews")}</div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}