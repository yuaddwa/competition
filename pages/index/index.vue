<template>
	<view class="login-container">
		<view class="login-form">
			<view class="input-group">
				<text class="input-label">手机号</text>
				<input type="number" class="input" v-model="phone" placeholder="请输入手机号" placeholder-class="placeholder" />
			</view>
			<view class="input-group password-group">
				<text class="input-label">密码</text>
				<view class="password-input-container">
					<input :type="showPassword ? 'text' : 'password'" class="input" v-model="password" placeholder="请输入密码" placeholder-class="placeholder" />
					<view class="password-toggle" @click="togglePassword">
						<text class="iconfont">{{ showPassword ? '\ue78f' : '\ue8ff' }}</text>
					</view>
				</view>
			</view>
			<button class="login-btn" @click="login">登录</button>
			<view class="forgot-password" @click="forgotPassword">忘记密码</view>
			<view class="register-container">
				<text>还没有账号？？</text>
				<text class="register-link" @click="register">立即注册</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { setToken } from '@/utils/index'

	export default {
		data() {
			return {
				phone: '',
				password: '',
				showPassword: false
			}
		},
		onLoad() {

		},
		methods: {
			login() {
				if (!this.phone) {
					uni.showToast({ title: '请输入手机号', icon: 'none' });
					return;
				}
				if (!this.password) {
					uni.showToast({ title: '请输入密码', icon: 'none' });
					return;
				}
				// 这里可以添加登录接口调用
				console.log('登录信息:', { phone: this.phone, password: this.password });
				// 先写入占位 token，后续接入真实登录接口时替换成后端返回值
				setToken('mock-token');
				uni.showToast({ title: '登录成功', icon: 'success' });
				uni.redirectTo({
					url: '/pages/home/home'
				});
			},
			forgotPassword() {
				// 这里可以跳转到忘记密码页面或调用忘记密码接口
				console.log('忘记密码？');
				uni.showToast({ title: '忘记密码功能开发中', icon: 'none' });
			},
			togglePassword() {
				this.showPassword = !this.showPassword;
			},
			register() {
				uni.redirectTo({
					url: '/pages/register/register'
				});
			}
		}
	}
</script>

<style>
	@font-face {
		font-family: 'iconfont';  /* Project id 5162264 */
		src: url('../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff2') format('woff2'),
			 url('../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff') format('woff'),
			 url('../static/download/font_5162264_g3oiz4ouy1i/iconfont.ttf') format('truetype');
	}

	.iconfont {
		font-family: 'iconfont' !important;
		font-size: 32rpx;
	}

	.login-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 150rpx 40rpx 0;
	}

	.login-form {
		width: 100%;
		max-width: 500rpx;
	}

	.input-group {
		margin-bottom: 40rpx;
	}

	.input-label {
		display: block;
		font-size: 28rpx;
		color: #333;
		margin-bottom: 12rpx;
	}

	.input {
		width: 100%;
		height: 80rpx;
		border: 1rpx solid #e8e8e8;
		border-radius: 8rpx;
		padding: 0 20rpx;
		font-size: 30rpx;
		background-color: #f8f8f8;
	}

	.placeholder {
		color: #999;
	}

	.login-btn {
		width: 100%;
		height: 80rpx;
		background-color: #007aff;
		color: #fff;
		font-size: 32rpx;
		border-radius: 8rpx;
		margin-top: 20rpx;
		margin-bottom: 30rpx;
	}

	.forgot-password {
		text-align: right;
		font-size: 26rpx;
		color: #007aff;
		margin-bottom: 30rpx;
	}

	.register-container {
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 26rpx;
		color: #666;
	}

	.register-link {
		color: #007aff;
		margin-left: 10rpx;
	}

	.password-input-container {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
	}

	.password-toggle {
		position: absolute;
		right: 20rpx;
		font-size: 32rpx;
		cursor: pointer;
		z-index: 1;
	}

	.password-group .input {
		padding-right: 60rpx;
	}
</style>
