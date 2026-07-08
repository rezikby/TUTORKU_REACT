// frontend/src/components/ForumPage.tsx
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusCircle, Flame, ThumbsUp, MessageSquare, Hash, Check, Search, Bookmark } from "lucide-react";
import { toastError, toastSuccess, confirmAction } from "../lib/swal";
import { Skeleton } from "../components/ui";

type ForumComment = {
  id: number;
  user: { name: string; avatar?: string | null };
  parent_id?: number | null;
  body: string;
  likes: number;
  replies: ForumComment[];
  time: string;
  is_solution: boolean;
};

type CurrentUser = {
  id: number;
  name: string;
  avatar?: string | null;
  education_level?: string | null;
} | null;

type ForumPost = {
  id: number;
  user: { id?: number; name: string; avatar?: string | null } | string;
  category: string;
  subject?: { id?: number; name?: string | null; slug?: string | null } | null;
  education_level?: string | null;
  title: string;
  body: string;
  likes: number;
  replies: number;
  time: string;
  created_at?: string | null;
  solved: boolean;
  liked_by_me?: boolean;
  bookmarked_by_me?: boolean;
  comments?: ForumComment[];
};

type ForumCategory = {
  id: number;
  name: string;
  slug: string;
};

type ForumSubject = {
  id: number;
  name: string;
  slug: string;
};

type Page = "landing" | "cari-tutor" | "detail-tutor" | "booking" | "live-class" | "chat" | "dashboard-siswa" | "forum" | "about" | "progress" | "settings" | "login" | "register" | "video" | "upload-video" | "admin" | "login-google-otp" | "tutor-registration" | "booking-saya" | "riwayat-belajar" | "favorit" | "notifikasi" | "platform-admin" | "tutor-login" | "admin-login";

