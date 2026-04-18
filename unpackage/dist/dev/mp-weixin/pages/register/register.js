"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      phone: "",
      password: "",
      confirmPassword: "",
      inputCode: "",
      realCode: "",
      showPassword: false,
      showConfirmPassword: false
    };
  },
  onReady() {
    this.drawCaptcha();
  },
  methods: {
    // 生成验证码
    generateCode() {
      let code = "";
      for (let i = 0; i < 4; i++) {
        code += Math.floor(Math.random() * 10);
      }
      this.realCode = code;
      common_vendor.index.__f__("log", "at pages/register/register.vue:82", "当前验证码:", code);
      return code;
    },
    // 画验证码
    drawCaptcha() {
      const ctx = common_vendor.index.createCanvasContext("captchaCanvas", this);
      const code = this.generateCode();
      const canvasWidth = 160;
      const canvasHeight = 80;
      ctx.setFillStyle("#555555");
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      for (let i = 0; i < code.length; i++) {
        let x = 2 + i * 20;
        let y = 30;
        let deg = (Math.random() - 0.5) * 0.4;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(deg);
        ctx.setFontSize(20);
        ctx.setFillStyle("#ffffff");
        ctx.fillText(code[i], 0, 0);
        ctx.restore();
      }
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvasWidth, Math.random() * canvasHeight);
        ctx.lineTo(Math.random() * canvasWidth, Math.random() * canvasHeight);
        ctx.setStrokeStyle("#ffffff");
        ctx.stroke();
      }
      ctx.draw();
    },
    // 注册
    register() {
      if (!this.phone) {
        common_vendor.index.showToast({ title: "请输入手机号", icon: "none" });
        return;
      }
      if (!this.inputCode) {
        common_vendor.index.showToast({ title: "请输入验证码", icon: "none" });
        return;
      }
      if (this.inputCode.trim() !== this.realCode) {
        common_vendor.index.showToast({ title: "验证码错误", icon: "none" });
        this.drawCaptcha();
        return;
      }
      if (!this.password) {
        common_vendor.index.showToast({ title: "请输入密码", icon: "none" });
        return;
      }
      if (this.password !== this.confirmPassword) {
        common_vendor.index.showToast({ title: "两次密码不一致", icon: "none" });
        return;
      }
      common_vendor.index.showToast({ title: "注册成功", icon: "success" });
      setTimeout(() => {
        common_vendor.index.navigateBack();
      }, 1500);
    },
    togglePassword() {
      this.showPassword = !this.showPassword;
    },
    toggleConfirmPassword() {
      this.showConfirmPassword = !this.showConfirmPassword;
    },
    goLogin() {
      common_vendor.index.navigateBack();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_assets._imports_0,
    b: $data.phone,
    c: common_vendor.o(($event) => $data.phone = $event.detail.value, "a4"),
    d: $data.showPassword ? "text" : "password",
    e: $data.password,
    f: common_vendor.o(($event) => $data.password = $event.detail.value, "81"),
    g: $data.showPassword ? "../../picture/eye.png" : "../../picture/闭眼睛.png",
    h: common_vendor.o((...args) => $options.togglePassword && $options.togglePassword(...args), "e3"),
    i: $data.showConfirmPassword ? "text" : "password",
    j: $data.confirmPassword,
    k: common_vendor.o(($event) => $data.confirmPassword = $event.detail.value, "78"),
    l: $data.showConfirmPassword ? "../../picture/eye.png" : "../../picture/闭眼睛.png",
    m: common_vendor.o((...args) => $options.toggleConfirmPassword && $options.toggleConfirmPassword(...args), "f7"),
    n: $data.inputCode,
    o: common_vendor.o(($event) => $data.inputCode = $event.detail.value, "ca"),
    p: common_vendor.o((...args) => $options.drawCaptcha && $options.drawCaptcha(...args), "91"),
    q: common_vendor.o((...args) => $options.register && $options.register(...args), "13"),
    r: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "60")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/register/register.js.map
