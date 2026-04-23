const TOKEN_KEY = "token";
const USER_INFO_KEY = "userInfo";
const LOGIN_ACCOUNT_HISTORY_KEY = "loginAccountHistory";

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

function normalizeAccount(raw) {
  return String(raw || "").trim();
}

export function getLoginAccountHistory() {
  try {
    const raw = uni.getStorageSync(LOGIN_ACCOUNT_HISTORY_KEY);
    if (!raw) return [];
    const list = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(list)) return [];
    return list
      .map((it) => {
        if (typeof it === "string") {
          const account = normalizeAccount(it);
          return account ? { account, nickname: "", lastLoginAt: 0 } : null;
        }
        if (!it || typeof it !== "object") return null;
        const account = normalizeAccount(it.account || it.phone || it.username);
        if (!account) return null;
        return {
          account,
          nickname: normalizeAccount(it.nickname || it.name || ""),
          lastLoginAt: Number(it.lastLoginAt) || 0,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function rememberLoginAccount(account, user = null) {
  const normalized = normalizeAccount(account);
  if (!normalized) return;
  const nickname = normalizeAccount(
    user && (user.nickname || user.username || user.name || "")
  );
  const history = getLoginAccountHistory();
  const next = [
    { account: normalized, nickname, lastLoginAt: Date.now() },
    ...history.filter((it) => normalizeAccount(it.account) !== normalized),
  ].slice(0, 8);
  try {
    uni.setStorageSync(LOGIN_ACCOUNT_HISTORY_KEY, next);
  } catch {
    //
  }
}

export function buildQuery(params = {}) {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&");
}

