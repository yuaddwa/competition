<template>
	<view class="page">
		<view v-if="mode === 'virtual' && kind === 'group' && groupDetail" class="hero">
			<text class="hero-title">{{ groupDetail.name }}</text>
			<text class="hero-desc">{{ groupDetail.desc || "暂无简介" }}</text>
			<text v-if="groupDetail.clientName" class="hero-meta">客户：{{ groupDetail.clientName }}</text>
			<text v-if="groupDetail.deadline" class="hero-meta">交付：{{ groupDetail.deadline }}</text>
		</view>

		<view v-else-if="mode === 'virtual' && kind === 'agent' && agentDetail" class="hero">
			<text class="hero-title">{{ agentDetail.name }}</text>
			<text class="hero-desc">{{ agentDetail.role || "数字员工" }}</text>
			<text class="hero-meta">一对一工作沟通</text>
		</view>

		<view v-else-if="mode === 'virtual' && kind === 'hq'" class="hero">
			<text class="hero-title">{{ pageTitle }}</text>
			<text class="hero-desc">全员大群 · 日报与经理总览</text>
		</view>

		<view v-else-if="mode === 'virtual' && kind === 'manager'" class="hero">
			<text class="hero-title">{{ pageTitle }}</text>
			<text class="hero-desc">每日 21:30 推送总览 · 可与系统留痕沟通</text>
		</view>

		<view v-else-if="mode === 'virtual' && kind === 'persona'" class="hero">
			<text class="hero-title">{{ pageTitle }}</text>
			<text class="hero-desc">人格对话 · 本地演示（未接大模型）</text>
		</view>

		<view v-else-if="mode === 'remote'" class="hero">
			<text class="hero-title">{{ pageTitle }}</text>
			<text class="hero-desc">工作流沟通线程</text>
			<text class="hero-meta mono">工作流编号：{{ workflowId }}</text>
		</view>

		<view v-else class="hero">
			<text class="hero-title">{{ pageTitle }}</text>
			<text class="hero-desc">本地会话</text>
		</view>

		<view class="group">
			<view class="cell" hover-class="cell-hover" @click="goSearch">
				<text class="cell-main">查找聊天记录</text>
				<text class="cell-arrow">›</text>
			</view>
			<view v-if="showGroupManage" class="cell" hover-class="cell-hover" @click="openGroupManage">
				<text class="cell-main">群管理</text>
				<text class="cell-arrow">›</text>
			</view>
			<view v-if="showGroupManage" class="cell" hover-class="cell-hover" @click="openGroupNotice">
				<text class="cell-main">群公告</text>
				<text class="cell-arrow">›</text>
			</view>
		</view>

		<view class="group">
			<view class="cell cell-row">
				<text class="cell-main">置顶聊天</text>
				<switch :checked="pinned" color="#07c160" @change="onPinChange" />
			</view>
			<view class="cell cell-row">
				<text class="cell-main">消息免打扰</text>
				<switch :checked="muted" color="#07c160" @change="onMuteChange" />
			</view>
		</view>

		<view class="group">
			<view class="cell cell-danger" hover-class="cell-hover" @click="confirmClear">
				<text class="cell-main">清空聊天记录</text>
			</view>
		</view>

		<text v-if="mode === 'remote'" class="foot-tip">工作流会话正文在服务端保存；本页清空仅影响本机已拉取列表的展示缓存。</text>
	</view>
</template>

