// frontend/src/app/TUTORKU/CariTutorPage.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Filter, MapPin, Star, Clock, GraduationCap, ChevronDown } from "lucide-react";

type Page = "landing" | "cari-tutor" | "detail-tutor" | "booking" | "live-class" | "chat" | "dashboard-siswa" | "forum" | "about" | "progress" | "settings" | "login" | "register" | "video" | "upload-video" | "admin" | "login-google-otp" | "tutor-registration" | "booking-saya" | "riwayat-belajar" | "favorit" | "notifikasi" | "platform-admin" | "tutor-login" | "admin-login";

type Tutor = {
  id: number;
  name: string;
  photo?: string | null;
  headline?: string | null;
  bio?: string | null;
  subjects?: { name: string }[];
  subject_label?: string | null;
  price_per_hour?: number;
  experience_years?: number;
  experience_label?: string | null;
  city?: string | null;
  province?: string | null;
  location?: string | null;
  levels?: string[];
  level_label?: string | null;
  mode_online?: boolean;
  mode_offline?: boolean;
  online?: boolean;
  badge?: string | null;
  verified?: boolean;
  rating?: number;
  reviews?: number;
  like_count?: number;
  dislike_count?: number;
  view_count?: number;
  my_vote?: "like" | "dislike" | null;
  is_favorited?: boolean;
  subject?: string | null;
  price?: number;
  experience?: string | null;
  level?: string | null;
  availabilities?: { day_of_week: number; start_time: string; end_time: string; is_active: boolean }[];
};

interface CariTutorPageProps {
  tutors: Tutor[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterSubject: string;
  setFilterSubject: (s: string) => void;
  onSelectTutor: (tutor: Tutor) => void;
  navigate: (p: Page) => void;
}

export default function CariTutorPage({
  tutors,
  searchQuery,
  setSearchQuery,
  filterSubject,
  setFilterSubject,
  onSelectTutor,
  navigate,
}: CariTutorPageProps) {
  const { t } = useTranslation();
  const [priceFilter, setPriceFilter] = useState(170000);
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [modeFilter, setModeFilter] = useState<"online" | "offline" | "keduanya">("keduanya");
  const [sortBy, setSortBy] = useState<"rating" | "price" | "experience">("rating");

  const filteredTutors = tutors.filter((tutor) => {
    const matchSearch = tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subject_label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subjects?.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchPrice = (tutor.price_per_hour || tutor.price || 0) <= priceFilter;
    
    const matchRating = !ratingFilter || (tutor.rating || 0) >= ratingFilter;
    
    const matchMode = modeFilter === "keduanya" ||
      (modeFilter === "online" && tutor.mode_online) ||
      (modeFilter === "offline" && tutor.mode_offline);
    
    return matchSearch && matchPrice && matchRating && matchMode;
  });

  const sortedTutors = [...filteredTutors].sort((a, b) => {
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "price") return (a.price_per_hour || a.price || 0) - (b.price_per_hour || b.price || 0);
    return (b.experience_years || 0) - (a.experience_years || 0);
  });

  const subjects = [...new Set(tutors.flatMap(t => 
    t.subjects?.map(s => s.name) || [t.subject_label || t.subject || ""]
  ))].filter(Boolean);

