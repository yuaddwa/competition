<template>
	<view class="page model-settings-page" :class="{ 'theme-dark': isDarkMode }">
		<view class="tip-card">
			<text class="tip-title">{{ t("model_settings_tip_title") }}</text>
			<text class="tip-text">{{ t("model_settings_tip") }}</text>
		</view>

		<view class="section-label">{{ t("model_section_connection") }}</view>
		<view class="form-card">
			<view class="field">
				<text class="label">{{ t("model_label_api_key") }}</text>
				<input
					class="input"
					type="text"
					password
					v-model="apiKey"
					:placeholder="t('model_placeholder_key')"
					placeholder-class="ph"
				/>
			</view>
			<view class="field field-last">
				<text class="label">{{ t("model_label_base_url") }}</text>
				<input
					class="input"
					type="text"
					v-model="baseUrl"
					placeholder="https://api.openai.com/v1"
					placeholder-class="ph"
				/>
			</view>
		</view>

		<view class="section-label">{{ t("model_section_model") }}</view>
		<view class="form-card">
			<view class="field field-last">
				<text class="label">{{ t("model_label_model_name") }}</text>
				<input class="input" type="text" v-model="model" placeholder="gpt-4o-mini" placeholder-class="ph" />
			</view>
		</view>

		<view class="btn-save" :class="{ 'btn-save-disabled': verifying }" @click="save">
			<text class="btn-save-t">{{ verifying ? t("model_verify_loading") : t("save") }}</text>
		</view>
	</view>
</template>

