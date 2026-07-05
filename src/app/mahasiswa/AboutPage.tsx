import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AvatarFallback from '../shared/AvatarFallback';

type TeamMember = {
  id?: number | string;
  name: string;
  role: string;
  bio: string;
  photo?: string | null;
  social?: {
    instagram?: string;
    tiktok?: string;
    x?: string;
  };
};

type FaqItem = {
  id?: number | string;
  question: string;
  answer: string;
};

type AboutPageProps = {
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
};

type TeamMemberCardProps = {
  member: TeamMember;
};

function TeamMemberCard({ member }: TeamMemberCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = document.getElementById(`team-member-card-${member.id}`);
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [member.id]);

  return (
    <div
      id={`team-member-card-${member.id}`}
      className={`bg-white p-6 rounded-xl border border-gray-200 text-left transition-all duration-700 ease-out transform ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="mb-4 flex justify-center">
        <AvatarFallback name={member.name} photo={member.photo} sizeClass="h-28 w-28" alt={member.name} />
      </div>

      <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
      <p className="text-sm text-blue-600 font-medium mt-1">{member.role}</p>
      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{member.bio}</p>

      {(member.social?.instagram || member.social?.tiktok || member.social?.x) && (
        <div className="flex gap-3 mt-3">
          {member.social?.instagram && (
            <a
              href={member.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-pink-600 transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
          )}
          {member.social?.tiktok && (
            <a
              href={member.social.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-black transition-colors"
              aria-label="TikTok"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.76-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
          )}
          {member.social?.x && (
            <a
              href={member.social.x}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-black transition-colors"
              aria-label="X (Twitter)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function AboutPage({ apiFetch }: AboutPageProps) {
  const { t, i18n } = useTranslation();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const defaultTeamMembers: TeamMember[] = [
    {
      id: "mita",
      name: "Mita Yuliana",
      role: "Founder & CEO",
      bio: "Membangun platform edukasi online yang mudah digunakan dan dapat diakses oleh semua siswa di Indonesia.",
      photo: "/img/MitaYuliana.jpeg",
      social: {
        instagram: "https://instagram.com/mita.yuliana",
      },
    },
    {
      id: "rezi",
      name: "Rezi",
      role: "Chief Technology Officer",
      bio: "Memimpin pengembangan produk dan memastikan pengalaman live class berjalan lancar dan andal.",
      photo: "/img/rezi.jpeg",
      social: {
        x: "https://x.com/rezi",
      },
    },
  ];

  const videos = useMemo(
    () => [
      {
        id: 1,
        title: "Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)",
        channel: "Rick Astley",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      {
        id: 2,
        title: "Video 2",
        channel: "Channel 2",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      {
        id: 3,
        title: "Video 3",
        channel: "Channel 3",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
    ],
    [],
  );

  const normalizeTeamMembers = (source: any): TeamMember[] => {
    if (!source) return [];
    const payload = source?.data ?? source;

    const list =
      Array.isArray(payload.team) && payload.team.length
        ? payload.team
        : Array.isArray(payload.teamMembers) && payload.teamMembers.length
        ? payload.teamMembers
        : Array.isArray(payload.team_members) && payload.team_members.length
        ? payload.team_members
        : Array.isArray(payload.about?.team) && payload.about.team.length
        ? payload.about.team
        : Array.isArray(payload.data?.team) && payload.data.team.length
        ? payload.data.team
        : [];

    return list.map((item: any) => {
      const normalized = {
        id: item.id ?? item.name,
        name: item.name ?? item.full_name ?? item.title ?? "",
        role: item.role ?? item.position ?? "",
        bio: item.bio ?? item.description ?? item.about ?? "",
        photo: item.photo ?? item.avatar ?? item.image ?? null,
        social: {
          instagram: item.instagram ?? item.social?.instagram ?? null,
          tiktok: item.tiktok ?? item.social?.tiktok ?? null,
          x: item.x ?? item.twitter ?? item.social?.x ?? item.social?.twitter ?? null,
        },
      };

      // Merge dengan defaultTeamMembers untuk mengisi photo jika kosong
      const defaultMember = defaultTeamMembers.find(
        (dm) => dm.name.toLowerCase() === normalized.name.toLowerCase()
      );
      if (defaultMember && !normalized.photo) {
        normalized.photo = defaultMember.photo;
        if (!normalized.social?.instagram && defaultMember.social?.instagram) {
          normalized.social.instagram = defaultMember.social.instagram;
        }
        if (!normalized.social?.x && defaultMember.social?.x) {
          normalized.social.x = defaultMember.social.x;
        }
      }

      return normalized;
    });
  };

  const normalizeFaqs = (source: any): FaqItem[] => {
    if (!source) return [];
    const payload = source?.data ?? source;

    const list =
      Array.isArray(payload.faqs) && payload.faqs.length
        ? payload.faqs
        : Array.isArray(payload.faq) && payload.faq.length
        ? payload.faq
        : Array.isArray(payload.questions) && payload.questions.length
        ? payload.questions
        : Array.isArray(payload.about?.faqs) && payload.about.faqs.length
        ? payload.about.faqs
        : Array.isArray(payload.data?.faqs) && payload.data.faqs.length
        ? payload.data.faqs
        : [];

    return list.map((item: any) => ({
      id: item.id ?? item.question,
      question: item.question ?? item.title ?? "",
      answer: item.answer ?? item.response ?? item.description ?? "",
    }));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % videos.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + videos.length) % videos.length);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const locale = i18n.language || "id";

    apiFetch(`/about?lang=${encodeURIComponent(locale)}`, {
      headers: {
        "Accept-Language": locale,
        "X-Locale": locale,
      },
    })
      .then((response) => {
        if (!mounted) return;
        const normalizedTeam = normalizeTeamMembers(response);
        setTeamMembers(normalizedTeam.length ? normalizedTeam : defaultTeamMembers);
        setFaqs(normalizeFaqs(response));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || t("about.loadErrorFallback"));
        setTeamMembers(defaultTeamMembers);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [apiFetch, i18n.language]);

  const displayMembers = teamMembers.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-14 xs:pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-gray-600 text-sm">{t("about.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white pt-14 xs:pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="font-semibold text-red-700 mb-1">Error</p>
            <p className="text-red-600 text-sm">{t("about.loadError", { error })}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-14 xs:pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header Section - Left Aligned */}
        <div className="mb-12 text-left">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            {t("about.heading")}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-3xl">
            {t("about.description")}
          </p>
        </div>

        {/* Video Section - Full Width */}
        <div className="mb-12">
          <div className="relative bg-black rounded-xl overflow-hidden" style={{ paddingBottom: '45%' }}>
            <iframe
              src={videos[currentSlide].url}
              title={`Video ${currentSlide + 1}`}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>

            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Previous video"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Next video"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {videos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`Go to video ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Team Section - 3 Members in a Row - Left Aligned */}
        {displayMembers.length > 0 && (
          <div className="mb-16">
            <div className="text-left mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t("about.teamHeading")}
              </h2>
              <p className="text-sm text-gray-600 max-w-2xl leading-relaxed mt-2">
                {t("about.teamDescription")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {displayMembers.map((member) => (
                <TeamMemberCard key={member.id ?? member.name} member={member} />
              ))}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <div>
            <div className="mb-8 text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t("about.faqHeading")}
              </h2>
              <p className="text-sm text-gray-600 max-w-2xl leading-relaxed mt-2">
                {t("about.faqDescription")}
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((item) => (
                <div key={item.id ?? item.question} className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                    {item.question}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
