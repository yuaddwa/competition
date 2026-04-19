<template>
	<view class="page">
		<view class="hint">账号与安全</view>
		<view class="cell-group">
			<view class="cell cell-border" @click="switchAccount">
				<view class="cell-icon bg-switch">
					<text class="iconfont cell-glyph">&#xe654;</text>
				</view>
				<text class="cell-title">切换账号</text>
				<text class="cell-arrow">›</text>
			</view>
			<view class="cell" @click="logoutAccount">
				<view class="cell-icon bg-out">
					<text class="iconfont cell-glyph">&#xe727;</text>
				</view>
				<text class="cell-title cell-danger">退出账号</text>
				<text class="cell-arrow">›</text>
			</view>
		</view>

		<view class="hint">偏好设置</view>
		<view class="cell-group">
			<view class="cell cell-border" @click="showLanguagePicker">
				<view class="cell-icon bg-lang">
					<text class="cell-glyph-text">🌐</text>
				</view>
				<text class="cell-title">语言</text>
				<text class="cell-value">{{ currentLanguage }}</text>
				<text class="cell-arrow">›</text>
			</view>
			<view class="cell cell-border" @click="showFontSizePicker">
				<view class="cell-icon bg-font">
					<text class="cell-glyph-text">Aa</text>
				</view>
				<text class="cell-title">字体大小</text>
				<text class="cell-value">{{ currentFontSize }}</text>
				<text class="cell-arrow">›</text>
			</view>
			<view class="cell" @click="toggleDarkMode">
				<view class="cell-icon bg-dark">
					<text class="cell-glyph-text">{{ isDarkMode ? '🌙' : '☀️' }}</text>
				</view>
				<text class="cell-title">深色模式</text>
				<view class="toggle-switch" :class="{ on: isDarkMode }" @click.stop="toggleDarkMode">
					<view class="toggle-knob" />
				</view>
			</view>
		</view>

		<view class="hint">隐私设置</view>
		<view class="cell-group">
			<view class="cell cell-border" @click="toggleReadReceipt">
				<view class="cell-icon bg-privacy">
					<text class="cell-glyph-text">✓</text>
				</view>
				<view class="cell-text-wrap">
					<text class="cell-title">消息已读回执</text>
					<text class="cell-sub">关闭后对方不会看到你是否阅读消息</text>
				</view>
				<view class="toggle-switch" :class="{ on: readReceipt }" @click.stop="toggleReadReceipt">
					<view class="toggle-knob" />
				</view>
			</view>
			<view class="cell cell-border" @click="toggleOnlineStatus">
				<view class="cell-icon bg-online">
					<text class="cell-glyph-text">●</text>
				</view>
				<view class="cell-text-wrap">
					<text class="cell-title">在线状态</text>
					<text class="cell-sub">显示你的在线或离线状态</text>
				</view>
				<view class="toggle-switch" :class="{ on: onlineStatus }" @click.stop="toggleOnlineStatus">
					<view class="toggle-knob" />
				</view>
			</view>
			<view class="cell" @click="showPrivacyPolicy">
				<view class="cell-icon bg-policy">
					<text class="cell-glyph-text">📜</text>
				</view>
				<text class="cell-title">隐私政策</text>
				<text class="cell-arrow">›</text>
			</view>
		</view>

		<view class="hint">通用设置</view>
		<view class="cell-group">
			<view class="cell cell-border" @click="exportData">
				<view class="cell-icon bg-export">
					<text class="cell-glyph-text">📤</text>
				</view>
				<text class="cell-title">数据导出</text>
				<text class="cell-arrow">›</text>
			</view>
			<view class="cell cell-border" @click="checkUpdate">
				<view class="cell-icon bg-update">
					<text class="cell-glyph-text">🔄</text>
				</view>
				<view class="cell-text-wrap">
					<text class="cell-title">检查更新</text>
					<text class="cell-sub">当前版本 v1.0.0</text>
				</view>
				<text class="cell-arrow">›</text>
			</view>
			<view class="cell" @click="clearCache">
				<view class="cell-icon bg-cache">
					<text class="cell-glyph-text">🗑️</text>
				</view>
				<view class="cell-text-wrap">
					<text class="cell-title">清理缓存</text>
					<text class="cell-sub">当前缓存：{{ cacheSize }}</text>
				</view>
				<text class="cell-arrow">›</text>
			</view>
		</view>

		<text class="sub-hint">切换账号将前往登录页以使用其他账号登录；退出账号将清除本机登录状态并返回「我的」。</text>
	</view>
