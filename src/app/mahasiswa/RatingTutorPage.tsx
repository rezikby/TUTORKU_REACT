import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, X } from "lucide-react";
import { toastError, toastSuccess } from "../lib/swal";

type RatingTutorPageProps = {
  bookingId: string | null;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  onClose: () => void;
  onSubmitted: () => void;
};

export default function RatingTutorPage({
  bookingId,
  apiFetch,
  onClose,
  onSubmitted,
}: RatingTutorPageProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoCloseSeconds, setAutoCloseSeconds] = useState(10);

  const handleSubmit = async () => {
    if (!bookingId) {
      setError(t("liveClass.reviewPopup.errorMessage"));
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await apiFetch(`/bookings/${bookingId}/review`, {
        method: "POST",
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
        }),
      });

      toastSuccess(t("liveClass.reviewPopup.successMessage"));
      onSubmitted();
    } catch (err: any) {
      const message = err?.message || t("liveClass.reviewPopup.errorMessage");
      setError(message);
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (submitting) return;
    if (autoCloseSeconds <= 0) {
      onClose();
      return;
    }

    const timer = window.setTimeout(() => {
      setAutoCloseSeconds((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [autoCloseSeconds, submitting, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">
              {t("liveClass.reviewPopup.title")}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {t("liveClass.reviewPopup.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 bg-slate-900/80 p-2 text-slate-300 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }, (_, index) => index + 1).map(
                (star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:-translate-y-0.5"
                  >
                    <Star
                      size={32}
                      className={`${
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-600"
                      } transition-colors`}
                    />
                  </button>
                ),
              )}
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {t("liveClass.reviewPopup.commentLabel")}
            </p>
          </div>

          <div>
            <label className="sr-only" htmlFor="rating-comment">
              {t("liveClass.reviewPopup.commentLabel")}
            </label>
            <textarea
              id="rating-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={t("liveClass.reviewPopup.commentPlaceholder")}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
            <div className="mt-2 text-right text-xs text-slate-500">
              {comment.length}/1000
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            {t("liveClass.reviewPopup.skipButton")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? t("liveClass.reviewPopup.submitting")
              : t("liveClass.reviewPopup.submitButton")}
          </button>
        </div>
        <div className="mt-3 text-right text-xs text-slate-500">
          {t("liveClass.reviewPopup.autoCloseMessage", {
            seconds: autoCloseSeconds,
          })}
        </div>
      </div>
    </div>
  );
}
