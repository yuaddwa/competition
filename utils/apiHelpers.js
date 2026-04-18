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
  return obj.id ?? obj.workflowId ?? obj.uuid ?? "";
}
