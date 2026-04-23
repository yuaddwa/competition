/**
 * Normalize typical Spring / wrapped JSON bodies.
 */
export function unwrapData(res) {
  if (res == null || typeof res !== "object") return res;
  if (Object.prototype.hasOwnProperty.call(res, "data") && res.data !== undefined) {
    return res.data;
  }
  if (Object.prototype.hasOwnProperty.call(res, "result") && res.result !== undefined) {
    return res.result;
  }
  return res;
}

/**
 * 从 Spring Boot / 常见 API 的 JSON 错误体里取可读信息（不依赖仅 msg、message 字段）
 */
export function pickHttpBodyMessage(data, maxLen = 300) {
  if (data == null) return "";
  if (typeof data === "string") {
    const t = data.trim();
    if (!t || t.startsWith("<") || /html/i.test(t.slice(0, 20))) return "";
    return t.slice(0, maxLen);
  }
  if (typeof data !== "object" || data instanceof Array) {
    return String(data).slice(0, maxLen);
  }
  const d = data;
  if (d.msg && String(d.msg).trim()) return String(d.msg).trim().slice(0, maxLen);
  if (d.message && String(d.message).trim()) return String(d.message).trim().slice(0, maxLen);
  if (d.detail) return String(d.detail).trim().slice(0, maxLen);
  if (d.reason) return String(d.reason).trim().slice(0, maxLen);
  if (d.errorMessage) return String(d.errorMessage).trim().slice(0, maxLen);
  if (d.data && typeof d.data === "string" && d.data.trim()) return d.data.trim().slice(0, maxLen);
  if (d.data && typeof d.data === "object" && (d.data.message || d.data.msg)) {
    return String(d.data.message || d.data.msg).trim().slice(0, maxLen);
  }
  if (typeof d.error === "string" && d.error.trim()) return d.error.trim().slice(0, maxLen);
  if (d.error && typeof d.error === "object" && d.error.message) {
    return String(d.error.message).trim().slice(0, maxLen);
  }
  if (Array.isArray(d.errors) && d.errors.length) {
    const e0 = d.errors[0];
    const p =
      (e0 && (e0.defaultMessage || e0.message)) ||
      (e0 && e0.field && e0.rejectedValue != null
        ? `${e0.field}: ${e0.rejectedValue}`
        : null);
    if (p) return String(p).trim().slice(0, maxLen);
  }
  if (d.status != null && d.path) {
    return `${d.error || "HTTP"} ${d.status} ${d.path}`.trim().slice(0, maxLen);
  }
  return "";
}

/** 与 request 的 reject 对象或 throw 的 Error 配合，取后端可读文案 */
export function getApiErrorMessage(err, maxLen = 300) {
  if (err == null) return "";
  if (typeof err === "string") return err.slice(0, maxLen);
  if (err.data) {
    const fromBody = pickHttpBodyMessage(err.data, maxLen);
    if (fromBody) return fromBody;
  }
  const m = err.message && String(err.message).trim();
  if (m && m !== "Error" && !/^HTTP\s+\d+$/i.test(m)) {
    return m.slice(0, maxLen);
  }
  if (err.statusCode && err.statusCode >= 400) {
    return `HTTP ${err.statusCode}`;
  }
  const em = err.errMsg;
  if (em && typeof em === "string" && !/^\s*request:ok/i.test(String(em))) {
    return em.slice(0, maxLen);
  }
  return "";
}

/**
 * 若顶层为 { code, msg, data } 且 code 表示失败，抛出带 msg 的 Error（HTTP 仍为 2xx 时常见）
 */
function isBusinessSuccessCode(code) {
  if (code === undefined || code === null) return true;
  if (code === 0 || code === 200 || code === 20000 || code === "0" || code === "200" || code === "SUCCESS")
    return true;
  if (String(code) === "200" || String(code) === "0") return true;
  return false;
}

export function unwrapDataOrThrowBusinessError(res) {
  if (res == null) return res;
  if (typeof res !== "object" || res instanceof Array) {
    return unwrapData(res);
  }
  if (Object.prototype.hasOwnProperty.call(res, "code")) {
    if (!isBusinessSuccessCode(res.code)) {
      const msg = res.msg || res.message || res.error || "request failed";
      const e = new Error(String(msg));
      e.data = res;
      throw e;
    }
  }
  if (res.success === false) {
    const msg = res.msg || res.message || "request failed";
    const e = new Error(String(msg));
    e.data = res;
    throw e;
  }
  return unwrapData(res);
}

export function unwrapList(res) {
  const d = unwrapData(res);
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object") {
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.content)) return d.content;
    if (Array.isArray(d.records)) return d.records;
    if (Array.isArray(d.list)) return d.list;
  }
  return [];
}

export function pickId(obj) {
  if (!obj || typeof obj !== "object") return "";
  const nestedWorkflow = obj.workflow && typeof obj.workflow === "object" ? obj.workflow : null;
  const id =
    obj.id ??
    obj.workflowId ??
    obj.workflowID ??
    obj.workflow_id ??
    obj.uuid ??
    obj._id ??
    obj.value ??
    (nestedWorkflow ? nestedWorkflow.id ?? nestedWorkflow.workflowId ?? nestedWorkflow.uuid : undefined);
  if (id != null && id !== "") return String(id);
  return "";
}
