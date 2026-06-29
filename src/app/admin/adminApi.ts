const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000/api";
const API_ROOT = API_BASE.replace(/\/api\/?$/, "");

const getCsrfToken = () => {
  const cookies = document.cookie.split("; ");
  const csrfCookie = cookies.find((cookie) => cookie.startsWith("XSRF-TOKEN="));
  if (!csrfCookie) return null;
  return decodeURIComponent(csrfCookie.split("=")[1]);
};

// Fetch CSRF token from backend
const fetchCsrfToken = async () => {
  try {
    await fetch(`${API_ROOT}/sanctum/csrf-cookie`, {
      method: "GET",
      credentials: "include",
    });
  } catch (error) {
    console.warn("Failed to fetch CSRF token:", error);
  }
};

export async function adminApiFetch(
  path: string,
  options: RequestInit = {},
): Promise<any> {
  // Ensure CSRF token is available
  await fetchCsrfToken();

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const token = localStorage.getItem("TUTORKU_token");

  const headers: HeadersInit = {
    Accept: "application/json",
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers["X-XSRF-TOKEN"] = csrfToken;
  }

  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || response.statusText || "Terjadi kesalahan pada server";
    const validationErrors = data?.errors
      ? Object.values(data.errors)
          .flatMap((value: any) => Array.isArray(value) ? value : [value])
          .filter(Boolean)
          .join(" ")
      : "";
    throw new Error(validationErrors ? `${message}: ${validationErrors}` : message);
  }

  return data;
}
