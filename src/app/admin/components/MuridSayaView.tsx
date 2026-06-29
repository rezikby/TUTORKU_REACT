// frontend/src/app/admin/components/MuridSayaView.tsx
import { Search, MoreVertical, MessageCircle, Star, User, Calendar, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { adminApiFetch } from "../adminApi";

type Student = {
  id: number;
  name: string;
  avatar?: string | null;
  total_sessions: number;
  last_session_date: string;
  email?: string;
  phone?: string;
};

export default function MuridSayaView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApiFetch("/dashboard/tutor/students")
      .then((data) => setStudents(data.data ?? data))
      .catch((error) => console.error(error))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredStudents = useMemo(
    () =>
      students.filter((student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [searchTerm, students],
  );

  const formatDate = (date: string) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Murid Saya</h2>
          <p className="text-sm text-gray-400 mt-0.5">Kelola murid yang pernah belajar denganmu</p>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
          {isLoading ? "Memuat..." : `${filteredStudents.length} murid`}
        </span>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Cari murid..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 rounded"
        />
      </div>

      {/* Table */}
      <div className="border border-gray-200 overflow-hidden rounded">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-blue-600">
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Murid</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Sesi</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Terakhir</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                    Memuat murid...
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold rounded-full">
                            {getInitials(student.name)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                          {student.email && (
                            <p className="text-xs text-gray-400">{student.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        {student.total_sessions}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        {formatDate(student.last_session_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"
                          title="Chat"
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button 
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"
                          title="More options"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                    {searchTerm ? "Tidak ada murid yang ditemukan." : "Belum ada murid yang belajar denganmu."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      {filteredStudents.length > 0 && (
        <div className="mt-4 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
          {filteredStudents.length} murid aktif
        </div>
      )}
    </div>
  );
}