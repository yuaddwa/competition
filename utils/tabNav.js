/**
 * 底部五个主 Tab 统一用 switchTab，避免 redirectTo 整页替换带来的卡顿与闪烁。
 * 路径须与 pages.json 中 tabBar.list 一致。
 */
export const TAB_PAGE = {
	home: "/pages/home/home",
	project: "/pages/project/project",
	add: "/pages/add/add",
	message: "/pages/message/message",
	profile: "/pages/profile/profile",
};

export function switchMainTab(keyOrPath) {
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
			uni.showToast({ title: "切换失败", icon: "none" });
		},
	});
}