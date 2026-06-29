import { useState } from "react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import {
  Globe,
  BookOpen,
  Users,
  Video,
  Brain,
  MapPin,
  FileText,
  Shield,
  BarChart2,
  Bell,
  MessageCircle,
  LogIn,
  Search,
  Calendar,
  LogOut,
  ChevronRight,
    Sparkles,
    Check,
    Star,
  Zap,
  GraduationCap,
} from "lucide-react";
import TutorCard, { Tutor as TutorCardType } from "../TUTORKU/TutorCard";

type Page =
  | "landing"
  | "cari-tutor"
  | "detail-tutor"
  | "booking"
  | "live-class"
  | "chat"
  | "dashboard-siswa"
  | "forum"
  | "about"
  | "progress"
  | "settings"
  | "login"
  | "register"
  | "video"
  | "upload-video"
  | "admin"
  | "login-google-otp"
  | "tutor-registration"
  | "booking-saya"
  | "riwayat-belajar"
  | "favorit"
  | "notifikasi"
  | "platform-admin"
  | "admin-login";

type PlatformStats = {
  total_tutors: number;
  total_students: number;
  total_cities: number;
  satisfaction_rate: number;
  total_sessions: number;
};

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

type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  avatar?: string | null;
};

type Testimonial = {
  id?: number;
  name: string;
  role: string;
  photo?: string | null;
  text: string;
  rating: number;
  created_at?: string;
};

