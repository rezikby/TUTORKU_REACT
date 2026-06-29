export default function NotificationsSection({ settings, toggleSetting, savingKey }: { settings: any; toggleSetting: (k: any) => void; savingKey: string | null; }) {
  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-4">Pengaturan Notifikasi</h2>
      {!settings ? (
        <div className="text-sm text-gray-400">Memuat pengaturan...</div>
      ) : (
        <div className="space-y-3">
          {[
            { key: "notif_email", label: "Notifikasi Email", desc: "Terima pemberitahuan booking & pembayaran via email." },
            { key: "notif_whatsapp", label: "Notifikasi WhatsApp", desc: "Terima pemberitahuan penting via WhatsApp." },
            { key: "notif_push", label: "Notifikasi Push", desc: "Terima notifikasi realtime di aplikasi." },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
              <div>
                <div className="text-sm font-medium text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-400">{item.desc}</div>
              </div>
              <button
                onClick={() => toggleSetting(item.key)}
                disabled={savingKey === item.key}
                className={`w-10 h-5 rounded-full transition-all flex-shrink-0 relative ${settings[item.key] ? "bg-blue-600" : "bg-gray-200"} disabled:opacity-60`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings[item.key] ? "left-5.5" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
