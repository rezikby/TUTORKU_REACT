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
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-[0.3em] mb-4">
            {t("about.title")}
          </p>
          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
            {t("about.heading")}
          </h1>
          <p className="text-base xs:text-lg leading-relaxed text-gray-600 mb-8">
            {t("about.description")}
          </p>
        </div>

        <div className="grid gap-4 xs:gap-6 lg:grid-cols-3 mt-8 xs:mt-10">
          {features.map((item) => (
            <div
              key={item.title}
              className="bg-slate-50 p-5 rounded-3xl border border-slate-200 shadow-sm"
            >
              <p className="text-sm font-semibold text-slate-900 mb-2">{item.title}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xs:gap-6 lg:grid-cols-2 mt-10">
          <div className="bg-[#EFF6FF] p-6 rounded-3xl border border-blue-100 shadow-sm">
            <h2 className="text-xl xs:text-2xl font-bold text-[#2563EB] mb-3">{t("about.missionTitle")}</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {t("about.missionDescription")}
            </p>
          </div>
          <div className="bg-[#EFF6FF] p-6 rounded-3xl border border-blue-100 shadow-sm">
            <h2 className="text-xl xs:text-2xl font-bold text-[#2563EB] mb-3">{t("about.visionTitle")}</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {t("about.visionDescription")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xs:gap-6 mt-10 pt-6 xs:pt-8 border-t border-slate-200">
          {stats.map((item) => (
            <div key={item.label} className="text-center bg-slate-50 p-4 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-2xl xs:text-3xl font-extrabold text-[#2563EB]">{item.value}</div>
              <div className="text-xs xs:text-sm text-slate-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
            {t("about.loading")}
          </div>
        ) : error ? (
          <div className="mt-12 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            {t("about.loadError", { error })}
          </div>
        ) : (
          <>
            <div className="mt-14 rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-[#2563EB] font-semibold mb-2">
                    {t("about.teamTitle")}
                  </p>
                  <h2 className="text-2xl xs:text-3xl font-extrabold text-slate-900">
                    {t("about.teamHeading")}
                  </h2>
                </div>
                <p className="max-w-2xl text-sm text-slate-600 leading-relaxed">
                  {t("about.teamDescription")}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {teamMembers.map((member) => (
                  <div key={member.id ?? member.name} className="rounded-3xl bg-white p-5 text-center border border-slate-200 shadow-sm">
                    <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs uppercase tracking-[0.25em]">{t("about.noPhoto")}</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{member.role}</p>
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">{member.bio}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-14 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-[#2563EB] font-semibold mb-2">
                    {t("about.faqTitle")}
                  </p>
                  <h2 className="text-2xl xs:text-3xl font-extrabold text-slate-900">
                    {t("about.faqHeading")}
                  </h2>
                </div>
                <p className="max-w-2xl text-sm text-slate-600 leading-relaxed">
                  {t("about.faqDescription")}
                </p>
              </div>
              <div className="space-y-4">
                {faqs.map((item) => (
                  <div key={item.id ?? item.question} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-sm font-semibold text-slate-900">{item.question}</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.answer}</p>
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
