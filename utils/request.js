import { getToken, buildQuery, clearSession } from "./index";
import { t, getLanguage } from "./lang";
import { pickHttpBodyMessage } from "./apiHelpers";

/** H5 是否走本地 Vite 代理（不要直连远程，避免跨域且易配错） */
function isH5Development() {
	// uni-app / Vite 下 DEV 有时为 false，用 MODE 更稳
	return import.meta.env.MODE === "development" || import.meta.env.DEV === true;
}

/** 基址只写到端口，不要带 /api（接口里已有 /api/...），否则会变成 /api/api/… → 后端 404 */
function normalizeApiOrigin(raw) {
	let u = String(raw || "")
		.trim()
		.replace(/\/+$/, "");
	if (/\/api$/i.test(u)) {
		console.warn(
			"[request] VITE_API_BASE_URL 末尾不要带 /api（已自动去掉）。误写会导致请求 …/api/api/auth/login",
		);
		u = u.replace(/\/api$/i, "");
	}
	return u ? `${u}/` : "http://120.27.137.241:8081/";
}

/**
 * 接口根地址：
 * - H5 开发：默认直连 VITE_API_BASE_URL（浏览器直接请求云上 8081）。同事用 HBuilderX/未跑 vite 代理时，
 *   若仍走「相对路径 → localhost:5173/api」会因未代理得到 404；默认直连可避免依赖本机代理。
 * - 若需本地走代理（例如后端暂未开 CORS），在 .env 设 VITE_H5_USE_PROXY=1。
 * - 小程序/App：同上基址逻辑（无 #ifdef H5 时代码由构建裁剪）。
 */
function resolveBaseUrl() {
	const fromEnv = import.meta.env.VITE_API_BASE_URL;
	let base =
		typeof fromEnv === "string" && fromEnv.trim()
			? normalizeApiOrigin(fromEnv.trim())
			: normalizeApiOrigin("http://120.27.137.241:8081");
	// #ifdef H5
	/** 与 .env 中 VITE_H5_USE_PROXY=1 配合：请求发到当前页 origin，由 vite.config.js 代理到 VITE_PROXY_TARGET */
	if (import.meta.env.VITE_H5_USE_PROXY === "1" && isH5Development()) {
		base = "";
	}
	// #endif
	return base;
}

export const BASE_URL = resolveBaseUrl();

/** 毫秒；弱网/跨省访问云上 IP 时 10s 易超时，可用 VITE_REQUEST_TIMEOUT_MS 加大 */
function defaultTimeoutMs() {
	const n = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS);
	return Number.isFinite(n) && n > 0 ? n : 25000;
}

/** 统一网络错误文案，便于全局排查 */
export function toastNetworkMessage(err, hint = "") {
  const msg = (err && err.errMsg) || String(err || "");
  const lang = getLanguage();
  let title = hint || t("err_network", lang);
  if (msg.includes("timeout") || msg.includes("超时")) {
    title = t("err_timeout_net", lang);
  } else if (msg.includes("domain") || msg.includes("域名")) {
    title = t("err_domain", lang);
  } else if (msg.includes("abort")) {
    title = t("err_abort", lang);
  } else if (msg.includes("fail") && msg.includes("ssl")) {
    title = t("err_ssl", lang);
  }
  uni.showToast({ title, icon: "none", duration: 2600 });
}

function normalizeUrl(url = "") {
  return url.startsWith("/") ? url : `/${url}`;
}

/** 后端若不带 /api 前缀（多为 /auth、/workflows），.env 设 VITE_API_STRIP_PREFIX=1 */
function resolveRequestPath(url = "") {
  let path = normalizeUrl(url);
  if (import.meta.env.VITE_API_STRIP_PREFIX === "1") {
    path = path.replace(/^\/api/, "") || "/";
  }
  return path;
}