export function ForumPage({
  posts,
  setPosts,
  likedPosts,
  setLikedPosts,
  apiFetch,
  navigate,
  user,
}: {
  posts: ForumPost[];
  setPosts: Dispatch<SetStateAction<ForumPost[]>>;
  likedPosts: number[];
  setLikedPosts: Dispatch<SetStateAction<number[]>>;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  navigate: (p: Page) => void;
  user: CurrentUser;
}) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [forumCategories, setForumCategories] = useState<ForumCategory[]>([]);
  const [forumSubjects, setForumSubjects] = useState<ForumSubject[]>([]);
  const [activeSubject, setActiveSubject] = useState<number | null>(null);
  const [activeEducationLevel, setActiveEducationLevel] = useState<string>("Semua");
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
  const [newSubjectId, setNewSubjectId] = useState<number | null>(null);
  const [newEducationLevel, setNewEducationLevel] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<number[]>([]);
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<number, ForumComment[]>>({});
  const [replyBodies, setReplyBodies] = useState<Record<number, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<number, boolean>>({});
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

  const categories = ["Semua", ...forumCategories.map((c) => c.name)];
  const levelOptions = ["Semua", "SD", "SMP/MTS", "SMA/SMK", "Universitas/Politeknik"];
  const subjectOptions = [{ id: null, name: t("forum.allSubjects") }, ...forumSubjects.map((subject) => ({ id: subject.id, name: subject.name }))];
  const getCategoryLabel = (c: string) => (c === "Semua" ? t("forum.allCategories") : c);

  const normalizeEducationLevel = (level?: string | null) => {
    const normalized = (level ?? "").trim().toLowerCase();
    if (!normalized) return "";
    if (normalized.includes("sd")) return "SD";
    if (normalized.includes("smp") || normalized.includes("mts")) return "SMP/MTS";
    if (normalized.includes("sma") || normalized.includes("smk")) return "SMA/SMK";
    if (normalized.includes("universitas") || normalized.includes("politeknik") || normalized.includes("mahasiswa")) {
      return "Universitas/Politeknik";
    }
    return level?.trim() ?? "";
  };

  const getDefaultSubjectId = (subjects: ForumSubject[], level?: string | null) => {
    const normalized = normalizeEducationLevel(level);
    const levelKeywords = {
      SD: ["sd", "mi"],
      "SMP/MTS": ["smp", "mts"],
      "SMA/SMK": ["sma", "smk"],
      "Universitas/Politeknik": ["universitas", "politeknik", "mahasiswa"],
    } as Record<string, string[]>;

    const keywords = levelKeywords[normalized as keyof typeof levelKeywords] ?? [];

    if (keywords.length > 0) {
      const matched = subjects.find((subject) => {
        const subjectName = subject.name.toLowerCase();
        return keywords.some((keyword) => subjectName.includes(keyword));
      });
      if (matched) return matched.id;
    }

    return subjects[0]?.id ?? null;
  };

  const loadCategories = async () => {
    try {
      const data = await apiFetch("/forum/categories");
      const items = data.data ?? data;
      setForumCategories(items);
      if (items.length > 0) {
        setNewCategoryId(items[0].id);
      }
    } catch (error) {
      console.error("Gagal memuat kategori forum", error);
    }
  };

  const loadSubjects = async () => {
    try {
      const data = await apiFetch("/subjects");
      const items = data.data ?? data;
      setForumSubjects(items);
    } catch (error) {
      console.error("Gagal memuat mata pelajaran forum", error);
    }
  };

  useEffect(() => {
    loadCategories();
    loadSubjects();
  }, []);

  useEffect(() => {
    if (showCreateForm && forumSubjects.length > 0) {
      const defaultSubjectId = getDefaultSubjectId(forumSubjects, user?.education_level);
      setNewSubjectId(defaultSubjectId);
      setNewEducationLevel(normalizeEducationLevel(user?.education_level));
    }
  }, [showCreateForm, forumSubjects, user?.education_level]);

  useEffect(() => {
    const postLikes = posts
      .filter((post) => post.liked_by_me)
      .map((post) => post.id);
    if (postLikes.length > 0) {
      setLikedPosts(postLikes);
    }
  }, [posts, setLikedPosts]);

  useEffect(() => {
    const postBookmarks = posts
      .filter((post) => post.bookmarked_by_me)
      .map((post) => post.id);
    if (postBookmarks.length > 0) {
      setBookmarkedPosts(postBookmarks);
    }
  }, [posts]);

  const loadPostComments = async (id: number) => {
    if (expandedPostId === id && expandedReplies[id]) {
      setExpandedPostId(null);
      return;
    }

    setLoadingComments((prev) => ({ ...prev, [id]: true }));
    try {
      const data = await apiFetch(`/forum/posts/${id}`);
      const detail = data.data ?? data;
      const comments = detail.comments ?? [];
      setExpandedReplies((prev) => ({ ...prev, [id]: comments }));
      setExpandedPostId(id);
    } catch (error) {
      console.error("Gagal memuat komentar forum", error);
      toastError(t("forum.loadCommentsFailed"));
    } finally {
      setLoadingComments((prev) => ({ ...prev, [id]: false }));
    }
  };

  const startEditingPost = (post: ForumPost) => {
    if (editingPostId !== post.id) {
      setEditingPostId(post.id);
      setEditTitle(post.title);
      setEditBody(post.body);
    }
  };

  const cancelEditingPost = () => {
    setEditingPostId(null);
    setEditTitle("");
    setEditBody("");
  };

  const savePostEdits = async (postId: number) => {
    if (!editTitle.trim() || !editBody.trim()) {
      toastError(t("forum.titleBodyRequired"));
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const response = await apiFetch(`/forum/posts/${postId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editTitle.trim(),
          body: editBody.trim(),
        }),
      });
      const updatedPost = response.data ?? response;
      setPosts((current) => current.map((post) => (post.id === postId ? updatedPost : post)));
      setEditingPostId(null);
      setEditTitle("");
      setEditBody("");
      toastSuccess(t("forum.postUpdated"));
    } catch (error: any) {
      console.error("Gagal memperbarui post forum", error);
      toastError(error?.message || t("forum.postUpdateFailed"));
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const deletePost = async (postId: number) => {
    if (!(await confirmAction(t("forum.deletePostConfirmTitle"), t("forum.deletePostConfirmText")))) {
      return;
    }

    setDeletingPostId(postId);
    try {
      await apiFetch(`/forum/posts/${postId}`, { method: "DELETE" });
      setPosts((current) => current.filter((post) => post.id !== postId));
      if (expandedPostId === postId) {
        setExpandedPostId(null);
      }
      if (editingPostId === postId) {
        cancelEditingPost();
      }
      toastSuccess(t("forum.postDeleted"));
    } catch (error: any) {
      console.error("Gagal menghapus post forum", error);
      toastError(error?.message || t("forum.postDeleteFailed"));
    } finally {
      setDeletingPostId(null);
    }
  };

  const isPostOwner = (post: ForumPost) => {
    return (
      user !== null &&
      typeof post.user !== "string" &&
      typeof post.user.id === "number" &&
      post.user.id === user.id
    );
  };

  const isEditableByOwner = (post: ForumPost) => {
    if (!isPostOwner(post) || !post.created_at) {
      return false;
    }

    const createdAt = new Date(post.created_at);
    const threshold = new Date(Date.now() - 5 * 60 * 1000);
    return createdAt >= threshold;
  };

  const toggleLike = async (id: number) => {
    const currentLiked = likedPosts.includes(id);
    setLikedPosts(currentLiked ? likedPosts.filter((i) => i !== id) : [...likedPosts, id]);
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? {
              ...post,
              liked_by_me: !currentLiked,
              likes: currentLiked ? Math.max(post.likes - 1, 0) : post.likes + 1,
            }
          : post,
      ),
    );

    try {
      const data = await apiFetch(`/forum/posts/${id}/like`, { method: "POST" });
      const updatedLikes = data.likes ?? null;
      if (updatedLikes !== null) {
        setPosts((current) =>
          current.map((post) =>
            post.id === id
              ? {
                  ...post,
                  likes: updatedLikes,
                  liked_by_me: !currentLiked,
                }
              : post,
          ),
        );
      }
    } catch (error) {
      setLikedPosts(currentLiked ? [...likedPosts, id] : likedPosts.filter((i) => i !== id));
      setPosts((current) =>
        current.map((post) =>
          post.id === id
            ? {
                ...post,
                liked_by_me: currentLiked,
                likes: post.likes,
              }
            : post,
        ),
      );
      toastError(t("forum.likeFailed"));
    }
  };

  const toggleBookmark = async (id: number) => {
    const currentBookmarked = bookmarkedPosts.includes(id);
    setBookmarkedPosts(
      currentBookmarked
        ? bookmarkedPosts.filter((i) => i !== id)
        : [...bookmarkedPosts, id]
    );

    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? { ...post, bookmarked_by_me: !currentBookmarked }
          : post,
      ),
    );

    try {
      await apiFetch(`/forum/posts/${id}/bookmark`, { method: "POST" });
    } catch (error) {
      setBookmarkedPosts(
        currentBookmarked
          ? [...bookmarkedPosts, id]
          : bookmarkedPosts.filter((i) => i !== id)
      );
      toastError(t("forum.bookmarkFailed"));
    }
  };

  const submitReply = async (postId: number) => {
    const body = replyBodies[postId];
    if (!body || !body.trim()) {
      toastError(t("forum.replyRequired"));
      return;
    }

    setSubmittingReply((prev) => ({ ...prev, [postId]: true }));
    try {
      const newComment = await apiFetch(`/forum/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: body.trim() }),
      });

      const comment = newComment.data ?? newComment;

      setExpandedReplies((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), comment],
      }));

      setPosts((current) =>
        current.map((post) =>
          post.id === postId ? { ...post, replies: post.replies + 1 } : post,
        ),
      );

      setReplyBodies((prev) => ({ ...prev, [postId]: "" }));
      toastSuccess(t("forum.replyAdded"));
    } catch (error: any) {
      console.error("Gagal menambah balasan", error);
      toastError(error?.message || t("forum.replyAddFailed"));
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const filtered = posts
    .filter((post) => {
      if (activeCategory !== "Semua" && post.category !== activeCategory) return false;
      if (activeSubject !== null && post.subject?.id !== activeSubject) return false;
      if (activeEducationLevel !== "Semua" && post.education_level !== activeEducationLevel) return false;
      return true;
    })
    .filter((post) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.trim().toLowerCase();
      return (
        post.title.toLowerCase().includes(query) ||
        post.body.toLowerCase().includes(query) ||
        post.category.toLowerCase().includes(query) ||
        (post.subject?.name ?? "").toLowerCase().includes(query)
      );
    });

  const getTimeAgo = (time: string) => {
    if (!time) return "";
    const date = new Date(time);
    if (isNaN(date.getTime())) return time;
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return t("forum.justNow");
    if (minutes < 60) return t("forum.minutesAgo", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("forum.hoursAgo", { count: hours });
    const days = Math.floor(hours / 24);
    return t("forum.daysAgo", { count: days });
  };

  const extractHashtags = (text: string) => {
    const matches = Array.from(text.matchAll(/#\([\p{L}\p{N}_-]+\)|#[\p{L}\p{N}_-]+/gu)).map((m) => m[0]);
    return Array.from(new Set(matches));
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-2 xs:px-3 sm:px-4 py-4 xs:py-6 pb-24 xs:pb-32">
        {/* Header - Forum Komunitas sejajar dengan Buat Post */}
        <div className="flex items-start sm:items-center justify-between gap-2 xs:gap-4 mb-4 xs:mb-6">
          <div>
            <h1 className="text-lg xs:text-2xl font-extrabold text-gray-900">{t("forum.title")}</h1>
            <p className="text-xs xs:text-sm text-gray-400 mt-0.5">{t("forum.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-4 py-1.5 xs:py-2.5 bg-blue-600 text-white text-xs xs:text-sm font-medium hover:bg-blue-700 transition-colors rounded whitespace-nowrap shrink-0 mt-0.5 xs:mt-0 sm:mt-0">
            <PlusCircle size={14} className="xs:w-4 xs:h-4" />
            <span className="hidden xs:inline">{t("forum.createPost")}</span>
            <span className="inline xs:hidden">{t("forum.createPostShort")}</span>
          </button>
        </div>

        {showCreateForm && (
          <div className="border border-blue-200 bg-blue-50/50 rounded p-2.5 xs:p-4 mb-4 xs:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 xs:gap-3 mb-3 xs:mb-4">
              <div>
                <h2 className="text-sm xs:text-lg font-semibold text-blue-900">{t("forum.createPostTitle")}</h2>
                <p className="text-xs xs:text-sm text-blue-700 mt-0.5 xs:mt-1">
                  {t("forum.createPostHint")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-xs xs:text-sm text-blue-700 hover:text-blue-900"
              >
                {t("forum.cancel")}
              </button>
            </div>

            <div className="grid gap-2.5 xs:gap-4">
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1.5 xs:mb-2">{t("forum.category")}</label>
                <select
                  value={newCategoryId ?? ""}
                  onChange={(event) => setNewCategoryId(Number(event.target.value))}
                  className="w-full rounded border border-gray-200 bg-white px-2.5 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                >
                  {forumCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1.5 xs:mb-2">{t("forum.subject")}</label>
                <select
                  value={newSubjectId ?? ""}
                  onChange={(event) => setNewSubjectId(event.target.value ? Number(event.target.value) : null)}
                  className="w-full rounded border border-gray-200 bg-white px-2.5 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                >
                  <option value="">{t("forum.selectSubjectPlaceholder")}</option>
                  {forumSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1.5 xs:mb-2">{t("forum.educationLevel")}</label>
                <select
                  value={newEducationLevel}
                  onChange={(event) => setNewEducationLevel(event.target.value)}
                  className="w-full rounded border border-gray-200 bg-white px-2.5 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                >
                  <option value="">{t("forum.selectLevelPlaceholder")}</option>
                  {levelOptions.filter((level) => level !== "Semua").map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1.5 xs:mb-2">{t("forum.postTitleLabel")}</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder={t("forum.postTitlePlaceholder")}
                  className="w-full rounded border border-gray-200 bg-white px-2.5 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1.5 xs:mb-2">{t("forum.descriptionLabel")}</label>
                <textarea
                  value={newBody}
                  onChange={(event) => setNewBody(event.target.value)}
                  placeholder={t("forum.descriptionPlaceholder")}
                  rows={4}
                  className="w-full rounded border border-gray-200 bg-white px-2.5 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                />
                <p className="mt-1.5 xs:mt-2 text-[10px] xs:text-xs text-gray-500 flex items-center gap-1">
                  <Hash size={12} /> {t("forum.hashtagHintPrefix")} <span className="font-semibold text-gray-700">#tag</span> {t("forum.hashtagHintOr")} <span className="font-semibold text-gray-700">#(contoh)</span>
                </p>
              </div>

              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-end gap-2 xs:gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 xs:px-4 py-1.5 xs:py-2 rounded border border-blue-600 text-xs xs:text-sm text-blue-600 hover:bg-blue-50 transition"
                >
                  {t("forum.cancel")}
                </button>
                <button
                  type="button"
                  disabled={
                    isSubmitting || !newCategoryId || !newTitle.trim() || !newBody.trim()
                  }
                  onClick={async () => {
                    if (!newCategoryId) {
                      toastError(t("forum.categoryRequired"));
                      return;
                    }
                    if (!newTitle.trim() || !newBody.trim()) {
                      toastError(t("forum.titleBodyRequired"));
                      return;
                    }
                    setIsSubmitting(true);
                    try {
                      const newPost = await apiFetch("/forum/posts", {
                        method: "POST",
                        body: JSON.stringify({
                          forum_category_id: newCategoryId,
                          subject_id: newSubjectId ?? null,
                          education_level: newEducationLevel || null,
                          title: newTitle.trim(),
                          body: newBody.trim(),
                        }),
                      });

                      const created = newPost.data ?? newPost;
                      setPosts((current) => [created, ...current]);
                      setShowCreateForm(false);
                      setNewTitle("");
                      setNewBody("");
                      setNewSubjectId(getDefaultSubjectId(forumSubjects, user?.education_level));
                      setNewEducationLevel(normalizeEducationLevel(user?.education_level));
                      toastSuccess(t("forum.postCreated"));
                    } catch (error: any) {
                      console.error("Gagal membuat post forum", error);
                      toastError(
                        error?.message || t("forum.postCreateFailed")
                      );
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="inline-flex items-center justify-center px-3 xs:px-4 py-1.5 xs:py-2 rounded bg-blue-600 text-white text-xs xs:text-sm font-medium hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSubmitting ? t("forum.saving") : t("forum.sendPost")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter - langsung di bawah header */}
        <div className="flex items-center gap-1 xs:gap-2 mb-3 xs:mb-4 overflow-x-auto pb-1 xs:pb-0">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-2 xs:px-4 py-1 xs:py-1.5 text-xs xs:text-sm font-medium transition-colors whitespace-nowrap rounded ${
                activeCategory === c
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {getCategoryLabel(c)}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative mb-3 xs:mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("forum.searchPlaceholder")}
            className="w-full px-2.5 xs:px-4 py-2 xs:py-2.5 pl-8 xs:pl-10 border border-gray-200 bg-white text-xs xs:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 rounded"
          />
          <Search size={16} className="absolute left-2.5 xs:left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="grid gap-2 xs:grid-cols-2 mb-3 xs:mb-4">
          <div>
            <label className="block text-[10px] xs:text-xs font-medium text-gray-600 mb-1">{t("forum.subjectFilter")}</label>
            <select
              value={activeSubject ?? ""}
              onChange={(event) => setActiveSubject(event.target.value ? Number(event.target.value) : null)}
              className="w-full rounded border border-gray-200 bg-white px-2.5 xs:px-3 py-1.5 xs:py-2 text-xs xs:text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
            >
              {subjectOptions.map((subject) => (
                <option key={subject.id ?? "all"} value={subject.id ?? ""}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] xs:text-xs font-medium text-gray-600 mb-1">{t("forum.levelFilter")}</label>
            <select
              value={activeEducationLevel}
              onChange={(event) => setActiveEducationLevel(event.target.value)}
              className="w-full rounded border border-gray-200 bg-white px-2.5 xs:px-3 py-1.5 xs:py-2 text-xs xs:text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
            >
              {levelOptions.map((level) => (
                <option key={level} value={level}>
                  {level === "Semua" ? t("forum.allLevels") : level}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Trending */}
        {posts.length > 0 && (
          <div className="border border-gray-200 p-2.5 xs:p-4 mb-3 xs:mb-4 bg-gray-50 rounded">
            <div className="flex items-start gap-2 xs:gap-3">
              <div className="w-7 xs:w-8 h-7 xs:h-8 flex items-center justify-center bg-yellow-50 border border-yellow-200 shrink-0 rounded">
                <Flame size={14} className="xs:w-4 xs:h-4 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] xs:text-xs font-semibold text-yellow-600">{t("forum.trending")}</span>
                <p className="text-xs xs:text-sm text-gray-700 truncate">{t("forum.trendingExample")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Posts */}
        {filtered.length === 0 ? (
          <div className="border border-gray-200 p-4 xs:p-6 sm:p-8 text-center rounded">
            <div className="text-gray-400 text-xs xs:text-sm">{t("forum.noDiscussions")}</div>
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="mt-3 xs:mt-4 px-3 xs:px-5 py-1.5 xs:py-2 bg-blue-600 text-white text-xs xs:text-sm font-medium hover:bg-blue-700 transition-colors rounded"
            >
              {t("forum.createFirstPost")}
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 xs:space-y-3">
              {filtered.map((post) => {
                const userName = typeof post.user === "string" ? post.user : post.user?.name ?? t("forum.unknownUser");
                const avatarSrc = post.user && typeof post.user === "object" ? post.user.avatar ?? undefined : undefined;
                const time = post.time ?? "";
                const isLiked = post.liked_by_me ?? likedPosts.includes(post.id);
                const likeCount = post.likes;
                const hashtags = extractHashtags(`${post.title} ${post.body}`);

                return (
                  <div key={post.id} className="border border-gray-200 p-2.5 xs:p-4 hover:border-gray-300 transition-colors cursor-pointer rounded">
                    {/* User & Meta */}
                    <div className="flex items-start gap-2 xs:gap-3 mb-2 xs:mb-3">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt={userName} className="w-8 xs:w-10 h-8 xs:h-10 object-cover bg-gray-100 shrink-0 rounded" />
                      ) : (
                        <div className="w-8 xs:w-10 h-8 xs:h-10 bg-blue-600 text-white flex items-center justify-center text-xs xs:text-sm font-bold shrink-0 rounded">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 xs:gap-2">
                          <span className="text-xs xs:text-sm font-semibold text-gray-900">{userName}</span>
                          <span className="text-[9px] xs:text-[10px] px-1.5 xs:px-2 py-0.5 bg-blue-50 text-blue-600 font-medium border border-blue-200 rounded">
                            {post.category}
                          </span>
                          {post.subject?.name && (
                            <span className="text-[9px] xs:text-[10px] px-1.5 xs:px-2 py-0.5 bg-purple-50 text-purple-600 font-medium border border-purple-200 rounded">
                              {post.subject.name}
                            </span>
                          )}
                          {post.education_level && (
                            <span className="text-[9px] xs:text-[10px] px-1.5 xs:px-2 py-0.5 bg-emerald-50 text-emerald-600 font-medium border border-emerald-200 rounded">
                              {post.education_level}
                            </span>
                          )}
                          {post.solved && (
                            <span className="text-[9px] xs:text-[10px] px-1.5 xs:px-2 py-0.5 bg-green-50 text-green-600 font-medium border border-green-200 flex items-center gap-0.5 rounded">
                              <Check size={8} /> {t("forum.answered")}
                            </span>
                          )}
                          {post.replies > 0 && !post.solved && (
                            <span className="text-[9px] xs:text-[10px] px-1.5 xs:px-2 py-0.5 bg-blue-50 text-blue-600 font-medium border border-blue-200 flex items-center gap-0.5 rounded">
                              <MessageSquare size={8} /> {post.replies} {t("forum.repliesSuffix")}
                            </span>
                          )}
                          <span className="text-[10px] xs:text-xs text-gray-400 ml-auto">{getTimeAgo(time)}</span>
                        </div>
                        <h3 className="text-xs xs:text-sm font-semibold text-gray-900 mt-0.5 xs:mt-1">{post.title}</h3>
                        <p className="text-[10px] xs:text-xs text-gray-500 line-clamp-2 mt-0.5 xs:mt-1">{post.body}</p>
                        {hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 xs:gap-2 mt-2 xs:mt-3">
                            {hashtags.map((tag) => (
                              <span key={tag} className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-1.5 xs:px-2.5 py-0.5 text-[9px] xs:text-[11px] font-medium text-blue-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 xs:gap-4 pt-2 xs:pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                        className={`flex items-center gap-1 text-[10px] xs:text-xs font-medium transition-colors ${
                          isLiked ? "text-red-600" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <ThumbsUp size={12} className="xs:w-3 xs:h-3" fill={isLiked ? "#DC2626" : "none"} />
                        {likeCount}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); loadPostComments(post.id); }}
                        className="flex items-center gap-1 text-[10px] xs:text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <MessageSquare size={12} className="xs:w-3 xs:h-3" />
                        {post.replies}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(post.id); }}
                        className={`flex items-center gap-1 text-[10px] xs:text-xs font-medium transition-colors ml-auto ${
                          bookmarkedPosts.includes(post.id) ? "text-yellow-500" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Bookmark size={12} className="xs:w-3 xs:h-3" fill={bookmarkedPosts.includes(post.id) ? "#FBBF24" : "none"} />
                        <span className="hidden xs:inline">{t("forum.bookmarkLabel")}</span>
                      </button>
                    </div>

                    {isPostOwner(post) && (
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-600">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); startEditingPost(post); }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {t("forum.editAction")}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); deletePost(post.id); }}
                          className="text-red-600 hover:text-red-800"
                          disabled={deletingPostId === post.id}
                        >
                          {deletingPostId === post.id ? t("forum.deleting") : t("forum.deleteAction")}
                        </button>
                        <span className="text-gray-500">
                          {isEditableByOwner(post) ? t("forum.editableWithin5min") : t("forum.editOnlyWithin5min")}
                        </span>
                      </div>
                    )}

                    {editingPostId === post.id && (
                      <div className="mt-4 rounded border border-blue-200 bg-blue-50 p-4">
                        <div className="grid gap-3">
                          <div>
                            <label className="block text-sm font-medium text-blue-900 mb-2">{t("forum.editTitleLabel")}</label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full rounded border border-blue-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-900 mb-2">{t("forum.editBodyLabel")}</label>
                            <textarea
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              rows={4}
                              className="w-full rounded border border-blue-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2 justify-end">
                            <button
                              type="button"
                              onClick={cancelEditingPost}
                              className="px-3 py-2 rounded border border-blue-200 text-blue-700 hover:bg-blue-100 transition"
                            >
                              {t("forum.cancel")}
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingEdit || !editTitle.trim() || !editBody.trim()}
                              onClick={() => savePostEdits(post.id)}
                              className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:bg-blue-300"
                            >
                              {isSubmittingEdit ? t("forum.saving") : t("forum.saveChanges")}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expanded Comments Section */}
                    {expandedPostId === post.id && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        {loadingComments[post.id] ? (
                          <div className="text-center text-sm text-gray-500">
                            <div className="space-y-2">
                              <Skeleton className="h-3 w-3/4 mx-auto" />
                              <Skeleton className="h-3 w-full" />
                              <Skeleton className="h-3 w-full" />
                            </div>
                          </div>
                        ) : (
                          <>
                            {expandedReplies[post.id] && expandedReplies[post.id].length > 0 ? (
                              <div className="space-y-3 mb-4">
                                {expandedReplies[post.id].map((comment) => (
                                  <div key={comment.id} className="rounded border border-gray-200 bg-gray-50 p-3">
                                    <div className="flex items-start gap-2">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                                        {comment.user?.name?.charAt(0).toUpperCase() ?? "U"}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-semibold text-gray-900">{comment.user?.name}</span>
                                          <span className="text-xs text-gray-500">{comment.time}</span>
                                          {comment.is_solution && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">{t("forum.solutionBadge")}</span>}
                                        </div>
                                        <p className="mt-1 text-xs text-gray-700">{comment.body}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-xs text-gray-500 mb-4">{t("forum.noRepliesYet")}</div>
                            )}

                            {/* Reply Form */}
                            <div className="border-t border-gray-200 pt-3">
                              <textarea
                                value={replyBodies[post.id] ?? ""}
                                onChange={(e) => setReplyBodies((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                placeholder={t("forum.replyPlaceholder")}
                                rows={3}
                                className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-400 focus:outline-none"
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedPostId(null)}
                                  className="px-3 py-1 rounded text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                                >
                                  {t("forum.close")}
                                </button>
                                <button
                                  type="button"
                                  disabled={submittingReply[post.id] || !replyBodies[post.id]?.trim()}
                                  onClick={() => submitReply(post.id)}
                                  className="px-3 py-1 rounded text-xs bg-blue-600 text-white hover:bg-blue-700 transition disabled:bg-blue-300"
                                >
                                  {submittingReply[post.id] ? t("forum.sending") : t("forum.send")}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
        </div>
        </>)}
      </div>
    </div>
  );
}

export default ForumPage;