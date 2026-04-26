# 作品安装说明（uni-app / HBuilderX）

本文面向评委与队友：**使用 DCloud 官方 HBuilderX 打开本仓库并运行**，无需自行拼凑脚手架（若你改用 **CLI + 命令行**，见文末补充）。

---

## 一、环境准备

| 项 | 说明 |
|----|------|
| **HBuilderX** | 建议使用官网最新正式版：[https://www.dcloud.io/hbuilderx.html](https://www.dcloud.io/hbuilderx.html) |
| **uni-app 编译器** | 在 HBuilderX 中通过「工具 → 插件安装」确保已安装 **uni-app 编译** 相关插件（按提示更新即可） |
| **微信开发者工具**（可选） | 运行到微信小程序时需要；官网下载并登录 |
| **Node.js**（可选） | 仅在使用 **npm 脚本 / Vite 命令行** 时需要，建议 LTS 18+ |

本工程 `manifest.json` 中 **`vueVersion` 为 `3`**，与 **Vue3 + uni-app** 一致。

---

## 二、用 HBuilderX「安装」并打开项目

1. **下载并安装 HBuilderX**（解压即用型，按官方指引即可）。  
2. 启动 HBuilderX，菜单 **文件 → 导入 → 从本地目录导入**，选择本仓库根目录（包含 `pages.json`、`manifest.json`、`App.vue` 的那一层）。  
3. 导入后，左侧项目管理器中应能看到 **pages、components、utils、static** 等目录。  
4. 若提示缺少插件或编译器版本过低，按弹窗 **一键安装 / 更新** 即可。

> **说明**：所谓「uni-app 直接安装」一般指：**安装 HBuilderX + 内置/uni 插件**，再把本项目作为 **uni-app 工程**打开，而不是在应用商店安装成品 APK。

---

## 三、运行到浏览器（H5，联调最方便）

1. 在项目管理器中 **选中项目根节点**。  
2. 菜单 **运行 → 运行到浏览器 → Chrome**（或 Edge 等）。  
3. 首次运行会触发编译，控制台无报错后浏览器会自动打开本地开发地址（常见为 `http://localhost:5173` 等，以 HBuilderX 控制台输出为准）。

### 3.1 后端与代理（H5）

- 项目使用 **Vite 开发代理** 转发接口，配置见根目录 **`.env.development`**（若本地没有，请按 **`.env.example`** 复制一份并重命名为 `.env.development`）。  
- 关键变量示例（具体以你队服务器为准）：  
  - **`VITE_PROXY_TARGET`**：后端 `http(s)://主机:端口`，**末尾不要带 `/api`**。  
  - **`VITE_API_BASE_URL`**：H5 直连用的 API 根地址（与后端文档一致）。  
- 修改 `.env.development` 后需 **重新运行** 一次到浏览器。

### 3.2 大模型（可选）

- 登录应用后，在 **模型 / API 设置** 中配置 **OpenAI 兼容** 的 Base URL（路径需含 **`/v1`**）、API Key 与模型名。  
- 不配密钥时，部分功能会走 **本地兜底文案**，仍可演示流程。

---

## 四、运行到微信小程序

1. 安装并打开 **微信开发者工具**。  
2. 在 HBuilderX 中：**运行 → 运行到小程序模拟器 → 微信开发者工具**。  
3. 首次需在微信开发者工具里填写 **小程序 AppID**；测试可使用测试号（按微信文档申请）。  
4. 在 `manifest.json` → **微信小程序配置** 中，可将 `mp-weixin.appid` 改为你的小程序 AppID（与微信工具一致）。  
5. **request 合法域名**：正式体验需在小程序后台配置 **HTTPS 业务域名**；本地调试可在微信开发者工具中开启 **不校验合法域名**（仅开发用）。

---

## 五、运行到 App / 真机

1. **运行 → 运行到手机或模拟器**，按提示连接 USB 或使用模拟器。  
2. Android 需开启开发者模式与 USB 调试；iOS 需按 DCloud 文档配置证书（以赛方设备为准）。  
3. 真机访问后端时，注意 **局域网 IP / HTTPS** 与小程序域名校验差异。

---

## 六、发行与打包（竞赛提交）

- **发行 → 原生 App-云打包 / 本地打包**：按 `manifest.json` 中 **应用名称、图标、权限** 检查无误后再打包。  
- **发行 → 小程序-微信**：上传代码包到微信公众平台（需合法主体与 AppID）。  

具体菜单名称以当前 HBuilderX 版本为准。

---

## 七、常见问题

| 现象 | 处理建议 |
|------|----------|
| 接口 404 | 检查 `.env.development` 中 `VITE_PROXY_TARGET`、`VITE_API_STRIP_PREFIX` 是否与后端路径一致（见 `vite.config.js` 注释）。 |
| H5 白屏 | 看 HBuilderX 控制台编译报错；确认 Node 与 HBuilderX 内置编译器为较新版本。 |
| 小程序无法请求 | 开发阶段在微信开发者工具关闭域名校验；上线配置合法域名。 |
| 全员群 / 对话无智能回复 | 在应用内配置 LLM 的 API Key 与 Base URL。 |

---

## 八、补充：命令行 + npm（可选）

若仓库根目录存在 **`package.json`**（部分分支会带上），可在项目根执行：

```bash
npm install
npm run dev:h5
```

脚本名称以 `package.json` 的 `scripts` 为准。若当前分支 **没有** `package.json`，请 **优先使用 HBuilderX 运行**，或按 [uni-app 官方 CLI 文档](https://uniapp.dcloud.net.cn/quickstart-cli.html) 在空工程迁移依赖（超出本文「直接安装」范围）。

---

**文档维护**：后端地址、AppID、域名以各环境为准；更新后请同步修改 `.env.example` 中的示例说明。
