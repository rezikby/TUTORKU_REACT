import {
  r as i,
  j as s,
  f as Z,
  g as f,
  T as O,
  C as G,
  V as ee,
  h as y,
  i as se,
  X as te,
} from "./index-BctrgboK.js";
import "./index-BrEiKMMA.js";
import { C as ae } from "./calendar-Bdx5KvMa.js";
import { M as L } from "./map-pin-BN9cNJYs.js";
import { C as ne } from "./circle-alert-BBZlhHdt.js";
import { C as P } from "./circle-check-big-CGUhSZtr.js";
const re = {
    pending: "Menunggu",
    confirmed: "Dikonfirmasi",
    completed: "Selesai",
    cancelled: "Dibatalkan",
    rejected: "Ditolak",
  },
  ie = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  },
  le = {
    pending: s.jsx(G, { size: 14, className: "text-yellow-600" }),
    confirmed: s.jsx(P, { size: 14, className: "text-blue-600" }),
    completed: s.jsx(P, { size: 14, className: "text-green-600" }),
    cancelled: s.jsx(te, { size: 14, className: "text-red-600" }),
    rejected: s.jsx(ne, { size: 14, className: "text-red-600" }),
  },
  oe = "/api".replace(/\/api\/?$/, "") ?? "http://localhost:8000";
