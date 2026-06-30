// frontend/src/app/App.tsx
import { useEffect, useState, Suspense, lazy } from "react";
import i18n from "../i18n";
import {
  Search,
  Bell,
  Home,
  User,
  Menu,
  X,
  Heart,
  GraduationCap,
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
  PlusCircle,
  Calendar,
  Clock,
  Award,
  BookMarked,
  Shield,
  Loader2,
  ChevronLeft,
  Phone,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  MapPin,
  Video,
  Users,
  BookOpen,
  Star,
  TrendingUp,
  DollarSign,
  FileText,
  BarChart2,
  LogIn,
  Sparkles,
  Target,
  Flame,
  Trophy,
  Wallet,
  Check,
  Play,
  Pencil,
  Eraser,
  Type,
  Square,
  Upload,
  Maximize2,
  Hash,
  ThumbsUp,
  Share2,
  Flag,
  MapPinned,
} from "lucide-react";

const VideoPage = lazy(() => import("./TUTORKU/VideoPage"));
const LoginPage = lazy(() => import("./auth/LoginPage"));
const RegisterPage = lazy(() => import("./auth/RegisterPage"));
const GoogleOtpPage = lazy(() => import("./auth/GoogleOtpPage"));
const AdminLoginPage = lazy(() => import("./auth/AdminLoginPage"));
const CariTutorPage = lazy(() => import("./TUTORKU/CariTutorPage"));
const DetailTutorPage = lazy(() => import("./TUTORKU/DetailTutorPage"));
const BookingPage = lazy(() => import("./TUTORKU/BookingPage"));
const DashboardSiswaPage = lazy(() => import("./mahasiswa/DashboardSiswaPage"));
const BookingSayaPage = lazy(() => import("./mahasiswa/BookingSayaPage"));
const BookingDetailPage = lazy(() => import("./mahasiswa/BookingDetailPage"));
const RiwayatBelajarPage = lazy(() => import("./mahasiswa/RiwayatBelajarPage"));
const FavoritPage = lazy(() => import("./mahasiswa/FavoritPage"));
const NotifikasiPage = lazy(() => import("./mahasiswa/NotifikasiPage"));
const ProgressPage = lazy(() => import("./mahasiswa/ProgressPage"));
const LandingPage = lazy(() => import("./mahasiswa/LandingPage"));
const SettingsPage = lazy(() => import("./mahasiswa/SettingsPage"));
const ReminderSettingsPage = lazy(() => import("./mahasiswa/ReminderSettingsPage"));
const AboutPage = lazy(() => import("./mahasiswa/AboutPage"));
const LiveClassPage = lazy(() => import("./mahasiswa/LiveClassPage"));
const ChatPage = lazy(() => import("./mahasiswa/ChatPage"));
const ForumPage = lazy(() => import("./mahasiswa/ForumPage"));
const TutorRegistrationPage = lazy(() => import("./mahasiswa/TutorRegistrationPage"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const PlatformAdminLayout = lazy(() => import("./admin/PlatformAdminLayout"));
const LiveClasView = lazy(() => import("./admin/components/LiveClasView"));

import TutorCard from "./TUTORKU/TutorCard";
import Navbar from "./components/ui/navbar";
import Footer from "./components/ui/fotter";
import MobileBottomNav from "./components/ui/MobileButtomNav";
import ReminderNotificationPopup from "./components/ui/ReminderNotificationPopup";
import AiPopup from "./mahasiswa/AiPopup";
import WebsiteRatingPopup from "./mahasiswa/WebsiteRatingPopup";
import { Skeleton } from "./components/ui/skeleton";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  alertSuccess,
  alertError,
  confirmAction,
  toastSuccess,
  toastError,
} from "./lib/swal";
import { getEcho, disconnectEcho } from "./lib/echo";
import { showChatMessageNotification, registerNotificationServiceWorker, requestNotificationPermission } from "./lib/notifications";

const PageSkeleton = () => (
  <div className="space-y-6 px-6 py-6">
    <Skeleton className="h-10 w-2/5 rounded-lg" />
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-36 rounded-lg" />
      <Skeleton className="h-36 rounded-lg" />
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
    </div>
  </div>
);

import type { Page } from "./types.ts";

type Tutor = {
  id: string | number;
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
  availabilities?: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }[];
};

type ForumPost = {
  id: number;
  user: { id?: number; name: string; avatar?: string | null } | string;
  category: string;
  title: string;
  body: string;
  likes: number;
  replies: number;
  time: string;
  solved: boolean;
  liked_by_me?: boolean;
};

type DashboardOverview = {
  total_sessions: number;
  total_study_hours: number;
  favorite_tutor?: string | null;
  upcoming_session?: {
    tutor: { name: string; photo?: string | null };
    subject: { name: string };
    date: string;
    start_time: string;
  } | null;
  weekly_study_minutes: { label: string; minutes: number }[];
  achievements_count: number;
};

type PlatformStats = {
  total_tutors: number;
  total_students: number;
  total_cities: number;
  satisfaction_rate: number;
  total_sessions: number;
};

type ProgressData = {
  attendance_rate: number;
  total_sessions_completed: number;
  average_score: number | null;
  monthly_study_hours: { month: string; hours: number }[];
  progress_by_subject: { subject: string; hours: number; sessions: number }[];
  achievements_earned: {
    id: number;
    code: string;
    name: string;
    description: string;
    icon?: string | null;
    earned_at?: string | null;
  }[];
  achievements_total: number;
};

type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  avatar?: string | null;
};

type LoginResult = {
  success: boolean;
  requires_otp?: boolean;
  phone?: string;
  message?: string;
  role?: string;
};

const API_BASE =
  (import.meta as any).env?.VITE_API_URL ?? "https://rezi-laravel.nlabs.id/api";
