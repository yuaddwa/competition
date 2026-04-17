"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      currentPage: "home"
    };
  },
  onLoad() {
  },
  methods: {
    navigateTo(page) {
      common_vendor.index.navigateTo({
        url: `/pages/${page}/${page}`
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.currentPage === "home" ? 1 : "",
    b: common_vendor.o(($event) => $options.navigateTo("home")),
    c: $data.currentPage === "project" ? 1 : "",
    d: common_vendor.o(($event) => $options.navigateTo("project")),
    e: common_vendor.o(($event) => $options.navigateTo("add")),
    f: $data.currentPage === "message" ? 1 : "",
    g: common_vendor.o(($event) => $options.navigateTo("message")),
    h: $data.currentPage === "profile" ? 1 : "",
    i: common_vendor.o(($event) => $options.navigateTo("profile"))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/home.js.map