  return (
    <div className="min-h-screen" style={{ background: "#F2F6FF" }}>
      <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 lg:px-6 xl-2xl:px-8 py-4 xs:py-6 pb-32 md:pb-8">
        
        {/* HEADER */}
        <div className="mb-4 xs:mb-6">
          <h1 className="text-lg xs:text-2xl font-bold text-gray-900">{t("findTutor.title")}</h1>
          <p className="text-xs xs:text-sm text-gray-500 mt-1">{t("findTutor.description")}</p>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white rounded-lg xs:rounded-xl md:rounded-2xl p-3 xs:p-4 border border-gray-200 mb-4 xs:mb-6">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 xs:left-3 top-1/2 -translate-y-1/2 text-gray-400 xs:w-4 xs:h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("findTutor.searchPlaceholder")}
              className="w-full pl-7 xs:pl-10 pr-3 xs:pr-4 py-2 xs:py-2.5 text-xs xs:text-sm bg-gray-50 rounded-md xs:rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-lg xs:rounded-xl md:rounded-2xl p-3 xs:p-4 border border-gray-200 mb-4 xs:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 xs:gap-3 md:gap-4">
            {/* Price Filter */}
            <div>
              <label className="text-[10px] xs:text-xs font-semibold text-gray-500 uppercase tracking-wider block">{t("findTutor.maxPrice")}</label>
              <div className="flex items-center gap-2 xs:gap-3 mt-1.5">
                <input
                  type="range"
                  min="50000"
                  max="500000"
                  step="10000"
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(Number(e.target.value))}
                  className="flex-1 accent-[#2563EB] h-1 xs:h-2"
                />
                <span className="text-[9px] xs:text-sm font-semibold text-[#2563EB] min-w-[50px] xs:min-w-[70px] text-right">Rp {priceFilter.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="text-[10px] xs:text-xs font-semibold text-gray-500 uppercase tracking-wider block">{t("findTutor.ratingMin")}</label>
              <div className="flex gap-1 xs:gap-2 mt-1.5 flex-wrap">
                {[0, 3, 4, 4.5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRatingFilter(r === ratingFilter ? 0 : r)}
                    className={`px-2 xs:px-3 py-0.5 xs:py-1 rounded text-[9px] xs:text-sm font-medium transition-all whitespace-nowrap ${
                      ratingFilter === r
                        ? "bg-[#2563EB] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {r === 0 ? t("findTutor.all") : `${r}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Filter */}
            <div>
              <label className="text-[10px] xs:text-xs font-semibold text-gray-500 uppercase tracking-wider block">{t("findTutor.mode")}</label>
              <div className="flex gap-1 xs:gap-2 mt-1.5 flex-wrap">
                {["online", "offline", "keduanya"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setModeFilter(mode as typeof modeFilter)}
                    className={`px-2 xs:px-3 py-0.5 xs:py-1 rounded text-[9px] xs:text-sm font-medium transition-all capitalize whitespace-nowrap ${
                      modeFilter === mode
                        ? "bg-[#2563EB] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {mode === "keduanya" ? t("findTutor.both") : t(`findTutor.${mode}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RESULT COUNT & SORT */}
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3 mb-4 xs:mb-6">
          <span className="text-xs xs:text-sm text-gray-600">
            {t("findTutor.results", { count: sortedTutors.length })}
          </span>
          <div className="flex items-center gap-1.5 xs:gap-2 w-full xs:w-auto">
            <span className="text-[10px] xs:text-xs text-gray-500 whitespace-nowrap">{t("findTutor.sortLabel")}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs xs:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded px-2 xs:px-3 py-1 xs:py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB] flex-1 xs:flex-auto"
            >
              <option value="rating">{t("findTutor.sort.rating")}</option>
              <option value="price">{t("findTutor.sort.price")}</option>
              <option value="experience">{t("findTutor.sort.experience")}</option>
            </select>
          </div>
        </div>

        {/* TUTOR LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 xs:gap-3 md:gap-4">
          {sortedTutors.map((tutor) => (
            <div
              key={tutor.id}
              className="bg-white rounded-lg xs:rounded-xl md:rounded-2xl p-3 xs:p-4 border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => { onSelectTutor(tutor); }}
            >
              <div className="flex items-start gap-2 xs:gap-3">
                <img
                  src={tutor.photo || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format"}
                  alt={tutor.name}
                  className="w-12 xs:w-14 h-12 xs:h-14 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 xs:gap-2 flex-wrap">
                    <h3 className="font-semibold text-xs xs:text-base text-gray-900 truncate">{tutor.name}</h3>
                    {tutor.verified && (
                      <span className="text-[#2563EB] text-[8px] xs:text-xs bg-[#2563EB]/10 px-1.5 xs:px-2 py-0.5 rounded-full whitespace-nowrap">✓ {t("findTutor.verified")}</span>
                    )}
                  </div>
                  <p className="text-[10px] xs:text-sm text-gray-500 line-clamp-1">{tutor.subject_label || tutor.subject || t("findTutor.subjectPlaceholder")}</p>
                  <div className="flex items-center gap-0.5 xs:gap-1 text-[9px] xs:text-sm text-gray-600 mt-0.5 xs:mt-1 flex-wrap">
                    <Star size={12} className="xs:w-3.5 xs:h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                    <span className="font-semibold">{tutor.rating || 0}</span>
                    <span className="text-gray-400">({tutor.reviews || 0})</span>
                    <span className="mx-0.5 xs:mx-1">•</span>
                    <MapPin size={12} className="xs:w-3.5 xs:h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{tutor.city || tutor.province || t("findTutor.location")}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 xs:gap-2 mt-1 xs:mt-2">
                    {tutor.levels?.slice(0, 2).map((level) => (
                      <span key={level} className="text-[7px] xs:text-xs bg-gray-100 text-gray-600 px-1.5 xs:px-2 py-0.5 rounded-full whitespace-nowrap">
                        {level}
                      </span>
                    ))}
                    {tutor.experience_years && (
                      <span className="text-[7px] xs:text-xs bg-gray-100 text-gray-600 px-1.5 xs:px-2 py-0.5 rounded-full whitespace-nowrap">
                        {t("findTutor.experienceYears", { years: tutor.experience_years })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col xs:flex-row items-start xs:items-center xs:justify-between gap-2 xs:gap-3 mt-2 xs:mt-4 pt-2 xs:pt-4 border-t border-gray-100">
                <div className="text-base xs:text-lg font-bold text-[#2563EB]">
                  Rp {(tutor.price_per_hour || tutor.price || 0).toLocaleString("id-ID")}
                  <span className="text-[8px] xs:text-xs font-normal text-gray-400">{t("findTutor.perSession")}</span>
                </div>
                <div className="flex gap-1 xs:gap-2 w-full xs:w-auto">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectTutor(tutor); }}
                    className="flex-1 xs:flex-auto px-2 xs:px-4 py-1 xs:py-1.5 text-xs xs:text-sm font-medium text-[#2563EB] border border-[#2563EB] rounded hover:bg-[#2563EB] hover:text-white transition-all"
                  >
                    {t("findTutor.viewProfile")}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectTutor(tutor); navigate("booking"); }}
                    className="flex-1 xs:flex-auto px-2 xs:px-4 py-1 xs:py-1.5 text-xs xs:text-sm font-medium bg-[#2563EB] text-white rounded hover:bg-[#1D4ED8] transition-all"
                  >
                    {t("findTutor.bookButton")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedTutors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t("findTutor.noResults")}</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setPriceFilter(170000);
                setRatingFilter(0);
                setModeFilter("keduanya");
              }}
              className="mt-4 text-[#2563EB] font-medium hover:underline"
            >
              {t("findTutor.resetFilters")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}