const API_ROOT = API_BASE.replace(/\/api\/?$/, "");
const defaultTutorPhoto =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format";

const getCsrfToken = () => {
  const cookies = document.cookie.split("; ");
  const csrfCookie = cookies.find((cookie) => cookie.startsWith("XSRF-TOKEN="));
  if (csrfCookie) {
    return decodeURIComponent(csrfCookie.split("=")[1]);
  }
  return null;
};

export default function App() {
  const [activePage, setActivePage] = useState<Page>("landing");
  const [liveClassBookingId, setLiveClassBookingId] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<"student" | "tutor">("student");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("TUTORKU_token"),
  );
  const [language, setLanguage] = useState<string>(() =>
    localStorage.getItem("TUTORKU_lang") || "id",
  );
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [selectedTutorId, setSelectedTutorId] = useState<string | number | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<
    number | string | null
  >(null);
  const [showWebsiteRatingPopup, setShowWebsiteRatingPopup] = useState(false);
  const [websiteRatingBookingId, setWebsiteRatingBookingId] = useState<number | null>(null);
  const [initialChatConversation, setInitialChatConversation] = useState<any | null>(null);

  // Handle navigation after initialChatConversation is set
  useEffect(() => {
    if (initialChatConversation && activePage === "chat") {
      console.log("InitialChatConversation is set, page is chat");
    }
  }, [initialChatConversation, activePage]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [loading, setLoading] = useState({ auth: false, tutors: false });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reminderNotification, setReminderNotification] = useState<{
    id: string;
    title: string;
    message: string;
    booking_id?: number;
    action_url?: string;
  } | null>(null);
  const [forceStudentTheme, setForceStudentTheme] = useState(() => {
    try {
      return localStorage.getItem("force_student_theme") === "1";
    } catch {
      return false;
    }
  });
  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    if (!language) return;
    i18n.changeLanguage(language);
    localStorage.setItem("TUTORKU_lang", language);
  }, [language]);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(
    null,
  );
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [studyData, setStudyData] = useState<{ name: string; jam: number }[]>(
    [],
  );
  const [activeTab, setActiveTab] = useState("overview");

  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(
    null,
  );
  const [otpCooldown, setOtpCooldown] = useState(0);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
    const incomingHeaders =
      options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : Array.isArray(options.headers)
        ? Object.fromEntries(options.headers)
        : (options.headers as Record<string, string> | undefined) ?? {};

    const headers: HeadersInit = {
      Accept: "application/json",
      "Accept-Language": language || "id",
      "X-Locale": language || "id",
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...incomingHeaders,
    };

    const currentToken = token || localStorage.getItem("TUTORKU_token");
    if (currentToken) {
      headers["Authorization"] = `Bearer ${currentToken}`;
    }

    if (
      options.method &&
      ["POST", "PUT", "DELETE", "PATCH"].includes(options.method.toUpperCase())
    ) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers["X-XSRF-TOKEN"] = csrfToken;
      }
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      if (res.status === 401) {
        localStorage.removeItem("TUTORKU_token");
        setToken(null);
        setUser(null);
        if (activePage !== "login" && activePage !== "register") {
          navigate("login");
          toastError("Sesi Anda telah berakhir. Silakan login kembali.");
        }
        throw new Error("Unauthorized");
      }

      if (!res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          throw new Error(
            json.message || json.error || `Request failed: ${res.status}`,
          );
        } catch {
          throw new Error(text || `Request failed: ${res.status}`);
        }
      }

      const data = await res.json();
      return data;
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        throw error;
      }
      console.error("API Fetch Error:", error);
      throw error;
    }
  };

  // Detect redirect from payment gateway with booking/payment ids in query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get("booking_id");
    let paymentId = params.get("payment_id");
    const midtransStatus =
      params.get("transaction_status") || params.get("status_code");

    if (!bookingId) return;

    (async () => {
      try {
        if (!paymentId) {
          const bookingResponse = await apiFetch(`/bookings/${bookingId}`);
          const bookingData = bookingResponse.data ?? bookingResponse;
          paymentId = bookingData?.payment?.id;
        }

        let synced = false;

        if (paymentId) {
          try {
            await apiFetch(`/payments/${paymentId}/simulate`, {
              method: "POST",
              body: JSON.stringify({ status: "paid" }),
            });
            synced = true;
          } catch {
            try {
              await apiFetch(`/payments/${paymentId}/check-status`, {
                method: "POST",
              });
              synced = true;
            } catch (e) {
              console.warn("Gagal sync status payment:", e);
            }
          }
        }

        if (!synced && paymentId && midtransStatus) {
          const normalizedStatus = midtransStatus.toLowerCase();
          if (["settlement", "capture", "paid", "success"].includes(normalizedStatus)) {
            try {
              await apiFetch(`/payments/${paymentId}/check-status`, {
                method: "POST",
              });
              synced = true;
            } catch (e) {
              console.warn("Gagal sync status payment via midtransStatus:", e);
            }
          }
        }

        if (synced) {
          await new Promise((r) => setTimeout(r, 500));
        }

        const data = await apiFetch(`/bookings/${bookingId}`);
        const booking = data.data ?? data;
        const paymentStatus = booking?.payment?.status?.toLowerCase();

        if (
          booking?.status === "confirmed" ||
          paymentStatus === "paid" ||
          paymentStatus === "success"
        ) {
          toastSuccess("Pembayaran berhasil! Booking dikonfirmasi.");
          if (booking?.id) {
            setWebsiteRatingBookingId(Number(booking?.id));
            setShowWebsiteRatingPopup(true);
          }
        } else {
          toastSuccess("Pembayaran berhasil. Booking sedang diproses.");
        }
      } catch (err) {
        console.error("Gagal memuat booking setelah pembayaran", err);
        toastSuccess("Pembayaran berhasil!");
      } finally {
        const u = new URL(window.location.href);
        u.search = "";
        window.history.replaceState({}, "", u.toString());
        navigate("booking-saya");
      }
    })();
  }, []);

  const fetchUser = async () => {
    const currentToken = token || localStorage.getItem("TUTORKU_token");
    if (!currentToken) {
      setToken(null);
      setUser(null);
      return;
    }

    try {
      const data = await apiFetch("/auth/me");
      setUser(data.data ?? data);
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        console.error("Gagal memuat user:", error);
      }
    }
  };

  useEffect(() => {
    if (!user || !token) {
      setUnreadCount(0);
      return;
    }

    const loadUnread = async () => {
      try {
        const data = await apiFetch("/notifications/unread-count?exclude_chat=1");
        setUnreadCount(data.unread_count ?? 0);
      } catch (error: any) {
        if (error.message !== "Unauthorized") {
          console.error("Gagal memuat jumlah notifikasi", error);
        }
      }
    };
    loadUnread();

    try {
      const echo = getEcho(token);
      const channel = echo.private(`App.Models.User.${user.id}`);
      channel.notification(async (notification: any) => {
        const category = notification?.data?.category ?? notification?.category ?? null;
        if (category !== "chat") {
          setUnreadCount((c) => c + 1);
        }

        if (category === "reminder") {
          const title = notification?.data?.title || "Pengingat Sesi";
          const body = notification?.data?.message || "Sesi belajar kamu akan segera dimulai.";
          const bookingId = notification?.data?.booking_id;
          const actionUrl = notification?.data?.action_url;
          
          // Show in-app popup
          setReminderNotification({
            id: Math.random().toString(36),
            title,
            message: body,
            booking_id: bookingId,
            action_url: actionUrl,
          });
          
          try {
            await showChatMessageNotification({ title, body, icon: "/favicon.ico" });
          } catch (notifyErr) {
            console.error("[app-reminder] notification error", notifyErr);
          }
        }
      });

      return () => {
        echo.leave(`private-App.Models.User.${user.id}`);
      };
    } catch (error) {
      console.error("Echo connection error:", error);
    }
  }, [user?.id, token]);

  // Global chat listener: trigger notifications even when not in ChatPage
  useEffect(() => {
    if (!user || !token) return;

    void requestNotificationPermission();
    void registerNotificationServiceWorker();

    try {
      const echo = getEcho(token);
      // Listen to global private chat notifications for this user
      const channelName = `chat-messages.${user.id}`;
      const globalChatChannel = echo.private(channelName);

      console.debug("[app-global-chat] subscribing to", channelName);
      try {
        globalChatChannel.subscribed(() => {
          console.debug("[app-global-chat] subscribed to", channelName);
        });
      } catch {
        // ignore if unsupported
      }

      try {
        globalChatChannel.error((err: any) => {
          console.warn("[app-global-chat] channel error", channelName, err);
        });
      } catch {
        // ignore if unsupported
      }

      globalChatChannel.listen(".message.sent", async (e: any) => {
        const incoming = e.message ?? e;
        const senderName = e.sender_name || incoming.user?.name || "Pesan baru";
        const preview = incoming.content || (incoming.type === "image" ? "📸 Mengirim gambar" : incoming.type === "file" ? "📄 Mengirim file" : "Pesan baru");
        const senderAvatar = e.sender_avatar || incoming.user?.avatar;

        console.debug("[app-global-chat] event received", { event: e, incoming, userId: user.id });
        if (String(incoming.sender_id) !== String(user.id)) {
          console.debug("[app-global-chat] incoming message", { senderId: incoming.sender_id, userId: user.id, senderName, preview });
          try {
            await showChatMessageNotification({
              title: senderName,
              body: preview,
              icon: senderAvatar || undefined,
            });
          } catch (notifyErr) {
            console.error("[app-global-chat] notification error", notifyErr);
          }
        }
      });

      return () => {
        echo.leave(`private-${channelName}`);
      };
    } catch (error) {
      console.warn("[app-global-chat] setup error", error);
    }
  }, [user?.id, token]);

  useEffect(() => {
    const currentToken = localStorage.getItem("TUTORKU_token");
    if (currentToken) {
      setToken(currentToken);
      fetchUser();
    }
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem("TUTORKU_token", token);
      fetchUser();
    } else {
      localStorage.removeItem("TUTORKU_token");
      setUser(null);
      disconnectEcho();
    }
  }, [token]);

  const logout = async () => {
    const confirmed = await confirmAction(
      "Yakin ingin keluar?",
      "Kamu akan keluar dari akun TUTORKU.",
    );
    if (!confirmed) return;

    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error", error);
    }

    localStorage.removeItem("TUTORKU_token");
    setToken(null);
    setUser(null);
    disconnectEcho();
    setIsUserMenuOpen(false);
    navigate("landing");
    toastSuccess("Berhasil keluar.");
  };

  const navigate = (page: string) => {
    if (page === "login") {
      setLoginMode("student");
    }
    setActivePage(page as Page);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileMenuOpen(false);
    setIsUserMenuOpen(false);

    if (page === "landing") {
      window.location.hash = "#/";
    } else if (page === "admin") {
      window.location.hash = "#/admin";
    } else if (page === "platform-admin") {
      window.location.hash = "#/platform-admin";
    } else {
      window.location.hash = `#/${page}`;
    }
  };

  const navigateWithParams = (page: string, params?: Record<string, string>) => {
    if (page === "login") {
      setLoginMode("student");
    }
    setActivePage(page as Page);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileMenuOpen(false);
    setIsUserMenuOpen(false);

    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    if (page === "landing") {
      window.location.hash = "#/";
    } else if (page === "admin") {
      window.location.hash = "#/admin";
    } else if (page === "platform-admin") {
      window.location.hash = "#/platform-admin";
    } else {
      window.location.hash = `#/${page}${query}`;
    }
  };

  const openTutorDetail = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setSelectedTutorId(tutor.id);
    navigateWithParams("detail-tutor", { tutorId: String(tutor.id) });
  };

  const startChatWithTutor = async (tutorId: number) => {
    try {
      const data = await apiFetch("/chat/conversations/start", {
        method: "POST",
        body: JSON.stringify({ user_id: tutorId }),
      });
      console.log("Chat conversation response:", data);
      const conversation = data.data ?? data;
      console.log("Extracted conversation:", conversation);
      return conversation;
    } catch (error) {
      console.error("Gagal memulai chat", error);
      return null;
    }
  };

  const navigateAfterLogin = (role?: string) => {
    // Redirect berdasarkan role ke dashboard yang sesuai
    const resolvedRole = role ?? user?.role;
    if (resolvedRole === "tutor") {
      navigate("admin"); // Dashboard tutor
    } else if (resolvedRole === "admin") {
      navigate("platform-admin"); // Dashboard admin
    } else {
      navigate("dashboard-siswa"); // Default dashboard siswa
    }
  };

  const loadTutors = async () => {
    setLoading((prev) => ({ ...prev, tutors: true }));
    try {
      const data = await apiFetch("/tutors");
      setTutors(data.data ?? data);
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        console.error("Gagal memuat tutor", error);
      }
    } finally {
      setLoading((prev) => ({ ...prev, tutors: false }));
    }
  };

  const loadForumPosts = async () => {
    try {
      const data = await apiFetch("/forum/posts");
      setForumPosts(data.data ?? data);
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        console.error("Gagal memuat forum posts", error);
      }
    }
  };

  const loadPlatformStats = async () => {
    try {
      const data = await apiFetch("/platform/stats");
      setPlatformStats(data.data ?? data);
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        console.error("Gagal memuat statistik platform", error);
      }
    }
  };

  const loadOverview = async () => {
    try {
      const data = await apiFetch("/dashboard/siswa");
      setOverview(
        data.data ??
          data ?? {
            total_sessions: 0,
            total_study_hours: 0,
            favorite_tutor: null,
            upcoming_session: null,
            weekly_study_minutes: [],
            achievements_count: 0,
          },
      );
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        console.error("Gagal memuat overview", error);
      }
      setOverview({
        total_sessions: 0,
        total_study_hours: 0,
        favorite_tutor: null,
        upcoming_session: null,
        weekly_study_minutes: [],
        achievements_count: 0,
      });
    }
  };

  const loadProgressData = async () => {
    try {
      const data = await apiFetch("/students/progress");
      setProgressData(data.data ?? data);
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        console.error("Gagal memuat progress", error);
      }
    }
  };

  const registerWithPhone = async (phone: string, name: string) => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      localStorage.removeItem("TUTORKU_token");
      setToken(null);
      setUser(null);

      const csrfToken = getCsrfToken();
      const headers: HeadersInit = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (csrfToken) {
        headers["X-XSRF-TOKEN"] = csrfToken;
      }

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = "Registrasi gagal";
        if (data.errors) {
          const errors = Object.values(data.errors).flat();
          errorMessage = errors.join(", ");
        } else if (data.message) {
          errorMessage = data.message;
        }
        throw new Error(errorMessage);
      }

      const newToken = data.token;
      if (newToken) {
        localStorage.setItem("TUTORKU_token", newToken);
        setToken(newToken);
        setUser(data.user);
        toastSuccess("Registrasi berhasil! Selamat datang.");
        navigate("dashboard-siswa");
        return true;
      }

      return false;
    } catch (error: any) {
      console.error("❌ Error registerWithPhone:", error);
      toastError(error.message || "Registrasi gagal. Silakan coba lagi.");
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const loginWithPhone = async (phone: string): Promise<LoginResult> => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      const csrfToken = getCsrfToken();
      const headers: HeadersInit = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (csrfToken) {
        headers["X-XSRF-TOKEN"] = csrfToken;
      }

      const response = await fetch(`${API_BASE}/auth/login-phone`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          phone,
          device_name: "TUTORKU Web",
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404 || data.requires_otp) {
          return {
            success: false,
            requires_otp: true,
            phone: phone,
            message:
              data.message ||
              "Nomor handphone belum terdaftar. Silakan verifikasi.",
          };
        }
        throw new Error(data.message || "Login gagal");
      }

      const newToken = data.token;
      if (newToken) {
        setToken(newToken);
        localStorage.setItem("TUTORKU_token", newToken);
        setUser(data.user);
        toastSuccess("Login berhasil! Selamat datang.");
        return { success: true, role: data.role };
      }

      return { success: false };
    } catch (error: any) {
      console.error("Error loginWithPhone:", error);
      toastError(error.message || "Login gagal. Periksa nomor handphone Anda.");
      return { success: false };
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const sendPhoneOtp = async (phone: string): Promise<boolean> => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      const csrfToken = getCsrfToken();
      const headers: HeadersInit = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (csrfToken) {
        headers["X-XSRF-TOKEN"] = csrfToken;
      }

      const response = await fetch(`${API_BASE}/auth/phone/send-otp`, {
        method: "POST",
        headers,
        body: JSON.stringify({ phone }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengirim OTP");
      }

      setOtpCooldown(60);
      toastSuccess("Kode OTP telah dikirim ke nomor WhatsApp Anda.");
      return true;
    } catch (error: any) {
      console.error("Error sendPhoneOtp:", error);
      toastError(
        error.message || "Gagal mengirim OTP. Periksa nomor handphone Anda.",
      );
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const verifyPhoneOtp = async (
    phone: string,
    otp: string,
  ): Promise<LoginResult> => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      const csrfToken = getCsrfToken();
      const headers: HeadersInit = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (csrfToken) {
        headers["X-XSRF-TOKEN"] = csrfToken;
      }

      const response = await fetch(`${API_BASE}/auth/phone/verify-otp`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          phone,
          code: otp,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verifikasi OTP gagal");
      }

      return { success: true, phone: data.phone ?? phone };
    } catch (error: any) {
      console.error("Error verifyPhoneOtp:", error);
      toastError(error.message || "Kode OTP tidak valid. Silakan coba lagi.");
      return { success: false, message: error.message };
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const startGoogleLogin = async (role: "student" | "tutor" = "student") => {
    try {
      setLoading((prev) => ({ ...prev, auth: true }));
      const validRole = typeof role === "string" ? role : "student";

      const response = await fetch(
        `${API_BASE}/auth/google/redirect?role=${validRole}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Gagal mendapatkan URL redirect Google",
        );
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error startGoogleLogin:", error);
      toastError(
        error.message || "Gagal memulai login Google. Silakan coba lagi.",
      );
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const verifyGoogleOtp = async (otp: string): Promise<boolean> => {
    if (!pendingGoogleToken) {
      toastError("Token tidak valid. Silakan ulangi login.");
      return false;
    }

    setLoading((prev) => ({ ...prev, auth: true }));

    try {
      const csrfToken = getCsrfToken();
      const headers: HeadersInit = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      if (csrfToken) {
        headers["X-XSRF-TOKEN"] = csrfToken;
      }

      const response = await fetch(`${API_BASE}/auth/google/verify-otp`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          pending_token: pendingGoogleToken,
          code: otp,
          remember: false,
          device_name: "TUTORKU Web",
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.redirect_role) {
          if (data.redirect_role === "tutor") {
            setLoginMode("tutor");
            navigate("admin-login");
          }
          setLoading((prev) => ({ ...prev, auth: false }));
          return false;
        }

        if (response.status === 419) {
          await fetch(`${API_ROOT}/sanctum/csrf-cookie`, {
            credentials: "include",
          });

          const newCsrfToken = getCsrfToken();
          const retryHeaders: HeadersInit = {
            Accept: "application/json",
            "Content-Type": "application/json",
          };
          if (newCsrfToken) {
            retryHeaders["X-XSRF-TOKEN"] = newCsrfToken;
          }

          const retryResponse = await fetch(
            `${API_BASE}/auth/google/verify-otp`,
            {
              method: "POST",
              headers: retryHeaders,
              body: JSON.stringify({
                pending_token: pendingGoogleToken,
                code: otp,
                remember: false,
                device_name: "TUTORKU Web",
              }),
              credentials: "include",
            },
          );

          const retryData = await retryResponse.json();

          if (!retryResponse.ok) {
            if (retryData.redirect_role) {
              if (retryData.redirect_role === "tutor") {
                setLoginMode("tutor");
                toastError(
                  retryData.message ||
                    "Akun ini adalah tutor. Silakan gunakan opsi tutor pada halaman login ini.",
                );
              } else if (retryData.redirect_role === "admin") {
                toastError(
                  retryData.message ||
                    "Akun ini adalah admin. Silakan masuk lewat halaman Login Admin.",
                );
                navigate("admin-login");
              }
              setLoading((prev) => ({ ...prev, auth: false }));
              return false;
            }

            throw new Error(
              retryData.message || "Verifikasi OTP gagal setelah refresh CSRF",
            );
          }

          const newToken = retryData.token;
          if (newToken) {
            setToken(newToken);
            localStorage.setItem("TUTORKU_token", newToken);
            setUser(retryData.user);
            setPendingGoogleToken(null);
            toastSuccess("Login berhasil! Selamat datang.");
            navigate("dashboard-siswa");
            setLoading((prev) => ({ ...prev, auth: false }));
            return true;
          }
          return false;
        }

        throw new Error(data.message || "Verifikasi OTP gagal");
      }

      const newToken = data.token;
      if (newToken) {
        setToken(newToken);
        localStorage.setItem("TUTORKU_token", newToken);
        setUser(data.user);
        setPendingGoogleToken(null);
        toastSuccess("Login berhasil! Selamat datang.");
        navigate("dashboard-siswa");
        setLoading((prev) => ({ ...prev, auth: false }));
        return true;
      }

      return false;
    } catch (error: any) {
      console.error("Error verifyGoogleOtp:", error);
      toastError(error.message || "Kode OTP tidak valid. Silakan coba lagi.");
      setLoading((prev) => ({ ...prev, auth: false }));
      return false;
    }
  };

  const resendGoogleOtp = async (): Promise<void> => {
    if (!pendingGoogleToken) {
      toastError("Token tidak valid. Silakan ulangi login.");
      return;
    }

    setLoading((prev) => ({ ...prev, auth: true }));

    try {
      const csrfToken = getCsrfToken();
      const headers: HeadersInit = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      if (csrfToken) {
        headers["X-XSRF-TOKEN"] = csrfToken;
      }

      const response = await fetch(`${API_BASE}/auth/google/resend-otp`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          pending_token: pendingGoogleToken,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 419) {
          await fetch(`${API_ROOT}/sanctum/csrf-cookie`, {
            credentials: "include",
          });

          const newCsrfToken = getCsrfToken();
          const retryHeaders: HeadersInit = {
            Accept: "application/json",
            "Content-Type": "application/json",
          };
          if (newCsrfToken) {
            retryHeaders["X-XSRF-TOKEN"] = newCsrfToken;
          }

          const retryResponse = await fetch(
            `${API_BASE}/auth/google/resend-otp`,
            {
              method: "POST",
              headers: retryHeaders,
              body: JSON.stringify({
                pending_token: pendingGoogleToken,
              }),
              credentials: "include",
            },
          );

          const retryData = await retryResponse.json();

          if (!retryResponse.ok) {
            throw new Error(
              retryData.message ||
                "Gagal mengirim ulang OTP setelah refresh CSRF",
            );
          }

          setOtpCooldown(60);
          toastSuccess("Kode OTP baru telah dikirim ke email Anda.");
          setLoading((prev) => ({ ...prev, auth: false }));
          return;
        }

        throw new Error(data.message || "Gagal mengirim ulang OTP");
      }

      setOtpCooldown(60);
      toastSuccess("Kode OTP baru telah dikirim ke email Anda.");
    } catch (error: any) {
      console.error("Error resendGoogleOtp:", error);
      toastError(
        error.message || "Gagal mengirim ulang OTP. Silakan coba lagi.",
      );
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const tutorLoginWithPassword = async (
    email: string,
    password: string,
    remember = false,
  ): Promise<boolean> => {
    setLoginError(null);
    setLoading((prev) => ({ ...prev, auth: true }));

    try {
      const csrfToken = getCsrfToken();
      const headers: HeadersInit = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (csrfToken) {
        headers["X-XSRF-TOKEN"] = csrfToken;
      }

      const response = await fetch(`${API_BASE}/auth/tutor/login`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
          remember,
          device_name: "TUTORKU Web",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        let message = data.message || "Login gagal. Silakan coba lagi.";
        if (data.errors) {
          const errors = Object.values(data.errors).flat();
          message = errors.join(", ");
        }
        throw new Error(message);
      }

      const newToken = data.token;
      if (newToken) {
        setToken(newToken);
        localStorage.setItem("TUTORKU_token", newToken);
        setUser(data.user);
        toastSuccess("Login berhasil! Selamat datang.");
        navigate("admin");
        return true;
      }

      throw new Error("Login gagal. Silakan coba lagi.");
    } catch (error: any) {
      console.error("Error tutorLoginWithPassword:", error);
      const message = error.message || "Login gagal. Silakan coba lagi.";
      setLoginError(message);
      toastError(message);
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const adminLoginWithPassword = async (
    email: string,
    password: string,
  ): Promise<boolean> => {
    setLoginError(null);
    setLoading((prev) => ({ ...prev, auth: true }));

    try {
      const csrfToken = getCsrfToken();
      const headers: HeadersInit = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (csrfToken) {
        headers["X-XSRF-TOKEN"] = csrfToken;
      }

      const response = await fetch(`${API_BASE}/auth/admin/login`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
          device_name: "TUTORKU Web",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        let message = data.message || "Login gagal. Silakan coba lagi.";
        if (data.errors) {
          const errors = Object.values(data.errors).flat();
          message = errors.join(", ");
        }
        throw new Error(message);
      }

      const newToken = data.token;
      if (newToken) {
        setToken(newToken);
        localStorage.setItem("TUTORKU_token", newToken);
        setUser(data.user);
        toastSuccess("Login berhasil! Selamat datang.");
        navigate("platform-admin");
        return true;
      }

      throw new Error("Login gagal. Silakan coba lagi.");
    } catch (error: any) {
      console.error("Error adminLoginWithPassword:", error);
      const message = error.message || "Login gagal. Silakan coba lagi.";
      setLoginError(message);
      toastError(message);
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  useEffect(() => {
    const applyHashRoute = () => {
      const hash = window.location.hash || "";

      if (hash === "#/" || hash === "" || hash === "#") {
        setActivePage("landing");
        return;
      }

      if (hash.startsWith("#/platform-admin")) {
        setActivePage("platform-admin");
        return;
      }
      if (hash.startsWith("#/admin-login")) {
        setActivePage("admin-login");
        return;
      }
      if (hash.startsWith("#/admin")) {
        setActivePage("admin");
        return;
      }

      if (hash.startsWith("#/login/google-otp")) {
        const query = hash.split("?")[1] ?? "";
        const params = new URLSearchParams(query);
        const pendingToken = params.get("pending_token");

        if (pendingToken) {
          setPendingGoogleToken(pendingToken);
          setActivePage("login-google-otp");
        } else {
          setLoginError("Token tidak valid. Silakan ulangi login.");
          navigate("login");
        }
        return;
      }

      if (hash.startsWith("#/login/callback")) {
        const query = hash.split("?")[1] ?? "";
        const params = new URLSearchParams(query);
        const googleToken = params.get("token");
        const userRole = params.get("role");
        const error = params.get("error");

        if (error) {
          setLoginError("Login Google gagal. Silakan coba lagi.");
          navigate("login");
          return;
        }

        if (googleToken) {
          setToken(googleToken);
          localStorage.setItem("TUTORKU_token", googleToken);
          fetchUser();
          toastSuccess("Login berhasil! Selamat datang.");

          // Route berdasarkan role
          if (userRole === "tutor") {
            navigate("admin");
          } else if (userRole === "admin") {
            navigate("platform-admin");
          } else {
            navigate("dashboard-siswa");
          }
          return;
        }

        setLoginError("Token tidak valid. Silakan coba lagi.");
        navigate("login");
        return;
      }

      if (hash.includes("error=")) {
        const params = new URLSearchParams(hash.split("?")[1] ?? "");
        const err = params.get("error");
        const targetPage: Page =
          err === "role_admin"
            ? "admin-login"
            : hash.startsWith("#/admin-login")
              ? "admin-login"
              : "login";

        if (err) {
          const message =
            err === "google_failed"
              ? "Login Google gagal. Silakan coba lagi."
              : err === "google_no_email"
                ? "Akun Google tidak memiliki email."
                : err === "role_tutor"
                  ? "Akun ini adalah tutor. Silakan gunakan opsi tutor pada halaman login ini."
                  : err === "role_admin"
                    ? "Akun ini adalah admin. Silakan masuk lewat halaman Login Admin."
                    : "Login gagal. Silakan coba lagi.";

          if (err === "role_tutor") {
            setLoginMode("tutor");
            toastError(message);
          } else {
            setLoginError(message);
          }

          setActivePage(targetPage);
        }
        return;
      }

      const pageWithQuery = hash.replace("#/", "") as string;
      const [pagePart, queryString] = pageWithQuery.split("?");
      const page = pagePart as Page;
      const params = new URLSearchParams(queryString ?? "");
      setLiveClassBookingId(params.get("booking_id"));
      const restoredTutorId = params.get("tutorId") ?? params.get("id");

      if (
        page &&
        page !== "landing" &&
        page !== "admin" &&
        page !== "platform-admin"
      ) {
        setActivePage(page);
      }

      if (page === "detail-tutor" && restoredTutorId) {
        const tutorIdNumber = Number(restoredTutorId);
        if (!Number.isNaN(tutorIdNumber)) {
          setSelectedTutorId(tutorIdNumber);
        }
      }
    };

    applyHashRoute();
    window.addEventListener("hashchange", applyHashRoute);
    return () => window.removeEventListener("hashchange", applyHashRoute);
  }, []);

  useEffect(() => {
    loadTutors();
    loadForumPosts();
    loadPlatformStats();
  }, []);

  useEffect(() => {
    if (selectedTutorId !== null && !selectedTutor) {
      const matched = tutors.find((t) => t.id === selectedTutorId) ?? null;
      if (matched) {
        setSelectedTutor(matched);
      }
    }
  }, [tutors, selectedTutorId, selectedTutor]);

  useEffect(() => {
    if (activePage === "dashboard-siswa") {
      loadOverview();
    }
    if (activePage === "progress") {
      loadProgressData();
    }
  }, [activePage, token]);

  useEffect(() => {
    const onUserUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const updated = { ...detail };
      if (updated.avatar) {
        const sep = updated.avatar.includes("?") ? "&" : "?";
        updated.avatar = `${updated.avatar}${sep}t=${Date.now()}`;
      }
      setUser(updated);
    };
    window.addEventListener("user:updated", onUserUpdated as EventListener);
    return () =>
      window.removeEventListener(
        "user:updated",
        onUserUpdated as EventListener,
      );
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "TUTORKU:user") {
        try {
          const parsed = JSON.parse(e.newValue || "null");
          if (parsed?.user) {
            const updated = { ...parsed.user };
            if (updated.avatar) {
              const sep = updated.avatar.includes("?") ? "&" : "?";
              updated.avatar = `${updated.avatar}${sep}t=${Date.now()}`;
            }
            setUser(updated);
          }
        } catch (err) {}
      }

      if (e.key === "TUTORKU:materials") {
        try {
          window.dispatchEvent(new Event("materials:changed"));
        } catch (err) {}
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    try {
      const should = forceStudentTheme || user?.role === "siswa";
      if (should) document.documentElement.classList.add("student-theme");
      else document.documentElement.classList.remove("student-theme");
    } catch (e) {}
  }, [user, forceStudentTheme]);

  const showNav =
    activePage !== "login" &&
    activePage !== "register" &&
    activePage !== "admin" &&
    activePage !== "platform-admin" &&
    activePage !== "admin-login" &&
    activePage !== "login-google-otp" &&
    activePage !== "live-class-tutor";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ============ REMINDER NOTIFICATION POPUP ============ */}
      <ReminderNotificationPopup
        reminder={reminderNotification}
        onClose={() => setReminderNotification(null)}
        onAction={(url) => {
          if (url) {
            if (url.includes("/live-class")) {
              const bookingId = url.split("/").pop();
              if (bookingId) {
                setLiveClassBookingId(bookingId);
                navigate("live-class");
              }
            }
          }
        }}
      />

      {/* ============ NAVBAR ============ */}
      {showNav && (
        <Navbar
          activePage={activePage}
          navigate={navigate}
          user={user}
          unreadCount={unreadCount}
          logout={logout}
          apiFetch={apiFetch}
          setUnreadCount={setUnreadCount}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}

      {/* ============ CONTENT ============ */}
      <div className={showNav ? "pt-16" : "pt-0"}>
        <Suspense fallback={<PageSkeleton />}>
          {activePage === "landing" && (
            <LandingPage
              navigate={navigate}
              platformStats={platformStats}
              tutors={tutors}
              user={user}
              onSelectTutor={openTutorDetail}
            />
          )}

          {activePage === "login" && (
            <LoginPage
              navigate={navigate}
              startGoogleLogin={startGoogleLogin}
              loginWithPhone={loginWithPhone}
              verifyPhoneOtp={verifyPhoneOtp}
              sendPhoneOtp={sendPhoneOtp}
              otpCooldown={otpCooldown}
              loading={loading.auth}
              error={loginError}
            />
          )}

          {activePage === "register" && (
            <RegisterPage
              navigate={navigate}
              startGoogleLogin={startGoogleLogin}
              sendPhoneOtp={sendPhoneOtp}
              verifyPhoneOtp={verifyPhoneOtp}
              registerWithPhone={registerWithPhone}
              otpCooldown={otpCooldown}
              loading={loading.auth}
              error={loginError}
            />
          )}

          {activePage === "login-google-otp" && (
            <GoogleOtpPage
              navigate={navigate}
              verifyGoogleOtp={verifyGoogleOtp}
              resendGoogleOtp={resendGoogleOtp}
              otpCooldown={otpCooldown}
              loading={loading.auth}
              error={loginError}
            />
          )}

        {activePage === "admin-login" && (
          <AdminLoginPage
            navigate={navigate}
            adminLoginWithPassword={adminLoginWithPassword}
            loading={loading.auth}
            error={loginError}
          />
        )}

        {activePage === "settings" && (
          <SettingsPage
            user={user}
            apiFetch={apiFetch}
            navigate={navigate}
            onUpdateUser={setUser}
            language={language}
            onLanguageChange={setLanguage}
          />
        )}

        {activePage === "reminder-settings" && (
          <ReminderSettingsPage
            apiFetch={apiFetch}
            navigate={navigate}
          />
        )}

        {activePage === "about" && <AboutPage apiFetch={apiFetch} />}

        {activePage === "cari-tutor" && (
          <CariTutorPage
            tutors={tutors}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterSubject={filterSubject}
            setFilterSubject={setFilterSubject}
            onSelectTutor={openTutorDetail}
            onBookTutor={(t: Tutor) => {
              setSelectedTutor(t);
              navigate("booking");
            }}
            navigate={navigate}
          />
        )}

        {activePage === "detail-tutor" && (
          <DetailTutorPage
            tutorId={selectedTutorId ?? selectedTutor?.id ?? null}
            apiFetch={apiFetch}
            navigate={navigate}
            user={user}
            onBooking={(tutorId: number) => {
              if (tutorId && (!selectedTutor || selectedTutor.id !== tutorId)) {
                const matched = tutors.find((t) => t.id === tutorId);
                if (matched) {
                  setSelectedTutor(matched);
                }
              }
              navigate("booking");
            }}
            onChat={async (tutorId: number) => {
              if (tutorId && (!selectedTutor || selectedTutor.id !== tutorId)) {
                const matched = tutors.find((t) => t.id === tutorId);
                if (matched) {
                  setSelectedTutor(matched);
                }
              }
              const conversation = await startChatWithTutor(tutorId);
              console.log("[App] Setting conversation:", conversation);
              if (conversation && conversation.id) {
                setInitialChatConversation(conversation);
                navigate("chat");
              } else {
                toastError("Gagal membuka chat. Silakan coba lagi.");
              }
            }}
          />
        )}

        {activePage === "booking" && (
          <BookingPage
            tutor={selectedTutor}
            apiFetch={apiFetch}
            navigate={navigate}
            setUnreadCount={setUnreadCount}
          />
        )}

        {activePage === "live-class" && (
          <LiveClassPage
            navigate={navigate}
            apiFetch={apiFetch}
            user={user}
            bookingId={liveClassBookingId}
          />
        )}

        {activePage === "live-class-tutor" && (
          <LiveClasView navigate={navigate} bookingId={liveClassBookingId} user={user} />
        )}

        {activePage === "chat" && (
          <ChatPage
            apiFetch={apiFetch}
            token={token}
            currentUserId={user?.id}
            navigate={navigate}
            initialConversation={initialChatConversation}
          />
        )}

        {activePage === "dashboard-siswa" && (
          <DashboardSiswaPage
            overview={overview}
            user={user}
            unreadCount={unreadCount}
            apiFetch={apiFetch}
            navigate={navigate}
          />
        )}

        {activePage === "booking-saya" && (
          <BookingSayaPage
            apiFetch={apiFetch}
            navigate={navigate}
            onSelectBooking={(id: number | string) => {
              setSelectedBookingId(id);
              navigate("booking-detail");
            }}
          />
        )}
        {activePage === "booking-detail" && (
          <BookingDetailPage
            bookingId={selectedBookingId}
            apiFetch={apiFetch}
            navigate={navigate}
          />
        )}
        {activePage === "riwayat-belajar" && (
          <RiwayatBelajarPage apiFetch={apiFetch} navigate={navigate} />
        )}

        {activePage === "favorit" && (
          <FavoritPage
            apiFetch={apiFetch}
            navigate={navigate}
            navigateWithParams={navigateWithParams}
            onSelectTutor={openTutorDetail}
          />
        )}

        {activePage === "notifikasi" && (
          <NotifikasiPage apiFetch={apiFetch} navigate={navigate} />
        )}

        {activePage === "tutor-registration" && (
          <TutorRegistrationPage
            apiFetch={apiFetch}
            navigate={navigate}
            user={user}
          />
        )}

        {activePage === "forum" && (
          <ForumPage
            posts={forumPosts}
            setPosts={setForumPosts}
            likedPosts={likedPosts}
            setLikedPosts={setLikedPosts}
            apiFetch={apiFetch}
            navigate={navigate}
            user={user}
          />
        )}

        {activePage === "progress" && (
          <ProgressPage
            navigate={navigate}
            progressData={
              progressData?.monthly_study_hours?.map((item) => ({
                label: item.month,
                value: item.hours,
              })) ?? []
            }
          />
        )}
        {activePage === "video" && <VideoPage navigate={navigate} apiFetch={apiFetch} setSelectedTutor={setSelectedTutor} />}
        {activePage === "upload-video" && (
          <AdminLayout
            user={user}
            onUpdateUser={(updated: User) => setUser(updated)}
            logout={logout}
            openUpload
          />
        )}
        {activePage === "admin" && (
          <AdminLayout
            user={user}
            onUpdateUser={(updated: User) => setUser(updated)}
            logout={logout}
          />
        )}
        {activePage === "platform-admin" && (
          <PlatformAdminLayout user={user} logout={logout} />
        )}
        </Suspense>
      </div>

      {/* ============ FOOTER ============ */}
      {activePage !== "admin" &&
        activePage !== "platform-admin" &&
        activePage !== "login" &&
        activePage !== "register" &&
        activePage !== "login-google-otp" &&
        activePage !== "live-class-tutor" && <Footer navigate={navigate} />}

      {/* ============ MOBILE BOTTOM NAV ============ */}
      {showNav && (
        <MobileBottomNav
          activePage={activePage}
          navigate={navigate}
          user={user}
        />
      )}

      {showNav && (
        <div className="fixed bottom-24 right-4 z-50">
          <AiPopup compact />
        </div>
      )}

      {showWebsiteRatingPopup && websiteRatingBookingId && (
        <WebsiteRatingPopup
          bookingId={websiteRatingBookingId}
          onClose={() => setShowWebsiteRatingPopup(false)}
        />
      )}
    </div>
  );
}
