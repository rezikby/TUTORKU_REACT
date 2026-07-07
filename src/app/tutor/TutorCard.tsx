import React, { useState } from "react";
import { Star, MapPin, Clock, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface Tutor {
  id: string | number;
  name: string;
  photo?: string | null;
  online?: boolean;
  mode_online?: boolean;
  mode_offline?: boolean;
  verified?: boolean;
  badge?: string | null;
  subject?: string | null;
  subject_label?: string | null;
  rating?: number;
  reviews?: number;
  location?: string | null;
  city?: string | null;
  experience_label?: string | null;
  experience_years?: number;
  level_label?: string | null;
  level?: string | null;
  levels?: string[];
  price?: number;
  price_per_hour?: number;
}

interface TutorCardProps {
  tutor: Tutor;
  onView?: () => void;
  onBook?: () => void;
}

function formatPrice(value: number) {
  return value.toLocaleString("id-ID");
}

export default function TutorCard({
  tutor,
  onView,
  onBook,
}: TutorCardProps) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);

  const subject = tutor.subject ?? tutor.subject_label ?? t("findTutor.subjectGeneral");
  const location = tutor.location ?? tutor.city ?? t("findTutor.online");
  const experience = t("findTutor.experienceYears", { years: tutor.experience_years ?? 0 });
  const level = tutor.level_label ?? tutor.level ?? t("findTutor.allLevels");
  const price = formatPrice(tutor.price ?? tutor.price_per_hour ?? 0);
  const online = tutor.online ?? tutor.mode_online ?? false;
  const offline = tutor.mode_offline ?? false;
  const modeLabel = online && offline
    ? t("findTutor.modeOnlineOffline")
    : online
    ? t("findTutor.online")
    : offline
    ? t("findTutor.offline")
    : t("findTutor.modeUnknown");
  const badge = tutor.badge ?? (tutor.verified ? t("findTutor.topTutor") : null);

  return (
    <div className="bg-white p-3">
      <div className="flex gap-3">
        <div className="relative shrink-0">
          {tutor.photo && !imageError ? (
            <img
              src={tutor.photo}
              onError={() => setImageError(true)}
              alt={tutor.name}
              className="w-[72px] h-[72px] rounded-lg object-cover bg-gray-200"
            />
          ) : (
            <div
              className="
                w-[72px]
                h-[72px]
                rounded-lg
                bg-blue-600
                text-white
                flex
                items-center
                justify-center
                text-2xl
                font-bold
              "
            >
              {tutor.name?.charAt(0)?.toUpperCase() || "T"}
            </div>
          )}

          {online && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-[18px] leading-tight text-gray-900 truncate">
                {tutor.name}
              </h3>

              <p className="text-sm text-slate-500 mt-1 truncate">
                {subject}
              </p>
            </div>

            {badge && (
              <span className="text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-600 whitespace-nowrap">
                {badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-2">
            <Star
              size={14}
              className="fill-yellow-400 text-yellow-400"
            />

            <span className="text-sm font-medium text-gray-900">
              {tutor.rating ?? 0}
            </span>

            <span className="text-sm text-gray-500">
              ({tutor.reviews ?? 0})
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3 pb-3 border-b border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <MapPin size={12} />
          <span>{location}</span>
        </div>

        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{experience}</span>
        </div>

        <div className="flex items-center gap-1">
          <BookOpen size={12} />
          <span>{level}</span>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-700">
          {modeLabel}
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center gap-2">
        <div>
          <span className="text-lg font-bold text-gray-900">
            Rp {price}
          </span>

          <span className="text-[10px] text-gray-500 ml-1">
            {t("findTutor.perSession")}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onView}
            className="
              h-8
              px-3
              text-xs
              border
              border-gray-300
              rounded-md
              text-gray-700
              hover:bg-gray-50
              transition
            "
          >
            {t("findTutor.viewProfile")}
          </button>

          <button
            onClick={onBook}
            className="
              h-8
              px-3
              text-xs
              rounded-md
              bg-blue-600
              text-white
              hover:bg-blue-700
              transition
            "
          >
            {t("findTutor.bookButton")}
          </button>
        </div>
      </div>
    </div>
  );
}