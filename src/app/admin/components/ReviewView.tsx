// frontend/src/app/admin/components/ReviewView.tsx
import { useEffect, useState } from "react";
import { Star, User, Calendar, MessageSquare, StarHalf } from "lucide-react";
import { adminApiFetch } from "../adminApi";

type Review = {
  id: number;
  student: { name: string } | null;
  rating: number;
  comment: string | null;
  created_at: string;
};

export default function ReviewView() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApiFetch("/tutor/reviews?per_page=20")
      .then((data) => {
        const reviewsPayload = data.data ?? data;
        setReviews(Array.isArray(reviewsPayload) ? reviewsPayload : reviewsPayload.data ?? []);
      })
      .catch((error) => console.error(error))
      .finally(() => setIsLoading(false));
  }, []);

  const formatDate = (date: string) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.round(r.rating) === star).length,
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Ulasan</h2>
          <p className="text-sm text-gray-400 mt-0.5">Lihat ulasan dari murid-muridmu</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">{averageRating.toFixed(1)}</div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={14}
                  className={i <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                />
              ))}
            </div>
            <div className="text-xs text-gray-400">{reviews.length} ulasan</div>
          </div>
        </div>
      </div>

      {/* Rating Summary */}
      {reviews.length > 0 && (
        <div className="border border-gray-200 p-4 mb-6 rounded bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{reviews.length} ulasan</div>
              </div>
              <div className="flex-1 space-y-1">
                {ratingDistribution.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-3 text-right">{star}</span>
                    <Star size={11} className="fill-yellow-400 text-yellow-400 shrink-0" />
                    <div className="flex-1 h-1.5 bg-gray-200 rounded overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded" 
                        style={{ width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` }} 
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="border border-gray-200 p-4 text-center text-sm text-gray-400 rounded">
          Memuat ulasan...
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="border border-gray-200 p-4 hover:border-gray-300 transition-colors rounded">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold rounded-full shrink-0">
                    {getInitials(r.student?.name ?? "")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.student?.name ?? "Siswa"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">({r.rating})</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                  <Calendar size={12} />
                  {formatDate(r.created_at)}
                </span>
              </div>
              {r.comment && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600 leading-relaxed">"{r.comment}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-gray-200 p-8 text-center rounded">
          <MessageSquare size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Belum ada ulasan</p>
          <p className="text-xs text-gray-400 mt-1">Ulasan dari murid akan muncul di sini</p>
        </div>
      )}

      {/* Footer */}
      {reviews.length > 0 && (
        <div className="mt-4 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
          {reviews.length} ulasan
        </div>
      )}
    </div>
  );
}