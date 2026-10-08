const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1")
  .replace(/\/+$/, "");
const ACCESS_KEY = "topic-manager-access";
const REFRESH_KEY = "topic-manager-refresh";

function resolveApiUrl(path, baseUrl) {
  if (/^https?:\/\//i.test(path)) return new URL(path);
  if (baseUrl) return new URL(path, baseUrl);
  return new URL(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`);
}

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_KEY);
}

export function saveTokens(tokens) {
  sessionStorage.setItem(ACCESS_KEY, tokens.access);
  if (tokens.refresh) sessionStorage.setItem(REFRESH_KEY, tokens.refresh);
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken() {
  const refresh = sessionStorage.getItem(REFRESH_KEY);
  if (!refresh) return null;

  const response = await fetch(`${API_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) {
    clearTokens();
    return null;
  }

  const tokens = await response.json();
  sessionStorage.setItem(ACCESS_KEY, tokens.access);
  return tokens.access;
}

async function request(path, options = {}, retry = true) {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const apiOrigin = new URL(API_URL).origin;
  const url = resolveApiUrl(path);
  if (url.origin !== apiOrigin) {
    throw new Error("API trả về đường dẫn phân trang không cùng máy chủ.");
  }

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    throw new Error(`Không thể kết nối máy chủ API (${API_URL}).`);
  }

  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request(path, options, false);
  }

  if (!response.ok) {
    let detail = `Yêu cầu không thành công (${response.status}).`;
    try {
      const payload = await response.json();
      detail =
        payload.detail ||
        Object.entries(payload)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join(" · ") ||
        detail;
    } catch {
      // Keep the HTTP status message when the response is not JSON.
    }
    throw new Error(detail);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function apiGet(path) {
  let pageUrl = resolveApiUrl(path);
  const payload = await request(pageUrl.href);
  if (Array.isArray(payload)) return payload;
  if (!Array.isArray(payload?.results)) return payload;

  const results = [...payload.results];
  const visitedPages = new Set([pageUrl.href]);
  let next = payload.next;

  while (next) {
    pageUrl = resolveApiUrl(next, pageUrl.href);
    if (visitedPages.has(pageUrl.href)) {
      throw new Error("API trả về vòng lặp phân trang, không thể tải hết dữ liệu.");
    }
    visitedPages.add(pageUrl.href);

    const nextPage = await request(pageUrl.href);
    if (!Array.isArray(nextPage?.results)) {
      throw new Error("API trả về dữ liệu phân trang không hợp lệ.");
    }
    results.push(...nextPage.results);
    next = nextPage.next;
  }

  return results;
}

export function apiPost(path, body) {
  return request(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiUpload(path, formData) {
  return request(path, { method: "POST", body: formData });
}

export function apiPatch(path, body) {
  return request(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function apiDelete(path) {
  return request(path, { method: "DELETE" });
}

export async function login(username, password) {
  const tokens = await apiPost("/auth/token/", { username, password });
  saveTokens(tokens);
  try {
    return await apiGet("/auth/me/");
  } catch (error) {
    clearTokens();
    throw error;
  }
}

export async function loadCurrentUser() {
  return apiGet("/auth/me/");
}

export { API_URL };
