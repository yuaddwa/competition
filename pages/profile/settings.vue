<template>
	<view class="page">
		<view class="hint">{{ t('settings_section_account') }}</view>
		<view class="cell-group">
			<view class="cell cell-border" @click="switchAccount">
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
		<text class="sub-hint">{{ t('settings_switch_logout_hint') }}</text>

		<view class="hint" style="margin-top: 40rpx;">{{ t('language_settings') }}</view>
		<view class="cell-group">
			<view class="cell" @click="openLanguageSelect">
				<view class="cell-icon bg-lang">
					<text class="iconfont cell-glyph">&#xe654;</text>
				</view>
				<text class="cell-title">{{ t('language') }}</text>
				<view class="cell-right">
					<text class="cell-extra">{{ currentLanguageName }}</text>
					<text class="cell-arrow">›</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getToken, clearSession } from "@/utils/index";
	import { LANGUAGES, getLanguage, setLanguage, t } from "@/utils/lang";

	export default {
		data() {
			return {
				languages: LANGUAGES
			};
		},
		computed: {
			currentLanguage() {
				return getLanguage();
			},
			currentLanguageName() {
				return this.languages[this.currentLanguage]?.name || t("chinese", getLanguage());
			}
		},
		onShow() {
			try {
				uni.setNavigationBarTitle({ title: t("settings", getLanguage()) });
			} catch (e) {
				//
			}
			if (!getToken()) {
				uni.showToast({ title: t("please_login_first", getLanguage()), icon: "none" });
				setTimeout(() => {
					uni.redirectTo({ url: "/pages/login/login" });
				}, 400);
			}
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			switchAccount() {
				uni.showModal({
					title: t("switch_account", getLanguage()),
					content: t("switch_account_modal_body", getLanguage()),
					confirmText: t("go_to_login", getLanguage()),
					cancelText: t("cancel", getLanguage()),
					success: (res) => {
						if (!res.confirm) return;
						clearSession();
						uni.reLaunch({ url: "/pages/login/login" });
					},
				});
			},
			logoutAccount() {
				uni.showModal({
					title: t("logout", getLanguage()),
					content: t("logout_confirm_body", getLanguage()),
					confirmText: t("logout_action", getLanguage()),
					cancelText: t("cancel", getLanguage()),
					success: (res) => {
						if (!res.confirm) return;
						clearSession();
						uni.showToast({ title: t("logged_out", getLanguage()), icon: "success" });
						setTimeout(() => {
							uni.navigateBack({ delta: 1 });
						}, 400);
					},
				});
			},
			openLanguageSelect() {
				const languageOptions = Object.values(this.languages).map(lang => ({
					text: lang.name,
					value: lang.code
				}));
				
				uni.showActionSheet({
					itemList: languageOptions.map(opt => opt.text),
					success: (res) => {
						const selectedLang = languageOptions[res.tapIndex].value;
						if (selectedLang !== this.currentLanguage) {
							setLanguage(selectedLang);
							uni.showToast({ title: t("language_switched", getLanguage()), icon: "success" });
							// 刷新页面以应用语言变化
							setTimeout(() => {
								uni.reLaunch({ url: "/pages/profile/profile" });
							}, 500);
						}
					}
				});
			}
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
		padding-left: 4rpx;
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

	.bg-switch {
		background: linear-gradient(145deg, #3b82f6, #2563eb);
	}

	.bg-out {
			background: linear-gradient(145deg, #64748b, #475569);
		}

		.bg-lang {
			background: linear-gradient(145deg, #0ea5e9, #0284c7);
		}

		.cell-title {
			flex: 1;
			font-size: 32rpx;
			color: #1e293b;
			font-weight: 400;
		}

		.cell-right {
			display: flex;
			align-items: center;
		}

		.cell-extra {
			font-size: 28rpx;
			color: #64748b;
			margin-right: 8rpx;
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
