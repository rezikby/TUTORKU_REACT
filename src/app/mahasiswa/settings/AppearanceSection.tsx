import { useTranslation } from "react-i18next";

export default function AppearanceSection({ settings, toggleSetting, savingKey, language, onLanguageChange }: { settings: any; toggleSetting: (k: any) => void; savingKey: string | null; language: string; onLanguageChange: (lang: string) => void; }) {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-4">{t("settings.appearance")}</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <div className="text-sm font-medium text-gray-900">{t("settings.darkMode")}</div>
            <div className="text-xs text-gray-400">{t("settings.darkModeDesc")}</div>
          </div>
          <button
            onClick={() => toggleSetting("dark_mode")}
            disabled={savingKey === "dark_mode"}
            className={`w-10 h-5 rounded-full transition-all flex-shrink-0 relative ${settings?.dark_mode ? "bg-blue-600" : "bg-gray-200"} disabled:opacity-60`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings?.dark_mode ? "left-5.5" : "left-0.5"}`} />
          </button>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("settings.language")}</label>
          <select 
            className="w-full border-b border-gray-200 px-0 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            <option value="id">Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>
  );
}
