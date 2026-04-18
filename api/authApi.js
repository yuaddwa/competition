import request from "@/utils/request";
import { unwrapData } from "@/utils/apiHelpers";

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
    } catch (err) {
      lastErr = err;
    }

    try {
      const r = await request.post("/api/auth/login", body, {
        needAuth: false,
        showError: false,
        header: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const parsed = extractSession(r);
      if (parsed.token) return parsed;
    } catch (err) {
      lastErr = err;
    }
  }

  if (lastErr) throw lastErr;
  throw new Error("登录失败：未拿到 token");
}

export async function register(payload) {
  const r = await request.post("/api/auth/register", payload, { needAuth: false });
  return extractSession(r);
}

export async function changePassword(payload) {
  const r = await request.post("/api/auth/change-password", payload, { needAuth: true });
  return unwrapData(r);
}
