import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const teamMembers = [
  {
    name: "Alif",
    role: "Founder & Product Lead",
    photo: null,
  },
  {
    name: "Dewi",
    role: "Design & UX",
    photo: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Rian",
    role: "Engineering",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Sari",
    role: "Growth & Community",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
  },
];

export default function AboutPage() {
  const { t } = useTranslation();
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleSections, setVisibleSections] = useState<boolean[]>(
    new Array(8).fill(false),
  );

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            if (!Number.isNaN(index)) {
              setVisibleSections((current) => {
                const next = [...current];
                next[index] = true;
                return next;
              });
            }
          }
        });
      },
      { threshold: 0.2 },
    );

    [...featureRefs.current, ...sectionRefs.current].forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  const sectionClass = (index: number) =>
    `transition duration-700 ease-out transform ${
      visibleSections[index]
        ? "opacity-100 translate-y-0"
        : "opacity-0 translate-y-8"
    }`;

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
          {features.map((item, index) => (
            <div
              key={item.title}
              ref={(el) => {
                featureRefs.current[index] = el;
              }}
              data-index={index}
              className={`${sectionClass(index)} bg-slate-50 p-5 rounded-3xl border border-slate-200 shadow-sm`}
            >
              <p className="text-sm font-semibold text-slate-900 mb-2">{item.title}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xs:gap-6 lg:grid-cols-2 mt-10">
          <div
            ref={(el) => {
              sectionRefs.current[3] = el;
            }}
            data-index={3}
            className={`${sectionClass(3)} bg-[#EFF6FF] p-6 rounded-3xl border border-blue-100 shadow-sm`}
          >
            <h2 className="text-xl xs:text-2xl font-bold text-[#2563EB] mb-3">{t("about.missionTitle")}</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {t("about.missionDescription")}
            </p>
          </div>
          <div
            ref={(el) => {
              sectionRefs.current[4] = el;
            }}
            data-index={4}
            className={`${sectionClass(4)} bg-[#EFF6FF] p-6 rounded-3xl border border-blue-100 shadow-sm`}
          >
            <h2 className="text-xl xs:text-2xl font-bold text-[#2563EB] mb-3">{t("about.visionTitle")}</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {t("about.visionDescription")}
            </p>
          </div>
        </div>

        <div
          ref={(el) => {
            sectionRefs.current[5] = el;
          }}
          data-index={5}
          className={`${sectionClass(5)} grid grid-cols-2 md:grid-cols-4 gap-4 xs:gap-6 mt-10 pt-6 xs:pt-8 border-t border-slate-200`}
        >
          {stats.map((item) => (
            <div key={item.label} className="text-center bg-slate-50 p-4 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-2xl xs:text-3xl font-extrabold text-[#2563EB]">{item.value}</div>
              <div className="text-xs xs:text-sm text-slate-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        <div
          ref={(el) => {
            sectionRefs.current[6] = el;
          }}
          data-index={6}
          className={`${sectionClass(6)} mt-14 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#2563EB] font-semibold mb-2">Tim Kami</p>
              <h2 className="text-2xl xs:text-3xl font-extrabold text-slate-900">Bersama membangun pengalaman belajar yang lebih baik</h2>
            </div>
            <p className="max-w-2xl text-sm text-slate-600 leading-relaxed">
              Kami percaya belajar efektif terjadi saat teknologi, tutor, dan komunitas bekerja bersama.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {teamMembers.map((member) => (
              <div key={member.name} className="rounded-3xl bg-white p-4 text-center border border-slate-200 shadow-sm">
                <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs uppercase tracking-[0.25em]">Coming</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                <p className="text-xs text-slate-500 mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          ref={(el) => {
            sectionRefs.current[7] = el;
          }}
          data-index={7}
          className={`${sectionClass(7)} mt-14 rounded-3xl border border-slate-200 bg-gradient-to-r from-[#2563EB]/10 via-white to-[#2563EB]/5 p-8 text-center shadow-sm`}
        >
          <h3 className="text-xl xs:text-2xl font-bold text-slate-900 mb-3">Siap mulai perjalanan belajarmu?</h3>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            TUTORKU mempertemukan siswa dengan tutor profesional dan komunitas pembelajar yang aktif.
          </p>
        </div>
      </div>
    </div>
  );
}
