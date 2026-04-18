export function cleanDeptLabel(label = "") {
  return label.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, "").trim();
}
