"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_index = require("../../utils/index.js");
const _sfc_main = {
  data() {
    return {
      phone: "",
      password: "",
      showPassword: false
    };
  },
  onLoad() {
  },
  methods: {
    login() {
      if (!this.phone) {
        common_vendor.index.showToast({ title: "请输入手机号", icon: "none" });
        return;
      }
      if (!this.password) {
        common_vendor.index.showToast({ title: "请输入密码", icon: "none" });
        return;
      }
      common_vendor.index.__f__("log", "at pages/index/index.vue:52", "登录信息:", { phone: this.phone, password: this.password });
      utils_index.setToken("mock-token");
      common_vendor.index.showToast({ title: "登录成功", icon: "success" });
      common_vendor.index.navigateTo({
        url: "/pages/home/home"
      });
    },
    forgotPassword() {
      common_vendor.index.__f__("log", "at pages/index/index.vue:62", "忘记密码？");
      common_vendor.index.showToast({ title: "忘记密码功能开发中", icon: "none" });
    },
    togglePassword() {
      this.showPassword = !this.showPassword;
    },
    register() {
      common_vendor.index.navigateTo({
        url: "/pages/register/register"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.phone,
    b: common_vendor.o(($event) => $data.phone = $event.detail.value),
    c: $data.showPassword ? "text" : "password",
    d: $data.password,
    e: common_vendor.o(($event) => $data.password = $event.detail.value),
    f: common_vendor.t($data.showPassword ? "" : ""),
    g: common_vendor.o((...args) => $options.togglePassword && $options.togglePassword(...args)),
    h: common_vendor.o((...args) => $options.login && $options.login(...args)),
    i: common_vendor.o((...args) => $options.forgotPassword && $options.forgotPassword(...args)),
    j: common_vendor.o((...args) => $options.register && $options.register(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
