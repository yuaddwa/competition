<template>
	<view class="register-container">
		<view class="register-form">

			<view class="input-group">
				<text class="input-label">手机号</text>
				<input class="input" v-model="phone" placeholder="请输入手机号" />
			</view>

			<view class="input-group">
				<text class="input-label">验证码</text>
				<view class="code-container">
					<input class="input code-input" v-model="inputCode" placeholder="请输入验证码" />

					<canvas 
						canvas-id="captchaCanvas"
						class="captcha"
						style="width:200px;height:80px;"
						@click="drawCaptcha"
					></canvas>
				</view>
				<text class="tips">看不清？点击图片刷新</text>
			</view>

			<view class="input-group">
				<text class="input-label">密码</text>
				<input type="password" class="input" v-model="password" placeholder="请输入密码" />
			</view>

			<view class="input-group">
				<text class="input-label">确认密码</text>
				<input type="password" class="input" v-model="confirmPassword" placeholder="请再次输入密码" />
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
			realCode: ''
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
			console.log("当前验证码:", code); // 调试用
			return code;
		},

		// 画验证码（已修复尺寸问题）
		drawCaptcha() {
			const ctx = uni.createCanvasContext('captchaCanvas', this);
			const code = this.generateCode();

			ctx.setFillStyle('#f2f2f2');
			ctx.fillRect(0, 0, 200, 80);

			for (let i = 0; i < code.length; i++) {
				let x = 20 + i * 40;
				let y = 50;
				let deg = (Math.random() - 0.5) * 0.5;

				ctx.save();
				ctx.translate(x, y);
				ctx.rotate(deg);

				ctx.setFontSize(32);
				ctx.setFillStyle(this.randomColor());
				ctx.fillText(code[i], 0, 0);

				ctx.restore();
			}

			// 干扰线
			for (let i = 0; i < 5; i++) {
				ctx.beginPath();
				ctx.moveTo(Math.random() * 200, Math.random() * 80);
				ctx.lineTo(Math.random() * 200, Math.random() * 80);
				ctx.setStrokeStyle(this.randomColor());
				ctx.stroke();
			}

			ctx.draw();
		},

		randomColor() {
			return `rgb(${Math.random()*255},${Math.random()*255},${Math.random()*255})`;
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

			// ⭐ 已修复：trim 防空格
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
}

.register-form {
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

.code-container {
	display: flex;
	align-items: center;
}

.code-input {
	flex: 1;
}

.captcha {
	width: 200px;
	height: 80px;
	margin-left: 10px;
	background-color: #f2f2f2;
	border-radius: 8rpx;
}

.tips {
	font-size: 24rpx;
	color: #999;
	margin-top: 10rpx;
}

.register-btn {
	width: 100%;
	height: 80rpx;
	background-color: #007aff;
	color: #fff;
	font-size: 32rpx;
	border-radius: 8rpx;
	margin-top: 20rpx;
}

.back-login {
	text-align: center;
	font-size: 26rpx;
	color: #007aff;
	margin-top: 30rpx;
}
</style>