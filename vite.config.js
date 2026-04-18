import { defineConfig, loadEnv } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

/**
 * H5 开发：浏览器请求发到当前页 origin（如 http://localhost:5173/api/...），
 * 由这里把前缀 /api 转发到真实后端；否则相对路径只会打到 Vite，易 404。
 *
 * 后端地址：根目录 .env.development 里 VITE_PROXY_TARGET，或默认 8081。
 */
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const target = (env.VITE_PROXY_TARGET || "http://127.0.0.1:8081").replace(/\/+$/, "");

	return {
		plugins: [uni()],
		server: {
			host: true,
			proxy: {
				// 用前缀匹配，避免个别环境下 "/api" 键匹配不到子路径
				"^/api": {
					target,
					changeOrigin: true,
					secure: false,
				},
			},
		},
	};
});