function buildRequestUrl(path) {
  let requestUrl = `${BASE_URL.replace(/\/+$/, "")}${path}`;
  // #ifdef H5
  if (isH5Development() && BASE_URL === "" && typeof window !== "undefined" && window.location?.origin) {
    requestUrl = `${window.location.origin}${path}`;
  }
  // #endif
  return requestUrl;
}

function looksLikeAuthExpiredMessage(message = "") {
  const m = String(message || "").toLowerCase();
  if (!m) return false;
  return (
    m.includes("token") ||
    m.includes("jwt") ||
    m.includes("expired") ||
    m.includes("expire") ||
    m.includes("login expired") ||
    m.includes("未登录") ||
    m.includes("登录失效") ||
    m.includes("登录已失效") ||
    m.includes("登录过期") ||
    m.includes("凭证失效")
  );
}

function isAuthExpiredResponse(statusCode, resData, token) {
  if (Number(statusCode) !== 401) return false;
  // 本地已无 token，直接视为未登录
  if (!token) return true;
  const msg = pickHttpBodyMessage(resData);
  return looksLikeAuthExpiredMessage(msg);
}

/**
 * multipart 上传（如头像）；字段名默认 file，与 Swagger 一致。
 */
export function uploadFile(options = {}) {
  const {
    url = "",
    filePath = "",
    name = "file",
    needAuth = true,
    showError = true,
    formData = {},
  } = options;
  const token = getToken();
  const path = resolveRequestPath(url);
  const requestUrl = buildRequestUrl(path);
  return new Promise((resolve, reject) => {
    if (import.meta.env.MODE === "development") {
      console.log("[uploadFile]", requestUrl);
    }
    uni.uploadFile({
      url: requestUrl,
      filePath,
      name,
      formData,
      header: needAuth && token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        const statusCode = res.statusCode;
        let data = res.data;
        try {
          data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
        } catch {
          //
        }
        if (statusCode === 401 && needAuth) {
          clearSession();
          if (showError) {
            uni.showToast({ title: t("err_login_expired", getLanguage()), icon: "none", duration: 2200 });
          }
          reject({ statusCode: 401, message: "未授权", data });
          setTimeout(() => {
            uni.reLaunch({ url: "/pages/login/login" });
          }, 400);
          return;
        }
        if (statusCode >= 200 && statusCode < 300) {
          resolve(data);
          return;
        }
        const message = (data && (data.msg || data.message)) || t("err_upload_failed", getLanguage());
        if (showError) {
          uni.showToast({ title: `${message}(${statusCode})`, icon: "none", duration: 2600 });
        }
        reject({ statusCode, message, data });
      },
      fail: (err) => {
        console.warn("[uploadFile] fail", requestUrl, err);
        if (showError) {
          toastNetworkMessage(err);
        }
        reject(err);
      },
    });
  });
}

