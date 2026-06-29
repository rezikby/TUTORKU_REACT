export default function AccountSection() {
  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-4">Keamanan Akun</h2>
      <div className="space-y-3">
        <div className="border border-gray-200 p-3 flex items-center justify-between rounded">
          <div>
            <div className="text-sm font-medium text-gray-900">Ubah Password</div>
            <div className="text-xs text-gray-400">Ganti password akun kamu</div>
          </div>
          <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors rounded">Ubah</button>
        </div>
        <div className="border border-gray-200 p-3 flex items-center justify-between rounded">
          <div>
            <div className="text-sm font-medium text-gray-900">Verifikasi 2 Langkah</div>
            <div className="text-xs text-gray-400">Tingkatkan keamanan akun</div>
          </div>
          <button className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors rounded">Aktifkan</button>
        </div>
      </div>
    </div>
  );
}
