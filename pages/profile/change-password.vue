<template>
	<view class="page">
		<view class="card">
			<text class="h">{{ t('change_password') }}</text>
			<text class="hint">{{ t('change_password_hint') }}</text>

			<view class="field">
				<text class="lab">{{ t('current_password') }}</text>
				<input class="inp" password v-model="oldPassword" :placeholder="t('please_enter_current_password')" placeholder-class="ph" />
			</view>
			<view class="field">
				<text class="lab">{{ t('new_password') }}</text>
				<input class="inp" password v-model="newPassword" :placeholder="t('new_password_min_6')" placeholder-class="ph" />
			</view>
			<view class="field">
				<text class="lab">{{ t('confirm_new_password') }}</text>
				<input class="inp" password v-model="confirmPassword" :placeholder="t('reenter_new_password')" placeholder-class="ph" />
			</view>

			<button class="btn primary" type="primary" :loading="loading" @click="submit">{{ t('save_new_password') }}</button>
		</view>
	</view>
</template>

<script>
	import * as authApi from "@/clientApi/authApi";
	import { getToken } from "@/utils/index";
	import { t, getLanguage } from "@/utils/lang";

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
			try {
				uni.setNavigationBarTitle({ title: t("change_password", getLanguage()) });
			} catch (e) {
				//
			}
			if (!getToken()) {
				uni.showToast({ title: this.t('please_login_first'), icon: "none" });
				setTimeout(() => {
					uni.redirectTo({ url: "/pages/login/login" });
				}, 400);
			}
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			handleChangePasswordError(err) {
				const sc = err && Number(err.statusCode);
				const data = err && err.data;
				let bodyText = "";
				if (typeof data === "string") {
					bodyText = data;
				} else if (data && typeof data === "object") {
					bodyText = [data.message, data.msg, data.error].filter(Boolean).join(" ");
				}
				if (sc === 400) {
					if (/相同|一致|same|identical|不能与|unchanged|未变更/i.test(bodyText)) {
						uni.showToast({ title: this.t('cannot_use_same_password'), icon: "none" });
						return;
					}
					uni.showToast({ title: this.t('current_password_error'), icon: "none" });
					return;
				}
				const fallback =
					bodyText || (err && err.message) || this.t('change_failed_retry');
				uni.showToast({
					title: String(fallback).slice(0, 40),
					icon: "none",
				});
			},
			async submit() {
				if (!this.oldPassword) {
					uni.showToast({ title: this.t('please_enter_current_password'), icon: "none" });
					return;
				}
				if (!this.newPassword || this.newPassword.length < 6) {
					uni.showToast({ title: this.t('new_password_min_6'), icon: "none" });
					return;
				}
				if (this.newPassword !== this.confirmPassword) {
					uni.showToast({ title: this.t('passwords_not_match'), icon: "none" });
					return;
				}
				if (this.newPassword === this.oldPassword) {
					uni.showToast({ title: this.t('cannot_use_same_password'), icon: "none" });
					return;
				}
				this.loading = true;
				try {
					await authApi.changePassword({
						oldPassword: this.oldPassword,
						newPassword: this.newPassword,
					});
					uni.showToast({ title: this.t('change_success'), icon: "success" });
					setTimeout(() => uni.navigateBack(), 600);
				} catch (e) {
					this.handleChangePasswordError(e);
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
