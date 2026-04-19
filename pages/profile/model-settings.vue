<template>
	<view class="page">
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

		<view class="btn-save" @click="save">
			<text class="btn-save-t">{{ t("save") }}</text>
		</view>
	</view>
</template>

<script>
	import { getLlmSettings, setLlmSettings } from "@/utils/llmSettings";
	import { t, getLanguage } from "@/utils/lang";

	export default {
		data() {
			return {
				apiKey: "",
				baseUrl: "",
				model: "",
			};
		},
		onLoad() {
			const s = getLlmSettings();
			this.apiKey = s.apiKey;
			this.baseUrl = s.baseUrl;
			this.model = s.model;
		},
		onShow() {
			try {
				uni.setNavigationBarTitle({ title: t("model_api", getLanguage()) });
			} catch (e) {
				//
			}
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			save() {
				setLlmSettings({
					apiKey: this.apiKey,
					baseUrl: this.baseUrl,
					model: this.model,
				});
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

	.btn-save-t {
		display: block;
		text-align: center;
		color: #fff;
		font-size: 30rpx;
		font-weight: 700;
	}
</style>
