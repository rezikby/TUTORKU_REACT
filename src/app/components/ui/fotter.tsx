// frontend/src/app/components/ui/Footer.tsx
import { useTranslation } from "react-i18next";

type FooterProps = {
  navigate: (page: string) => void;
};

export default function Footer({ navigate }: FooterProps) {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-[#1a4db8] bg-[#2563EB]">
      <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 lg:px-6 xl-2xl:px-8 py-6 xs:py-8 md:py-12 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4 md:gap-8 text-[10px] xs:text-sm text-white">
        {/* Kolom 1 - Brand */}
       <div>
<div className="h-7 xs:h-9 mb-2 xs:mb-3 relative overflow-visible">
<img
  src="/img/logo2.png"
  alt="TUTORKU Logo"
  className="absolute -left-8 xs:-left-2 lg:-left-10 top-1/2 -translate-y-1/2 h-60 xs:h-64 w-auto object-contain flex-shrink-0"
/>
</div>
  <div className="text-[9px] xs:text-sm text-white/80 mb-2 xs:mb-4">{t("footer.brand")}</div>
  <div className="flex gap-2 xs:gap-3">
    <a
      href="#"
      className="w-7 xs:w-9 h-7 xs:h-9 flex items-center justify-center rounded overflow-hidden flex-shrink-0"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src="/img/social/instagram.png" alt="Instagram" className="w-full h-full object-contain" />
    </a>

    <a
      href="#"
      className="w-7 xs:w-9 h-7 xs:h-9 flex items-center justify-center rounded overflow-hidden flex-shrink-0"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src="/img/social/tik-tok.png" alt="TikTok" className="w-full h-full object-contain" />
    </a>

    <a
      href="#"
      className="w-7 xs:w-9 h-7 xs:h-9 flex items-center justify-center rounded overflow-hidden flex-shrink-0"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src="/img/social/youtube.png" alt="YouTube" className="w-full h-full object-contain" />
    </a>


    {/* X (Twitter) - Warna Asli Hitam */}
    <a
      href="#"
      className="w-7 xs:w-9 h-7 xs:h-9 flex items-center justify-center rounded overflow-hidden flex-shrink-0"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src="/img/social/twitter.png" alt="Twitter" className="w-full h-full object-contain" />
    </a>
  </div>
</div>

        {/* Kolom 2 - Produk */}
        <div>
          <div className="text-xs xs:text-sm font-semibold text-white mb-2 xs:mb-3">{t("footer.product")}</div>
          <ul className="space-y-1 xs:space-y-2">
            <li
              onClick={() => navigate("cari-tutor")}
              className="hover:text-white/70 cursor-pointer text-white/80"
            >
              {t("footer.searchTutor")}
            </li>
            <li
              onClick={() => navigate("tutor-registration")}
              className="hover:text-white/70 cursor-pointer text-white/80"
            >
              {t("footer.becomeTutor")}
            </li>
            <li
              onClick={() => navigate("live-class")}
              className="hover:text-white/70 cursor-pointer text-white/80"
            >
              {t("footer.liveClass")}
            </li>
            <li
              onClick={() => navigate("forum")}
              className="hover:text-white/70 cursor-pointer text-white/80"
            >
              {t("footer.community")}
            </li>
          </ul>
        </div>

        {/* Kolom 3 - Komunitas */}
        <div>
          <div className="text-xs xs:text-sm font-semibold text-white mb-2 xs:mb-3">{t("footer.company")}</div>
          <ul className="space-y-1 xs:space-y-2">
            <li
              onClick={() => navigate("about")}
              className="hover:text-white/70 cursor-pointer text-white/80"
            >
              {t("footer.aboutUs")}
            </li>
            <li className="hover:text-white/70 cursor-pointer text-white/80">{t("footer.blog")}</li>
            <li className="hover:text-white/70 cursor-pointer text-white/80">{t("footer.careers")}</li>
            <li className="hover:text-white/70 cursor-pointer text-white/80">{t("footer.press")}</li>
          </ul>
        </div>

        {/* Kolom 4 - Support */}
        <div>
          <div className="text-sm font-semibold text-white mb-3">{t("footer.support")}</div>
          <ul className="space-y-2">
            <li className="hover:text-white/70 cursor-pointer text-white/80">{t("footer.faq")}</li>
            <li className="hover:text-white/70 cursor-pointer text-white/80">{t("footer.contact")}</li>
            <li className="hover:text-white/70 cursor-pointer text-white/80">{t("footer.privacy")}</li>
            <li className="hover:text-white/70 cursor-pointer text-white/80">{t("footer.terms")}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/60">
          <span>{t("footer.copyright")}</span>
          {/* <span className="flex items-center gap-1">
            {t("footer.madeWith")} <Heart size={12} className="text-red-400 fill-red-400" /> {t("footer.inIndonesia")}
          </span> */}
        </div>
      </div>
    </footer>
  );
}