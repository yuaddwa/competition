const TOKEN_KEY = "token";
const USER_INFO_KEY = "userInfo";

export function setToken(token) {
  uni.setStorageSync(TOKEN_KEY, token || "");
}

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || "";
}

export function clearToken() {
  uni.removeStorageSync(TOKEN_KEY);
}

export function setUserInfo(user) {
  if (!user || typeof user !== "object") {
    uni.removeStorageSync(USER_INFO_KEY);
    return;
  }
  try {
    uni.setStorageSync(USER_INFO_KEY, JSON.stringify(user));
  } catch {
    uni.removeStorageSync(USER_INFO_KEY);
  }
}

export function getUserInfo() {
  try {
    const s = uni.getStorageSync(USER_INFO_KEY);
    if (!s) return null;
    return typeof s === "string" ? JSON.parse(s) : s;
  } catch {
    return null;
  }
}

export function clearUserInfo() {
  uni.removeStorageSync(USER_INFO_KEY);
}

export function clearSession() {
  clearToken();
  clearUserInfo();
}

export function buildQuery(params = {}) {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&");
}

