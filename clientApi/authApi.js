import request, { uploadFile, BASE_URL } from "@/utils/request";
import { unwrapData, pickHttpBodyMessage, getApiErrorMessage } from "@/utils/apiHelpers";

/** 相对路径头像补全为可请求的绝对地址（与接口同源） */
export function resolveAvatarDisplayUrl(url) {
  if (!url || !String(url).trim()) return "";
  const s = String(url).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const base = BASE_URL.replace(/\/+$/, "");
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${base}${path}`;
}

/**
 * 解析登录/注册接口返回中的 token 与用户信息（兼容多种后端包装）
 */
export function extractSession(payload) {
  const raw = unwrapData(payload);
  const obj = raw && typeof raw === "object" ? raw : {};
  const token =
    obj.token ||
    obj.accessToken ||
    obj.access_token ||
    (obj.data && typeof obj.data === "object" && (obj.data.token || obj.data.accessToken)) ||
    "";
  const user =
    obj.user ||
    obj.userInfo ||
    obj.profile ||
    obj.account ||
    (obj.data && typeof obj.data === "object" ? obj.data.user || obj.data.userInfo : null) ||
    null;
  return { token: token || "", user };
}

export async function login(payload) {
  const shouldStopRetry = (errLike) => {
    const status = Number(errLike && errLike.statusCode);
    const msg = String(getApiErrorMessage(errLike) || "").toLowerCase();
    if (status === 401 || status === 403) return true;
    // 明确账号/密码类错误时不要继续轮询尝试，避免“看起来一直在登录”
    return /用户不存在|账号不存在|用户名不存在|密码错误|invalid|not found|unauthorized|forbidden/.test(
      msg
    );
  };
  const account = String(
    payload?.account ?? payload?.phone ?? payload?.username ?? payload?.mobile ?? payload?.loginName ?? ""
  ).trim();
  const password = String(payload?.password ?? "").trim();
  const candidates = [
    { phone: account, password },
    { username: account, password },
    { mobile: account, password },
    { account, password },
    { loginName: account, password },
  ];

  let lastErr = null;
  for (const body of candidates) {
    try {
      const r = await request.post("/api/auth/login", body, { needAuth: false, showError: false });
      const parsed = extractSession(r);
      if (parsed.token) return parsed;
      const msg = pickHttpBodyMessage(r);
      if (msg) {
        const e = new Error(msg);
        e.data = r;
        throw e;
      }
    } catch (err) {
      lastErr = err;
      if (shouldStopRetry(err)) throw err;
    }
  }

  if (lastErr) throw lastErr;
  throw new Error("登录失败：未拿到 token");
}

export async function register(payload) {
  const r = await request.post("/api/auth/register", payload, { needAuth: false });
  return extractSession(r);
}

export async function changePassword(payload, requestOptions = {}) {
  const r = await request.post("/api/auth/change-password", payload, {
    needAuth: true,
    showError: false,
    ...requestOptions,
  });
  return unwrapData(r);
}

/** GET /api/auth/me — Swagger：当前用户 */
export async function getCurrentUser() {
  const r = await request.get("/api/auth/me", {}, { needAuth: true, showError: false });
  return unwrapData(r);
}

/** GET /api/auth/profile — 昵称、邮箱、头像 URL 等 */
export async function getAuthProfile() {
  const r = await request.get("/api/auth/profile", {}, { needAuth: true, showError: false });
  return unwrapData(r);
}

/**
 * PATCH /api/auth/profile/nickname
 * @param {string} nickname 传空字符串表示按后端规则清空昵称
 */
export async function patchAuthNickname(nickname) {
  const r = await request.patch(
    "/api/auth/profile/nickname",
    { nickname: nickname ?? "" },
    { needAuth: true },
  );
  return unwrapData(r);
}

/** POST /api/auth/profile/avatar — multipart 字段名 file（jpg/png/gif/webp，≤5MB） */
export async function uploadAuthAvatar(tempFilePath) {
  const raw = await uploadFile({
    url: "/api/auth/profile/avatar",
    filePath: tempFilePath,
    name: "file",
    needAuth: true,
  });
  return unwrapData(raw);
}

/** 将接口返回的资料合并进本地 user 对象（兼容 avatarUrl / avatar） */
export function mergeProfileIntoUser(localUser, profile) {
  if (!profile || typeof profile !== "object") return localUser || {};
  const u = { ...(localUser || {}) };
  if ("nickname" in profile) u.nickname = profile.nickname;
  if (profile.email != null && profile.email !== undefined) u.email = profile.email;
  const av = profile.avatarUrl ?? profile.avatar ?? profile.avatarURL;
  if (av != null && String(av).trim() !== "") u.avatarUrl = String(av).trim();
  if (profile.phone != null) u.phone = profile.phone;
  if (profile.mobile != null) u.mobile = profile.mobile;
  return u;
}
