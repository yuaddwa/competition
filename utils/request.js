import { getToken, buildQuery, clearSession } from "./index";

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
	//if (isH5Development()) {
	//	base = "";
	//}
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
  let title = hint || "网络异常，请稍后重试";
  if (msg.includes("timeout") || msg.includes("超时")) {
    title = "连接超时：可换网络或稍后重试";
  } else if (msg.includes("domain") || msg.includes("域名")) {
    title = "请求被拒绝：请配置合法域名或检查网络";
  } else if (msg.includes("abort")) {
    title = "请求已中断";
  } else if (msg.includes("fail") && msg.includes("ssl")) {
    title = "安全连接失败，请稍后重试";
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
    uni.request({
      url: requestUrl,
      method: finalMethod,
      data: finalMethod === "GET" ? {} : data,
      timeout:
        typeof timeoutOpt === "number" && timeoutOpt > 0 ? timeoutOpt : defaultTimeoutMs(),
      header: {
        "Content-Type": "application/json",
        ...authHeader,
        ...header,
      },
      success: (res) => {
        const { statusCode, data: resData } = res;
        if (statusCode === 401 && needAuth) {
          clearSession();
          if (showError) {
            uni.showToast({ title: "登录已失效，请重新登录", icon: "none", duration: 2200 });
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

        let message = (resData && (resData.msg || resData.message)) || "请求失败";
        if (statusCode >= 500) {
          message = "服务暂时不可用，请稍后重试";
        } else if (statusCode === 404 || Number(statusCode) === 404) {
          const bodyStr =
            typeof resData === "string"
              ? resData.slice(0, 120)
              : JSON.stringify(resData || {}).slice(0, 120);
          const looksLikeHtml = typeof resData === "string" && /<\s*html/i.test(resData);
          const doubleApi = String(requestUrl).includes("/api/api/");
          message = looksLikeHtml
            ? "404：请求未到达接口（像打到前端/Nginx）"
            : doubleApi
              ? "404：地址里多了一段 /api，请改 .env"
              : "接口404：请对照 Swagger 路径或后端是否部署同一版本";
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
        if (statusCode >= 500 && !serverMsg) {
          message = "服务暂时不可用，请稍后重试";
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

export default request;

