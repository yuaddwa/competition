<template>
	<view class="page">
		<view class="card">
			<view class="head">
				<view class="avatar-wrap">
					<text class="avatar-text">{{ avatarChar }}</text>
				</view>
				<view class="head-main">
					<text class="name">{{ displayName }}</text>
					<text class="sub">{{ phoneText }}</text>
				</view>
			</view>

			<view class="group">
				<view class="row row-border">
					<text class="lab">昵称</text>
					<input
						class="nick-input"
						v-model.trim="nickname"
						maxlength="20"
						placeholder="请输入昵称"
						placeholder-class="ph"
					/>
				</view>
				<view class="row row-border">
					<text class="lab">手机号</text>
					<text class="val">{{ user.phone || user.mobile || "-" }}</text>
				</view>
			</view>
			<button class="btn" type="primary" @click="saveNickname">保存昵称</button>
		</view>
	</view>
</template>

<script>
import { getToken, getUserInfo, setUserInfo } from "@/utils/index";

export default {
	data() {
		return {
			user: {},
			nickname: "",
		};
	},
	computed: {
		displayName() {
			const n = this.nickname || this.user.nickname || this.user.name || this.user.username || "我的资料";
			return n;
		},
		avatarChar() {
			return this.displayName && this.displayName.length ? this.displayName.slice(0, 1) : "我";
		},
		phoneText() {
			const p = this.user.phone || this.user.mobile || "";
			if (!p || String(p).length < 7) return "请完善手机号";
			const s = String(p);
			return `${s.slice(0, 3)}****${s.slice(-4)}`;
		},
	},
	onShow() {
		if (!getToken()) {
			uni.showToast({ title: "请先登录", icon: "none" });
			setTimeout(() => {
				uni.redirectTo({ url: "/pages/login/login" });
			}, 400);
			return;
		}
		this.user = getUserInfo() || {};
		this.nickname = this.user.nickname || "";
	},
	methods: {
		saveNickname() {
			const nextNickname = (this.nickname || "").trim();
			if (!nextNickname) {
				uni.showToast({ title: "昵称不能为空", icon: "none" });
				return;
			}
			if (nextNickname.length > 20) {
				uni.showToast({ title: "昵称最多 20 字", icon: "none" });
				return;
			}
			this.user = {
				...this.user,
				nickname: nextNickname,
			};
			setUserInfo(this.user);
			uni.showToast({ title: "昵称已保存", icon: "success" });
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
	padding: 30rpx;
	box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
	border: 1rpx solid #e2e8f0;
}

.head {
	display: flex;
	flex-direction: row;
	align-items: center;
	padding-bottom: 24rpx;
	border-bottom: 1rpx solid #e2e8f0;
	margin-bottom: 16rpx;
}

.avatar-wrap {
	width: 96rpx;
	height: 96rpx;
	border-radius: 14rpx;
	background: linear-gradient(135deg, #2563eb, #7c3aed);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.avatar-text {
	font-size: 40rpx;
	font-weight: 700;
	color: #fff;
}

.head-main {
	margin-left: 22rpx;
	min-width: 0;
}

.name {
	display: block;
	font-size: 34rpx;
	font-weight: 700;
	color: #0f172a;
	line-height: 1.3;
}

.sub {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #64748b;
}

.group {
	background: #fff;
}

.row {
	min-height: 92rpx;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
}

.row-border {
	border-bottom: 1rpx solid #e2e8f0;
}

.lab {
	font-size: 28rpx;
	color: #475569;
}

.val {
	max-width: 66%;
	text-align: right;
	font-size: 28rpx;
	color: #0f172a;
	word-break: break-all;
}

.nick-input {
	width: 66%;
	height: 64rpx;
	text-align: right;
	font-size: 28rpx;
	color: #0f172a;
}

.ph {
	color: #94a3b8;
}

.btn {
	margin-top: 28rpx;
	height: 86rpx;
	line-height: 86rpx;
	border: none;
	border-radius: 43rpx;
	font-size: 30rpx;
	font-weight: 700;
	background: linear-gradient(135deg, #2563eb, #7c3aed) !important;
}

.btn::after {
	border: none;
}
</style>
