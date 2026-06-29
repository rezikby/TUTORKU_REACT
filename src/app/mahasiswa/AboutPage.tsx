import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const { t } = useTranslation();

  const features = [
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
  ];

  const stats = [
    { label: t("about.stats.students"), value: "10K+" },
    { label: t("about.stats.tutors"), value: "500+" },
    { label: t("about.stats.cities"), value: "50+" },
    { label: t("about.stats.rating"), value: "4.9" },
  ];

  return (
    <div className="min-h-screen bg-white pt-14 xs:pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 xs:py-12 pb-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-[0.3em] mb-4">{t("about.title")}</p>
          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
            {t("about.heading")}
          </h1>
          <p className="text-base xs:text-lg leading-relaxed text-gray-600 mb-8">
            {t("about.description")}
          </p>
        </div>

        <div className="grid gap-4 xs:gap-6 lg:grid-cols-3 mt-8 xs:mt-10">
          {features.map((item) => (
            <div key={item.title} className="bg-gray-50 p-4 xs:p-6">
              <p className="text-sm font-semibold text-gray-900 mb-2">{item.title}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xs:gap-6 lg:grid-cols-2 mt-6 xs:mt-10">
          <div className="bg-blue-50/50 p-4 xs:p-6">
            <h2 className="text-xl xs:text-2xl font-bold text-[#2563EB] mb-3">{t("about.missionTitle")}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t("about.missionDescription")}
            </p>
          </div>
          <div className="bg-blue-50/50 p-4 xs:p-6">
            <h2 className="text-xl xs:text-2xl font-bold text-[#2563EB] mb-3">{t("about.visionTitle")}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t("about.visionDescription")}
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xs:gap-6 mt-8 xs:mt-10 pt-6 xs:pt-8 border-t border-gray-200">
          {stats.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-2xl xs:text-3xl font-extrabold text-[#2563EB]">{item.value}</div>
              <div className="text-xs xs:text-sm text-gray-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
