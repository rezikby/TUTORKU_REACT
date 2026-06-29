export default function HelpSection() {
  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-4">Bantuan</h2>
      <div className="space-y-3">
        <button className="w-full text-left border border-gray-200 p-3 hover:bg-gray-50 transition-colors rounded">
          <div className="text-sm font-medium text-gray-900">FAQ</div>
          <div className="text-xs text-gray-400">Pertanyaan yang sering diajukan</div>
        </button>
        <button className="w-full text-left border border-gray-200 p-3 hover:bg-gray-50 transition-colors rounded">
          <div className="text-sm font-medium text-gray-900">Hubungi Kami</div>
          <div className="text-xs text-gray-400">Dukungan pelanggan</div>
        </button>
        <button className="w-full text-left border border-gray-200 p-3 hover:bg-gray-50 transition-colors rounded">
          <div className="text-sm font-medium text-gray-900">Pusat Bantuan</div>
          <div className="text-xs text-gray-400">Panduan dan dokumentasi</div>
        </button>
      </div>
    </div>
  );
}