function he(I) {
  const { apiFetch: g, navigate: k, onSelectBooking: j } = I,
    [c, p] = i.useState([]),
    [F, N] = i.useState(!1),
    [n, w] = i.useState("all"),
    [b, v] = i.useState(!1),
    [r, l] = i.useState([]),
    [S, h] = i.useState([]),
    H = async () => {
      N(!0);
      try {
        const e = await g("/bookings");
        p(e.data ?? e ?? []);
      } catch (e) {
        console.error("Gagal memuat booking", e);
      } finally {
        N(!1);
      }
    };
  i.useEffect(() => {
    H();
  }, []);
  const M = async (e) => {
      if (
        await y(
          "Batalkan booking ini?",
          "Pembatalan ini akan menghapus data booking secara permanen",
        )
      )
        try {
          (await g(`/bookings/${e}/cancel`, {
            method: "POST",
            body: JSON.stringify({}),
          }),
            p((t) => t.filter((a) => a.id !== e)),
            l((t) => t.filter((a) => a !== e)));
        } catch (t) {
          console.error("Gagal membatalkan booking", t);
          const a =
            (t == null ? void 0 : t.message) ||
            ((t == null ? void 0 : t.toString) && t.toString()) ||
            "Gagal membatalkan booking";
          se("Gagal membatalkan booking", a);
        }
    },
    U = async (e) => {
      if (
        await y("Hapus booking ini dari tampilan?", "Data tidak akan dihapus.")
      ) {
        h((t) => [...t, e]);
        try {
          (await g(`/bookings/${e}`, { method: "DELETE" }),
            p((t) => t.filter((a) => a.id !== e)),
            l((t) => t.filter((a) => a !== e)));
        } catch (t) {
          console.error("Gagal menghapus booking", t);
        } finally {
          h((t) => t.filter((a) => a !== e));
        }
      }
    },
    J = async () => {
      if (
        r.length !== 0 &&
        (await y(
          `Hapus ${r.length} booking dari tampilan?`,
          "Data tidak akan dihapus.",
        ))
      ) {
        h(r);
        try {
          (await g("/bookings/bulk-destroy", {
            method: "POST",
            body: JSON.stringify({ booking_ids: r }),
          }),
            p((e) => e.filter((t) => !r.includes(t.id))),
            l([]));
        } catch (e) {
          console.error("Gagal menghapus booking", e);
        } finally {
          h([]);
        }
      }
    },
    R = (e) => {
      l((t) => (t.includes(e) ? t.filter((a) => a !== e) : [...t, e]));
    },
    V = (e) => {
      l(e ? u.map((t) => t.id) : []);
    },
    o = (e) => {
      var a, x, d;
      const t =
        ((a = e.status) == null ? void 0 : a.toLowerCase()) || "pending";
      if (t === "pending") {
        const m =
          (d = (x = e.payment) == null ? void 0 : x.status) == null
            ? void 0
            : d.toLowerCase();
        if (m === "success" || m === "paid") return "confirmed";
      }
      return t;
    },
    W = (e) =>
      e != null && e.photo
        ? e.photo.startsWith("http")
          ? e.photo
          : `${oe}/storage/${e.photo}`
        : null,
    u = c.filter((e) => {
      const t = o(e);
      return n === "all"
        ? !0
        : n === "upcoming"
          ? t === "pending" || t === "confirmed"
          : n === "completed"
            ? t === "completed"
            : n === "cancelled"
              ? t === "cancelled" || t === "rejected"
              : !0;
    }),
    K = (e) => {
      const t = o(e);
      if (!(t === "pending" || t === "confirmed") || !e.created_at) return !1;
      const a = new Date(e.created_at);
      return (Date.now() - a.getTime()) / 6e4 <= 5;
    },
    X = (e) => {
      var a;
      return (
        o(e) === "confirmed" &&
        ((a = e.live_session) == null ? void 0 : a.status) === "ongoing"
      );
    },
    q = (e) => {
      var a;
      return (
        o(e) === "confirmed" &&
        ((a = e.live_session) == null ? void 0 : a.status) !== "ongoing"
      );
    },
    B = (e) => {
      window.location.hash = `#/live-class?booking_id=${e}`;
    },
    Q = (e) =>
      e
        ? new Date(e).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "",
    Y = {
      all: "Semua",
      upcoming: "Akan Datang",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };
  return s.jsx("div", {
    className: "min-h-screen bg-white pt-14 xs:pt-16",
    children: s.jsxs("div", {
      className:
        "max-w-4xl mx-auto px-2 xs:px-3 sm:px-4 lg:px-6 py-4 xs:py-6 pb-32",
      children: [
        s.jsxs("div", {
          className: "mb-4 xs:mb-6",
          children: [
            s.jsx("h1", {
              className: "text-lg xs:text-2xl font-extrabold text-gray-900",
              children: "Booking Saya",
            }),
            s.jsx("p", {
              className: "text-xs xs:text-sm text-gray-400 mt-0.5",
              children: "Kelola sesi belajarmu",
            }),
          ],
        }),
        s.jsxs("div", {
          className: "sm:hidden mb-4",
          children: [
            s.jsxs("button", {
              onClick: () => v(!b),
              className:
                "w-full flex items-center justify-between px-3 py-2 text-xs bg-white border border-gray-200",
              children: [
                s.jsx("span", {
                  className: "font-medium text-gray-700",
                  children: Y[n],
                }),
                s.jsx(Z, {
                  size: 16,
                  className: `text-gray-400 transition-transform shrink-0 ${b ? "rotate-180" : ""}`,
                }),
              ],
            }),
            b &&
              s.jsx("div", {
                className: "border border-gray-200 border-t-0 bg-white",
                children: [
                  { key: "all", label: "Semua" },
                  { key: "upcoming", label: "Akan Datang" },
                  { key: "completed", label: "Selesai" },
                  { key: "cancelled", label: "Dibatalkan" },
                ].map((e) =>
                  s.jsxs(
                    "button",
                    {
                      onClick: () => {
                        (w(e.key), v(!1));
                      },
                      className: `w-full text-left px-3 py-2 text-xs transition-colors ${n === e.key ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`,
                      children: [
                        e.label,
                        e.key === "all" &&
                          c.length > 0 &&
                          s.jsxs("span", {
                            className: "ml-2 text-[10px] text-gray-400",
                            children: ["(", c.length, ")"],
                          }),
                      ],
                    },
                    e.key,
                  ),
                ),
              }),
          ],
        }),
        s.jsx("div", {
          className:
            "hidden sm:flex gap-0.5 xs:gap-1 mb-4 xs:mb-6 border-b border-gray-100 overflow-x-auto",
          children: [
            { key: "all", label: "Semua" },
            { key: "upcoming", label: "Akan Datang" },
            { key: "completed", label: "Selesai" },
            { key: "cancelled", label: "Dibatalkan" },
          ].map((e) =>
            s.jsxs(
              "button",
              {
                onClick: () => w(e.key),
                className: `px-2 xs:px-4 py-2 xs:py-2.5 text-xs xs:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${n === e.key ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`,
                children: [
                  e.label,
                  e.key === "all" &&
                    c.length > 0 &&
                    s.jsx("span", {
                      className:
                        "ml-1 xs:ml-1.5 px-1 xs:px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] xs:text-[10px] font-semibold inline-block rounded",
                      children: c.length,
                    }),
                ],
              },
              e.key,
            ),
          ),
        }),
        F
          ? s.jsx("div", {
              className:
                "bg-white border border-gray-200 p-4 xs:p-6 text-center text-xs xs:text-sm text-gray-400",
              children: s.jsxs("div", {
                className: "space-y-3",
                children: [
                  s.jsx(f, { className: "h-3 xs:h-4 w-1/3 mx-auto" }),
                  s.jsx(f, { className: "h-5 xs:h-6 w-full" }),
                  s.jsx(f, { className: "h-5 xs:h-6 w-full" }),
                ],
              }),
            })
          : u.length === 0
            ? s.jsxs("div", {
                className:
                  "bg-white border border-gray-200 p-6 xs:p-8 text-center",
                children: [
                  s.jsx("div", {
                    className: "text-gray-400 text-xs xs:text-sm",
                    children:
                      n === "all"
                        ? "Belum ada booking. Ayo cari tutor!"
                        : "Tidak ada booking di kategori ini.",
                  }),
                  n === "all" &&
                    s.jsx("button", {
                      onClick: () => k("cari-tutor"),
                      className:
                        "mt-4 px-4 xs:px-5 py-1.5 xs:py-2 bg-[#2563EB] text-white text-xs xs:text-sm font-medium hover:bg-[#1D4ED8] transition-colors",
                      children: "Cari Tutor",
                    }),
                ],
              })
            : s.jsxs(s.Fragment, {
                children: [
                  r.length > 0 &&
                    s.jsxs("div", {
                      className:
                        "mb-4 p-2 xs:p-3 bg-blue-50 border border-blue-200 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 xs:gap-3",
                      children: [
                        s.jsxs("div", {
                          className: "flex items-center gap-2 xs:gap-3",
                          children: [
                            s.jsx("input", {
                              type: "checkbox",
                              checked: r.length === u.length,
                              onChange: (e) => V(e.target.checked),
                              className:
                                "w-4 xs:w-5 h-4 xs:h-5 border-2 border-gray-300 rounded cursor-pointer accent-[#2563EB]",
                            }),
                            s.jsxs("span", {
                              className:
                                "text-xs xs:text-sm font-medium text-gray-700",
                              children: [r.length, " booking dipilih"],
                            }),
                          ],
                        }),
                        s.jsxs("button", {
                          onClick: J,
                          disabled: S.length > 0,
                          className:
                            "w-full xs:w-auto px-3 xs:px-4 py-1.5 text-xs xs:text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center justify-center xs:justify-start gap-1.5 xs:gap-2",
                          children: [
                            s.jsx(O, { size: 14, className: "xs:w-4 xs:h-4" }),
                            s.jsx("span", {
                              className: "hidden xs:inline",
                              children: "Hapus Semua",
                            }),
                            s.jsx("span", {
                              className: "xs:hidden",
                              children: "Hapus",
                            }),
                          ],
                        }),
                      ],
                    }),
                  s.jsx("div", {
                    className: "space-y-3",
                    children: u.map((e) => {
                      var C, D, E, T, _, $, z, A;
                      const t = o(e),
                        a = W(e.tutor),
                        x = t === "pending",
                        d = r.includes(e.id),
                        m = S.includes(e.id);
                      return s.jsxs(
                        "div",
                        {
                          className: `border ${x ? "border-yellow-200 bg-yellow-50/30" : "border-gray-200 bg-white"} ${d ? "ring-2 ring-[#2563EB]" : ""} p-4 transition-all`,
                          children: [
                            s.jsxs("div", {
                              className: "flex items-start gap-2 xs:gap-3",
                              children: [
                                a
                                  ? s.jsx("img", {
                                      src: a,
                                      alt:
                                        (C = e.tutor) == null ? void 0 : C.name,
                                      className:
                                        "w-10 xs:w-12 h-10 xs:h-12 object-cover bg-gray-100 shrink-0 rounded",
                                    })
                                  : s.jsx("div", {
                                      className:
                                        "w-10 xs:w-12 h-10 xs:h-12 bg-[#2563EB] text-white flex items-center justify-center text-base xs:text-lg font-bold shrink-0 rounded",
                                      children:
                                        ((T =
                                          (E =
                                            (D = e.tutor) == null
                                              ? void 0
                                              : D.name) == null
                                            ? void 0
                                            : E.charAt(0)) == null
                                          ? void 0
                                          : T.toUpperCase()) || "T",
                                    }),
                                s.jsxs("div", {
                                  className: "flex-1 min-w-0",
                                  children: [
                                    s.jsxs("div", {
                                      className:
                                        "flex flex-wrap items-start justify-between gap-2",
                                      children: [
                                        s.jsxs("div", {
                                          className: "min-w-0",
                                          children: [
                                            s.jsx("div", {
                                              className:
                                                "text-xs xs:text-sm font-semibold text-gray-900 truncate",
                                              children:
                                                ((_ = e.tutor) == null
                                                  ? void 0
                                                  : _.name) || "Tutor",
                                            }),
                                            s.jsxs("div", {
                                              className:
                                                "text-[11px] xs:text-xs text-gray-500 mt-0.5 line-clamp-1",
                                              children: [
                                                (($ = e.subject) == null
                                                  ? void 0
                                                  : $.name) || "-",
                                                " · ",
                                                ((z = e.tutor) == null
                                                  ? void 0
                                                  : z.city) || "Online",
                                              ],
                                            }),
                                          ],
                                        }),
                                        s.jsxs("div", {
                                          className:
                                            "flex items-center gap-2 xs:gap-3 flex-shrink-0",
                                          children: [
                                            s.jsxs("span", {
                                              className: `inline-flex items-center gap-0.5 xs:gap-1 px-1.5 xs:px-2 py-0.5 text-[9px] xs:text-[10px] font-medium border rounded shrink-0 ${ie[t]}`,
                                              children: [
                                                le[t],
                                                s.jsx("span", {
                                                  className: "hidden xs:inline",
                                                  children: re[t],
                                                }),
                                              ],
                                            }),
                                            s.jsx("div", {
                                              className:
                                                "flex items-center justify-center",
                                              children: s.jsx("input", {
                                                type: "checkbox",
                                                checked: d,
                                                onChange: () => R(e.id),
                                                className:
                                                  "w-5 h-5 border-2 border-gray-300 rounded-md cursor-pointer accent-[#2563EB] hover:border-[#2563EB] transition-colors focus:ring-2 focus:ring-[#2563EB]/20 focus:outline-none",
                                              }),
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    s.jsxs("div", {
                                      className:
                                        "flex flex-wrap items-center gap-2 xs:gap-3 mt-1.5 text-[10px] xs:text-xs text-gray-500",
                                      children: [
                                        s.jsxs("span", {
                                          className: "flex items-center gap-1",
                                          children: [
                                            s.jsx(ae, {
                                              size: 14,
                                              className: "text-gray-400",
                                            }),
                                            s.jsx("span", {
                                              children: Q(e.date) || e.date,
                                            }),
                                          ],
                                        }),
                                        s.jsxs("span", {
                                          className: "flex items-center gap-1",
                                          children: [
                                            s.jsx(G, {
                                              size: 14,
                                              className: "text-gray-400",
                                            }),
                                            s.jsxs("span", {
                                              children: [
                                                e.start_time,
                                                " ",
                                                e.end_time
                                                  ? `- ${e.end_time}`
                                                  : "",
                                              ],
                                            }),
                                          ],
                                        }),
                                        e.mode &&
                                          s.jsxs("span", {
                                            className:
                                              "flex items-center gap-1",
                                            children: [
                                              e.mode === "online"
                                                ? s.jsx(ee, {
                                                    size: 14,
                                                    className: "text-gray-400",
                                                  })
                                                : s.jsx(L, {
                                                    size: 14,
                                                    className: "text-gray-400",
                                                  }),
                                              s.jsx("span", {
                                                children:
                                                  e.mode === "online"
                                                    ? "Online"
                                                    : "Offline",
                                              }),
                                            ],
                                          }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            s.jsxs("div", {
                              className:
                                "flex flex-wrap items-center gap-1.5 xs:gap-2 mt-3 pt-3 border-t border-gray-100",
                              children: [
                                s.jsx("button", {
                                  onClick: () =>
                                    j ? j(e.id) : k("booking-detail"),
                                  className:
                                    "px-2 xs:px-4 py-1.5 text-xs font-medium text-[#2563EB] border border-[#2563EB]/30 hover:bg-[#2563EB]/5 transition-colors",
                                  children: "Detail",
                                }),
                                X(e)
                                  ? s.jsx("button", {
                                      onClick: () => B(e.id),
                                      className:
                                        "px-2 xs:px-4 py-1.5 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors",
                                      children: "Masuk",
                                    })
                                  : q(e)
                                    ? s.jsx("button", {
                                        disabled: !0,
                                        className:
                                          "px-2 xs:px-4 py-1.5 text-xs font-medium text-white bg-gray-400 cursor-not-allowed transition-colors",
                                        children: "Menunggu",
                                      })
                                    : o(e) === "completed"
                                      ? s.jsx("button", {
                                          onClick: () => B(e.id),
                                          className:
                                            "px-2 xs:px-4 py-1.5 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors",
                                          children: "Lihat",
                                        })
                                      : null,
                                e.mode === "offline" &&
                                  ((A = e.tutor) == null
                                    ? void 0
                                    : A.google_maps_url) &&
                                  s.jsxs("a", {
                                    href: e.tutor.google_maps_url,
                                    target: "_blank",
                                    rel: "noreferrer",
                                    className:
                                      "px-2 xs:px-4 py-1.5 text-xs font-medium text-[#2563EB] border border-[#2563EB]/30 hover:bg-[#2563EB]/5 transition-colors inline-flex items-center justify-center gap-1",
                                    children: [
                                      s.jsx(L, {
                                        size: 12,
                                        className: "xs:w-3 xs:h-3",
                                      }),
                                      s.jsx("span", {
                                        className: "hidden xs:inline",
                                        children: "GoMap",
                                      }),
                                    ],
                                  }),
                                K(e) &&
                                  s.jsx("button", {
                                    onClick: () => M(e.id),
                                    className:
                                      "px-2 xs:px-4 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors",
                                    children: "Batal",
                                  }),
                                s.jsx("button", {
                                  onClick: () => U(e.id),
                                  disabled: m,
                                  className:
                                    "px-2 xs:px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 transition-colors flex items-center justify-center gap-1",
                                  title:
                                    "Hapus dari tampilan (data tidak dihapus)",
                                  children: m
                                    ? s.jsx("span", {
                                        className:
                                          "inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin",
                                      })
                                    : s.jsx(O, { size: 14 }),
                                }),
                              ],
                            }),
                          ],
                        },
                        e.id,
                      );
                    }),
                  }),
                ],
              }),
      ],
    }),
  });
}
export { he as default };
