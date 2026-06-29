export default function PrivacySection() {
  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-4">Privasi</h2>
      <div className="space-y-3">
        <div className="border-b border-gray-100 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Profil Publik</div>
              <div className="text-xs text-gray-400">Tampilkan profil ke pengguna lain</div>
            </div>
            <button className="w-10 h-5 rounded-full bg-blue-600 relative">
              <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white" />
            </button>
          </div>
        </div>
        <div className="border-b border-gray-100 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Tampilkan Email</div>
              <div className="text-xs text-gray-400">Tampilkan email di profil</div>
            </div>
            <button className="w-10 h-5 rounded-full bg-gray-200 relative">
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
