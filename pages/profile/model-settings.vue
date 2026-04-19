<template>
	<view class="page">
		<view class="tip-card">
			<text class="tip-text">密钥仅保存在本机。对话时直接向「接口地址」发起聊天补全请求（OpenAI 兼容）。微信小程序需在公众平台配置该域名为合法 request 域名；或使用与后端同域的代理。</text>
		</view>

		<view class="form-group">
			<text class="label">API Key</text>
			<input
				class="input"
				type="text"
				password
				v-model="apiKey"
				placeholder="sk-… 或服务商密钥"
				placeholder-class="ph"
			/>
		</view>

		<view class="form-group">
			<text class="label">接口根地址（含 /v1）</text>
			<input
				class="input"
				type="text"
				v-model="baseUrl"
				placeholder="https://api.openai.com/v1"
				placeholder-class="ph"
			/>
		</view>

		<view class="form-group">
			<text class="label">模型名</text>
			<input class="input" type="text" v-model="model" placeholder="gpt-4o-mini" placeholder-class="ph" />
		</view>

		<view class="btn-save" @click="save">
			<text class="btn-save-t">保存</text>
		</view>
	</view>
</template>

<script>
	import { getLlmSettings, setLlmSettings } from "@/utils/llmSettings";

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
		methods: {
			save() {
				setLlmSettings({
					apiKey: this.apiKey,
					baseUrl: this.baseUrl,
					model: this.model,
				});
				uni.showToast({ title: "已保存", icon: "success" });
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
