import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Play, Calendar, User, Eye, ChevronLeft, ThumbsUp, ThumbsDown, MessageCircle, Share2, Tv } from "lucide-react";
import { alertError } from "../lib/swal";

interface CommentItem {
  id: number;
  author: string;
  text: string;
  created_at?: string;
}

interface Video {
  id: number;
  title: string;
  description: string | null;
  comments_enabled?: boolean;
  subject: { name: string } | string | null;
  uploader?: string | null;
  file_url: string | null;
  thumbnail_url?: string | null;
  views?: number;
  likes?: number;
  dislikes?: number;
  comments_count?: number;
  my_reaction?: "like" | "dislike" | null;
  comments?: CommentItem[];
  created_at: string;
  duration?: string;
  tutor_profile_id?: number;
  tutor?: { id: number; name?: string | null; photo?: string | null } | null;
}

type VideoBookingTutor = {
  id: number;
  name: string;
  photo?: string | null;
};

interface VideoDetailPageProps {
  videoId: number;
  onClose: () => void;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  navigate?: (page: any) => void;
  onBookTutor?: (tutor: VideoBookingTutor) => void;
}

export default function VideoDetailPage({ videoId, onClose, apiFetch, navigate, onBookTutor }: VideoDetailPageProps) {
  const { t, i18n } = useTranslation();
  const [video, setVideo] = useState<Video | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<number>(videoId);
  const [isLoading, setIsLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);

  const loadVideoDetail = async (id: number) => {
    setIsLoading(true);
    try {
      const detail = await apiFetch(`/materials/${id}`);
      setVideo(detail);
      setLikes(detail.likes ?? 0);
      setDislikes(detail.dislikes ?? 0);
      setUserReaction(detail.my_reaction ?? null);
      setComments(detail.comments ?? []);

      try {
        await apiFetch(`/materials/${id}/views`, {
          method: "POST",
        });
      } catch (error) {
        console.warn("Failed to track view:", error);
      }
    } catch (error) {
      console.error("Failed to load video detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentVideoId(videoId);
  }, [videoId]);

  useEffect(() => {
    loadVideoDetail(currentVideoId);
  }, [currentVideoId]);

  useEffect(() => {
    if (!video) {
      setRecommendedVideos([]);
      return;
    }

    const loadRecommended = async () => {
      try {
        const data = await apiFetch(`/materials?per_page=6`);
        const items = Array.isArray(data)
          ? data
          : data?.data ?? [];

        const subjectName = typeof video.subject === "string" ? video.subject.toLowerCase() : video.subject?.name?.toLowerCase() ?? "";
        const recommended = (items as Video[])
          .filter((item) => item.id !== video.id)
          .filter((item) => {
            const itemSubject = typeof item.subject === "string" ? item.subject.toLowerCase() : item.subject?.name?.toLowerCase() ?? "";
            return subjectName && itemSubject === subjectName;
          })
          .slice(0, 4);

        setRecommendedVideos(recommended);
      } catch (error) {
        console.warn("Failed to load recommended videos:", error);
        setRecommendedVideos([]);
      }
    };

    loadRecommended();
  }, [video, apiFetch]);

  useEffect(() => {
    if (!showShareToast) return;
    const timer = window.setTimeout(() => setShowShareToast(false), 1800);
    return () => window.clearTimeout(timer);
  }, [showShareToast]);

  const handleReaction = async (reaction: "like" | "dislike") => {
    if (!video) return;

    try {
      const data = await apiFetch(`/materials/${video.id}/${reaction}`, {
        method: "POST",
      });
      setLikes(data.likes ?? likes);
      setDislikes(data.dislikes ?? dislikes);
      setUserReaction(data.my_reaction ?? null);
    } catch (error) {
      console.error("Failed to save reaction:", error);
      alertError(t("videoPage.reactionLogin"));
    }
  };

  const handleAddComment = async () => {
    if (!video || !commentText.trim()) return;

    try {
      const data = await apiFetch(`/materials/${video.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: commentText.trim() }),
      });

      setComments((prev) => [
        ...prev,
        { id: data.id, author: data.author, text: data.text, created_at: data.created_at },
      ]);
      setCommentText("");
      setVideo((current) =>
        current ? { ...current, comments_count: data.comments_count } : current,
      );
    } catch (error) {
      console.error("Failed to add comment:", error);
      alertError(t("videoPage.commentLogin"));
    }
  };

  const handleShare = async () => {
    if (!video) return;
    const url = `${window.location.origin}/video/${video.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: video.title, text: video.description || "", url });
      } catch {
        // ignored
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
    setShowShareToast(true);
  };

  const subjectName = video ? (typeof video.subject === "string" ? video.subject : video.subject?.name ?? null) : null;

  const formatDate = (date: string) => {
    if (!date) return "-";
    const d = new Date(date);
    const locale = i18n.language?.startsWith("en") ? "en-US" : "id-ID";
    return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  };

  const descriptionText = video?.description ?? "";
  const isDescriptionLong = descriptionText.length > 240;
  const displayedDescription = showFullDescription || !isDescriptionLong
    ? descriptionText
    : `${descriptionText.slice(0, 240).trim()}...`;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-gray-400 text-sm">{t("videoPage.loadDetailLoading")}</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-medium mb-4">{t("videoPage.notFound")}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2563EB] text-white text-sm"
          >
            {t("videoPage.close")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="max-w-6xl mx-auto px-2 xs:px-3 sm:px-4 py-3 xs:py-6">
        {/* Header */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-4 py-1.5 xs:py-2 text-gray-600 mb-3 xs:mb-4 text-xs xs:text-sm"
        >
          <ChevronLeft size={14} className="xs:w-4 xs:h-4" />
          {t("videoPage.back")}
        </button>

        <div className="grid gap-3 xs:gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            {/* Video Player */}
            <div className="aspect-video bg-gray-100 flex items-center justify-center mb-4 xs:mb-6 overflow-hidden border border-gray-200">
              {video.file_url ? (
                <video
                  src={video.file_url}
                  controls
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  poster={video.thumbnail_url || undefined}
                />
              ) : (
                <div className="text-center text-gray-400">
                  <Play size={28} className="mx-auto mb-2 text-gray-300 xs:w-7 xs:h-7" />
                  <p className="text-xs xs:text-sm">{t("videoPage.unavailable")}</p>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="border-b border-gray-200 pb-4 xs:pb-6 mb-4 xs:mb-6">
              {/* Title & Actions Row */}
              <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2 xs:gap-3 mb-2 xs:mb-3">
                <h1 className="text-base xs:text-2xl font-bold text-gray-900 flex-1 min-w-[200px]">
                  {video.title}
                </h1>
                
                {/* Actions - Responsive */}
                <div className="flex flex-wrap items-center gap-1 xs:gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleReaction("like")}
                    className={`flex items-center gap-0.5 xs:gap-1 px-2 xs:px-3 py-1 xs:py-1.5 border text-[10px] xs:text-xs rounded ${
                      userReaction === "like"
                        ? "border-[#2563EB] bg-[#2563EB] text-white"
                        : "border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    <ThumbsUp size={12} className={`xs:w-4 xs:h-4 ${userReaction === "like" ? "fill-white" : "fill-[#2563EB] text-[#2563EB]"}`} />
                    <span className="hidden xs:inline">{likes}</span>
                  </button>

                  <button
                    onClick={() => handleReaction("dislike")}
                    className={`flex items-center gap-0.5 xs:gap-1 px-2 xs:px-3 py-1 xs:py-1.5 border text-[10px] xs:text-xs rounded ${
                      userReaction === "dislike"
                        ? "border-[#2563EB]/50 bg-[#2563EB]/50 text-white"
                        : "border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    <ThumbsDown size={12} className={`xs:w-4 xs:h-4 ${userReaction === "dislike" ? "fill-white" : "fill-[#2563EB]/50 text-[#2563EB]/50"}`} />
                    <span className="hidden xs:inline">{dislikes}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (video?.tutor_profile_id && onBookTutor) {
                        onBookTutor({
                          id: video.tutor_profile_id,
                          name: video.tutor?.name ?? video.uploader ?? t("videoPage.uploaderFallback"),
                          photo: video.tutor?.photo ?? null,
                        });
                      }
                    }}
                    className="flex items-center gap-0.5 xs:gap-1 px-2 xs:px-3 py-1 xs:py-1.5 border border-[#2563EB] bg-[#2563EB] text-white text-[10px] xs:text-xs rounded"
                  >
                    <Calendar size={12} className="xs:w-4 xs:h-4 fill-white" />
                    <span className="hidden xs:inline">{t("videoPage.booking")}</span>
                  </button>

                  <button
                    onClick={() => navigate && navigate("chat")}
                    className="flex items-center gap-0.5 xs:gap-1 px-2 xs:px-3 py-1 xs:py-1.5 border border-green-500 bg-green-500 text-white text-[10px] xs:text-xs rounded"
                  >
                    <MessageCircle size={12} className="xs:w-4 xs:h-4 fill-white" />
                    <span className="hidden xs:inline">{t("videoPage.chat")}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-0.5 xs:gap-1 px-2 xs:px-3 py-1 xs:py-1.5 border border-gray-300 bg-gray-100 text-gray-600 text-[10px] xs:text-xs rounded"
                  >
                    <Share2 size={12} className="xs:w-4 xs:h-4 fill-gray-400" />
                    <span className="hidden xs:inline">{t("videoPage.share")}</span>
                  </button>
                </div>
              </div>

              {/* Meta Info - Responsive text sizing */}
              <div className="flex flex-wrap items-center gap-2 xs:gap-3 text-[10px] xs:text-xs text-gray-400 font-normal">
                <span className="flex items-center gap-0.5 xs:gap-1">
                  <User size={10} className="xs:w-3 xs:h-3 text-gray-400" />
                  {video.uploader || t("videoPage.uploaderFallback")}
                </span>
                <span className="flex items-center gap-0.5 xs:gap-1">
                  <Calendar size={10} className="xs:w-3 xs:h-3 text-gray-400" />
                  {formatDate(video.created_at)}
                </span>
                <span className="flex items-center gap-0.5 xs:gap-1">
                  <Eye size={10} className="xs:w-3 xs:h-3 text-gray-400" />
                  {t("videoPage.views", { count: video.views || 0 })}
                </span>
                {subjectName && (
                  <span className="flex items-center gap-0.5 xs:gap-1">
                    <Play size={10} className="xs:w-3 xs:h-3 text-gray-400" />
                    {subjectName}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {video.description && (
              <div className="mb-4 xs:mb-6">
                <h3 className="text-xs xs:text-sm font-semibold text-gray-900 mb-1.5 xs:mb-2">{t("videoPage.descriptionTitle")}</h3>
                <p className="text-xs xs:text-sm text-gray-600 whitespace-pre-wrap">{displayedDescription}</p>
                {isDescriptionLong && (
                  <button
                    onClick={() => setShowFullDescription((current) => !current)}
                    className="mt-2 xs:mt-3 text-xs xs:text-sm font-medium text-[#2563EB]"
                  >
                    {showFullDescription ? t("videoPage.showLess") : t("videoPage.showMore")}
                  </button>
                )}
              </div>
            )}

            {/* Comments */}
            <div className="border-t border-gray-200 pt-4 xs:pt-6">
              <div className="flex items-center gap-1.5 xs:gap-2 mb-3 xs:mb-4">
                <MessageCircle size={16} className="xs:w-5 xs:h-5 text-[#2563EB]" />
                <h3 className="text-xs xs:text-sm font-semibold text-gray-900">
                  {t("videoPage.commentsTitle")}{video.comments_enabled === false ? ` (${t("videoPage.commentsDisabledShort")})` : ""}
                </h3>
              </div>

              {video.comments_enabled !== false ? (
                <>
                  <div className="mb-3 xs:mb-4 flex gap-2 xs:gap-3">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={2}
                      placeholder={t("videoPage.commentPlaceholder")}
                      className="flex-1 border border-gray-200 px-2 xs:px-3 py-1.5 xs:py-2 text-xs xs:text-sm outline-none focus:border-[#2563EB]"
                    />
                    <button
                      onClick={handleAddComment}
                      className="px-2 xs:px-4 py-1 xs:py-2 bg-[#2563EB] text-white text-xs xs:text-sm"
                    >
                      {t("videoPage.send")}
                    </button>
                  </div>

                  <div className="space-y-2 xs:space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-xs xs:text-sm text-gray-400 text-center py-3 xs:py-4">{t("videoPage.noComments")}</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="border border-gray-200 p-2 xs:p-3 bg-gray-50">
                          <p className="text-xs xs:text-sm font-medium text-gray-900">{comment.author}</p>
                          <p className="text-xs text-gray-600 mt-0.5 xs:mt-1">{comment.text}</p>
                          {comment.created_at && (
                            <p className="text-[10px] xs:text-xs text-gray-400 mt-1 xs:mt-2">
                              {formatDate(comment.created_at)}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs xs:text-sm text-gray-500">{t("videoPage.commentsDisabledFull")}</p>
              )}
            </div>
          </div>

          <aside className="space-y-2 xs:space-y-4">
            {/* Recommended Box */}
            <div className="bg-[#2563EB] p-3 xs:p-4">
              <h3 className="text-xs xs:text-sm font-semibold text-white mb-2 xs:mb-3">{t("videoPage.recommendations")}</h3>
              {recommendedVideos.length === 0 ? (
                <p className="text-xs xs:text-sm text-white/80">{t("videoPage.noRecommendations")}</p>
              ) : (
                <div className="space-y-1.5 xs:space-y-3">
                  {recommendedVideos.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setShowFullDescription(false);
                        setCurrentVideoId(item.id);
                      }}
                      type="button"
                      className="w-full text-left bg-white p-2 xs:p-3"
                    >
                      <div className="text-xs xs:text-sm font-semibold text-gray-900 line-clamp-2">{item.title}</div>
                      <div className="text-[10px] xs:text-xs text-[#2563EB] mt-0.5 xs:mt-1">{typeof item.subject === 'string' ? item.subject : item.subject?.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {showShareToast && (
        <div className="fixed bottom-4 right-4 bg-[#2563EB] text-white text-xs xs:text-sm px-3 xs:px-4 py-1.5 xs:py-2 rounded">
          {t("videoPage.shareCopied")}
        </div>
      )}
    </div>
  );
}