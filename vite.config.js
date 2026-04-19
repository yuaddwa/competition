import { defineConfig, loadEnv } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

/**
 * H5 开发：浏览器发到当前页 origin，再由 proxy 转到后端。
 * - 默认 VITE_API_STRIP_PREFIX 未开启：转发 /api → 后端（路径保持 /api/...）
 * - 设为 1：与常见 Spring 一致，后端无 /api 包一层，转发 /auth、/workflows（见 .env.development）
 *
 * 后端地址：VITE_PROXY_TARGET（默认见 .env.development，与 Swagger 一致）
 */
function normalizeProxyTarget(raw) {
	let t = (raw || "http://120.27.137.241:8081").replace(/\/+$/, "");
	if (/\/api$/i.test(t)) {
		console.warn(
			"[vite-config] VITE_PROXY_TARGET 末尾不要带 /api（已自动去掉）。否则会转发成 …/api/api/… 导致 404",
		);
		t = t.replace(/\/api$/i, "");
	}
	return t;
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const target = normalizeProxyTarget(env.VITE_PROXY_TARGET || "http://120.27.137.241:8081");
	/** 与 utils/request.js 一致：为 1 时前端请求 /auth、/workflows，不再带 /api */
	const stripApi = env.VITE_API_STRIP_PREFIX === "1";

	const logProxy = (proxy /* , _options */) => {
		proxy.on("proxyReq", (proxyReq, req) => {
			console.log("[vite-proxy]", req.method, req.url, "→", target);
		});
		proxy.on("error", (err) => {
			console.error("[vite-proxy] error", err?.message || err);
		});
	};

	/* 使用 '/api' 前缀键（与 Vite 文档一致）。注意：会匹配任意以 /api 开头的路径，
	 * 故前端源码目录勿命名为 api、apiClient 等（否则 /apiClient/… 会被误代理到后端 → 404）。 */
	const proxy = stripApi
		? {
				"/auth": { target, changeOrigin: true, secure: false, configure: logProxy },
				"/workflows": { target, changeOrigin: true, secure: false, configure: logProxy },
		  }
		: {
				"/api": { target, changeOrigin: true, secure: false, configure: logProxy },
		  };

	return {
		plugins: [uni()],
		server: {
			host: true,
			proxy,
		},
	};
});
