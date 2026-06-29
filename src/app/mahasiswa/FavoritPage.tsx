import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Heart, ChevronLeft, Star, MapPin, Clock } from "lucide-react";
import { confirmAction, toastSuccess, toastError } from "../lib/swal";

type Page = "landing" | "cari-tutor" | "detail-tutor" | "booking" | "live-class" | "chat" | "dashboard-siswa" | "forum" | "about" | "progress" | "settings" | "login" | "register" | "video" | "upload-video" | "admin" | "login-google-otp" | "tutor-registration" | "booking-saya" | "riwayat-belajar" | "favorit" | "notifikasi" | "platform-admin" | "tutor-login" | "admin-login";

export default function FavoritPage(props: any) {
  const { apiFetch, navigate, onSelectTutor } = props;
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/favorites");
      const list = data.data ?? data ?? [];
      setFavorites(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(t("favoritesPage.loadFailed"), error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (tutorId: number) => {
    const confirmed = await confirmAction(
      t("favoritesPage.confirmRemove"),
      t("favoritesPage.confirmRemoveDescription")
    );
    if (!confirmed) return;

    try {
      await apiFetch(`/tutors/${tutorId}/favorite`, { method: "POST" });
      toastSuccess(t("favoritesPage.removeSuccess"));
      await loadFavorites();
    } catch (error) {
      console.error(t("favoritesPage.removeFailed"), error);
      toastError(t("favoritesPage.removeFailed"));
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  if (!favorites || favorites.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Back */}
          <button
            onClick={() => navigate?.("dashboard-siswa")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ChevronLeft size={16} /> {t("favoritesPage.back")}
          </button>

          <h1 className="text-lg xs:text-2xl font-extrabold text-gray-900 mb-6">{t("favoritesPage.title")}</h1>
          
          <div className="border border-gray-200 p-4 sm:p-8 text-center rounded">
            <Heart size={32} className="text-gray-300 mx-auto mb-3" />
            <div className="text-sm text-gray-400">{t("favoritesPage.emptyTitle")}</div>
            <button
              onClick={() => navigate?.("cari-tutor")}
              className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors rounded"
            >
              {t("favoritesPage.findTutor")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Back */}
        <button
          onClick={() => navigate?.("dashboard-siswa")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> {t("favoritesPage.back")}
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg xs:text-2xl font-extrabold text-gray-900">{t("favoritesPage.title")}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{t("favoritesPage.tutorCount", { count: favorites.length })}</p>
          </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 xs:gap-3">
          {favorites.map((f: any) => (
            <div
              key={f.id}
              className="border border-gray-200 p-3 xs:p-4 hover:border-gray-300 transition-colors rounded"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                {f.photo ? (
                  <img
                    src={f.photo}
                    alt={f.name}
                    className="w-12 xs:w-14 h-12 xs:h-14 object-cover bg-gray-100 shrink-0 rounded"
                  />
                ) : (
                  <div className="w-12 xs:w-14 h-12 xs:h-14 bg-blue-600 text-white flex items-center justify-center text-lg font-bold shrink-0 rounded">
                    {f.name?.charAt(0)?.toUpperCase() || "T"}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="text-xs xs:text-sm font-semibold text-gray-900 truncate">{f.name}</div>
                  <div className="text-[10px] xs:text-xs text-gray-500 truncate">
                    {f.subjects?.[0]?.name ?? f.subject ?? t("favoritesPage.subjectsFallback")}
                  </div>
                  {/* Rating & Location */}
                  <div className="flex items-center gap-1 xs:gap-2 mt-1 text-xs text-gray-400">
                    {f.rating && (
                      <span className="flex items-center gap-0.5">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        {f.rating}
                      </span>
                    )}
                    {f.city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin size={12} /> {f.city}
                      </span>
                    )}
                    {f.experience_years && (
                      <span className="flex items-center gap-0.5">
                        <Clock size={12} /> {t("favoritesPage.experienceYears", { years: f.experience_years })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    onSelectTutor?.(f);
                  }}
                  className="flex-1 px-2 xs:px-4 py-1 xs:py-1.5 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors rounded"
                >
                  {t("favoritesPage.profile")}
                </button>
                <button
                  onClick={() => removeFavorite(f.id)}
                  className="px-2 xs:px-3 py-1 xs:py-1.5 border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-1 rounded"
                >
                  <Heart size={14} className="fill-red-500 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
          {t("favoritesPage.tutorCount", { count: favorites.length })}
        </div>

      </div>
    </div>
  );
}