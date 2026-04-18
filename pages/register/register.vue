<template>
	<view class="register-container">
		<view class="register-form">
			<view class="logo-container">
				<image src="../../picture/logo.png" class="logo" mode="aspectFit"></image>
			</view>
			<view class="form-title">用户注册</view>

			<view class="input-group">
				<text class="input-label">手机号</text>
				<view class="input-wrapper">
					<input class="input" v-model="phone" placeholder="请输入手机号" />
				</view>
			</view>

			<view class="input-group">
				<text class="input-label">密码</text>
				<view class="input-wrapper">
					<input :type="showPassword ? 'text' : 'password'" class="input" v-model="password" placeholder="请输入密码" />
					<image :src="showPassword ? '../../picture/eye.png' : '../../picture/闭眼睛.png'" class="eye-icon" @click="togglePassword"></image>
				</view>
			</view>

			<view class="input-group">
				<text class="input-label">确认密码</text>
				<view class="input-wrapper">
					<input :type="showConfirmPassword ? 'text' : 'password'" class="input" v-model="confirmPassword" placeholder="请再次输入密码" />
					<image :src="showConfirmPassword ? '../../picture/eye.png' : '../../picture/闭眼睛.png'" class="eye-icon" @click="toggleConfirmPassword"></image>
				</view>
			</view>

			<view class="input-group">
				<text class="input-label">验证码</text>
				<view class="code-wrapper">
					<input class="code-input" v-model="inputCode" placeholder="请输入验证码" />
					<canvas 
							canvas-id="captchaCanvas"
							id="captchaCanvas"
							class="captcha"
							@click="drawCaptcha"
						></canvas>
				</view>
				<text class="tips">看不清？点击图片刷新</text>
			</view>

			<button class="register-btn" @click="register">注册</button>

			<view class="back-login" @click="goLogin">
				返回登录
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
			confirmPassword: '',
			inputCode: '',
			realCode: '',
			showPassword: false,
			showConfirmPassword: false
		}
	},

	onReady() {
		this.drawCaptcha();
	},

	methods: {
		// 生成验证码
		generateCode() {
			let code = '';
			for (let i = 0; i < 4; i++) {
				code += Math.floor(Math.random() * 10);
			}
			this.realCode = code;
			console.log("当前验证码:", code);
			return code;
		},

		// 画验证码
		drawCaptcha() {
			const ctx = uni.createCanvasContext('captchaCanvas', this);
			const code = this.generateCode();
			
			const canvasWidth = 160;
			const canvasHeight = 80;

			// 背景
			ctx.setFillStyle('#555555');
			ctx.fillRect(0, 0, canvasWidth, canvasHeight);

			// 文字
						for (let i = 0; i < code.length; i++) {
							let x = 2 + i * 20;
							let y = 30;
							let deg = (Math.random() - 0.5) * 0.4;

							ctx.save();
							ctx.translate(x, y);
							ctx.rotate(deg);
							ctx.setFontSize(20);
							ctx.setFillStyle('#ffffff');
							ctx.fillText(code[i], 0, 0);
							ctx.restore();
						}

			// 干扰线
			for (let i = 0; i < 5; i++) {
				ctx.beginPath();
				ctx.moveTo(Math.random() * canvasWidth, Math.random() * canvasHeight);
				ctx.lineTo(Math.random() * canvasWidth, Math.random() * canvasHeight);
				ctx.setStrokeStyle('#ffffff');
				ctx.stroke();
			}

			ctx.draw();
		},

		// 注册
		register() {
			if (!this.phone) {
				uni.showToast({ title: '请输入手机号', icon: 'none' });
				return;
			}
			if (!this.inputCode) {
				uni.showToast({ title: '请输入验证码', icon: 'none' });
				return;
			}
			if (this.inputCode.trim() !== this.realCode) {
				uni.showToast({ title: '验证码错误', icon: 'none' });
				this.drawCaptcha();
				return;
			}
			if (!this.password) {
				uni.showToast({ title: '请输入密码', icon: 'none' });
				return;
			}
			if (this.password !== this.confirmPassword) {
				uni.showToast({ title: '两次密码不一致', icon: 'none' });
				return;
			}

			uni.showToast({ title: '注册成功', icon: 'success' });
			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
		},

		togglePassword() {
			this.showPassword = !this.showPassword;
		},
		toggleConfirmPassword() {
			this.showConfirmPassword = !this.showConfirmPassword;
		},
		goLogin() {
				uni.navigateBack();
			}
	}
}
</script>

<style>
.register-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 150rpx 40rpx 0;
	background-color: #333333;
	min-height: 100vh;
}

.register-form {
	width: 100%;
	max-width: 500rpx;
	background-color: #444444;
	padding: 40rpx;
	border-radius: 12rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
}

.logo-container {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 30rpx;
}

.logo {
	width: 200rpx;
	height: 100rpx;
}

.form-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #ffffff;
	text-align: center;
	margin-bottom: 40rpx;
}

.input-group {
	margin-bottom: 40rpx;
}

.input-label {
	display: block;
	font-size: 28rpx;
	color: #cccccc;
	margin-bottom: 12rpx;
}

.input {
	width: 100%;
	height: 80rpx;
	border: 1rpx solid #666666;
	border-radius: 8rpx;
	padding: 0 20rpx;
	font-size: 30rpx;
	background-color: #555555;
	color: #ffffff;
}

.input::placeholder {
	color: #999999;
}

.input-wrapper {
	display: flex;
	align-items: center;
	position: relative;
}

.eye-icon {
	width: 40rpx;
	height: 40rpx;
	position: absolute;
	right: 20rpx;
	cursor: pointer;
}

.code-wrapper {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.code-input {
	flex: 1;
	height: 80rpx;
	border: 1rpx solid #666666;
	border-radius: 8rpx;
	padding: 0 20rpx;
	font-size: 30rpx;
	background-color: #555555;
	color: #ffffff;
}

.code-input::placeholder {
	color: #999999;
}

/* 这里统一高度 */
.captcha {
	width: 160rpx;
	height: 80rpx;
	background-color: #555555;
	border-radius: 8rpx;
	border: 1rpx solid #666666;
}

.tips {
	font-size: 24rpx;
	color: #999999;
	margin-top: 10rpx;
	text-align: center;
}

.register-btn {
	width: 100%;
	height: 80rpx;
	background-color: #666666;
	color: #ffffff;
	font-size: 32rpx;
	border-radius: 8rpx;
	margin-top: 20rpx;
	border: none;
}

.register-btn:hover {
	background-color: #555555;
}

.back-login {
	text-align: center;
	font-size: 26rpx;
	color: #999999;
	margin-top: 30rpx;
}

.back-login:hover {
	color: #cccccc;
}
</style>