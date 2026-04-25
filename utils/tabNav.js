/**
 * 底部主 Tab 用 switchTab；推荐页不在 tabBar（微信最多 5 项），用 navigateTo 打开。
 * switchTab 路径须与 pages.json 中 tabBar.list 一致。
 */
import { t, getLanguage } from "@/utils/lang";

const RECOMMEND_PATH = "/pages/recommend/recommend";

export const TAB_PAGE = {
	home: "/pages/home/home",
	project: "/pages/project/project",
	add: "/pages/add/add",
	message: "/pages/message/message",
	profile: "/pages/profile/profile",
};

export function switchMainTab(keyOrPath) {
	if (keyOrPath === "recommend") {
		uni.navigateTo({
			url: RECOMMEND_PATH,
			fail(err) {
				console.warn("[tabNav] navigateTo recommend failed", err);
				uni.showToast({ title: t("tab_switch_failed", getLanguage()), icon: "none" });
			},
		});
		return;
	}
	let url = TAB_PAGE[keyOrPath];
	if (!url && typeof keyOrPath === "string" && keyOrPath.startsWith("/pages/")) {
		url = keyOrPath;
	}
	if (!url) {
		console.warn("[tabNav] unknown tab:", keyOrPath);
		return;
	}
	uni.switchTab({
		url,
		fail(err) {
			console.warn("[tabNav] switchTab failed", url, err);
			uni.showToast({ title: t("tab_switch_failed", getLanguage()), icon: "none" });
		},
	});
}