function request(options = {}) {
  const {
    url = "",
    method = "GET",
    data = {},
    header = {},
    needAuth = false,
    showError = true,
    timeout: timeoutOpt,
  } = options;

  const token = getToken();
  const authHeader = needAuth && token ? { Authorization: `Bearer ${token}` } : {};
  const finalMethod = method.toUpperCase();
  const path = resolveRequestPath(url);

  let queryStr = "";
  if (finalMethod === "GET" && data && Object.keys(data).length > 0) {
    const query = buildQuery(data);
    if (query) {
      queryStr = `?${query}`;
    }
  }

  let requestUrl = `${BASE_URL.replace(/\/+$/, "")}${path}${queryStr}`;
  // #ifdef H5
  /* 相对路径 /api 在少数运行时下异常；开发环境拼成绝对地址，确保打到 Vite 再由 proxy 转到后端 */
  if (isH5Development() && BASE_URL === "" && typeof window !== "undefined" && window.location?.origin) {
    requestUrl = `${window.location.origin}${path}${queryStr}`;
  }
  // #endif

  return new Promise((resolve, reject) => {
    if (import.meta.env.MODE === "development") {
      console.log("[request]", finalMethod, requestUrl);
    }
    let body = finalMethod === "GET" ? {} : data;
    if (finalMethod !== "GET" && data && typeof data === "object" && !(data instanceof ArrayBuffer)) {
      try {
        body = JSON.parse(JSON.stringify(data));
      } catch (e) {
        body = data;
      }
    }
    if (import.meta.env.MODE === "development" && finalMethod === "POST" && /\/workflows$/.test(path)) {
      console.log("[request] POST /workflows body (clone)", body);
    }
    uni.request({
      url: requestUrl,
      method: finalMethod,
      data: body,
      timeout:
        typeof timeoutOpt === "number" && timeoutOpt > 0 ? timeoutOpt : defaultTimeoutMs(),
      header: {
        "Content-Type": "application/json",
        ...authHeader,
        ...header,
      },
      success: (res) => {
        const { statusCode, data: resData } = res;
        if (statusCode === 401 && needAuth && isAuthExpiredResponse(statusCode, resData, token)) {
          clearSession();
          if (showError) {
            uni.showToast({ title: t("err_login_expired", getLanguage()), icon: "none", duration: 2200 });
          }
          reject({ statusCode: 401, message: "未授权", data: resData });
          setTimeout(() => {
            uni.reLaunch({ url: "/pages/login/login" });
          }, 400);
          return;
        }
        if (statusCode >= 200 && statusCode < 300) {
          resolve(resData);
          return;
        }

        const lang = getLanguage();
        let message = pickHttpBodyMessage(resData) || t("err_request_failed", lang);
        if (statusCode >= 500) {
          message = pickHttpBodyMessage(resData) || t("err_service_unavailable", lang);
        } else if (statusCode === 404 || Number(statusCode) === 404) {
          const bodyStr =
            typeof resData === "string"
              ? resData.slice(0, 120)
              : JSON.stringify(resData || {}).slice(0, 120);
          const looksLikeHtml = typeof resData === "string" && /<\s*html/i.test(resData);
          const doubleApi = String(requestUrl).includes("/api/api/");
          message = looksLikeHtml
            ? t("err_404_frontend", lang)
            : doubleApi
              ? t("err_404_double_api", lang)
              : t("err_404_api", lang);
          console.warn("[request] 404", finalMethod, requestUrl);
          console.warn("[request] 响应片段:", bodyStr);
          if (doubleApi) {
            console.warn(
              "[request] VITE_PROXY_TARGET / VITE_API_BASE_URL 只能写到端口，不要带末尾 /api",
            );
          } else {
            console.warn(
              "[request] 排查：终端应有 [vite-proxy]→后端；用 Swagger 直接 POST 同一接口对比",
            );
          }
        }
        if (showError) {
          const toastMsg = statusCode ? `${message}(${statusCode})` : message;
          uni.showToast({ title: toastMsg, icon: "none", duration: 2600 });
        }
        reject({ statusCode, message, data: resData });
      },
      fail: (err) => {
        console.warn("[request] fail", finalMethod, requestUrl, err);
        const em = (err && err.errMsg) || "";
        if (em.includes("timeout") || em.includes("超时")) {
          console.warn(
            "[request] 超时常见原因：对方网络慢/封禁出站、服务器 120.27…:8081 关机或安全组未放行、手机未开外网权限。可在 .env 增大 VITE_REQUEST_TIMEOUT_MS",
          );
        }
        if (showError) {
          toastNetworkMessage(err);
        }
        reject(err);
      },
    });
  });
}

request.get = (url, data = {}, options = {}) =>
  request({ url, method: "GET", data, ...options });

request.post = (url, data = {}, options = {}) =>
  request({ url, method: "POST", data, ...options });

request.put = (url, data = {}, options = {}) =>
  request({ url, method: "PUT", data, ...options });

request.delete = (url, data = {}, options = {}) =>
  request({ url, method: "DELETE", data, ...options });

request.patch = (url, data = {}, options = {}) =>
  request({ url, method: "PATCH", data, ...options });

export default request;

