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
  const r = await request.post("/api/auth/login", payload, { needAuth: false });
  return extractSession(r);
}

export async function register(payload) {
  const r = await request.post("/api/auth/register", payload, { needAuth: false });
  return extractSession(r);
}

export async function changePassword(payload) {
  const r = await request.post("/api/auth/change-password", payload, { needAuth: true });
  return unwrapData(r);
}
