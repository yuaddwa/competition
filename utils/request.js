import { getToken, buildQuery } from "./index";

export const BASE_URL = "http://120.27.137.241/";
const TIMEOUT = 10000;

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

        const message = (resData && (resData.msg || resData.message)) || "请求失败";
        if (showError) {
          uni.showToast({ title: message, icon: "none" });
        }
        reject({ statusCode, message, data: resData });
      },
      fail: (err) => {
        if (showError) {
          uni.showToast({ title: "网络异常，请稍后重试", icon: "none" });
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

