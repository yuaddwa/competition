<template>
	<view class="auth-page">
		<view class="auth-bg" />
		<!-- 同 home：小程序原生 scroll-view 会盖住 fixed 自定义 Tab -->
		<view class="scroll">
			<view class="auth-card">
				<text class="brand">创建账号</text>
				<text class="sub">手机号注册；验证码用于防止机器批量注册（本地图形校验）</text>

				<view class="field">
					<text class="lab">手机号</text>
					<input class="inp" type="number" maxlength="11" v-model="phone" placeholder="请输入手机号" placeholder-class="ph" />
				</view>

				<view class="field captcha-field">
					<text class="lab">验证码</text>
					<view class="captcha-row">
						<input
							class="inp captcha-inp"
							v-model="inputCode"
							placeholder="请输入图中数字"
							placeholder-class="ph"
							maxlength="6"
						/>
						<view class="captcha-img-wrap" @click="drawCaptcha">
							<canvas canvas-id="captchaCanvas" class="captcha-canvas"></canvas>
						</view>
					</view>
					<text class="captcha-tip" @click="drawCaptcha">看不清？点击图片刷新</text>
				</view>

				<view class="field">
					<text class="lab">密码</text>
					<input class="inp" password v-model="password" placeholder="至少 6 位" placeholder-class="ph" />
				</view>

				<view class="field">
					<text class="lab">确认密码</text>
					<input class="inp" password v-model="confirmPassword" placeholder="再次输入密码" placeholder-class="ph" />
				</view>

				<button class="submit primary" type="primary" :loading="loading" @click="register">注册</button>

				<view class="foot">
					<text class="link" @click="goLogin">已有账号？去登录</text>
				</view>
			</view>
			<view class="bottom-pad" />
		</view>
		<!-- 非 Tab 页默认无底栏，挂上与主页一致的导航 -->
		<AppTabBar current="profile" />
	</view>
</template>

<script>
	import { setToken, setUserInfo } from "@/utils/index";
	import * as authApi from "@/api/authApi";
	import AppTabBar from "@/components/AppTabBar.vue";

	export default {
		components: { AppTabBar },
		data() {
			return {
				phone: "",
				password: "",
				confirmPassword: "",
				inputCode: "",
				realCode: "",
				loading: false,
				canvasWpx: 300,
				canvasHpx: 96,
			};
		},
		onReady() {
			this.$nextTick(() => {
				/* 与右侧验证码图同宽同高（见 .captcha-img-wrap） */
				this.canvasWpx = uni.upx2px(240);
				this.canvasHpx = uni.upx2px(92);
				this.drawCaptcha();
			});
		},
		methods: {
			generateCode() {
				let code = "";
				for (let i = 0; i < 4; i++) {
					code += Math.floor(Math.random() * 10);
				}
				this.realCode = code;
				return code;
			},
			drawCaptcha() {
				const code = this.generateCode();
				const ctx = uni.createCanvasContext("captchaCanvas", this);
				const W = this.canvasWpx || 300;
				const H = this.canvasHpx || 96;

				ctx.setFillStyle("#f1f5f9");
				ctx.fillRect(0, 0, W, H);

				const fontSize = Math.floor(H * 0.42);
				for (let i = 0; i < code.length; i++) {
					const x = W * 0.12 + (i * W) / 5.5;
					const y = H * 0.68;
					const deg = (Math.random() - 0.5) * 0.45;
					ctx.save();
					ctx.translate(x, y);
					ctx.rotate(deg);
					ctx.setFontSize(fontSize);
					ctx.setFillStyle(this.randomColor());
					ctx.fillText(code[i], 0, 0);
					ctx.restore();
				}

				for (let i = 0; i < 5; i++) {
					ctx.beginPath();
					ctx.moveTo(Math.random() * W, Math.random() * H);
					ctx.lineTo(Math.random() * W, Math.random() * H);
					ctx.setStrokeStyle(this.randomColor());
					ctx.stroke();
				}

				ctx.draw();
			},
			randomColor() {
				const r = Math.floor(Math.random() * 200);
				const g = Math.floor(Math.random() * 200);
				const b = Math.floor(Math.random() * 200);
				return `rgb(${r},${g},${b})`;
			},
			async register() {
				const phone = (this.phone || "").trim();
				if (!phone) {
					uni.showToast({ title: "请输入手机号", icon: "none" });
					return;
				}
				if (!this.inputCode || this.inputCode.trim() !== this.realCode) {
					uni.showToast({ title: "验证码错误", icon: "none" });
					this.drawCaptcha();
					return;
				}
				if (!this.password || this.password.length < 6) {
					uni.showToast({ title: "密码至少 6 位", icon: "none" });
					return;
				}
				if (this.password !== this.confirmPassword) {
					uni.showToast({ title: "两次密码不一致", icon: "none" });
					return;
				}

				this.loading = true;
				try {
					const { token, user } = await authApi.register({
						phone,
						password: this.password,
					});
					if (token) {
						setToken(token);
						setUserInfo(user || { phone });
						uni.showToast({ title: "注册成功", icon: "success" });
						setTimeout(() => {
							/* 登录页 often 用 redirectTo 打开注册，栈里可能没有上一页，navigateBack 易失败；
							   进入 Tab 页必须用 switchTab，比 reLaunch 更稳 */
							uni.switchTab({
								url: "/pages/profile/profile",
								fail: () => {
									uni.reLaunch({ url: "/pages/profile/profile" });
								},
							});
						}, 400);
					} else {
						uni.showToast({ title: "注册成功，请登录", icon: "success" });
						setTimeout(() => {
							uni.redirectTo({ url: "/pages/login/login" });
						}, 500);
					}
				} catch {
					this.drawCaptcha();
				} finally {
					this.loading = false;
				}
			},
			goLogin() {
				uni.redirectTo({ url: "/pages/login/login" });
			},
		},
	};
