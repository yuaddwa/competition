<template>
	<view class="page-root">
		<view class="navbar-wrap" :style="{ paddingTop: statusBarPx + 'px' }">
			<view class="navbar">
				<view class="navbar-side" />
				<view class="navbar-center">
					<text class="navbar-title">{{ t('hq_group') }}</text>
					<text class="navbar-sub">{{ t('hq_subtitle', { count: agentCount }) }}</text>
				</view>
				<view class="navbar-side navbar-side-right" @click="openHallSettings">
					<text class="navbar-more">⋯</text>
				</view>
			</view>
		</view>

		<scroll-view scroll-y class="chat-scroll" :scroll-into-view="scrollToId" scroll-with-animation>
			<view v-if="loading" class="chat-empty"><text>{{ t('loading') }}</text></view>
			<view v-else class="chat-inner">
				<view
					v-for="msg in hallMessages"
					:key="msg.id"
					:id="'m-' + msg.id"
					class="hall-row"
					:class="{ 'is-mine': msg.isMine }"
				>
					<view v-if="!msg.isMine" class="hall-left">
						<view class="hall-av" :style="{ background: avatarColor(msg.senderName || '') }">
							<text class="hall-av-t">{{ avatarLetter(msg) }}</text>
						</view>
						<view class="hall-bubble-wrap">
							<text v-if="msg.senderName" class="hall-name">{{ hallSenderLabel(msg.senderName) }}</text>
							<view class="hall-bubble" :class="{ manager: msg.isManager }">
								<text class="hall-text">{{ msg.content }}</text>
							</view>
							<text class="hall-time">{{ formatTime(msg.time) }}</text>
						</view>
					</view>
					<view v-else class="hall-right">
						<view class="hall-bubble mine">
							<text class="hall-text">{{ msg.content }}</text>
						</view>
						<text class="hall-time">{{ formatTime(msg.time) }}</text>
					</view>
				</view>
			</view>
			<view id="bottom-anchor" class="bottom-anchor" />
		</scroll-view>

		<view class="chat-input">
			<input type="text" v-model="inputText" class="input-field" :placeholder="t('send_message')" placeholder-class="iph" />
			<view class="send-button" @click="sendHall">{{ t('send') }}</view>
		</view>

		<!-- 偏好设置入口 -->
		<view class="preferences-entry">
			<view class="entry-content">
				<view class="entry-header">
					<text class="entry-title">AI团队偏好设置</text>
					<view class="entry-action" @click="goToPreferences">
						<text class="action-text">去设置</text>
						<text class="action-arrow">›</text>
					</view>
				</view>
				<text class="entry-subtitle">设置你的公司偏好，让AI员工更好地为你服务</text>
			</view>
		</view>

		<AppTabBar current="home" />
	</view>
</template>

<script>
	import AppTabBar from "@/components/AppTabBar.vue";
	import { t, getLanguage } from "@/utils/lang";
	import {
		loadHQChatMessages,
		appendHQMessage,
		ensureHallWelcome,
		ensureHallDailyDigest,
		loadDigitalAgents,
		resolveHallSenderDisplay,
		HQ_ID,
	} from "@/utils/virtualTeamStore";

	export default {
		components: { AppTabBar },
		data() {
			return {
				statusBarPx: 20,
				hallMessages: [],
				loading: true,
				inputText: "",
				scrollToId: "",
			};
		},
		computed: {
			agentCount() {
				return loadDigitalAgents().length;
			},
		},
		onLoad() {
			const sys = uni.getSystemInfoSync();
			this.statusBarPx = sys.statusBarHeight || 20;
			uni.hideTabBar({ animation: false });
		},
		onShow() {
			uni.hideTabBar({ animation: false });
			this.bootstrapHall();
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			goToPreferences() {
				// 跳转到偏好设置页面
				uni.navigateTo({
					url: "/pages/preferences/preferences"
				});
			},
			openHallSettings() {
				uni.navigateTo({
					url: `/pages/chat/chat-settings?mode=virtual&kind=hq&id=${encodeURIComponent(HQ_ID)}&title=${encodeURIComponent(this.t('hq_group'))}`,
				});
			},
			bootstrapHall() {
				this.loading = true;
				try {
					ensureHallWelcome();
					ensureHallDailyDigest();
					this.hallMessages = loadHQChatMessages();
					this.$nextTick(() => {
						this.scrollToBottom();
					});
				} finally {
					this.loading = false;
				}
			},
			scrollToBottom() {
				this.scrollToId = "bottom-anchor";
			},
			sendHall() {
				const t = (this.inputText || "").trim();
				if (!t) return;
				appendHQMessage({ content: t, isMine: true, senderName: this.t("home_sender_me") });
				this.inputText = "";
				this.hallMessages = loadHQChatMessages();
				this.$nextTick(() => this.scrollToBottom());
			},
			avatarColor(name) {
				const colors = ["#07c160", "#10aeff", "#576b95", "#fa9d3b", "#1485ee", "#9a6bff"];
				let h = 0;
				const s = String(name || "");
				for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
				return colors[h % colors.length];
			},
			hallSenderLabel(raw) {
				return resolveHallSenderDisplay(raw);
			},
			avatarLetter(msg) {
				const lang = getLanguage();
				const fallback = t("profile_agent_char_fallback", lang);
				const raw = (msg.senderName || "").trim() || fallback;
				const shown = resolveHallSenderDisplay(raw);
				return shown.slice(0, 1);
			},
			formatTime(time) {
				const date = new Date(time);
				if (Number.isNaN(date.getTime())) return "";
				const h = date.getHours().toString().padStart(2, "0");
				const m = date.getMinutes().toString().padStart(2, "0");
				return `${h}:${m}`;
			},
		},
	};
