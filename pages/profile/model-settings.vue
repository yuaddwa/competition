<template>
	<view class="page">
		<view class="tip-card">
			<text class="tip-text">{{ t('model_settings_tip') }}</text>
		</view>

		<view class="form-group">
			<text class="label">{{ t('model_label_api_key') }}</text>
			<input
				class="input"
				type="text"
				password
				v-model="apiKey"
				:placeholder="t('model_placeholder_key')"
				placeholder-class="ph"
			/>
		</view>

		<view class="form-group">
			<text class="label">{{ t('model_label_base_url') }}</text>
			<input
				class="input"
				type="text"
				v-model="baseUrl"
				placeholder="https://api.openai.com/v1"
				placeholder-class="ph"
			/>
		</view>

		<view class="form-group">
			<text class="label">{{ t('model_label_model_name') }}</text>
			<input class="input" type="text" v-model="model" placeholder="gpt-4o-mini" placeholder-class="ph" />
		</view>

		<view class="btn-save" @click="save">
			<text class="btn-save-t">{{ t('save') }}</text>
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
		background: #f5f5f5;
		padding: 24rpx;
		box-sizing: border-box;
	}

	.tip-card {
		background: #fff7ed;
		border-radius: 12rpx;
		padding: 20rpx;
		margin-bottom: 24rpx;
		border: 1rpx solid #fed7aa;
	}

	.tip-text {
		font-size: 24rpx;
		color: #9a3412;
		line-height: 1.55;
	}

	.form-group {
		background: #fff;
		border-radius: 12rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
	}

	.label {
		display: block;
		font-size: 26rpx;
		color: #64748b;
		margin-bottom: 12rpx;
	}

	.input {
		width: 100%;
		font-size: 28rpx;
		color: #0f172a;
		padding: 16rpx 0;
		border-bottom: 1rpx solid #e2e8f0;
	}

	.ph {
		color: #94a3b8;
	}

	.btn-save {
		margin-top: 40rpx;
		background: #2563eb;
		border-radius: 12rpx;
		padding: 28rpx;
		align-items: center;
	}

	.btn-save-t {
		display: block;
		text-align: center;
		color: #fff;
		font-size: 30rpx;
		font-weight: 600;
	}
</style>
