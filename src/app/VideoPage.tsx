/**
 * FILE: frontend/src/app/VideoPage.tsx
 * STATUS: DIUBAH (fix crash null uploader/subject)
 */

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import VideoDetailPage from "./mahasiswa/VideoDetailPage";
import { Skeleton } from "./components/ui";

type VideoItem = {
  id: number;
  title: string;
  uploader: string | null;
  subject: string | null;
  file_url?: string | null;
};

export default function VideoPage({ navigate }: { navigate: (p: any) => void }) {
  const { t } = useTranslation();
  const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "https://rezi-laravel.nlabs.id/api";
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | "all">("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

  useEffect(() => {
    const onMaterialsChanged = () => fetchPage(1, true);

    const load = async () => {
      setLoading(true);
      try {
        await fetchPage(1, true);
      } catch (e) {
        console.warn("Failed to load videos", e);
      }

      try {
        const r = await fetch(`${API_BASE}/subjects`);
        const sd = await r.json().catch(() => null);
        if (sd && Array.isArray(sd)) setSubjects(sd.map((s: any) => (typeof s === "string" ? s : s.name)));
        else if (sd && sd.data) setSubjects(sd.data.map((s: any) => s.name));
      } catch (e) {
        console.warn("Failed to load subjects", e);
      }

      setLoading(false);
    };

    load();
    window.addEventListener("materials:changed", onMaterialsChanged);
    return () => window.removeEventListener("materials:changed", onMaterialsChanged);
  }, []);

  const fetchPage = async (p: number, replace = false) => {
    const perPage = 12;
    if (p === 1) setHasMore(true);
    if (!replace) setLoadingMore(true);
    try {
      const url = `${API_BASE}/materials?page=${p}&per_page=${perPage}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => null);
      let items: VideoItem[] = [];
      if (data && Array.isArray(data)) items = data as VideoItem[];
      else if (data && Array.isArray(data.data)) items = data.data as VideoItem[];
      else if (data && data.items) items = data.items as VideoItem[];

      if (replace) {
        setVideos(items);
      } else {
        setVideos((prev) => [...prev, ...items]);
      }

      if (items.length < perPage) setHasMore(false);
      else setHasMore(true);
      setPage(p);
    } catch (e) {
      console.warn("Failed paging videos", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = videos.slice();
    if (selectedSubject && selectedSubject !== "all") {
      list = list.filter((v) => v.subject === selectedSubject);
    }

    if (!q) return list;

    const score = (v: VideoItem) => {
      const title = v.title.toLowerCase();
      const up = (v.uploader ?? "").toLowerCase();
      const subj = (v.subject ?? "").toLowerCase();
      if (title.startsWith(q)) return 100;
      if (title.includes(q)) return 80 - title.indexOf(q);
      if (up.includes(q)) return 60 - up.indexOf(q);
      if (subj.includes(q)) return 40;
      return 0;
    };

    return list
      .map((v) => ({ v, s: score(v) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.v);
  }, [videos, selectedSubject, query]);

  const subjectsWithAll = ["all", ...subjects];

  const onClickVideo = (video: VideoItem) => {
    setSelectedVideoId(video.id);
  };

  const apiFetch = async (path: string, options?: RequestInit) => {
    const url = `${API_BASE}${path}`;
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return response.json();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-8">
      <div className="flex flex-col gap-6">
        <div className="w-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 w-full">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("video.searchPlaceholder")} className="w-full bg-transparent outline-none text-white placeholder:text-slate-400 text-sm" />
              <button className="text-xs text-primary px-2 py-1">{t("video.searchButton")}</button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
            {subjectsWithAll.map((s) => (
              <button key={s} onClick={() => setSelectedSubject(s === "all" ? "all" : s)} className={`px-2 py-1 rounded-full text-xs ${selectedSubject === s ? "bg-blue-600 text-white" : "bg-white/5 text-slate-300"}`}>
                {s === "all" ? t("video.allSubjects") : s}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(query ? filtered : videos).map((v) => (
              <div key={v.id} className="bg-card rounded-lg overflow-hidden cursor-pointer" onClick={() => onClickVideo(v)} role="button" tabIndex={0}>
                <div className="w-full h-36 bg-slate-700 flex items-center justify-center overflow-hidden">
                  {v.file_url ? (
                    <video muted playsInline autoPlay loop src={v.file_url} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white">{t("video.videoLabel")}</span>
                  )}
                </div>
                <div className="p-2">
                  <div className="text-sm font-semibold text-white truncate">{v.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{v.uploader ?? t("video.unknownUploader")} • {v.subject ?? t("video.unknownSubject")}</div>
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <div className="text-sm text-slate-400 mt-4">
              <Skeleton className="h-4 w-48" />
            </div>
          )}
          {!loading && hasMore && (
            <div className="mt-6 flex justify-center">
              <button onClick={() => fetchPage(page + 1)} className="px-4 py-2 rounded-sm bg-blue-600 text-white text-sm">
                {loadingMore ? t("video.loading") : t("video.loadMore")}
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedVideoId !== null && (
        <VideoDetailPage
          videoId={selectedVideoId}
          onClose={() => setSelectedVideoId(null)}
          apiFetch={apiFetch}
        />
      )}
    </div>
  );
}
