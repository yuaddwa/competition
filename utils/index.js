const TOKEN_KEY = "token";

export function setToken(token) {
  uni.setStorageSync(TOKEN_KEY, token || "");
}

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || "";
}

export function clearToken() {
  uni.removeStorageSync(TOKEN_KEY);
}

export function buildQuery(params = {}) {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&");
}

