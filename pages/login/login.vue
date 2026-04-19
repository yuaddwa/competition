<template>
	<view class="auth-page">
		<view class="auth-bg" />
		<view class="auth-main">
			<view class="auth-card">
			<text class="brand">{{ t('welcome_back') }}</text>
			<text class="sub">{{ t('login_subtitle') }}</text>

			<view class="field">
				<text class="lab">{{ t('account_phone') }}</text>
				<input class="inp" v-model="phone" :placeholder="t('input_account_phone')" placeholder-class="ph" />
			</view>

			<view class="field">
				<text class="lab">{{ t('password') }}</text>
				<view class="pwd-wrap">
					<input class="inp pwd" :password="!showPw" v-model="password" :placeholder="t('input_password')" placeholder-class="ph" />
					<text class="eye iconfont" @click="showPw = !showPw">{{ showPw ? '\ue78f' : '\ue8ff' }}</text>
				</view>
			</view>

			<!-- 小程序里原生 button 偶发不触发；view + tap/click。点击后走 authApi.login → POST /api/auth/login -->
			<view class="submit primary" :class="{ 'is-busy': loading }" hover-class="submit-hover" @tap.stop="onLogin" @click.stop="onLogin">
				<text>{{ loading ? t('logging_in') : t('login') }}</text>
			</view>

			<view class="foot">
				<text class="link" @tap.stop="goRegister">{{ t('no_account') }}</text>
			</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { setToken, setUserInfo } from "@/utils/index";
	import * as authApi from "@/clientApi/authApi";
	import { t, getLanguage } from "@/utils/lang";

	export default {
		data() {
			return {
				phone: "",
				password: "",
				showPw: false,
				loading: false,
			};
		},
		onShow() {
			try {
				uni.setNavigationBarTitle({ title: t("login", getLanguage()) });
			} catch (e) {
				//
			}
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			async onLogin() {
				if (this.loading) return;
				const phone = (this.phone || "").trim();
				if (!phone) {
					uni.showToast({ title: this.t('please_input_phone'), icon: "none" });
					return;
				}
				if (!this.password) {
					uni.showToast({ title: this.t('please_input_password'), icon: "none" });
					return;
				}
				this.loading = true;
				uni.showLoading({ title: this.t('logging_in'), mask: true });
				try {
					const { token, user } = await authApi.login({
						phone,
						password: this.password,
					});
					if (!token) {
						uni.showToast({ title: this.t('login_success_no_token'), icon: "none" });
						return;
					}
					setToken(token);
					setUserInfo(user || { phone: phone, username: phone });
					uni.showToast({ title: this.t('login_success'), icon: "success" });
					setTimeout(() => {
						uni.switchTab({
							url: "/pages/profile/profile",
							fail: () => {
								uni.reLaunch({ url: "/pages/profile/profile" });
							},
						});
					}, 400);
				} catch (e) {
					console.error("[login]", e);
				} finally {
					uni.hideLoading();
					this.loading = false;
				}
			},
			goRegister() {
				uni.redirectTo({ url: "/pages/register/register" });
			},
		},
	};
</script>

<style>
	@font-face {
		font-family: 'iconfont';
		src: url('../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff2') format('woff2'),
			 url('../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff') format('woff'),
			 url('../../static/download/font_5162264_g3oiz4ouy1i/iconfont.ttf') format('truetype');
	}

	.iconfont {
		font-family: 'iconfont' !important;
		font-size: 36rpx;
		color: #64748b;
	}

	.auth-page {
		min-height: 100vh;
		position: relative;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	.auth-main {
		flex: 1;
		padding: 48rpx 36rpx 24rpx;
		box-sizing: border-box;
	}

	.auth-bg {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		height: 420rpx;
		background: linear-gradient(165deg, #2563eb 0%, #4f46e5 45%, #7c3aed 100%);
		border-radius: 0 0 48rpx 48rpx;
		z-index: 0;
	}

	.auth-card {
		position: relative;
		z-index: 1;
		margin-top: 120rpx;
		padding: 44rpx 36rpx 48rpx;
		background: #fff;
		border-radius: 28rpx;
		box-shadow: 0 24rpx 60rpx rgba(15, 23, 42, 0.12);
	}

	.brand {
		display: block;
		font-size: 44rpx;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.02em;
	}

	.sub {
		display: block;
		margin-top: 12rpx;
		font-size: 26rpx;
		color: #64748b;
		line-height: 1.45;
		margin-bottom: 40rpx;
	}

	.field {
		margin-bottom: 32rpx;
	}

	.lab {
		display: block;
		font-size: 26rpx;
		font-weight: 600;
		color: #334155;
		margin-bottom: 12rpx;
	}

	.inp {
		width: 100%;
		height: 92rpx;
		padding: 0 28rpx;
		font-size: 30rpx;
		border-radius: 18rpx;
		background: #f8fafc;
		border: 2rpx solid #e2e8f0;
		box-sizing: border-box;
	}

	.inp:focus {
		border-color: #6366f1;
		background: #fff;
	}

	.ph {
		color: #94a3b8;
	}

	.pwd-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.pwd {
		padding-right: 88rpx;
	}

	.eye {
		position: absolute;
		right: 24rpx;
		padding: 8rpx;
	}

	.submit {
		width: 100%;
		height: 96rpx;
		line-height: 96rpx;
		border-radius: 48rpx;
		font-size: 32rpx;
		font-weight: 700;
		margin-top: 16rpx;
		text-align: center;
		color: #fff;
		background: linear-gradient(135deg, #2563eb, #4f46e5);
		box-shadow: 0 16rpx 36rpx rgba(37, 99, 235, 0.35);
	}

	.submit.is-busy {
		opacity: 0.75;
		pointer-events: none;
	}

	.submit-hover {
		opacity: 0.92;
	}

	.foot {
		margin-top: 36rpx;
		text-align: center;
	}

	.link {
		font-size: 28rpx;
		color: #4f46e5;
		font-weight: 600;
	}
</style>