</script>

<style>
	.page-root {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #ededed;
		box-sizing: border-box;
	}

	.navbar-wrap {
		background: #ededed;
		flex-shrink: 0;
		border-bottom: 1rpx solid #d9d9d9;
	}

	.navbar {
		min-height: 88rpx;
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 8rpx 16rpx 12rpx;
	}

	.navbar-side {
		width: 24rpx;
		min-width: 56rpx;
	}

	.navbar-side-right {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.navbar-more {
		font-size: 44rpx;
		font-weight: 600;
		color: #111;
		padding: 8rpx 8rpx 8rpx 16rpx;
		line-height: 1;
	}

	.navbar-center {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.navbar-title {
		font-size: 34rpx;
		font-weight: 600;
		color: #000;
	}

	.navbar-sub {
		font-size: 22rpx;
		color: #888;
		margin-top: 4rpx;
		text-align: center;
		line-height: 1.35;
	}

	.chat-scroll {
		flex: 1;
		height: 0;
	}

	.chat-inner {
		padding: 20rpx 24rpx 24rpx;
	}

	.chat-empty {
		padding: 80rpx;
		text-align: center;
		color: #999;
		font-size: 28rpx;
	}

	.hall-row {
		margin-bottom: 28rpx;
	}

	.hall-row.is-mine {
		display: flex;
		justify-content: flex-end;
	}

	.hall-left {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
	}

	.hall-av {
		width: 72rpx;
		height: 72rpx;
		border-radius: 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
		flex-shrink: 0;
	}

	.hall-av-t {
		font-size: 28rpx;
		font-weight: 600;
		color: #fff;
	}

	.hall-bubble-wrap {
		max-width: 75%;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.hall-name {
		font-size: 22rpx;
		color: #888;
		margin-bottom: 6rpx;
	}

	.hall-bubble {
		background: #fff;
		padding: 16rpx 20rpx;
		border-radius: 12rpx;
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.06);
	}

	.hall-bubble.manager {
		background: #e8f5e9;
		border: 1rpx solid #c8e6c9;
	}

	.hall-bubble.mine {
		background: #95ec69;
	}

	.hall-text {
		font-size: 28rpx;
		color: #191919;
		line-height: 1.55;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.hall-bubble.mine .hall-text {
		color: #191919;
	}

	.hall-time {
		font-size: 20rpx;
		color: #b2b2b2;
		margin-top: 8rpx;
	}

	.hall-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		max-width: 85%;
		margin-left: auto;
	}

	.bottom-anchor {
		height: 2rpx;
	}

	.chat-input {
		min-height: 100rpx;
		padding-bottom: env(safe-area-inset-bottom);
		background: #f7f7f7;
		border-top: 1rpx solid #dcdcdc;
		display: flex;
		align-items: center;
		padding: 16rpx 24rpx;
		gap: 16rpx;
		flex-shrink: 0;
		box-sizing: border-box;
	}

	.input-field {
		flex: 1;
		height: 72rpx;
		background: #fff;
		border-radius: 12rpx;
		padding: 0 24rpx;
		font-size: 28rpx;
	}

	.iph {
		color: #bbb;
	}

	.send-button {
		padding: 16rpx 28rpx;
		background: #07c160;
		color: #fff;
		border-radius: 12rpx;
		font-size: 28rpx;
		font-weight: 600;
	}

	/* 偏好设置提示样式 */
	.preferences-hint {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
	}

	.hint-content {
		background: #fff;
		border-radius: 24rpx 24rpx 0 0;
		padding: 32rpx;
		width: 100%;
		max-width: 600rpx;
	}

	.hint-title {
		display: block;
		font-size: 34rpx;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 12rpx;
		text-align: center;
	}

	.hint-text {
		display: block;
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.5;
		margin-bottom: 32rpx;
		text-align: center;
	}

	.hint-buttons {
		display: flex;
		flex-direction: row;
		gap: 16rpx;
	}

	.hint-btn {
		flex: 1;
		height: 88rpx;
		line-height: 88rpx;
		border-radius: 44rpx;
		font-size: 28rpx;
		font-weight: 600;
		text-align: center;
	}

	.hint-btn.cancel {
		background: #f1f5f9;
		color: #64748b;
	}

	/* 偏好设置入口样式 */
	.preferences-entry {
		background: #fff;
		border-top: 1rpx solid #e2e8f0;
		padding: 24rpx 32rpx;
		flex-shrink: 0;
	}

	.entry-content {
	}

	.entry-header {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8rpx;
	}

	.entry-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #0f172a;
	}

	.entry-action {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 4rpx;
	}

	.action-text {
		font-size: 24rpx;
		color: #6366f1;
		font-weight: 600;
	}

	.action-arrow {
		font-size: 32rpx;
		color: #6366f1;
		font-weight: 300;
	}

	.entry-subtitle {
		font-size: 22rpx;
		color: #64748b;
		line-height: 1.4;
	}
</style>
