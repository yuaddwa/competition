import { getToken, buildQuery } from "./index";

/**
 * 接口根地址：
 * - H5 开发：空串 → 相对路径 /api/... 经 Vite 代理到 VITE_PROXY_TARGET（见 .env.development）
 * - 其它：VITE_API_BASE_URL，未配置时与线上一致：http://120.27.137.241:8081/
 * 仅当后端无 /api 前缀时设 VITE_API_STRIP_PREFIX=1（与 Swagger 中 /api/... 矛盾时不要开）
 */
function resolveBaseUrl() {
	const fromEnv = import.meta.env.VITE_API_BASE_URL;
	let base =
		typeof fromEnv === "string" && fromEnv.trim() ? fromEnv.trim() : "http://120.27.137.241:8081/";
	if (!base.endsWith("/")) {
		base += "/";
	}
	// #ifdef H5
	if (import.meta.env.DEV) {
		base = "";
	}
	// #endif
	return base;
}

export const BASE_URL = resolveBaseUrl();
const TIMEOUT = 10000;

/** 统一网络错误文案，便于全局排查 */
export function toastNetworkMessage(err, hint = "") {
  const msg = (err && err.errMsg) || String(err || "");
  let title = hint || "网络异常，请稍后重试";
  if (msg.includes("timeout") || msg.includes("超时")) {
    title = "请求超时，请检查网络后重试";
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
  } = options;

  const token = getToken();
  const authHeader = needAuth && token ? { Authorization: `Bearer ${token}` } : {};
  const finalMethod = method.toUpperCase();
  const path = resolveRequestPath(url);

  let requestUrl = `${BASE_URL.replace(/\/+$/, "")}${path}`;
  if (finalMethod === "GET" && data && Object.keys(data).length > 0) {
    const query = buildQuery(data);
    if (query) {
      requestUrl = `${requestUrl}?${query}`;
    }
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: requestUrl,
      method: finalMethod,
      data: finalMethod === "GET" ? {} : data,
      timeout: TIMEOUT,
      header: {
        "Content-Type": "application/json",
        ...authHeader,
        ...header,
      },
      success: (res) => {
        const { statusCode, data: resData } = res;
        if (statusCode >= 200 && statusCode < 300) {
          resolve(resData);
          return;
        }

        let message = (resData && (resData.msg || resData.message)) || "请求失败";
        if (statusCode >= 500) {
          message = "服务暂时不可用，请稍后重试";
        } else if (statusCode === 404) {
          message = "接口不存在或路径错误";
          if (import.meta.env.DEV) {
            console.warn("[request] 404", requestUrl, resData);
          }
        }
        if (showError) {
          uni.showToast({ title: message, icon: "none", duration: 2600 });
        }
        reject({ statusCode, message, data: resData });
      },
      fail: (err) => {
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

