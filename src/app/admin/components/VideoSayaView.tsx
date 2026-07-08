// frontend/src/app/admin/components/VideoSayaView.tsx
import { Play, Trash2, Edit, Eye, MoreVertical, Plus, FileVideo, Calendar, MessageCircle, ToggleLeft, ToggleRight, Paperclip, ThumbsUp, ThumbsDown } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApiFetch } from "../adminApi";
import UploadVideoPage from "./UploadVideoPage";
import VideoDetailPage from "../../mahasiswa/VideoDetailPage";

interface VideoSayaViewProps {
  initialShowUpload?: boolean;
  apiFetch?: (path: string, options?: RequestInit) => Promise<any>;
}

interface Material {
  id: number;
  title: string;
  subject: string | null;
  description: string | null;
  comments_enabled: boolean;
  file_url: string | null;
  thumbnail_url?: string | null;
  created_at: string;
  views?: number;
  likes?: number;
  dislikes?: number;
  comments_count?: number;
}

export default function VideoSayaView({ initialShowUpload = false, apiFetch }: VideoSayaViewProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(initialShowUpload);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCommentsEnabled, setEditCommentsEnabled] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const data = await adminApiFetch("/tutor/materials");
      setMaterials(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApi = apiFetch || adminApiFetch;

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleDeleteVideo = async (id: number) => {
    setDeletingId(id);
    try {
      await adminApiFetch(`/tutor/materials/${id}`, { method: "DELETE" });
      setMaterials((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (material: Material) => {
    setEditingId(material.id);
    setEditTitle(material.title);
    setEditDescription(material.description ?? "");
    setEditCommentsEnabled(material.comments_enabled);
  };

  const handleSaveEdit = async (id: number) => {
    setSavingId(id);
    try {
      const updated = await adminApiFetch(`/tutor/materials/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          comments_enabled: editCommentsEnabled,
        }),
      });
      setMaterials((current) => current.map((item) => item.id === id ? { ...item, ...updated } : item));
      setEditingId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingId(null);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Materi Saya</h2>
          <p className="text-sm text-gray-400 mt-0.5">Kelola materi pembelajaran kamu</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors rounded"
        >
          <Plus size={18} />
          Upload Materi
        </button>
      </div>

      {showUpload && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Unggah Materi Video</h3>
              <p className="text-sm text-gray-500 mt-1">Upload materi baru tanpa meninggalkan halaman tutor.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50"
            >
              Tutup
            </button>
          </div>
          <UploadVideoPage
            onCancel={() => setShowUpload(false)}
            onSaved={() => {
              setShowUpload(false);
              loadMaterials();
            }}
          />
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full border border-gray-200 p-8 text-center text-sm text-gray-400 rounded">
            Memuat materi...
          </div>
        ) : materials.length > 0 ? (
          materials.map((material) => (
            <div
              key={material.id}
              onClick={() => setSelectedVideoId(material.id)}
              className="border border-gray-200 hover:border-gray-300 transition-colors rounded overflow-hidden cursor-pointer"
            >
              {/* Thumbnail - Clickable */}
              <div
                className="relative w-full h-36 bg-gray-100 flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity"
              >
                {material.thumbnail_url ? (
                  <img
                    src={material.thumbnail_url}
                    alt={`Thumbnail ${material.title}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center px-4">
                    <FileVideo size={32} className="text-gray-400" />
                    <p className="mt-2 text-xs text-gray-400">{material.subject ?? "Materi"}</p>
                  </div>
                )}
                {material.thumbnail_url && (
                  <div className="absolute inset-0 bg-black/20" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
                  <Eye size={32} className="text-white opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{material.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2">{material.description ?? "Tidak ada deskripsi"}</p>

                <div className="flex items-center gap-3 text-xs text-gray-400 mt-3 pb-3 border-b border-gray-100">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(material.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Paperclip size={14} />
                    {material.file_url ? "File tersedia" : "Tanpa file"}
                  </span>
                </div>

                {/* Engagement Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Eye size={12} />
                    {material.views ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp size={12} />
                    {material.likes ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsDown size={12} />
                    {material.dislikes ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={12} />
                    {material.comments_count ?? 0}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(material);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors rounded"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    disabled={deletingId === material.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVideo(material.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors rounded"
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full border border-gray-200 p-12 text-center rounded">
            <FileVideo size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-1">Belum ada materi</p>
            <p className="text-sm text-gray-400 mb-4">Unggah materi pembelajaran Anda untuk mulai membantu murid.</p>
            <button
              onClick={() => setShowUpload(true)}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors rounded"
            >
              Upload Materi Pertama
            </button>
          </div>
        )}
      </div>

      {editingId !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-5">
            <h3 className="text-base font-semibold text-gray-900">Edit Video / Materi</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-900">Judul</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 mt-1 text-base text-gray-900 font-medium placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-all" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-900">Deskripsi</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 mt-1 text-base text-gray-900 font-medium placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-all resize-none" />
              </div>
              <div className="flex items-center justify-between rounded border border-gray-200 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Komentar</p>
                  <p className="text-xs text-gray-500">Aktifkan atau nonaktifkan komentar untuk video ini</p>
                </div>
                <button type="button" onClick={() => setEditCommentsEnabled((v) => !v)} className="text-blue-600">
                  {editCommentsEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded">Batal</button>
              <button onClick={() => handleSaveEdit(editingId)} disabled={savingId === editingId} className="px-4 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-50">
                {savingId === editingId ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {materials.length > 0 && (
        <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
          {materials.length} materi
        </div>
      )}

      {/* Video Detail Modal */}
      {selectedVideoId !== null && (
        <VideoDetailPage
          videoId={selectedVideoId}
          onClose={() => setSelectedVideoId(null)}
          apiFetch={fetchApi}
        />
      )}
    </div>
  );
}