<script>
	import {
		clearVirtualChatMessages,
		getProjectGroupById,
		getDigitalAgentById,
		touchGroupLastMsg,
		touchAgentLastMsg,
		markAgentChatCleared,
		loadDigitalAgents,
	} from "@/utils/virtualTeamStore";
	import { clearLocalProjectChat } from "@/utils/messageUtils";

	function storageSessionKey(vm) {
		if (vm.mode === "virtual") return `v_${vm.kind}_${vm.id}`;
		if (vm.mode === "remote") return `r_${vm.workflowId}_${vm.threadId}`;
		return `l_${vm.projectName}`;
	}

	export default {
		data() {
			return {
				mode: "local",
				kind: "",
				id: "",
				pageTitle: "聊天信息",
				workflowId: "",
				threadId: "",
				workflowTitle: "",
				threadTitle: "",
				projectName: "",
				groupDetail: null,
				agentDetail: null,
				pinned: false,
				muted: false,
			};
		},
		computed: {
			showGroupManage() {
				return this.mode === "virtual" && (this.kind === "group" || this.kind === "hq");
			},
		},
		onLoad(options) {
			this.mode = (options && options.mode) || "local";
			if (this.mode === "virtual") {
				this.kind = options.kind ? decodeURIComponent(options.kind) : "";
				this.id = options.id ? decodeURIComponent(options.id) : "";
				this.pageTitle = options.title ? decodeURIComponent(options.title) : "聊天信息";
				if (this.kind === "group" && this.id) {
					this.groupDetail = getProjectGroupById(this.id);
				}
				if (this.kind === "agent" && this.id) {
					this.agentDetail = getDigitalAgentById(this.id);
				}
			} else if (this.mode === "remote") {
				this.workflowId = options.workflowId ? decodeURIComponent(options.workflowId) : "";
				this.threadId = options.threadId ? decodeURIComponent(options.threadId) : "";
				this.workflowTitle = options.workflowTitle ? decodeURIComponent(options.workflowTitle) : "";
				this.threadTitle = options.threadTitle ? decodeURIComponent(options.threadTitle) : "";
				const a = (this.workflowTitle || "").trim();
				const b = (this.threadTitle || "").trim();
				this.pageTitle = a && b ? `${a} · ${b}` : a || b || "工作流沟通";
			} else {
				this.projectName = options.projectName ? decodeURIComponent(options.projectName) : "";
				this.pageTitle = this.projectName || "聊天信息";
			}
			this.loadPrefs();
		},
		methods: {
			loadPrefs() {
				const key = storageSessionKey(this);
				this.pinned = uni.getStorageSync(`chat_pin_${key}`) === "1";
				this.muted = uni.getStorageSync(`chat_mute_${key}`) === "1";
			},
			savePin() {
				const key = storageSessionKey(this);
				if (this.pinned) uni.setStorageSync(`chat_pin_${key}`, "1");
				else uni.removeStorageSync(`chat_pin_${key}`);
			},
			saveMute() {
				const key = storageSessionKey(this);
				if (this.muted) uni.setStorageSync(`chat_mute_${key}`, "1");
				else uni.removeStorageSync(`chat_mute_${key}`);
			},
			onPinChange(e) {
				this.pinned = !!(e.detail && e.detail.value);
				this.savePin();
			},
			onMuteChange(e) {
				this.muted = !!(e.detail && e.detail.value);
				this.saveMute();
			},
			buildSearchQuery() {
				const p = [];
				p.push(`mode=${encodeURIComponent(this.mode)}`);
				if (this.mode === "virtual") {
					p.push(`kind=${encodeURIComponent(this.kind)}`);
					p.push(`id=${encodeURIComponent(this.id)}`);
					p.push(`title=${encodeURIComponent(this.pageTitle)}`);
				} else if (this.mode === "remote") {
					p.push(`workflowId=${encodeURIComponent(this.workflowId)}`);
					p.push(`threadId=${encodeURIComponent(this.threadId)}`);
					p.push(`workflowTitle=${encodeURIComponent(this.workflowTitle)}`);
					p.push(`threadTitle=${encodeURIComponent(this.threadTitle)}`);
				} else {
					p.push(`projectName=${encodeURIComponent(this.projectName)}`);
				}
				return p.join("&");
			},
			goSearch() {
				uni.navigateTo({ url: `/pages/chat/chat-search?${this.buildSearchQuery()}` });
			},
			openGroupManage() {
				const agents = loadDigitalAgents();
				const lines = agents.map((a) => `· ${a.name}（${a.role}）`).join("\n");
				if (this.kind === "hq") {
					uni.showModal({
						title: "群管理",
						content: `全员群 · 共 ${agents.length} 位数字员工\n${lines || "暂无成员"}`,
						showCancel: false,
					});
					return;
				}
				const g = this.groupDetail;
				const head = g ? `「${g.name}」协作成员\n` : "协作成员\n";
				uni.showModal({
					title: "群管理",
					content: `${head}${lines || "暂无成员"}`,
					showCancel: false,
				});
			},
			openGroupNotice() {
				if (this.kind === "hq") {
					uni.showModal({
						title: "群公告",
						content: "每日 21:00 各员工提交日报，21:30 经理总览推送至本群。",
						showCancel: false,
					});
					return;
				}
				const g = this.groupDetail;
				const notice = g && g.desc ? g.desc : "暂无群公告。可在「创建项目群」时填写项目说明，或后续在管理后台维护。";
				uni.showModal({ title: "群公告", content: notice, showCancel: false });
			},
			confirmClear() {
				uni.showModal({
					title: "清空聊天记录",
					content: "将删除本机该会话的聊天内容，是否继续？",
					success: (res) => {
						if (res.confirm) this.doClear();
					},
				});
			},
			doClear() {
				if (this.mode === "virtual") {
					clearVirtualChatMessages(this.kind, this.id);
					if (this.kind === "group") touchGroupLastMsg(this.id, "暂无消息");
					if (this.kind === "agent") {
						markAgentChatCleared(this.id);
						touchAgentLastMsg(this.id, "暂无消息");
					}
				} else if (this.mode === "local") {
					clearLocalProjectChat(this.projectName);
				} else {
					uni.showToast({ title: "已清除本机展示缓存", icon: "none" });
					uni.navigateBack();
					return;
				}
				uni.showToast({ title: "已清空", icon: "success" });
				setTimeout(() => uni.navigateBack(), 400);
			},
		},
	};
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: #ededed;
		padding: 24rpx 0 48rpx;
		box-sizing: border-box;
	}

	.hero {
		background: #fff;
		margin: 0 0 24rpx;
		padding: 40rpx 32rpx 36rpx;
		border-top: 1rpx solid #e5e5e5;
		border-bottom: 1rpx solid #e5e5e5;
	}

	.hero-title {
		display: block;
		font-size: 40rpx;
		font-weight: 600;
		color: #111;
		margin-bottom: 12rpx;
	}

	.hero-desc {
		display: block;
		font-size: 28rpx;
		color: #666;
		line-height: 1.5;
	}

	.hero-meta {
		display: block;
		font-size: 24rpx;
		color: #999;
		margin-top: 12rpx;
	}

	.hero-meta.mono {
		word-break: break-all;
	}

	.group {
		background: #fff;
		margin-bottom: 24rpx;
		border-top: 1rpx solid #e5e5e5;
		border-bottom: 1rpx solid #e5e5e5;
	}

	.cell {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 28rpx 32rpx;
		border-bottom: 1rpx solid #f0f0f0;
		font-size: 32rpx;
		color: #111;
	}

	.cell:last-child {
		border-bottom: none;
	}

	.cell-hover {
		background: #f5f5f5;
	}

	.cell-main {
		flex: 1;
	}

	.cell-arrow {
		color: #c7c7cc;
		font-size: 40rpx;
		font-weight: 300;
		margin-left: 16rpx;
	}

	.cell-row {
		justify-content: space-between;
	}

	.cell-danger .cell-main {
		text-align: center;
		color: #fa5151;
		width: 100%;
	}

	.foot-tip {
		display: block;
		padding: 0 32rpx;
		font-size: 24rpx;
		color: #999;
		line-height: 1.5;
	}
</style>
