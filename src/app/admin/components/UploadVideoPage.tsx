// frontend/src/app/admin/components/UploadVideoPage.tsx
import { useEffect, useState } from "react";
import { Upload, X, Video, FileText, Check, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { adminApiFetch } from "../adminApi";
import { alertError } from "../../lib/swal";

interface UploadVideoPageProps {
  onCancel?: () => void;
  onSaved?: () => void;
}

export default function UploadVideoPage({ onCancel, onSaved }: UploadVideoPageProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploaded, setIsUploaded] = useState(false);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }
      setThumbnail(file);
      setThumbnailPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoFile(null);
    setVideoPreviewUrl(null);
  };

  const handleRemoveThumbnail = () => {
    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl);
    }
    setThumbnail(null);
    setThumbnailPreviewUrl(null);
  };

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
    };
  }, [videoPreviewUrl, thumbnailPreviewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !title) {
      alertError("Mohon lengkapi semua field yang diperlukan");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("comments_enabled", commentsEnabled ? "1" : "0");
    formData.append("file", videoFile);
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    setIsUploading(true);
    setUploadProgress(15);

    try {
      await adminApiFetch("/tutor/materials", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(100);
      setIsUploaded(true);
      if (onSaved) onSaved();
    } catch (error) {
      console.error("Gagal upload video:", error);
      alertError("Gagal mengupload video. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isUploaded) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <Check size={40} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Video Berhasil Diupload!</h1>
        <p className="text-muted-foreground mb-6">Video kamu sedang dalam proses pemrosesan dan akan segera tayang.</p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => {
              setIsUploaded(false);
              setTitle("");
              setDescription("");
              setCommentsEnabled(true);
              handleRemoveVideo();
              handleRemoveThumbnail();
            }}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all"
          >
            Upload Video Lain
          </button>
          <button
            type="button"
            onClick={() => onCancel && onCancel()}
            className="px-6 py-3 border border-border text-white rounded-xl hover:bg-white/5 transition-all"
          >
            Kembali ke Materi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-32 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Upload Video</h1>
          <p className="text-sm text-muted-foreground mt-1">Bagikan pengetahuanmu dengan siswa lain</p>
        </div>
        <button 
          type="button"
          onClick={() => onCancel && onCancel()}
          className="px-4 py-2 border border-border text-muted-foreground rounded-xl hover:text-white hover:border-white/30 transition-all"
        >
          Batal
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Video Upload */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">File Video</h3>
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              videoFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            {videoFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{videoFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <button 
                    type="button"
                    onClick={handleRemoveVideo}
                    className="p-1 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X size={18} className="text-muted-foreground" />
                  </button>
                </div>
                {videoPreviewUrl && (
                  <div className="rounded-xl overflow-hidden border border-border bg-black">
                    <video src={videoPreviewUrl} controls className="w-full h-56 object-cover" />
                  </div>
                )}
              </div>
            ) : (
              <>
                <Upload size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Seret & letakkan file video di sini</p>
                <p className="text-xs text-muted-foreground mt-1">atau</p>
                <label className="inline-block mt-3 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl cursor-pointer hover:bg-primary/90 transition-all">
                  Pilih File
                  <input 
                    type="file" 
                    accept="video/*" 
                    className="hidden" 
                    onChange={handleVideoChange}
                  />
                </label>
                <p className="text-xs text-muted-foreground mt-2">MP4, AVI, MOV • Maks 500 MB</p>
              </>
            )}
          </div>
        </div>

        {/* Thumbnail */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Thumbnail</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                thumbnail ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              {thumbnail ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{thumbnail.name}</p>
                    <p className="text-xs text-muted-foreground">{(thumbnail.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button 
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="p-1 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X size={18} className="text-muted-foreground" />
                  </button>
                </div>
                {thumbnailPreviewUrl && (
                  <div className="rounded-xl overflow-hidden border border-border bg-black">
                    <img
                      src={thumbnailPreviewUrl}
                      alt="Thumbnail preview"
                      className="w-full h-40 object-cover"
                    />
                  </div>
                )}
              </div>
            ) : (
                <label className="cursor-pointer block">
                  <Upload size={28} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Upload Thumbnail</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG • Maks 5 MB</p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleThumbnailChange}
                  />
                </label>
              )}
            </div>
            <div className="bg-background/50 rounded-xl p-4 flex items-center justify-center border border-border">
              {thumbnailPreviewUrl ? (
                <img
                  src={thumbnailPreviewUrl}
                  alt="Thumbnail preview"
                  className="max-h-56 w-full object-contain rounded-xl"
                />
              ) : (
                <div className="text-center">
                  <Video size={32} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Preview thumbnail akan tampil di sini</p>
                </div>
              )}
            </div>
          </div>
          {thumbnailPreviewUrl && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-border bg-black">
              <div className="px-4 py-3 border-b border-border text-sm text-white">Preview Thumbnail</div>
              <img
                src={thumbnailPreviewUrl}
                alt="Thumbnail preview"
                className="w-full h-64 object-cover"
              />
            </div>
          )}
        </div>

        {/* Info Video */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Informasi Video</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Judul Video <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Belajar Limit Fungsi untuk Pemula"
                className="w-full bg-background/80 border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-primary transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Deskripsi
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan isi video, materi yang dibahas, dan target siswa"
                rows={4}
                className="w-full bg-background/80 border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-primary transition-all resize-none"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-4">
              <div>
                <p className="text-sm font-medium text-white">Komentar</p>
                <p className="text-xs text-muted-foreground">Aktifkan atau nonaktifkan komentar untuk video ini</p>
              </div>
              <button
                type="button"
                onClick={() => setCommentsEnabled((value) => !value)}
                className="text-primary"
              >
                {commentsEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </div>
            <div className="text-sm text-gray-400">
              Mata pelajaran dan jenjang akan diambil dari profil tutor yang sudah terdaftar.
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isUploading || !videoFile || !title}
            className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Uploading... {uploadProgress}%</span>
              </>
            ) : (
              <>
                <Upload size={18} />
                <span>Upload Video</span>
              </>
            )}
          </button>
        </div>

        {isUploading && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Mengupload video...</span>
              <span className="text-white font-semibold">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-background/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}