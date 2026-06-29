import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Play, Calendar, User, Eye, ChevronLeft, Search, ThumbsUp, ThumbsDown, Share2 } from "lucide-react";
import VideoDetailPage from "../mahasiswa/VideoDetailPage";
import { alertError, alertSuccess } from "../lib/swal";

type Page = string;

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
  levels?: string[] | string | null;
  level?: string[] | string | null;
  jenjang?: string[] | string | null;
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
}

type VideoBookingTutor = {
  id: number;
  name: string;
  photo?: string | null;
};

interface VideoPageProps {
  navigate: (page: any) => void;
  videoId?: string;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  setSelectedTutor: (tutor: VideoBookingTutor) => void;
}

export default function VideoPage({ navigate, videoId, apiFetch, setSelectedTutor }: VideoPageProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en-US" : "id-ID";
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredVideoId, setHoveredVideoId] = useState<number | null>(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

  const handleSelectVideo = (video: Video) => {
    setSelectedVideoId(video.id);
  };

  useEffect(() => {
    const loadVideos = async () => {
      setIsLoading(true);
      try {
        const data = await apiFetch("/materials?per_page=24");
        const videoData = Array.isArray(data) ? data : data.data || [];
        setVideos(videoData);

        const initialVideo = videoId
          ? videoData.find((v: Video) => v.id === parseInt(videoId, 10))
          : videoData[0];

        if (initialVideo) {
          setSelectedVideo(initialVideo);
          if (videoId) {
            setSelectedVideoId(initialVideo.id);
          }
        }
      } catch (error) {
        console.error("Gagal memuat video:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVideos();
  }, [videoId, apiFetch]);


  useEffect(() => {
    if (!showShareToast) return;
    const timer = window.setTimeout(() => setShowShareToast(false), 1800);
    return () => window.clearTimeout(timer);
  }, [showShareToast]);

  const getSubjectName = (subject: Video["subject"]) => {
    if (!subject) return "Materi";
    if (typeof subject === "string") return subject;
    return subject.name || "Materi";
  };


  const filteredVideos = videos
    .filter((video) =>
      (video.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSubjectName(video.subject).toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 3);

  const heroVideo = selectedVideo ?? filteredVideos[0] ?? null;
  const recommendedVideos = filteredVideos.filter((video) => video.id !== heroVideo?.id).slice(0, 8);

  const formatViews = (count?: number) => {
    if (!count) return t("videoPage.viewsCountZero", { count: 0 });
    if (count >= 1000000) return t("videoPage.viewsShortM", { count: Math.round(count / 1000000) });
    if (count >= 1000) return t("videoPage.viewsShortK", { count: Math.round(count / 1000) });
    return t("videoPage.views", { count });
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  };

  const timeAgo = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return t("videoPage.timeAgo.today");
    if (diff === 1) return t("videoPage.timeAgo.yesterday");
    if (diff < 7) return t("videoPage.timeAgo.daysAgo", { count: diff });
    if (diff < 30) return t("videoPage.timeAgo.weeksAgo", { count: Math.floor(diff / 7) });
    if (diff < 365) return t("videoPage.timeAgo.monthsAgo", { count: Math.floor(diff / 30) });
    return t("videoPage.timeAgo.yearsAgo", { count: Math.floor(diff / 365) });
  };

  const handleReaction = async (reaction: "like" | "dislike") => {
    if (!heroVideo) return;

    try {
      const data = await apiFetch(`/materials/${heroVideo.id}/${reaction}`, {
        method: "POST",
      });
      setLikes(data.likes ?? likes);
      setDislikes(data.dislikes ?? dislikes);
      setUserReaction(data.my_reaction ?? null);
    } catch (error) {
      console.error("Gagal menyimpan reaksi:", error);
      alertError(t("videoPage.reactionLogin"));
    }
  };

  const handleBooking = async () => {
    if (!heroVideo) return;
    try {
      await apiFetch("/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutor_id: heroVideo.uploader ? 1 : undefined,
          subject_id: 1,
          booking_date: new Date().toISOString().split("T")[0],
          start_time: "09:00",
          end_time: "10:00",
          notes: `Booking dari video: ${heroVideo.title}`,
        }),
      });
      alertSuccess(t("videoPage.bookingSuccess"));
    } catch (error) {
      console.error("Gagal membuat booking:", error);
      alertError(t("videoPage.bookingFailed"));
    }
  };

  const handleShare = async () => {
    if (!heroVideo) return;
    const url = `${window.location.origin}/video/${heroVideo.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: heroVideo.title, text: heroVideo.description || "", url });
      } catch {
        // ignored
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
    setShowShareToast(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400 text-sm">{t("videoPage.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-3">
          <button
            onClick={() => navigate("cari-tutor")}
            className="inline-flex items-center gap-2 self-start text-sm font-medium text-gray-700 transition hover:text-gray-900"
          >
            <ChevronLeft size={16} />
            {t("videoPage.back")}
          </button>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">{t("videoPage.title")}</h1>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("videoPage.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <Play size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-semibold text-gray-700">{t("videoPage.emptyTitle")}</p>
            <p className="mt-2 text-sm text-gray-500">{t("videoPage.emptyDescription")}</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {filteredVideos.map((video) => {
              const isHovered = hoveredVideoId === video.id;
              return (
                <button
                  key={video.id}
                  onClick={() => handleSelectVideo(video)}
                  onMouseEnter={() => setHoveredVideoId(video.id)}
                  onMouseLeave={() => setHoveredVideoId(null)}
                  className="block overflow-hidden text-left"
                >
                  <div className="relative aspect-video overflow-hidden rounded-md bg-gray-100">
                    {isHovered && video.file_url ? (
                      <video
                        src={video.file_url}
                        muted
                        autoPlay
                        loop
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : video.thumbnail_url ? (
                      <img src={video.thumbnail_url} alt={video.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <Play size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 rounded-full bg-gray-900/80 px-2 py-1 text-xs text-white">
                      {formatViews(video.views)}
                    </div>
                  </div>
                  <div className="pt-3 text-left">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{video.title}</p>
                    <div className="mt-2 flex flex-col gap-1 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{video.uploader || t("videoPage.uploaderFallback")}</span>
                      <span>{formatViews(video.views)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showShareToast && (
        <div className="fixed bottom-4 right-4 rounded-xl bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
          {t("videoPage.shareSuccess")}
        </div>
      )}

      {selectedVideoId !== null && (
        <VideoDetailPage
          videoId={selectedVideoId}
          onClose={() => setSelectedVideoId(null)}
          apiFetch={apiFetch}
          navigate={navigate}
          onBookTutor={(tutor) => {
            setSelectedTutor(tutor);
            navigate("booking");
          }}
        />
      )}
    </div>
  );
}