export default function LandingPage({
  navigate,
  platformStats,
  tutors,
  user,
  onSelectTutor,
}: {
  navigate: (p: Page) => void;
  platformStats: PlatformStats | null;
  tutors: TutorCardType[];
  user: User | null;
  onSelectTutor: (tutor: TutorCardType) => void;
}) {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [ratingsSummary, setRatingsSummary] = useState<{ average: number; total: number } | null>(null);

  // Fetch website ratings (testimonials)
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const API_ROOT = (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/?$/, "") ?? "http://localhost:8000";
        const response = await fetch(`${API_ROOT}/api/website/ratings`);
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          const ratings = data.data.map((r: any) => {
            const raw = r.photo;
            const photo = raw
              ? raw.startsWith("http")
                ? raw
                : `${API_ROOT}/storage/${raw}`
              : null;

            return {
              id: r.id,
              name: r.name,
              role: r.role,
              photo,
              text: r.text,
              rating: r.rating,
              created_at: r.created_at,
            };
          });
          setTestimonials(ratings);
          setRatingsSummary({ average: data.average ?? 0, total: data.total ?? ratings.length });
        }
      } catch (error) {
        console.error("Failed to fetch testimonials:", error);
        // Keep empty array if fetch fails
      }
    };

    fetchTestimonials();
  }, []);

  // Smooth scroll setup with fade-in animations
  useEffect(() => {
    // Enable smooth scrolling for the entire page
    document.documentElement.style.scrollBehavior = "smooth";
    
    // Intersection Observer for fade-in animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in", "fade-in", "duration-700");
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections for smooth fade-in
    const sections = document.querySelectorAll("section");
    sections.forEach((section) => {
      section.style.opacity = "0";
      observer.observe(section);
    });

    // Also observe divs with grid classes (tutor cards, feature cards)
    const cards = document.querySelectorAll("[class*='grid']");
    cards.forEach((card) => {
      observer.observe(card);
    });

    // Return cleanup function
    return () => {
      observer.disconnect();
    };
  }, []);

  const features = [
    {
      icon: <Globe size={24} className="text-white" />,
      title: t("landing.feature1.title"),
      desc: t("landing.feature1.description"),
      gradient: "from-[#2563EB] to-[#1D4ED8]",
    },
    {
      icon: <BookOpen size={24} className="text-white" />,
      title: t("landing.feature2.title"),
      desc: t("landing.feature2.description"),
      gradient: "from-[#0EA5E9] to-[#0284C7]",
    },
    {
      icon: <Users size={24} className="text-white" />,
      title: t("landing.feature3.title"),
      desc: t("landing.feature3.description"),
      gradient: "from-[#6366F1] to-[#4F46E5]",
    },
  ];

  const platformFeatures = [
    {
      icon: <Video size={20} />,
      title: t("landing.platformFeature1.title"),
      desc: t("landing.platformFeature1.description"),
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    {
      icon: <Brain size={20} />,
      title: t("landing.platformFeature2.title"),
      desc: t("landing.platformFeature2.description"),
      color: "#0EA5E9",
      bg: "#F0F9FF",
    },
    {
      icon: <MapPin size={20} />,
      title: t("landing.platformFeature3.title"),
      desc: t("landing.platformFeature3.description"),
      color: "#6366F1",
      bg: "#EEF2FF",
    },
    {
      icon: <FileText size={20} />,
      title: t("landing.platformFeature4.title"),
      desc: t("landing.platformFeature4.description"),
      color: "#0891B2",
      bg: "#ECFEFF",
    },
    {
      icon: <Shield size={20} />,
      title: t("landing.platformFeature5.title"),
      desc: t("landing.platformFeature5.description"),
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    {
      icon: <BarChart2 size={20} />,
      title: t("landing.platformFeature6.title"),
      desc: t("landing.platformFeature6.description"),
      color: "#0EA5E9",
      bg: "#F0F9FF",
    },
    {
      icon: <Bell size={20} />,
      title: t("landing.platformFeature7.title"),
      desc: t("landing.platformFeature7.description"),
      color: "#6366F1",
      bg: "#EEF2FF",
    },
    {
      icon: <MessageCircle size={20} />,
      title: t("landing.platformFeature8.title"),
      desc: t("landing.platformFeature8.description"),
      color: "#0891B2",
      bg: "#ECFEFF",
    },
  ];

  const steps = [
    {
      num: "01",
      icon: <LogIn size={18} />,
      title: t("landing.step1.title"),
      desc: t("landing.step1.description"),
      color: "#2563EB",
    },
    {
      num: "02",
      icon: <Search size={18} />,
      title: t("landing.step2.title"),
      desc: t("landing.step2.description"),
      color: "#0EA5E9",
    },
    {
      num: "03",
      icon: <Calendar size={18} />,
      title: t("landing.step3.title"),
      desc: t("landing.step3.description"),
      color: "#6366F1",
    },
    {
      num: "04",
      icon: <Video size={18} />,
      title: t("landing.step4.title"),
      desc: t("landing.step4.description"),
      color: "#0891B2",
    },
    {
      num: "05",
      icon: <Star size={18} />,
      title: t("landing.step5.title"),
      desc: t("landing.step5.description"),
      color: "#2563EB",
    },
  ];

  const activeTutorCount = tutors.filter(
    (t) => (t as any).role === "tutor",
  ).length;
  const fmt = (n: number) =>
    n >= 1000 ? `${n.toLocaleString("id-ID")}+` : n.toLocaleString("id-ID");
  const tutorVal =
    activeTutorCount > 0
      ? fmt(activeTutorCount)
      : platformStats?.total_tutors
        ? fmt(platformStats.total_tutors)
        : "—";
  const siswaVal = platformStats?.total_students
    ? fmt(platformStats.total_students)
    : "—";

  const stats = [
    { val: tutorVal, label: t("landing.stats.tutors") },
    { val: siswaVal, label: t("landing.stats.students") },
    { val: "50+", label: t("landing.stats.cities") },
    { val: "95%", label: t("landing.stats.satisfaction") },
  ];

  return (
    <div 
      className="bg-white text-gray-900" 
      style={{
        scrollBehavior: "smooth",
      }}
    >
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        
        body {
          scroll-behavior: smooth;
        }
        
        .animate-in {
          animation: fadeInUp 0.7s ease-out forwards;
        }
        
        .fade-in {
          opacity: 0;
          animation: fadeInUp 0.7s ease-out forwards;
        }
        
        .duration-700 {
          animation-duration: 0.7s !important;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        section {
          transition: opacity 0.7s ease-out;
        }
        
        /* Smooth hover effects */
        button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        button:hover {
          transform: translateY(-2px);
        }
        
        /* Stagger animation for grid items */
        [class*='grid'] > * {
          animation: fadeInUp 0.6s ease-out both;
        }
        
        [class*='grid'] > *:nth-child(1) { animation-delay: 0.1s; }
        [class*='grid'] > *:nth-child(2) { animation-delay: 0.2s; }
        [class*='grid'] > *:nth-child(3) { animation-delay: 0.3s; }
        [class*='grid'] > *:nth-child(4) { animation-delay: 0.4s; }
        [class*='grid'] > *:nth-child(5) { animation-delay: 0.5s; }
        [class*='grid'] > *:nth-child(6) { animation-delay: 0.6s; }
        [class*='grid'] > *:nth-child(7) { animation-delay: 0.7s; }
        [class*='grid'] > *:nth-child(8) { animation-delay: 0.8s; }
      `}</style>
      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-[#F2F6FF] via-white to-[#EFF6FF]">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#2563EB]/8 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-8%] w-[400px] h-[400px] rounded-full bg-[#0EA5E9]/10 blur-[100px]" />
          {/* Dot grid pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.04]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="dots"
                x="0"
                y="0"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.5" fill="#2563EB" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-xs font-semibold mb-6">
              <Sparkles size={12} />
              {t("landing.heroBadge")}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6">
              {t("landing.heroTitleFirstPart")} {" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#0EA5E9]">
                {t("landing.heroTitleHighlightedPart")}
              </span>
            </h1>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-lg">
              {t("landing.heroDescription")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <button
                onClick={() => navigate("cari-tutor")}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm bg-[#2563EB] text-white font-semibold hover:bg-[#1D4ED8] transition-colors text-base"
              >
                <Search size={18} />
                {t("landing.heroCTA")}
              </button>
              {!user && (
                <button
                  onClick={() => navigate("login")}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm border border-gray-200 text-gray-600 hover:text-[#2563EB] hover:border-[#2563EB]/40 hover:bg-[#F2F6FF] font-semibold transition-colors text-base"
                >
                  <GraduationCap size={18} />
                  {t("landing.heroLogin")}
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-sm px-5 py-4 border border-gray-100 flex-1"
                >
                  <div className="text-2xl font-extrabold text-[#2563EB]">
                    {s.val}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero image panel */}
          <div className="hidden lg:block relative">
            <div className="relative rounded-sm overflow-hidden border border-gray-100">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=450&fit=crop&auto=format"
                alt={t("landing.heroImageAlt")}
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
            </div>

            {/* Floating badge — verified */}
            <div className="absolute -bottom-4 -left-8 bg-white rounded-sm p-4 border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-[#DCFCE7] flex items-center justify-center">
                <Check size={18} className="text-[#16A34A]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  {t("landing.verifiedTutorTitle")}
                </div>
                <div className="text-xs text-gray-400">
                  {t("landing.verifiedTutorDescription")}
                </div>
              </div>
            </div>

            {/* Floating badge — rating */}
            <div className="absolute -top-4 -right-4 bg-white rounded-sm p-4 border border-gray-100">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={12}
                    fill="#FBBF24"
                    className="text-[#FBBF24]"
                  />
                ))}
              </div>
              <div className="text-sm font-semibold text-gray-800">
                {ratingsSummary
                  ? t("landing.ratingScore", { score: ratingsSummary.average.toFixed(1) })
                  : t("landing.noRatingScore")}
              </div>
              <div className="text-xs text-gray-400">
                {ratingsSummary
                  ? t("landing.reviewCount", { count: ratingsSummary.total })
                  : t("landing.noReviews")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TUTOR CARDS PREVIEW */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20">
          <div className="flex justify-between items-start sm:items-center mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                {t("landing.topTutorsTitle")}
              </h2>

              <p className="text-gray-400 mt-1">
                {t("landing.topTutorsDescription")}
              </p>
            </div>

            <button
              onClick={() => navigate("cari-tutor")}
              className="
          flex
          items-center
          gap-1
          text-blue-600
          font-semibold
          text-sm
          whitespace-nowrap
          hover:text-blue-700
          transition-colors
        "
            >
              {t("landing.viewAll")}
              <ChevronRight size={16} />
            </button>
          </div>

          <div
            className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        gap-8
      "
          >
            {tutors.slice(0, 6).map((tutor) => (
              <TutorCard
                key={tutor.id}
                tutor={tutor}
                onView={() => onSelectTutor(tutor)}
                onBook={() => {
                  navigate("booking");
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FITUR UNGGULAN */}
      <section className="bg-[#F2F6FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-xs font-semibold mb-4">
              <Zap size={12} />
              {t("landing.whyTitle")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              {t("landing.whyTitle")}
            </h2>
            <p className="text-gray-500 max-w-2xl">
              {t("landing.whyDescription")}
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-100 rounded-sm p-6 hover:border-[#2563EB]/30 transition-colors duration-200"
              >
                <div
                  className={`w-14 h-14 rounded-sm bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5`}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES GRID */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              {t("landing.platformFeaturesTitle")}
            </h2>
            <p className="text-gray-500 max-w-2xl">
              {t("landing.platformFeaturesDescription")}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {platformFeatures.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-100 rounded-sm p-5 hover:border-[#2563EB]/25 transition-colors duration-200 cursor-default"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0"
                    style={{ color: f.color, background: f.bg }}
                  >
                    {f.icon}
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {f.title}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ALUR SISWA */}
      <section className="bg-[#F2F6FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20">
          <div className="mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              {t("landing.stepsTitle")}
            </h2>

            <p className="text-gray-500">
              {t("landing.stepsDescription")}
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-8 left-[8%] right-[8%] h-px bg-[#4F7DF3]" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
              {steps.map((s, i) => (
                <div
                  key={s.num}
                  className="relative flex flex-col items-center text-center"
                >
                  <div
                    className="
                relative
                z-10
                w-16
                h-16
                rounded-full
                border
                border-[#4F7DF3]
                bg-[#F2F6FF]
                flex
                items-center
                justify-center
              "
                  >
                    <span
                      className="
                  text-[18px]
                  font-semibold
                  text-[#2563EB]
                "
                    >
                      {s.num}
                    </span>
                  </div>

                  <h4 className="mt-5 text-lg font-bold text-gray-900">
                    {s.title}
                  </h4>

                  <p className="mt-2 text-sm text-[#64748B] leading-relaxed max-w-[180px]">
                    {s.desc}
                  </p>

                  {i < steps.length - 1 && (
                    <div className="md:hidden w-px h-8 bg-[#4F7DF3] mt-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS - Hanya tampilkan jika ada data */}
      {testimonials.length > 0 && (
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20">
            <div className="mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
                {t("landing.testimonialTitle")}
              </h2>
              <p className="text-gray-500">
                {t("landing.testimonialDescription")}
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div
                  key={t.id || t.name}
                  className="bg-[#F2F6FF] border border-gray-100 rounded-sm p-6 hover:border-[#2563EB]/20 transition-colors"
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill="#FBBF24"
                        className="text-[#FBBF24]"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    {t.photo ? (
                      <img
                        src={t.photo}
                        alt={t.name}
                        className="w-10 h-10 rounded-full object-cover bg-gray-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                        {t.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {t.name}
                      </div>
                      <div className="text-xs text-gray-400">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA BANNER */}
      <section className="bg-[#F2F6FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-32 md:pb-20">
          <div
            className="relative rounded-sm overflow-hidden p-10 text-center bg-gradient-to-br from-[#2563EB] to-[#1D4ED8]"
            style={{ border: "1px solid rgba(37,99,235,0.3)" }}
          >
            {/* Decorative glows */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#0EA5E9]/20 blur-3xl" />
            </div>
            {/* Dot grid */}
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.06]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="dots-cta"
                  x="0"
                  y="0"
                  width="24"
                  height="24"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2" cy="2" r="1.5" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots-cta)" />
            </svg>
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                {t("landing.ctaTitle")}
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                {t("landing.ctaDescription")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}