// frontend/src/app/components/ui/Footer.tsx
import { GraduationCap, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Footer() {
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
    {/* Instagram - Warna Asli */}
    <a 
      href="#" 
      className="w-7 xs:w-9 h-7 xs:h-9 flex items-center justify-center bg-white hover:bg-white/90 rounded flex-shrink-0"
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg width="16" height="16" className="xs:w-5 xs:h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#instagram-gradient)" />
        <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" />
        <circle cx="18.5" cy="5.5" r="1.2" fill="white" />
        <defs>
          <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#f09433", stopOpacity:1}} />
            <stop offset="25%" style={{stopColor:"#e6683c", stopOpacity:1}} />
            <stop offset="50%" style={{stopColor:"#dc2743", stopOpacity:1}} />
            <stop offset="75%" style={{stopColor:"#cc2366", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#bc1888", stopOpacity:1}} />
          </linearGradient>
        </defs>
      </svg>
    </a>

    {/* TikTok - Warna Asli */}
    <a 
      href="#" 
      className="w-7 xs:w-9 h-7 xs:h-9 flex items-center justify-center bg-white hover:bg-white/90 rounded flex-shrink-0"
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg width="16" height="16" className="xs:w-5 xs:h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.6 5.82s.51.5 1.5.5c0 0-.5-1.4-.5-1.8 0-.2.1-.3.2-.4.1-.2.2-.3.3-.4.1-.1.3-.2.4-.3.2-.1.4-.2.6-.3V2.3c-.4 0-.8-.1-1.1-.1-.8 0-1.6.2-2.3.5-.6.3-1.1.7-1.5 1.2-.3.4-.5.8-.6 1.3-.1.4-.1.8 0 1.2 0 .2.1.5.2.7.1.2.2.4.3.6.1.2.2.3.4.5.1.1.3.2.4.3 0 0 .2.1.3.1V10c-.9 0-1.8-.2-2.6-.7-.8-.5-1.4-1.2-1.8-2.1-.4-.8-.5-1.7-.3-2.6 0-.3.1-.7.2-1 .1-.3.2-.6.4-.9.2-.3.4-.5.6-.8.2-.2.5-.5.7-.7.2-.2.5-.4.7-.6.2-.2.4-.3.6-.5.1-.1.2-.2.4-.3V1.5h-.1c-2.2 0-4.2 1.3-5.3 3.3-.4.8-.6 1.7-.6 2.6 0 .9.2 1.8.6 2.6.4.8 1 1.5 1.7 2.1.7.5 1.6.9 2.5 1.1.2 0 .4.1.6.1.1 0 .2 0 .3.1.1 0 .2.1.3.1h.1c.1 0 .2.1.3.1.1 0 .2.1.3.1.1 0 .2.1.3.1.1 0 .2.1.2.1.1 0 .2.1.2.1.1 0 .2.1.2.1h.1V12c-.1.1-.3.2-.4.3-.1.1-.3.2-.4.3-.2.1-.4.2-.6.3-.2.1-.4.2-.6.3-.2.1-.4.2-.5.3-.2.1-.4.2-.5.3-.2.1-.3.2-.5.3-.2.1-.4.2-.5.3-.2.1-.3.2-.5.3-.2.1-.3.2-.5.3-.2.1-.3.2-.4.3-.1.1-.3.2-.4.3-.1.1-.2.2-.3.3-.1.1-.2.2-.3.3-.1.1-.2.2-.3.3-.1.1-.2.2-.2.2-.1.1-.2.2-.2.3-.1.1-.1.2-.2.2-.1.1-.1.2-.2.2-.1.1-.1.2-.1.3 0 .1-.1.2-.1.3 0 .1 0 .2-.1.3 0 .1 0 .2-.1.2 0 .1 0 .2-.1.2 0 .1 0 .2-.1.2 0 .1 0 .2-.1.2 0 .1 0 .2-.1.2 0 .1 0 .2-.1.2 0 .1 0 .2-.1.2 0 .1 0 .2-.1.1 0 .1 0 .2v.1c0 .2-.1.3-.1.5 0 .2-.1.4-.1.6 0 .2-.1.4-.1.6 0 .2-.1.4-.1.6 0 .2-.1.4-.1.6 0 .2-.1.4-.1.6 0 .2-.1.4-.1.6 0 .2-.1.3-.1.5 0 .2-.1.3-.1.5 0 .2-.1.3-.1.5 0 .2-.1.3-.1.5 0 .2-.1.3-.1.4 0 .1-.1.3-.1.4v.1c0 .2-.1.3-.1.5 0 .2-.1.3-.1.5 0 .2-.1.3-.1.5 0 .2-.1.3-.1.5 0 .2-.1.3-.1.5 0 .2-.1.3-.1.4 0 .1-.1.3-.1.4v.1c0 .2-.1.3-.1.4 0 .1-.1.3-.1.4v.1c0 .2-.1.3-.1.4 0 .1-.1.3-.1.4v.1c0 .2-.1.3-.1.4 0 .1-.1.3-.1.4v.1c0 .2-.1.3-.1.4 0 .1-.1.3-.1.4v.1c0 .2-.1.3-.1.4 0 .1-.1.3-.1.4v.1c0 .2-.1.3-.1.4 0 .1-.1.3-.1.4v.1c0 .2-.1.3-.1.4 0 .1-.1.3-.1.4v.1c0 .2-.1.3-.1.4 0 .1-.1.3-.1.4v.1c0 .2-.1.3-.1.4 0 .1-.1.3-.1.4v.1c0 .2-.1.3-.1.4 0 .1-.1.3-.1.4v.1c0 .2-.1.3-.1.4 0 .1-.1.3-.1.4v.1c0 .2-.1.3-.1.4 0 .1-.1.3-.1.4v.1c0 .2-.1.3-.1.4 0 .1-.1.3-.1.4 0 .1-.1.3-.1.4 0 .1-.1.2-.1.3 0 .1-.1.2-.1.3v.1h-.1" fill="#000000"/>
      </svg>
    </a>

    {/* YouTube - Warna Asli Merah */}
    <a 
      href="#" 
      className="w-7 xs:w-9 h-7 xs:h-9 flex items-center justify-center bg-white hover:bg-white/90 rounded flex-shrink-0"
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg width="16" height="16" className="xs:w-5 xs:h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.8 7.7s-.2-1.6-.8-2.3c-.8-.9-1.7-.9-2.1-1C15.7 3.8 12 3.8 12 3.8h0s-3.7 0-6.9.4c-.4.1-1.3.1-2.1 1C2.2 5.9 2 7.5 2 7.5S1.8 9.4 1.8 11.3v0c0 1.9.2 3.8.2 3.8s.2 1.6.8 2.3c.8.9 1.8.9 2.3 1 1.7.1 7.1.4 7.1.4s3.7 0 6.9-.4c.4-.1 1.3-.1 2.1-1 .6-.7.8-2.3.8-2.3s.2-1.9.2-3.8v0c0-1.9-.2-3.8-.2-3.8z" fill="#FF0000"/>
        <path d="M10 14.5l5-3.5-5-3.5v7z" fill="white"/>
      </svg>
    </a>

    {/* X (Twitter) - Warna Asli Hitam */}
    <a 
      href="#" 
      className="w-7 xs:w-9 h-7 xs:h-9 flex items-center justify-center bg-white hover:bg-white/90 rounded flex-shrink-0"
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg width="14" height="14" className="xs:w-5 xs:h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#000000"/>
      </svg>
    </a>
  </div>
</div>

        {/* Kolom 2 - Product */}
        <div>
          <div className="text-xs xs:text-sm font-semibold text-white mb-2 xs:mb-3">{t("footer.product")}</div>
          <ul className="space-y-1 xs:space-y-2">
            <li className="hover:text-white/70 cursor-pointer text-white/80">{t("footer.searchTutor")}</li>
            <li className="hover:text-white/70 cursor-pointer text-white/80">{t("footer.becomeTutor")}</li>
            <li className="hover:text-white/70 cursor-pointer text-white/80">{t("footer.liveClass")}</li>
            <li className="hover:text-white/70 cursor-pointer text-white/80">{t("footer.community")}</li>
          </ul>
        </div>

        {/* Kolom 3 - Company */}
        <div>
          <div className="text-xs xs:text-sm font-semibold text-white mb-2 xs:mb-3">{t("footer.company")}</div>
          <ul className="space-y-1 xs:space-y-2">
            <li className="hover:text-white/70 cursor-pointer text-white/80">{t("footer.aboutUs")}</li>
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