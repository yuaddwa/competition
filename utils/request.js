import { getToken, buildQuery } from "./index";

/**
 * 接口根地址：
 * - H5 + 开发：留空 → 请求为相对路径 `/api/...`，发到当前页面所在源（如 localhost:5173），
 *   由 vite.config.js 里 `^/api` 代理转到后端；若写死 8081 会绕过代理且易跨域。
 * - 小程序 / App / H5 生产包：直连后端（默认与 .env.development 里代理目标一致）。
 */
function resolveBaseUrl() {
	let base = "http://127.0.0.1:8081/";
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
  const path = normalizeUrl(url);

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

