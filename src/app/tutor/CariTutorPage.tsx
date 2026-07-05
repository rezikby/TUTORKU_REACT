import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal, Star, MapPin, Clock, BookOpen } from "lucide-react";
import { toastError } from "../lib/swal";

const API_ROOT = (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/?$/, "") ?? "https://rezi-laravel.nlabs.id";

function formatPrice(value: number) {
  return value.toLocaleString("id-ID");
}

function TutorCardUI({ tutor, onView, onBook }: { tutor: any; onView: () => void; onBook: () => void }) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);

  const subject =
    tutor.subject ??
    tutor.subject_label ??
    (tutor.subjects ?? []).map((s: any) => s.name).join(" & ") ??
    t("findTutor.subjectGeneral");
  const location = tutor.city ?? tutor.province ?? tutor.location ?? t("findTutor.online");
  const experience = tutor.experience_label ?? (tutor.experience_years ? t("findTutor.experienceYears", { years: tutor.experience_years }) : "—");
  const level = tutor.level_label ?? tutor.level ?? t("findTutor.allLevels");
  const distanceLabel = tutor.distance != null ? `${tutor.distance.toFixed(1)} km` : null;
  function parseGoogleMapsCoords(url?: string | null) {
    if (!url) return null;
    try {
      const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) return { lat: atMatch[1], lng: atMatch[2] };
      const dMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (dMatch) return { lat: dMatch[1], lng: dMatch[2] };
      return null;
    } catch (e) { return null; }
  }

  const gmUrl = tutor.google_maps_url ?? null;
  const gmCoords = parseGoogleMapsCoords(gmUrl);
  const locationMapUrl = gmCoords
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${gmCoords.lat},${gmCoords.lng}`)}`
    : null;
  const price = formatPrice(tutor.price_per_hour ?? tutor.price ?? 0);
  const online = tutor.online ?? tutor.mode_online ?? false;
  const badge = tutor.badge ?? (tutor.verified ? t("findTutor.topTutor") : null);
  const photoUrl = tutor.photo
    ? tutor.photo.startsWith("http") ? tutor.photo : `${API_ROOT}/storage/${tutor.photo}`
    : null;

  return (
    <div className="bg-white p-4 border-b border-gray-100">
      {/* Top row */}
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {photoUrl && !imgError ? (
            <img
              src={photoUrl}
              onError={() => setImgError(true)}
              alt={tutor.name}
              className="w-16 h-16 rounded-xl object-cover bg-gray-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
              {tutor.name?.charAt(0)?.toUpperCase() ?? "T"}
            </div>
          )}
          {online && (
            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 text-[15px] leading-tight truncate">{tutor.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5 truncate">{subject}</p>
            </div>
            {badge && (
              <span className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <Star size={13} className="fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-900">{tutor.rating ?? 0}</span>
            <span className="text-xs text-gray-400">({tutor.reviews ?? 0})</span>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><MapPin size={11} />{location}</span>
        {distanceLabel && (
          <span className="flex items-center gap-1">• {distanceLabel}</span>
        )}
        <span className="flex items-center gap-1"><Clock size={11} />{experience}</span>
        <span className="flex items-center gap-1"><BookOpen size={11} />{level}</span>
      </div>
      {locationMapUrl && (
        <div className="mt-2 text-xs text-blue-600">
          <a href={locationMapUrl} target="_blank" rel="noreferrer" className="hover:underline">
            {t("findTutor.openMaps")}
          </a>
        </div>
      )}

      {/* Price + actions */}
      <div className="flex items-center justify-between mt-3">
        <div>
          <span className="text-base font-bold text-gray-900">Rp {price}</span>
          <span className="text-[10px] text-gray-400 ml-1">{t("findTutor.perSession")}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="h-8 px-3 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            {t("findTutor.profile")}
          </button>
          <button
            onClick={onBook}
            className="h-8 px-3 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
          >
            {t("findTutor.bookButton")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CariTutorPage(props: any) {
  const { t } = useTranslation();
  const { tutors, searchQuery, setSearchQuery, filterSubject, setFilterSubject, onSelectTutor, onBookTutor, navigate } = props;

  const subjects = ["Semua", "Matematika", "Fisika", "Bahasa Inggris", "Kimia", "Biologi", "Bahasa Indonesia"];
  const subjectLabels: Record<string, string> = {
    "Semua": t("findTutor.all"),
    "Matematika": t("findTutor.subjectMath"),
    "Fisika": t("findTutor.subjectPhysics"),
    "Bahasa Inggris": t("findTutor.subjectEnglish"),
    "Kimia": t("findTutor.subjectChemistry"),
    "Biologi": t("findTutor.subjectBiology"),
    "Bahasa Indonesia": t("findTutor.subjectIndonesian"),
  };
  const [showFilter, setShowFilter] = useState(false);
  const [priceRange, setPriceRange] = useState(500000);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("terpopuler");
  const [modeFilter, setModeFilter] = useState<"all" | "online" | "offline">("all");
  const [userLatitude, setUserLatitude] = useState<number | null>(null);
  const [userLongitude, setUserLongitude] = useState<number | null>(null);
  const [locationPermissionRequested, setLocationPermissionRequested] = useState(false);

  const activeSubject = filterSubject === "" ? "Semua" : filterSubject;

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const askUserLocation = () => {
    if (!navigator.geolocation) {
      toastError("Browser tidak mendukung geolokasi.");
      return;
    }
    setLocationPermissionRequested(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLatitude(position.coords.latitude);
        setUserLongitude(position.coords.longitude);
      },
      () => {
        toastError("Gagal mengambil lokasi. Periksa izin geolokasi.");
      },
      { enableHighAccuracy: true },
    );
  };

  const tutorsWithLocation = (tutors ?? []).map((t: any) => {
    const latitude = t.latitude != null ? Number(t.latitude) : null;
    const longitude = t.longitude != null ? Number(t.longitude) : null;
    const distance =
      userLatitude != null && userLongitude != null && latitude != null && longitude != null
        ? getDistanceKm(userLatitude, userLongitude, latitude, longitude)
        : null;

    return {
      ...t,
      latitude,
      longitude,
      distance,
    };
  });

  const filtered = tutorsWithLocation
    .filter((t: any) => {
      const subject =
        t.subject ?? t.subject_label ?? (t.subjects ?? []).map((s: any) => s.name).join(" ") ?? "";
      const matchQ =
        searchQuery === "" ||
        (t.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchS = activeSubject === "Semua" || subject.toLowerCase().includes(activeSubject.toLowerCase());
      const matchP = (t.price_per_hour ?? t.price ?? 0) <= priceRange;
      const matchR = minRating === 0 || (t.rating ?? 0) >= minRating;
      const matchMode =
        modeFilter === "all" ||
        (modeFilter === "online" && (t.online ?? t.mode_online)) ||
        (modeFilter === "offline" && (t.mode_offline ?? false));
      return matchQ && matchS && matchP && matchR && matchMode;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === "termurah") return (a.price_per_hour ?? a.price ?? 0) - (b.price_per_hour ?? b.price ?? 0);
      if (sortBy === "jarak_terdekat") {
        if (userLatitude == null || userLongitude == null) return 0;
        return (a.distance ?? Infinity) - (b.distance ?? Infinity);
      }
      if (sortBy === "jarak_terjauh") {
        if (userLatitude == null || userLongitude == null) return 0;
        return (b.distance ?? -Infinity) - (a.distance ?? -Infinity);
      }
      return (b.reviews ?? b.like_count ?? 0) - (a.reviews ?? a.like_count ?? 0);
    });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-32 md:pb-10">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{t("findTutor.title")}</h1>
          <p className="text-gray-500 text-sm">{t("findTutor.description")}</p>
        </div>

        {/* Search + Filter toggle */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("findTutor.searchPlaceholder")}
              className="bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none w-full"
            />
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showFilter
                ? "bg-blue-50 border-blue-300 text-blue-600"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <SlidersHorizontal size={15} />
            <span>{t("findTutor.filterButton")}</span>
          </button>
        </div>

        {/* Subject Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setFilterSubject(s === "Semua" ? "" : s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                activeSubject === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {subjectLabels[s]}
            </button>
          ))}
        </div>

        {/* Advanced Filter Panel */}
        {showFilter && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-5 grid sm:grid-cols-4 gap-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">{t("findTutor.location")}</label>
              <div className="text-sm text-gray-700 mb-2">{t("findTutor.locationPermissionHint")}</div>
              <button
                type="button"
                onClick={askUserLocation}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
              >
                <MapPin size={14} /> {t("findTutor.allowMyLocation")}
              </button>
              {userLatitude != null && userLongitude != null && (
                <p className="mt-2 text-xs text-gray-500">
                  {t("findTutor.yourLocation")}: {userLatitude.toFixed(5)}, {userLongitude.toFixed(5)}
                </p>
              )}
              {locationPermissionRequested && userLatitude == null && userLongitude == null && (
                <p className="mt-2 text-xs text-red-500">{t("findTutor.locationPermissionDenied")}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">{t("findTutor.maxPrice")}</label>
              <input
                type="range"
                min={30000}
                max={500000}
                step={10000}
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="text-sm font-semibold text-gray-800 mt-1">Rp {priceRange.toLocaleString("id-ID")}</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">{t("findTutor.mode")}</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: t("findTutor.all") },
                  { value: "online", label: t("findTutor.online") },
                  { value: "offline", label: t("findTutor.offline") },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setModeFilter(item.value as "all" | "online" | "offline")}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                      modeFilter === item.value
                        ? "bg-blue-50 text-blue-600 border-blue-300"
                        : "bg-white text-gray-500 border-gray-200 hover:text-gray-800"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">{t("findTutor.sortLabel")}</label>
              <div className="flex flex-col gap-1.5">
                {[
                  { val: "terpopuler", label: t("findTutor.sort.popular") },
                  { val: "rating", label: t("findTutor.sort.rating") },
                  { val: "termurah", label: t("findTutor.sort.price") },
                  { val: "jarak_terdekat", label: t("findTutor.sort.nearest") },
                  { val: "jarak_terjauh", label: t("findTutor.sort.farthest") },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setSortBy(opt.val)}
                    className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      sortBy === opt.val
                        ? "bg-blue-50 text-blue-600 border-blue-300"
                        : "bg-white text-gray-500 border-gray-200 hover:text-gray-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {(sortBy === "jarak_terdekat" || sortBy === "jarak_terjauh") && userLatitude == null && (
                <p className="mt-2 text-xs text-gray-500">{t("findTutor.sortByDistanceHint")}</p>
              )}
            </div>
          </div>
        )}

        {/* Result count */}
        <p className="text-sm text-gray-500 mb-4">
          <span className="font-semibold text-gray-800">{filtered.length}</span> {t("findTutor.tutorsFoundSuffix")}
        </p>

        {/* List — no card wrapper, just divider lines */}
        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0">
            {filtered.map((tutor: any) => (
              <TutorCardUI
                key={tutor.id}
                tutor={tutor}
                onView={() => onSelectTutor(tutor)}
                onBook={() => onBookTutor(tutor)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{t("findTutor.noResults")}</h3>
            <p className="text-gray-400 text-sm">{t("findTutor.noResultsHint")}</p>
          </div>
        )}
      </div>
    </div>
  );
}