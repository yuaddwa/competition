<template>
	<view class="page">
		<view class="card">
			<text class="h">修改密码</text>
			<text class="hint">修改成功后请牢记新密码；接口需登录态。</text>

			<view class="field">
				<text class="lab">当前密码</text>
				<input class="inp" password v-model="oldPassword" placeholder="请输入当前密码" placeholder-class="ph" />
			</view>
			<view class="field">
				<text class="lab">新密码</text>
				<input class="inp" password v-model="newPassword" placeholder="至少 6 位" placeholder-class="ph" />
			</view>
			<view class="field">
				<text class="lab">确认新密码</text>
				<input class="inp" password v-model="confirmPassword" placeholder="再次输入新密码" placeholder-class="ph" />
			</view>

			<button class="btn primary" type="primary" :loading="loading" @click="submit">保存新密码</button>
		</view>
	</view>
</template>

<script>
	import * as authApi from "@/api/authApi";
	import { getToken } from "@/utils/index";

	export default {
		data() {
			return {
				oldPassword: "",
				newPassword: "",
				confirmPassword: "",
				loading: false,
			};
		},
		onShow() {
			if (!getToken()) {
				uni.showToast({ title: "请先登录", icon: "none" });
				setTimeout(() => {
					uni.redirectTo({ url: "/pages/login/login" });
				}, 400);
			}
		},
		methods: {
			async submit() {
				if (!this.oldPassword) {
					uni.showToast({ title: "请输入当前密码", icon: "none" });
					return;
				}
				if (!this.newPassword || this.newPassword.length < 6) {
					uni.showToast({ title: "新密码至少 6 位", icon: "none" });
					return;
				}
				if (this.newPassword !== this.confirmPassword) {
					uni.showToast({ title: "两次新密码不一致", icon: "none" });
					return;
				}
				this.loading = true;
				try {
					await authApi.changePassword({
						oldPassword: this.oldPassword,
						newPassword: this.newPassword,
					});
					uni.showToast({ title: "已更新密码", icon: "success" });
					setTimeout(() => {
						uni.navigateBack({ delta: 1 });
					}, 400);
				} catch {
					//
				} finally {
					this.loading = false;
				}
			},
		},
	};
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: #f1f5f9;
		padding: 28rpx;
		box-sizing: border-box;
	}

	.card {
		background: #fff;
		border-radius: 24rpx;
		padding: 36rpx;
		box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
		border: 1rpx solid #e2e8f0;
	}

	.h {
		display: block;
		font-size: 36rpx;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 12rpx;
	}

	.hint {
		display: block;
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.45;
		margin-bottom: 32rpx;
	}

	.field {
		margin-bottom: 28rpx;
	}

	.lab {
		display: block;
		font-size: 26rpx;
		font-weight: 600;
		color: #334155;
		margin-bottom: 10rpx;
	}

	.inp {
		width: 100%;
		height: 88rpx;
		padding: 0 24rpx;
		font-size: 28rpx;
		border-radius: 16rpx;
		background: #f8fafc;
		border: 2rpx solid #e2e8f0;
		box-sizing: border-box;
	}

	.ph {
		color: #94a3b8;
	}

	.btn {
		width: 100%;
		height: 92rpx;
		line-height: 92rpx;
		border-radius: 46rpx;
		font-size: 30rpx;
		font-weight: 700;
		margin-top: 16rpx;
		border: none;
		background: linear-gradient(135deg, #2563eb, #7c3aed) !important;
	}

	.btn::after {
		border: none;
	}
</style>
