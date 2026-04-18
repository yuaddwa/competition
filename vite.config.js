import { defineConfig, loadEnv } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

/**
 * H5 开发：把 /api 转到本地后端，避免浏览器跨域。
 * 小程序/App 不走 Vite dev server，仍使用 utils/request.js 里的直连地址。
 *
 * 后端地址可通过环境变量覆盖：VITE_PROXY_TARGET=http://127.0.0.1:8081
 */
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const target = env.VITE_PROXY_TARGET || "http://127.0.0.1:8081";

	return {
		plugins: [uni()],
		server: {
			proxy: {
				"/api": {
					target,
					changeOrigin: true,
				},
			},
		},
	};
});
