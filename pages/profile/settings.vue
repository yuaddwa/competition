<template>
	<view class="page">
		<view v-if="loggedIn">
			<view class="hint">{{ t('settings_section_account') }}</view>
			<view class="cell-group">
				<view class="cell" @click="switchAccount">
					<view class="cell-icon bg-switch">
						<text class="iconfont cell-glyph">&#xe654;</text>
					</view>
					<text class="cell-title">{{ t('switch_account') }}</text>
					<text class="cell-arrow">›</text>
				</view>
				<view class="cell" @click="logoutAccount">
					<view class="cell-icon bg-out">
						<text class="iconfont cell-glyph">&#xe727;</text>
					</view>
					<text class="cell-title cell-danger">{{ t('logout') }}</text>
					<text class="cell-arrow">›</text>
				</view>
			</view>
		</view>

		<view class="hint">{{ t('settings_section_preferences') }}</view>
		<view class="cell-group">
			<view class="cell" @click="showLanguagePicker">
				<view class="cell-icon bg-lang">
					<text class="cell-glyph-text">🌐</text>
				</view>
				<text class="cell-title">{{ t('language') }}</text>
				<text class="cell-value">{{ languageRowLabel }}</text>
				<text class="cell-arrow">›</text>
			</view>
			<view class="cell" @click="showFontSizePicker">
				<view class="cell-icon bg-font">
					<text class="cell-glyph-text">Aa</text>
				</view>
				<text class="cell-title">{{ t('settings_font_size') }}</text>
				<text class="cell-value">{{ fontSizeRowLabel }}</text>
				<text class="cell-arrow">›</text>
			</view>
			<view class="cell" @click="toggleDarkMode">
				<view class="cell-icon bg-dark">
					<text class="cell-glyph-text">{{ isDarkMode ? '🌙' : '☀️' }}</text>
				</view>
				<text class="cell-title">{{ t('settings_dark_mode') }}</text>
				<view class="toggle-switch" :class="{ on: isDarkMode }" @click.stop="toggleDarkMode">
					<view class="toggle-knob" />
				</view>
			</view>
		</view>

		<view class="hint">{{ t('settings_section_privacy') }}</view>
		<view class="cell-group">
			<view class="cell" @click="toggleReadReceipt">
				<view class="cell-icon bg-privacy">
					<text class="cell-glyph-text">✓</text>
				</view>
				<view class="cell-text-wrap">
					<text class="cell-title">{{ t('settings_read_receipt') }}</text>
					<text class="cell-sub">{{ t('settings_read_receipt_sub') }}</text>
				</view>
				<view class="toggle-switch" :class="{ on: readReceipt }" @click.stop="toggleReadReceipt">
					<view class="toggle-knob" />
				</view>
			</view>
			<view class="cell" @click="toggleOnlineStatus">
				<view class="cell-icon bg-online">
					<text class="cell-glyph-text">●</text>
				</view>
				<view class="cell-text-wrap">
					<text class="cell-title">{{ t('settings_online_status') }}</text>
					<text class="cell-sub">{{ t('settings_online_status_sub') }}</text>
				</view>
				<view class="toggle-switch" :class="{ on: onlineStatus }" @click.stop="toggleOnlineStatus">
					<view class="toggle-knob" />
				</view>
			</view>
			<view class="cell" @click="showPrivacyPolicy">
				<view class="cell-icon bg-policy">
					<text class="cell-glyph-text">📜</text>
				</view>
				<text class="cell-title">{{ t('settings_privacy_policy') }}</text>
				<text class="cell-arrow">›</text>
			</view>
		</view>

		<view class="hint">{{ t('settings_section_general') }}</view>
		<view class="cell-group">
			<view class="cell" @click="exportData">
				<view class="cell-icon bg-export">
					<text class="cell-glyph-text">📤</text>
				</view>
				<text class="cell-title">{{ t('settings_export_data') }}</text>
				<text class="cell-arrow">›</text>
			</view>
			<view class="cell" @click="checkUpdate">
				<view class="cell-icon bg-update">
					<text class="cell-glyph-text">🔄</text>
				</view>
				<view class="cell-text-wrap">
					<text class="cell-title">{{ t('settings_check_update') }}</text>
					<text class="cell-sub">{{ versionSubLine }}</text>
				</view>
				<text class="cell-arrow">›</text>
			</view>
			<view class="cell" @click="clearCache">
				<view class="cell-icon bg-cache">
					<text class="cell-glyph-text">🗑️</text>
				</view>
				<view class="cell-text-wrap">
					<text class="cell-title">{{ t('settings_clear_cache') }}</text>
					<text class="cell-sub">{{ cacheSubLine }}</text>
				</view>
				<text class="cell-arrow">›</text>
			</view>
		</view>

		<text class="sub-hint">{{ t('settings_switch_logout_hint') }}</text>

		<view v-if="showSheet" class="sheet-mask" @tap="closeSheet">
			<view class="sheet-panel" @tap.stop>
				<view class="sheet-handle" />
				<view class="sheet-title">{{ sheetTitle }}</view>
				<view
					v-for="(item, index) in sheetItems"
					:key="index"
					class="sheet-row"
					:class="{ 'sheet-row-active': index === sheetActiveIndex }"
					@tap="onSheetSelect(index)"
				>
					<text class="sheet-row-t">{{ item }}</text>
					<text v-if="index === sheetActiveIndex" class="sheet-row-check">✓</text>
				</view>
				<view class="sheet-cancel" @tap="closeSheet">
					<text class="sheet-cancel-t">{{ t('cancel') }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { clearSession } from "@/utils/index";
	import { LANG_STORAGE_KEY, getLanguage, setLanguage, t as translate } from "@/utils/lang";

	/* 语言包仅 zh / en；切换时必须写入 app_language。字号存 xs/sm/md/xl，兼容旧版中文存盘 */
	const FONT_SIZE_KEYS = ["xs", "sm", "md", "xl"];
	const LEGACY_FONT_ZH_TO_KEY = { 小: "xs", 中: "sm", 大: "md", 特大: "xl" };

	export default {
		data() {
			return {
				loggedIn: false,
				currentLanguage: getLanguage(),
				readReceipt: true,
				onlineStatus: true,
				isDarkMode: false,
				currentFontSize: "sm",
				cacheSize: "0 KB",
				showSheet: false,
				sheetTitle: "",
				sheetItems: [],
				sheetActiveIndex: -1,
				sheetCallback: null,
			};
		},
		computed: {
			languageRowLabel() {
				return this.currentLanguage === "en" ? this.t("language_name_en") : this.t("language_name_zh");
			},
			fontSizeRowLabel() {
				return this.fontSizeToLabel(this.currentFontSize);
			},
			versionSubLine() {
				return this.t("settings_version_sub", { ver: "v1.0.0" });
			},
			cacheSubLine() {
				return this.t("settings_clear_cache_sub", { size: this.cacheSize });
			},
		},
		onLoad() {
			this.checkLogin();
			this.loadSettings();
			this.calculateCacheSize();
		},
		checkLogin() {
			try {
				const token = uni.getStorageSync("token");
				this.loggedIn = !!token;
			} catch {
				this.loggedIn = false;
			}
		},
		onShow() {
			this.currentLanguage = getLanguage();
			try {
				uni.setNavigationBarTitle({ title: translate("settings", getLanguage()) });
			} catch (e) {
				//
			}
		},
		methods: {
			fontSizeToLabel(size) {
				const m = { xs: "font_size_xs", sm: "font_size_sm", md: "font_size_md", xl: "font_size_xl" };
				return this.t(m[size] || "font_size_sm");
			},
			normalizeFontSizeKey(raw) {
				if (!raw) return "sm";
				if (LEGACY_FONT_ZH_TO_KEY[raw]) return LEGACY_FONT_ZH_TO_KEY[raw];
				return FONT_SIZE_KEYS.includes(raw) ? raw : "sm";
			},
			t(key, params = {}) {
				return translate(key, getLanguage(), params);
			},
			loadSettings() {
				try {
					let settings = uni.getStorageSync("userSettings") || {};
					if (typeof settings === "string") {
						try {
							settings = JSON.parse(settings || "{}");
						} catch {
							settings = {};
						}
					}
					this.readReceipt = settings.readReceipt !== false;
					this.onlineStatus = settings.onlineStatus !== false;
					this.isDarkMode = settings.isDarkMode || false;
					this.currentFontSize = this.normalizeFontSizeKey(settings.fontSize);

					const legacyLabelToCode = {
						"简体中文": "zh",
						"繁体中文": "zh",
						English: "en",
						"日本語": "en",
					};
					const rawApp = uni.getStorageSync(LANG_STORAGE_KEY);
					const hasAppLang = rawApp === "zh" || rawApp === "en";
					const fromSettings = settings.language;
					if (!hasAppLang && fromSettings && legacyLabelToCode[fromSettings]) {
						setLanguage(legacyLabelToCode[fromSettings]);
					}
					this.currentLanguage = getLanguage();
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
					this.cacheSize = this.t("cache_size_unknown");
				}
			},
			clearCache() {
				uni.showModal({
					title: this.t("modal_clear_cache_title"),
					content: this.t("modal_clear_cache_body", { size: this.cacheSize }),
					confirmText: this.t("action_clear_cache"),
					cancelText: this.t("cancel"),
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
							uni.showToast({ title: this.t("toast_clear_cache_ok"), icon: "success" });
						} catch {
							uni.showToast({ title: this.t("toast_clear_cache_fail"), icon: "none" });
						}
					},
				});
			},
			exportData() {
				uni.showModal({
					title: this.t("modal_export_data_title"),
					content: this.t("modal_export_data_body"),
					confirmText: this.t("action_copy_json"),
					cancelText: this.t("cancel"),
					success: (res) => {
						if (!res.confirm) return;
						try {
							const d = new Date();
							const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
							const labelBase = translate("export_data_json_label", getLanguage());
							const exportData = {
								exportTime: d.toISOString(),
								exportLabel: `${labelBase}_${ymd}`,
								userSettings: uni.getStorageSync("userSettings"),
								agents: uni.getStorageSync("digitalAgents"),
								groups: uni.getStorageSync("projectGroups"),
								workflows: uni.getStorageSync("workflows"),
							};
							const content = JSON.stringify(exportData, null, 2);
							uni.setClipboardData({
								data: content,
								success: () => {
									uni.showToast({ title: this.t("toast_clipboard_ok"), icon: "success" });
								},
								fail: () => {
									uni.showToast({ title: this.t("toast_clipboard_fail"), icon: "none" });
								},
							});
						} catch (e) {
							uni.showToast({ title: this.t("toast_export_fail"), icon: "none" });
						}
					},
				});
			},
			checkUpdate() {
				uni.showLoading({ title: this.t("loading_check_update") });
				setTimeout(() => {
					uni.hideLoading();
					uni.showModal({
						title: this.t("modal_check_update_title"),
						content: this.t("modal_check_update_body", { ver: "v1.0.0" }),
						showCancel: false,
						confirmText: this.t("action_got_it"),
					});
				}, 1000);
			},
			saveSettings() {
				try {
					const settings = {
						readReceipt: this.readReceipt,
						onlineStatus: this.onlineStatus,
						isDarkMode: this.isDarkMode,
						language: getLanguage() === "en" ? "English" : "简体中文",
						fontSize: this.currentFontSize,
					};
					uni.setStorageSync("userSettings", JSON.stringify(settings));
				} catch {
					//
				}
			},
			showLanguagePicker() {
				// 固定双语标签，避免随当前语言变化造成认知混淆
				const itemList = ["简体中文", "English"];
				const activeIndex = this.currentLanguage === "en" ? 1 : 0;
				this.openSheet(this.t("language"), itemList, activeIndex, (index) => {
					if (index < 0) return;
					const nextLang = index === 1 ? "en" : "zh";
					setLanguage(nextLang);
					this.currentLanguage = nextLang;
					this.saveSettings();
					try {
						uni.setNavigationBarTitle({ title: translate("settings", getLanguage()) });
					} catch (e) {
						//
					}
					this.$forceUpdate();
					uni.showToast({
						title: index === 1 ? this.t("toast_language_en") : this.t("toast_language_zh"),
						icon: "none",
					});
				});
			},
			showFontSizePicker() {
				const itemList = FONT_SIZE_KEYS.map((s) => this.fontSizeToLabel(s));
				const activeIndex = FONT_SIZE_KEYS.indexOf(this.currentFontSize);
				this.openSheet(this.t("settings_font_size"), itemList, activeIndex, (index) => {
					if (index < 0) return;
					this.currentFontSize = FONT_SIZE_KEYS[index];
					this.saveSettings();
					try {
						const app = getApp && getApp();
						app && app.applyFontSize && app.applyFontSize(this.currentFontSize);
					} catch (e) {
						//
					}
					uni.showToast({
						title: this.t("toast_font_changed", { size: this.fontSizeToLabel(this.currentFontSize) }),
						icon: "none",
					});
				});
			},
			openSheet(title, items, activeIndex, callback) {
				this.sheetTitle = title;
				this.sheetItems = items;
				this.sheetActiveIndex = activeIndex;
				this.sheetCallback = callback;
				this.showSheet = true;
			},
			closeSheet() {
				this.showSheet = false;
				this.sheetCallback = null;
			},
			onSheetSelect(index) {
				this.showSheet = false;
				if (this.sheetCallback) {
					this.sheetCallback(index);
					this.sheetCallback = null;
				}
			},
			toggleDarkMode() {
				this.isDarkMode = !this.isDarkMode;
				this.saveSettings();
				this.applyDarkMode(this.isDarkMode);
				uni.showToast({
					title: this.isDarkMode ? this.t("toast_dark_on") : this.t("toast_dark_off"),
					icon: "none",
				});
			},
			applyDarkMode(isDark) {
				try {
					const app = getApp && getApp();
					if (app && typeof app.applyDarkMode === "function") {
						app.applyDarkMode(isDark);
					}
				} catch (e) {
					console.warn("[settings] applyDarkMode", e);
				}
			},
			toggleReadReceipt() {
				this.readReceipt = !this.readReceipt;
				this.saveSettings();
				uni.showToast({
					title: this.readReceipt ? this.t("toast_read_receipt_on") : this.t("toast_read_receipt_off"),
					icon: "none",
				});
			},
			toggleOnlineStatus() {
				this.onlineStatus = !this.onlineStatus;
				this.saveSettings();
				uni.showToast({
					title: this.onlineStatus ? this.t("toast_online_on") : this.t("toast_online_off"),
					icon: "none",
				});
			},
			showPrivacyPolicy() {
				uni.showModal({
					title: this.t("modal_privacy_policy_title"),
					content: this.t("modal_privacy_policy_body"),
					showCancel: false,
					confirmText: this.t("action_got_it"),
				});
			},
			switchAccount() {
				uni.showModal({
					title: translate("switch_account", getLanguage()),
					content: translate("switch_account_modal_body", getLanguage()),
					confirmText: translate("go_to_login", getLanguage()),
					cancelText: translate("cancel", getLanguage()),
					success: (res) => {
						if (!res.confirm) return;
						clearSession();
						uni.reLaunch({ url: "/pages/login/login" });
					},
				});
			},
			logoutAccount() {
				uni.showModal({
					title: translate("logout", getLanguage()),
					content: translate("logout_confirm_body", getLanguage()),
					confirmText: translate("logout_action", getLanguage()),
					cancelText: translate("cancel", getLanguage()),
					success: (res) => {
						if (!res.confirm) return;
						clearSession();
						uni.showToast({ title: translate("logged_out", getLanguage()), icon: "success" });
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
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		background: transparent;
		border: none;
		box-shadow: none;
		padding: 0;
	}

	.cell {
		display: flex;
		flex-direction: row;
		align-items: center;
		min-height: 108rpx;
		padding: 24rpx 28rpx;
		box-sizing: border-box;
		background: #fff;
		border-radius: 22rpx;
		border: none;
		box-shadow: 0 8rpx 26rpx rgba(15, 23, 42, 0.06);
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

	.sheet-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(15, 23, 42, 0.14);
		z-index: 100000;
		display: flex;
		align-items: flex-end;
	}

	.sheet-panel {
		width: 100%;
		background: #eef2ff;
		border-radius: 24rpx 24rpx 0 0;
		padding-bottom: env(safe-area-inset-bottom);
		overflow: hidden;
	}

	.sheet-handle {
		width: 72rpx;
		height: 8rpx;
		border-radius: 999rpx;
		background: #cbd5e1;
		margin: 14rpx auto 12rpx;
	}

	.sheet-title {
		font-size: 26rpx;
		color: #64748b;
		text-align: center;
		padding: 12rpx 0 8rpx;
	}

	.sheet-row {
		background: #fff;
		padding: 30rpx 32rpx;
		border-top: 1rpx solid #eef2f7;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.sheet-row-active .sheet-row-t {
		color: #2563eb;
		font-weight: 700;
	}

	.sheet-row-t {
		font-size: 30rpx;
		color: #0f172a;
		font-weight: 600;
	}

	.sheet-row-check {
		font-size: 28rpx;
		color: #2563eb;
		font-weight: 700;
	}

	.sheet-cancel {
		margin-top: 14rpx;
		background: #fff;
		padding: 28rpx 32rpx;
		display: flex;
		justify-content: center;
	}

	.sheet-cancel-t {
		font-size: 30rpx;
		color: #64748b;
		font-weight: 600;
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