<script>
	import { getLlmSettings, setLlmSettings, validateLlmSettings } from "@/utils/llmSettings";
	import { verifyLlmConnection } from "@/utils/openaiCompatible";
	import { t, getLanguage } from "@/utils/lang";

	export default {
		data() {
			return {
				apiKey: "",
				baseUrl: "",
				model: "",
				/** 小程序无 document，不能依赖 html[data-theme]；与 App.applyDarkMode 的 updateTheme 联动 */
				isDarkMode: false,
				verifying: false,
			};
		},
		onLoad() {
			const s = getLlmSettings();
			this.apiKey = s.apiKey;
			this.baseUrl = s.baseUrl;
			this.model = s.model;
			this.loadDarkMode();
		},
		onShow() {
			this.loadDarkMode();
			try {
				uni.setNavigationBarTitle({ title: t("model_api", getLanguage()) });
			} catch (e) {
				//
			}
		},
		methods: {
			loadDarkMode() {
				try {
					const settings = uni.getStorageSync("userSettings");
					let parsed = {};
					if (settings) {
						parsed = typeof settings === "string" ? JSON.parse(settings) : settings;
					}
					this.isDarkMode = !!parsed.isDarkMode;
				} catch {
					this.isDarkMode = false;
				}
			},
			/** App.vue applyDarkMode 会调用当前页实例的 updateTheme */
			updateTheme(isDark) {
				this.isDarkMode = !!isDark;
			},
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			async save() {
				if (this.verifying) return;
				const result = validateLlmSettings({
					apiKey: this.apiKey,
					baseUrl: this.baseUrl,
					model: this.model,
				});
				if (!result.ok) {
					uni.showToast({
						title: this.t(result.messageKey),
						icon: "none",
						duration: 2800,
					});
					return;
				}
				this.verifying = true;
				uni.showLoading({
					title: this.t("model_verify_loading"),
					mask: true,
				});
				try {
					await verifyLlmConnection({
						apiKey: result.values.apiKey,
						baseUrl: result.values.baseUrl,
						model: result.values.model,
					});
				} catch (e) {
					const key = e && e.messageKey ? e.messageKey : "model_verify_failed";
					let title = this.t(key);
					const detail = e && e.detail ? String(e.detail).trim() : "";
					if (detail && (key === "model_verify_chat_failed" || key === "model_verify_http" || key === "model_verify_network")) {
						const short = detail.length > 72 ? `${detail.slice(0, 72)}…` : detail;
						title = `${title}（${short}）`;
					}
					uni.showToast({
						title,
						icon: "none",
						duration: 3600,
					});
					return;
				} finally {
					uni.hideLoading();
					this.verifying = false;
				}
				setLlmSettings(result.values);
				this.apiKey = result.values.apiKey;
				this.baseUrl = result.values.baseUrl;
				this.model = result.values.model;
				uni.showToast({ title: this.t("saved"), icon: "success" });
				setTimeout(() => uni.navigateBack(), 600);
			},
		},
	};
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: #f1f5f9;
		padding: 28rpx;
		padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.tip-card {
		background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
		border-radius: 20rpx;
		padding: 24rpx 28rpx;
		margin-bottom: 28rpx;
		border: 1rpx solid #c7d2fe;
	}

	.tip-title {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: #312e81;
		margin-bottom: 12rpx;
	}

	.tip-text {
		font-size: 24rpx;
		color: #4338ca;
		line-height: 1.55;
	}

	.section-label {
		font-size: 24rpx;
		font-weight: 600;
		color: #64748b;
		margin-bottom: 12rpx;
		padding-left: 8rpx;
		letter-spacing: 0.5rpx;
	}

	.form-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 8rpx 28rpx 8rpx;
		margin-bottom: 28rpx;
		border: none;
		box-shadow: 0 8rpx 28rpx rgba(15, 23, 42, 0.06);
	}

	.field {
		padding: 20rpx 0;
		border-bottom: 1rpx solid #e2e8f0;
	}

	.field-last {
		border-bottom: none;
	}

	.label {
		display: block;
		font-size: 26rpx;
		font-weight: 600;
		color: #475569;
		margin-bottom: 12rpx;
	}

	.input {
		width: 100%;
		min-height: 72rpx;
		font-size: 28rpx;
		color: #0f172a;
		padding: 12rpx 20rpx;
		border-radius: 16rpx;
		background: #f8fafc;
		border: 2rpx solid #e2e8f0;
		box-sizing: border-box;
	}

	.ph {
		color: #94a3b8;
	}

	.btn-save {
		margin-top: 16rpx;
		background: linear-gradient(135deg, #2563eb, #7c3aed);
		border-radius: 46rpx;
		padding: 28rpx;
		box-shadow: 0 12rpx 32rpx rgba(37, 99, 235, 0.28);
	}

	.btn-save-disabled {
		opacity: 0.72;
		pointer-events: none;
	}

	.btn-save-t {
		display: block;
		text-align: center;
		color: #fff;
		font-size: 30rpx;
		font-weight: 700;
	}
</style>

<style>
	/*
	 * 深色样式同时写两套：
	 * - .theme-dark：小程序无 document，html[data-theme] 不存在，必须用页面 class（与 loadDarkMode / updateTheme 同步）
	 * - [data-theme="dark"]：H5 上 App 会写根节点属性，双保险
	 * 小程序上 [data-theme="dark"] 里的 CSS 变量不会生效，须在 .theme-dark 根上重复一份变量，子元素里的 var(--bg-secondary) 等才能变深
	 */
	.model-settings-page.theme-dark {
		--bg-primary: #0f172a;
		--bg-secondary: #1e293b;
		--bg-tertiary: #334155;
		--text-primary: #f8fafc;
		--text-secondary: #94a3b8;
		--text-tertiary: #64748b;
		--border-color: #334155;
		--card-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.3);
		--input-bg: #1a2332;
		--input-border: #3f4f63;
		--input-placeholder: #94a3b8;
		--cell-hover: #334155;
		--primary-color: #2563eb;
	}

	.model-settings-page.theme-dark,
	[data-theme="dark"] .model-settings-page {
		background: var(--bg-primary) !important;
	}

	.model-settings-page.theme-dark .tip-card,
	[data-theme="dark"] .model-settings-page .tip-card {
		background: linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%) !important;
		border-color: rgba(99, 102, 241, 0.4) !important;
		box-shadow: 0 8rpx 28rpx rgba(0, 0, 0, 0.35) !important;
	}

	.model-settings-page.theme-dark .tip-title,
	[data-theme="dark"] .model-settings-page .tip-title {
		color: #c7d2fe !important;
	}

	.model-settings-page.theme-dark .tip-text,
	[data-theme="dark"] .model-settings-page .tip-text {
		color: #a5b4fc !important;
	}

	.model-settings-page.theme-dark .section-label,
	[data-theme="dark"] .model-settings-page .section-label {
		color: var(--text-secondary) !important;
	}

	.model-settings-page.theme-dark .form-card,
	[data-theme="dark"] .model-settings-page .form-card {
		background: var(--bg-secondary) !important;
		border: 1rpx solid var(--border-color) !important;
		box-shadow: var(--card-shadow) !important;
	}

	.model-settings-page.theme-dark .field,
	[data-theme="dark"] .model-settings-page .field {
		border-bottom-color: var(--border-color) !important;
	}

	.model-settings-page.theme-dark .label,
	[data-theme="dark"] .model-settings-page .label {
		color: var(--text-secondary) !important;
	}

	.model-settings-page.theme-dark .input,
	[data-theme="dark"] .model-settings-page .input {
		background: var(--input-bg) !important;
		color: var(--text-primary) !important;
		border-color: var(--input-border) !important;
		box-shadow: inset 0 1rpx 3rpx rgba(0, 0, 0, 0.35) !important;
		caret-color: var(--primary-color);
	}

	.model-settings-page.theme-dark .input:focus,
	[data-theme="dark"] .model-settings-page .input:focus {
		border-color: var(--primary-color) !important;
		box-shadow: inset 0 1rpx 3rpx rgba(0, 0, 0, 0.35), 0 0 0 2rpx rgba(37, 99, 235, 0.28) !important;
	}

	.model-settings-page.theme-dark .ph,
	[data-theme="dark"] .model-settings-page .ph {
		color: var(--input-placeholder) !important;
	}

	.model-settings-page.theme-dark .btn-save,
	[data-theme="dark"] .model-settings-page .btn-save {
		box-shadow: 0 12rpx 32rpx rgba(37, 99, 235, 0.4) !important;
	}
</style>