</script>

<style scoped>
	.auth-page {
		min-height: 100vh;
		position: relative;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	.auth-bg {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		height: 400rpx;
		background: linear-gradient(165deg, #6366f1 0%, #8b5cf6 55%, #a855f7 100%);
		border-radius: 0 0 48rpx 48rpx;
		z-index: 0;
	}

	.scroll {
		position: relative;
		z-index: 1;
		flex: 1;
		min-height: 0;
		padding: 36rpx 32rpx 40rpx;
		box-sizing: border-box;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}

	.auth-card {
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
	}

	.sub {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.5;
		margin-bottom: 36rpx;
	}

	.field {
		margin-bottom: 28rpx;
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

	.ph {
		color: #94a3b8;
	}

	.captcha-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 16rpx;
	}

	.captcha-row .inp {
		flex: 1;
		min-width: 0;
		width: auto;
	}

	.captcha-img-wrap {
		flex-shrink: 0;
		width: 240rpx;
		height: 92rpx;
		border-radius: 16rpx;
		border: 2rpx solid #e2e8f0;
		background: #f8fafc;
		overflow: hidden;
	}

	.captcha-canvas {
		display: block;
		width: 240rpx;
		height: 92rpx;
	}

	.captcha-tip {
		display: block;
		text-align: center;
		font-size: 24rpx;
		color: #64748b;
		margin-top: 12rpx;
	}

	.submit {
		width: 100%;
		height: 96rpx;
		line-height: 96rpx;
		border-radius: 48rpx;
		font-size: 32rpx;
		font-weight: 700;
		margin-top: 12rpx;
		border: none;
		background: linear-gradient(135deg, #6366f1, #9333ea) !important;
		box-shadow: 0 16rpx 36rpx rgba(99, 102, 241, 0.35);
	}

	.submit::after {
		border: none;
	}

	.foot {
		margin-top: 36rpx;
		text-align: center;
	}

	.link {
		font-size: 28rpx;
		color: #6366f1;
		font-weight: 600;
	}

	.bottom-pad {
		height: 200rpx;
		padding-bottom: env(safe-area-inset-bottom);
		box-sizing: border-box;
	}
</style>

<style>
	/* placeholder-class 需全局 */
	.ph {
		color: #94a3b8;
	}
</style>
