"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      phone: "",
      password: "",
      showPassword: false
    };
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
      common_vendor.index.showToast({ title: "登录成功", icon: "success" });
      common_vendor.index.switchTab({
        url: "/pages/home/home"
      });
    },
    forgotPassword() {
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
    a: common_assets._imports_0,
    b: $data.phone,
    c: common_vendor.o(($event) => $data.phone = $event.detail.value, "51"),
    d: $data.showPassword ? "text" : "password",
    e: $data.password,
    f: common_vendor.o(($event) => $data.password = $event.detail.value, "64"),
    g: $data.showPassword ? "../../picture/eye.png" : "../../picture/闭眼睛.png",
    h: common_vendor.o((...args) => $options.togglePassword && $options.togglePassword(...args), "db"),
    i: common_vendor.o((...args) => $options.login && $options.login(...args), "50"),
    j: common_vendor.o((...args) => $options.forgotPassword && $options.forgotPassword(...args), "af"),
    k: common_vendor.o((...args) => $options.register && $options.register(...args), "dc")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
