<template>
	<view class="login-container">
		<view class="login-form">

			<!-- Logo -->
			<view class="logo-container">
				<image src="../../picture/logo.png" class="logo" mode="aspectFit"></image>
			</view>

			<view class="form-title">用户登录</view>

			<!-- 手机号 -->
			<view class="input-group">
				<text class="input-label">手机号</text>
				<input type="number" class="input" v-model="phone" placeholder="请输入手机号" />
			</view>

			<!-- 密码 -->
			<view class="input-group">
				<text class="input-label">密码</text>
				<view class="input-wrapper">
					<input :type="showPassword ? 'text' : 'password'" class="input" v-model="password" placeholder="请输入密码" />
					<image :src="showPassword ? '../../picture/eye.png' : '../../picture/闭眼睛.png'" class="eye-icon" @click="togglePassword"></image>
				</view>
			</view>

			<button class="login-btn" @click="login">登录</button>

			<view class="forgot-password" @click="forgotPassword">忘记密码</view>

			<view class="register-box">
				<text>还没有账号？</text>
				<text class="register-link" @click="register">立即注册</text>
			</view>

		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			phone: '',
			password: '',
			showPassword: false
		}
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
			uni.showToast({ title: '登录成功', icon: 'success' });

			uni.switchTab({
				url: '/pages/home/home'
			});
		},
		forgotPassword() {
			uni.showToast({ title: '忘记密码功能开发中', icon: 'none' });
		},
		togglePassword() {
			this.showPassword = !this.showPassword;
		},
		register() {
			uni.navigateTo({
				url: '/pages/register/register'
			});
		}
	}
}
</script>

<style>
/* ⭐关键：整个页面居中 */
.login-container {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	background-color: #333;
	padding: 40rpx;
	box-sizing: border-box;
}

/* 卡片 */
.login-form {
	width: 100%;
	max-width: 500rpx;
	background-color: #444;
	padding: 40rpx;
	border-radius: 20rpx;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.4);
}

/* logo */
.logo-container {
	display: flex;
	justify-content: center;
	margin-bottom: 20rpx;
}

.logo {
	width: 180rpx;
	height: 90rpx;
}

/* 标题 */
.form-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #fff;
	text-align: center;
	margin-bottom: 30rpx;
}

/* 输入区域 */
.input-group {
	margin-bottom: 30rpx;
}

.input-label {
	font-size: 26rpx;
	color: #ccc;
	margin-bottom: 10rpx;
	display: block;
}

.input {
	width: 100%;
	height: 80rpx;
	border: 1rpx solid #666;
	border-radius: 10rpx;
	padding: 0 20rpx;
	font-size: 30rpx;
	background-color: #555;
	color: #fff;
	box-sizing: border-box;
}

.input::placeholder {
	color: #999;
}

/* 密码眼睛 */
.input-wrapper {
	position: relative;
}

.eye-icon {
	width: 40rpx;
	height: 40rpx;
	position: absolute;
	right: 20rpx;
	top: 50%;
	transform: translateY(-50%);
}

/* 登录按钮 */
.login-btn {
	width: 100%;
	height: 80rpx;
	background-color: #666;
	color: #fff;
	font-size: 32rpx;
	border-radius: 10rpx;
	margin-top: 10rpx;
}

/* 忘记密码 */
.forgot-password {
	text-align: right;
	font-size: 24rpx;
	color: #aaa;
	margin-top: 15rpx;
}

/* 注册区域 */
.register-box {
	margin-top: 30rpx;
	text-align: center;
	font-size: 26rpx;
	color: #aaa;
}

.register-link {
	margin-left: 10rpx;
	color: #ccc;
}
</style>