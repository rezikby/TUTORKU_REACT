import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, X } from "lucide-react";
import { toastError, toastSuccess } from "../lib/swal";

const API_ROOT = (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/?$/, "") ?? "https://rezi-laravel.nlabs.id";

interface WebsiteRatingPopupProps {
  bookingId?: number;
  onClose: () => void;
}

export default function WebsiteRatingPopup({
  bookingId,
  onClose,
}: WebsiteRatingPopupProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const apiFetch = async (path: string, options?: any) => {
    const token = localStorage.getItem("TUTORKU_token") || localStorage.getItem("auth_token");
    const headers: any = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(`${API_ROOT}/api${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "API Error");
    }

    return response.json();
  };

  const handleSubmit = async () => {
    if (rating < 1) {
      toastError(t("websiteRatingPopup.validation.selectRating"));
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/website/ratings", {
        method: "POST",
        body: JSON.stringify({
          rating,
          review: review.trim() || null,
          booking_id: bookingId || null,
        }),
      });

      toastSuccess(t("websiteRatingPopup.successMessage"));
      onClose();
    } catch (error: any) {
      toastError(error.message || t("websiteRatingPopup.errorMessage"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {t("websiteRatingPopup.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          {t("websiteRatingPopup.subtitle")}
        </p>

        {/* Rating Stars */}
        <div className="flex gap-2 mb-6 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={`${
                  star <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                } transition-colors`}
              />
            </button>
          ))}
        </div>

        {/* Review Text */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("websiteRatingPopup.reviewLabel")}
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder={t("websiteRatingPopup.reviewPlaceholder")}
            maxLength={500}
            rows={4}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {review.length}/500
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors rounded"
          >
            {t("websiteRatingPopup.skipButton")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 rounded"
          >
            {submitting ? t("websiteRatingPopup.savingButton") : t("websiteRatingPopup.submitButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