</template>

<script>
	import { getToken, clearSession } from "@/utils/index";

	const LANG_OPTIONS = ["简体中文", "繁体中文", "English", "日本語"];
	const FONT_OPTIONS = ["小", "中", "大", "特大"];

	export default {
		data() {
			return {
				readReceipt: true,
				onlineStatus: true,
				isDarkMode: false,
				currentLanguage: "简体中文",
				currentFontSize: "中",
				cacheSize: "0 KB",
			};
		},
		onLoad() {
			this.loadSettings();
			this.calculateCacheSize();
		},
		methods: {
			loadSettings() {
				try {
					const settings = uni.getStorageSync("userSettings") || {};
					this.readReceipt = settings.readReceipt !== false;
					this.onlineStatus = settings.onlineStatus !== false;
					this.isDarkMode = settings.isDarkMode || false;
					this.currentLanguage = settings.language || "简体中文";
					this.currentFontSize = settings.fontSize || "中";
				} catch {
					//
				}
			},
			calculateCacheSize() {
				try {
					const info = uni.getStorageInfoSync();
					const size = info.currentSize;
					if (size < 1024) {
						this.cacheSize = size + " KB";
					} else {
						this.cacheSize = (size / 1024).toFixed(2) + " MB";
					}
				} catch {
					this.cacheSize = "未知";
				}
			},
			clearCache() {
				uni.showModal({
					title: "清理缓存",
					content: `确定要清理缓存吗？当前缓存大小：${this.cacheSize}`,
					confirmText: "清理",
					cancelText: "取消",
					success: (res) => {
						if (!res.confirm) return;
						try {
							const userSettings = uni.getStorageSync("userSettings");
							const currentTheme = uni.getStorageSync("currentTheme");
							const isDarkMode = uni.getStorageSync("isDarkMode");
							uni.clearStorageSync();
							if (userSettings) {
								uni.setStorageSync("userSettings", userSettings);
							}
							if (currentTheme) {
								uni.setStorageSync("currentTheme", currentTheme);
							}
							if (isDarkMode !== undefined) {
								uni.setStorageSync("isDarkMode", isDarkMode);
							}
							this.loadSettings();
							this.calculateCacheSize();
							uni.showToast({ title: "清理成功", icon: "success" });
						} catch {
							uni.showToast({ title: "清理失败", icon: "none" });
						}
					},
				});
			},
			exportData() {
				uni.showModal({
					title: "数据导出",
					content: "确定要导出所有数据吗？包含您的数字员工、项目群、工作流等信息。",
					confirmText: "导出",
					cancelText: "取消",
					success: (res) => {
						if (!res.confirm) return;
						try {
							const exportData = {
								exportTime: new Date().toLocaleString(),
								userSettings: uni.getStorageSync("userSettings"),
								agents: uni.getStorageSync("digitalAgents"),
								groups: uni.getStorageSync("projectGroups"),
								workflows: uni.getStorageSync("workflows"),
							};
							const fileName = `一人公司数据_${new Date().format('YYYYMMDD')}.json`;
							const content = JSON.stringify(exportData, null, 2);
							const base64 = uni.arrayBufferToBase64(uni.stringToBuffer(content));
							const savedFile = plus.io.convertLocalFileSystemURL('_doc/' + fileName);
							uni.saveFile({
								tempFilePath: 'data:application/json;base64,' + base64,
								success: (saveRes) => {
									uni.showToast({ title: "已保存到: " + saveRes.savedFilePath, icon: "none", duration: 3000 });
								},
								fail: () => {
									uni.showToast({ title: "导出功能暂不可用", icon: "none" });
								}
							});
						} catch (e) {
							uni.showToast({ title: "导出失败", icon: "none" });
						}
					},
				});
			},
			checkUpdate() {
				uni.showLoading({ title: "检查中..." });
				setTimeout(() => {
					uni.hideLoading();
					uni.showModal({
						title: "检查更新",
						content: "当前已是最新版本 (v1.0.0)",
						showCancel: false,
						confirmText: "我知道了",
					});
				}, 1000);
			},
			saveSettings() {
				try {
					const settings = {
						readReceipt: this.readReceipt,
						onlineStatus: this.onlineStatus,
						isDarkMode: this.isDarkMode,
						language: this.currentLanguage,
						fontSize: this.currentFontSize,
					};
					uni.setStorageSync("userSettings", JSON.stringify(settings));
				} catch {
					//
				}
			},
			showLanguagePicker() {
				const idx = LANG_OPTIONS.indexOf(this.currentLanguage);
				uni.showActionSheet({
					itemList: LANG_OPTIONS,
					success: (res) => {
						if (res.tapIndex >= 0) {
							this.currentLanguage = LANG_OPTIONS[res.tapIndex];
							this.saveSettings();
							uni.showToast({ title: `已设置为${this.currentLanguage}`, icon: "none" });
						}
					},
				});
			},
			showFontSizePicker() {
				const idx = FONT_OPTIONS.indexOf(this.currentFontSize);
				uni.showActionSheet({
					itemList: FONT_OPTIONS,
					success: (res) => {
						if (res.tapIndex >= 0) {
							this.currentFontSize = FONT_OPTIONS[res.tapIndex];
							this.saveSettings();
							uni.showToast({ title: `字体已调整为${this.currentFontSize}`, icon: "none" });
						}
					},
				});
			},
			toggleDarkMode() {
				this.isDarkMode = !this.isDarkMode;
				this.saveSettings();
				this.applyDarkMode(this.isDarkMode);
				uni.showToast({
					title: this.isDarkMode ? "已开启深色模式" : "已关闭深色模式",
					icon: "none",
				});
			},
			applyDarkMode(isDark) {
				const theme = isDark ? 'dark' : 'light';
				uni.setStorageSync('currentTheme', theme);
				try {
					if (typeof document !== 'undefined') {
						document.documentElement.setAttribute('data-theme', theme);
						document.body && document.body.setAttribute('data-theme', theme);
					}
				} catch (e) {
					console.warn('[settings] applyDarkMode', e);
				}
				const pages = getCurrentPages();
				pages.forEach(page => {
					if (page && page.$vm && page.$vm.updateTheme) {
						page.$vm.updateTheme(isDark);
					}
				});
			},
			toggleReadReceipt() {
				this.readReceipt = !this.readReceipt;
				this.saveSettings();
				uni.showToast({
					title: this.readReceipt ? "已开启已读回执" : "已关闭已读回执",
					icon: "none",
				});
			},
			toggleOnlineStatus() {
				this.onlineStatus = !this.onlineStatus;
				this.saveSettings();
				uni.showToast({
					title: this.onlineStatus ? "已显示在线状态" : "已隐藏在线状态",
					icon: "none",
				});
			},
			showPrivacyPolicy() {
				uni.showModal({
					title: "隐私政策",
					content: "我们尊重并保护您的个人隐私。您的数据将仅用于改善服务体验，不会被未经授权的第三方访问。",
					showCancel: false,
					confirmText: "我知道了",
				});
			},
			switchAccount() {
				uni.showModal({
					title: "切换账号",
					content: "将退出当前账号并前往登录页，以便使用其他账号登录。",
					confirmText: "前往登录",
					cancelText: "取消",
					success: (res) => {
						if (!res.confirm) return;
						clearSession();
						uni.reLaunch({ url: "/pages/login/login" });
					},
				});
			},
			logoutAccount() {
				uni.showModal({
					title: "退出账号",
					content: "确定退出当前账号吗？",
					confirmText: "退出",
					cancelText: "取消",
					success: (res) => {
						if (!res.confirm) return;
						clearSession();
						uni.showToast({ title: "已退出", icon: "success" });
						setTimeout(() => {
							uni.navigateBack({ delta: 1 });
						}, 400);
					},
				});
			},
		},
	};
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: #f1f5f9;
		padding: 24rpx 28rpx 48rpx;
		box-sizing: border-box;
	}

	.hint {
		display: block;
		font-size: 26rpx;
		color: #64748b;
		margin-bottom: 16rpx;
		margin-top: 32rpx;
		padding-left: 4rpx;
	}

	.hint:first-child {
		margin-top: 0;
	}

	.sub-hint {
		display: block;
		margin-top: 24rpx;
		padding: 0 8rpx;
		font-size: 24rpx;
		color: #94a3b8;
		line-height: 1.5;
	}

	.cell-group {
		background: #fff;
		border-radius: 24rpx;
		overflow: hidden;
		border: 1rpx solid #e2e8f0;
		box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
		padding-left: 28rpx;
	}

	.cell {
		display: flex;
		flex-direction: row;
		align-items: center;
		min-height: 108rpx;
		padding: 22rpx 28rpx 22rpx 0;
		box-sizing: border-box;
	}

	.cell-border {
		border-bottom: 1rpx solid #e2e8f0;
	}

	.cell:active {
		background-color: #f8fafc;
	}

	.cell-icon {
		width: 64rpx;
		height: 64rpx;
		border-radius: 12rpx;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
	}

	.cell-glyph {
		font-size: 36rpx;
		color: #fff;
		line-height: 1;
	}

	.cell-glyph-text {
		font-size: 28rpx;
		font-weight: 700;
		color: #fff;
	}

	.bg-switch {
		background: linear-gradient(145deg, #3b82f6, #2563eb);
	}

	.bg-out {
		background: linear-gradient(145deg, #64748b, #475569);
	}

	.bg-lang {
		background: linear-gradient(145deg, #10b981, #059669);
	}

	.bg-font {
		background: linear-gradient(145deg, #8b5cf6, #7c3aed);
	}

	.bg-dark {
		background: linear-gradient(145deg, #1e293b, #0f172a);
	}

	.bg-privacy {
		background: linear-gradient(145deg, #06b6d4, #0891b2);
	}

	.bg-online {
		background: linear-gradient(145deg, #22c55e, #16a34a);
	}

	.bg-policy {
		background: linear-gradient(145deg, #f59e0b, #d97706);
	}

	.bg-cache {
		background: linear-gradient(145deg, #64748b, #475569);
	}

	.bg-export {
		background: linear-gradient(145deg, #10b981, #059669);
	}

	.bg-update {
		background: linear-gradient(145deg, #3b82f6, #2563eb);
	}

	.cell-title {
		flex: 1;
		font-size: 32rpx;
		color: #1e293b;
		font-weight: 400;
	}

	.cell-value {
		font-size: 28rpx;
		color: #94a3b8;
		margin-right: 12rpx;
	}

	.cell-sub {
		display: block;
		font-size: 22rpx;
		color: #94a3b8;
		margin-top: 4rpx;
	}

	.cell-text-wrap {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.cell-danger {
		color: #dc2626;
		font-weight: 500;
	}

	.cell-arrow {
		flex-shrink: 0;
		font-size: 36rpx;
		color: #cbd5e1;
		font-weight: 300;
		line-height: 1;
		padding-left: 12rpx;
	}

	.toggle-switch {
		width: 96rpx;
		height: 52rpx;
		border-radius: 26rpx;
		background: #e2e8f0;
		flex-shrink: 0;
		position: relative;
		transition: background 0.3s ease;
	}

	.toggle-switch.on {
		background: #07c160;
	}

	.toggle-knob {
		position: absolute;
		top: 4rpx;
		left: 4rpx;
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
		transition: transform 0.3s ease;
	}

	.toggle-switch.on .toggle-knob {
		transform: translateX(44rpx);
	}
</style>

<style>
	@font-face {
		font-family: "iconfont";
		src: url("../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff2") format("woff2"),
			url("../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff") format("woff"),
			url("../../static/download/font_5162264_g3oiz4ouy1i/iconfont.ttf") format("truetype");
	}

	.iconfont {
		font-family: "iconfont" !important;
		font-size: 36rpx;
	}
</style>
