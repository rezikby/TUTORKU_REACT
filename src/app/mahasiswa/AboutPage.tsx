import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type TeamMember = {
  id?: number | string;
  name: string;
  role: string;
  bio: string;
  photo?: string | null;
};

type FaqItem = {
  id?: number | string;
  question: string;
  answer: string;
};

type AboutPageProps = {
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
};

export default function AboutPage({ apiFetch }: AboutPageProps) {
  const { t } = useTranslation();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const features = useMemo(
    () => [
      {
        title: t("about.feature1.title"),
        description: t("about.feature1.description"),
      },
      {
        title: t("about.feature2.title"),
        description: t("about.feature2.description"),
      },
      {
        title: t("about.feature3.title"),
        description: t("about.feature3.description"),
      },
    ],
    [t],
  );

  const stats = useMemo(
    () => [
      { label: t("about.stats.students"), value: "10K+" },
      { label: t("about.stats.tutors"), value: "500+" },
      { label: t("about.stats.cities"), value: "50+" },
      { label: t("about.stats.rating"), value: "4.9" },
    ],
    [t],
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

    return list.map((item: any) => ({
      id: item.id ?? item.name,
      name: item.name ?? item.full_name ?? item.title ?? "",
      role: item.role ?? item.position ?? "",
      bio: item.bio ?? item.description ?? item.about ?? "",
      photo: item.photo ?? item.avatar ?? item.image ?? null,
    }));
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

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    apiFetch("/about")
      .then((response) => {
        if (!mounted) return;
        setTeamMembers(normalizeTeamMembers(response));
        setFaqs(normalizeFaqs(response));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || t("about.loadErrorFallback"));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [apiFetch, t]);

  return (
    <div className="min-h-screen bg-white pt-14 xs:pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 xs:py-12 pb-24">
        {/* Header Section - Improved */}
        <div className="max-w-3xl mb-12">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-[0.3em] mb-4">
            {t("about.title")}
          </p>
          <h1 className="text-4xl xs:text-5xl sm:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            {t("about.heading")}
          </h1>
          <p className="text-lg xs:text-xl leading-relaxed text-gray-600">
            {t("about.description")}
          </p>
        </div>

        {/* Features Grid - Improved */}
        <div className="grid gap-6 xs:gap-8 lg:grid-cols-3 mt-10">
          {features.map((item, index) => (
            <div
              key={item.title}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-lg">{index + 1}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Mission & Vision - Improved */}
        <div className="grid gap-6 xs:gap-8 lg:grid-cols-2 mt-12">
          <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100 shadow-sm">
            <h2 className="text-2xl xs:text-3xl font-bold text-blue-600 mb-4">
              {t("about.missionTitle")}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t("about.missionDescription")}
            </p>
          </div>
          <div className="bg-indigo-50 p-8 rounded-2xl border border-indigo-100 shadow-sm">
            <h2 className="text-2xl xs:text-3xl font-bold text-indigo-600 mb-4">
              {t("about.visionTitle")}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t("about.visionDescription")}
            </p>
          </div>
        </div>

        {/* Stats - Improved */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xs:gap-6 mt-12 pt-8 border-t border-gray-200">
          {stats.map((item) => (
            <div 
              key={item.label} 
              className="text-center bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl xs:text-4xl font-extrabold text-blue-600 mb-1">
                {item.value}
              </div>
              <div className="text-sm text-gray-500">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Loading State - Improved */}
        {loading ? (
          <div className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-600">{t("about.loading")}</p>
          </div>
        ) : error ? (
          <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-8">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-xl">⚠️</span>
              <div>
                <p className="font-semibold text-red-700 mb-1">Error</p>
                <p className="text-red-600">{t("about.loadError", { error })}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Team Section - Improved */}
            <div className="mt-14">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
                <div>
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-[0.3em] mb-2">
                    {t("about.teamTitle")}
                  </p>
                  <h2 className="text-3xl xs:text-4xl font-extrabold text-gray-900">
                    {t("about.teamHeading")}
                  </h2>
                </div>
                <p className="max-w-2xl text-gray-600 leading-relaxed">
                  {t("about.teamDescription")}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {teamMembers.map((member) => (
                  <div 
                    key={member.id ?? member.name} 
                    className="bg-white p-6 rounded-2xl text-center border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-200"
                  >
                    <div className="mx-auto mb-4 h-28 w-28 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-gray-400">
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-500">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-blue-600 font-medium mt-1">{member.role}</p>
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{member.bio}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section - Improved */}
            <div className="mt-14">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
                <div>
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-[0.3em] mb-2">
                    {t("about.faqTitle")}
                  </p>
                  <h2 className="text-3xl xs:text-4xl font-extrabold text-gray-900">
                    {t("about.faqHeading")}
                  </h2>
                </div>
                <p className="max-w-2xl text-gray-600 leading-relaxed">
                  {t("about.faqDescription")}
                </p>
              </div>

              <div className="space-y-4">
                {faqs.map((item) => (
                  <div 
                    key={item.id ?? item.question} 
                    className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.question}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}