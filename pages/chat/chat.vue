<template>
	<view class="chat-page">
		<view class="chat-header">
			<text class="back-button iconfont" @click="goBack">&#xe602;</text>
			<text v-if="projectName === '工程部'" class="avatar-icon iconfont icon-laoban"></text>
			<text v-else class="avatar-icon iconfont icon-xiangmu"></text>
			<text class="chat-title">{{ pageTitle }}</text>
		</view>
		<view v-if="!selectedEmployeeId" class="employee-panel">
			<view
				v-if="employeeOptions.length > 0"
				v-for="item in employeeOptions"
				:key="item.id"
				class="employee-item"
				@click="openEmployee(item.id)"
			>
				<text class="employee-id">{{ item.cnId }}</text>
				<text class="employee-raw">({{ item.id }})</text>
			</view>
			<text v-else class="employee-empty">当前部门暂无员工 ID 配置</text>
		</view>
		<scroll-view
			class="chat-content"
			scroll-y
			:scroll-into-view="chatScrollIntoView"
			:scroll-with-animation="true"
			v-if="selectedEmployeeId && chatMessages.length > 0"
		>
			<view
				v-for="msg in chatMessages"
				:key="msg.id"
				:id="`msg-${msg.id}`"
				class="bubble-row"
				:class="{ 'my-message': msg.isMine }"
			>
				<view class="message-bubble" :class="{ 'my-message': msg.isMine }">
					<text class="bubble-text">{{ msg.content }}</text>
				</view>
				<text class="bubble-meta-time">{{ formatTime(msg.time) }}</text>
			</view>
		</scroll-view>
		<view v-else-if="selectedEmployeeId" class="chat-empty">
			<text>暂无消息</text>
		</view>
		<view v-if="selectedEmployeeId" class="chat-input">
			<input type="text" v-model="inputText" placeholder="输入消息..." class="input-field" />
			<view class="send-button" @click="sendMessage">{{ isReplying ? "生成中..." : "发送" }}</view>
		</view>
	</view>
</template>

<script>
	import agentDepartments from "@/data/agentDepartments";
	import { loadChatMessages, markMessagesAsRead } from "@/utils/messageUtils";

	const ID_TOKEN_CN_MAP = {
		eng: "工程",
		des: "设计",
		paid: "付费媒体",
		sales: "销售",
		mkt: "市场",
		prd: "产品",
		pm: "项目管理",
		qa: "测试",
		sup: "支援",
		spatial: "空间计算",
		sp: "专业",
		fin: "财务",
		ac: "学术",
		frontend: "前端",
		backend: "后端",
		mobile: "移动应用",
		ai: "人工智能",
		ui: "界面设计",
		ux: "用户体验",
		arch: "架构",
		ppc: "PPC投放",
		tracking: "跟踪测量",
		creative: "创意",
		outbound: "外联",
		deal: "交易",
		se: "销售工程",
		growth: "增长",
		content: "内容",
		seo: "搜索优化",
		feedback: "反馈",
		pri: "优先级",
		shepherd: "项目牧羊人",
		experiment: "实验追踪",
		jira: "Jira流程",
		evidence: "证据收集",
		api: "接口测试",
		perf: "性能测试",
		response: "响应支持",
		analytics: "分析",
		compliance: "合规",
		xr: "XR交互",
		vision: "visionOS",
		metal: "Metal渲染",
		orchestrator: "编排",
		mcp: "MCP",
		doc: "文档",
		bookkeeper: "账务控制",
		fpa: "财务规划分析",
		tax: "税务",
		anthro: "人类学",
		history: "历史学",
		psych: "心理学"
	};

	function translateIdToChinese(id) {
		if (!id) return "";
		return id
			.split("-")
			.map(token => ID_TOKEN_CN_MAP[token] || token.toUpperCase())
			.join("·");
	}

	function normalizeDepartmentName(name) {
		return (name || "")
			.replace(/^[^\s\u4e00-\u9fa5A-Za-z]+/, "")
			.replace(/\s+/g, "")
			.trim();
	}

	const UI_DESIGNER_EMPLOYEE_ID = "des-ui";
	const UI_DESIGNER_DEPARTMENT = "设计部";

	function extractAssistantText(resData) {
		if (!resData) return "";
		const contentFromChoices = resData?.choices?.[0]?.message?.content;
		if (typeof contentFromChoices === "string" && contentFromChoices.trim()) {
			return contentFromChoices.trim();
		}
		if (Array.isArray(contentFromChoices)) {
			const text = contentFromChoices
				.map(part => (typeof part?.text === "string" ? part.text : ""))
				.join("")
				.trim();
			if (text) return text;
		}
		const directText =
			resData?.reply ||
			resData?.text ||
			resData?.content ||
			resData?.data?.reply ||
			resData?.data?.content ||
			resData?.data?.text;
		if (typeof directText === "string" && directText.trim()) {
			return directText.trim();
		}
		const geminiText = resData?.candidates?.[0]?.content?.parts
			?.map(part => (typeof part?.text === "string" ? part.text : ""))
			.join("")
			.trim();
		if (geminiText) {
			return geminiText;
		}
		const outputText = resData?.output_text || resData?.output?.[0]?.content?.[0]?.text;
		if (typeof outputText === "string" && outputText.trim()) {
			return outputText.trim();
		}
		return "";
	}

	export default {
		data() {
			return {
				projectName: "",
				selectedEmployeeId: "",
				inputText: "",
				chatMessages: [],
				chatScrollIntoView: "",
				isReplying: false,
			};
		},
		computed: {
			currentDepartment() {
				const normalizedProjectName = normalizeDepartmentName(this.projectName);
				return agentDepartments.find(dept => {
					const normalizedDeptName = normalizeDepartmentName(dept.name);
					return (
						normalizedDeptName === normalizedProjectName ||
						normalizedDeptName.includes(normalizedProjectName) ||
						normalizedProjectName.includes(normalizedDeptName)
					);
				}) || null;
			},
			employeeOptions() {
				if (!this.currentDepartment) return [];
				return (this.currentDepartment.services || []).map(service => ({
					id: service.id,
					cnId: translateIdToChinese(service.id)
				}));
			},
			pageTitle() {
				if (!this.selectedEmployeeId) return this.projectName;
				const selected = this.employeeOptions.find(item => item.id === this.selectedEmployeeId);
				return selected ? `${this.projectName} · ${selected.cnId}` : this.projectName;
			}
		},
		onLoad(options) {
			const raw = options && options.projectName;
			if (raw) {
				this.projectName = decodeURIComponent(raw);
				this.selectedEmployeeId = options && options.employeeId ? decodeURIComponent(options.employeeId) : "";
				this.loadChatMessages();
				this.markAsRead();
			}
		},
		methods: {
			goBack() {
				uni.navigateBack();
			},
			loadChatMessages() {
				const all = loadChatMessages(this.projectName);
				if (this.selectedEmployeeId) {
					this.chatMessages = all.filter(msg => msg.employeeId === this.selectedEmployeeId);
					this.scrollToLatestMessage();
					return;
				}
				this.chatMessages = all.filter(msg => !msg.employeeId);
				this.scrollToLatestMessage();
			},
			markAsRead() {
				markMessagesAsRead(this.projectName);
			},
			openEmployee(employeeId) {
				uni.navigateTo({
					url: `/pages/chat/chat?projectName=${encodeURIComponent(this.projectName)}&employeeId=${encodeURIComponent(employeeId)}`
				});
			},
			sendMessage() {
				if (!this.inputText.trim() || this.isReplying) return;

				const userContent = this.inputText.trim();
				const newMessage = {
					id: "msg-" + Date.now(),
					projectName: this.projectName,
					employeeId: this.selectedEmployeeId || "",
					title: "消息",
					content: userContent,
					time: new Date().toISOString(),
					sender: "me",
					read: true,
				};

				const allMessages = uni.getStorageSync("projectMessages") || [];
				allMessages.unshift(newMessage);
				uni.setStorageSync("projectMessages", allMessages);

				this.inputText = "";
				this.loadChatMessages();

				if (
					this.projectName === UI_DESIGNER_DEPARTMENT &&
					this.selectedEmployeeId === UI_DESIGNER_EMPLOYEE_ID
				) {
					this.replyFromUiDesignerApi(userContent);
					return;
				}

				if (this.projectName === "工程部" && this.selectedEmployeeId) {
					setTimeout(() => {
						const replyMessage = {
							id: "msg-" + Date.now(),
							projectName: "工程部",
							employeeId: this.selectedEmployeeId,
							title: "回复",
							content: "好的，我知道了",
							time: new Date().toISOString(),
							read: false,
						};
						const updatedMessages = uni.getStorageSync("projectMessages") || [];
						updatedMessages.unshift(replyMessage);
						uni.setStorageSync("projectMessages", updatedMessages);
						this.loadChatMessages();
					}, 1000);
				}
			},
			async replyFromUiDesignerApi(userContent) {
				const apiKey = uni.getStorageSync("uiDesignerApiKey") || import.meta.env.VITE_UI_DESIGNER_API_KEY || "";
				const apiUrl = uni.getStorageSync("uiDesignerApiUrl") || import.meta.env.VITE_UI_DESIGNER_API_URL || "https://api.openai.com/v1/chat/completions";
				const apiModel = uni.getStorageSync("uiDesignerModel") || import.meta.env.VITE_UI_DESIGNER_MODEL || "gpt-4o-mini";

				if (!apiKey) {
					uni.showToast({
						title: "缺少 API Key，请先配置 uiDesignerApiKey",
						icon: "none",
						duration: 2600
					});
					return;
				}

				this.isReplying = true;
				try {
					const response = await new Promise((resolve, reject) => {
						uni.request({
							url: apiUrl,
							method: "POST",
							header: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${apiKey}`
							},
							data: {
								model: apiModel,
								messages: [
									{
										role: "system",
										content: "你是设计部的界面设计员工，擅长界面布局、组件规范、可用性与视觉一致性。请用简洁中文给出可执行建议。"
									},
									{
										role: "user",
										content: userContent
									}
								],
								temperature: 0.7
							},
							success: resolve,
							fail: reject
						});
					});

					if (!response || response.statusCode < 200 || response.statusCode >= 300) {
						throw new Error(`HTTP ${response?.statusCode || "UNKNOWN"}`);
					}

					const errorMessage =
						response?.data?.error?.message ||
						response?.data?.message ||
						response?.data?.msg ||
						"";
					const content = extractAssistantText(response?.data);
					if (!content) {
						const dataSnippet = JSON.stringify(response?.data || {}).slice(0, 180);
						throw new Error(errorMessage || `接口返回中未找到可用回复内容: ${dataSnippet}`);
					}

					const replyMessage = {
						id: "msg-" + Date.now(),
						projectName: this.projectName,
						employeeId: this.selectedEmployeeId,
						title: "回复",
						content,
						time: new Date().toISOString(),
						read: false
					};
					const updatedMessages = uni.getStorageSync("projectMessages") || [];
					updatedMessages.unshift(replyMessage);
					uni.setStorageSync("projectMessages", updatedMessages);
					this.loadChatMessages();
				} catch (error) {
					const errText = error?.message || "未知错误";
					const failMessage = {
						id: "msg-" + Date.now(),
						projectName: this.projectName,
						employeeId: this.selectedEmployeeId,
						title: "系统提示",
						content: `接口调用失败：${errText}`,
						time: new Date().toISOString(),
						read: false
					};
					const updatedMessages = uni.getStorageSync("projectMessages") || [];
					updatedMessages.unshift(failMessage);
					uni.setStorageSync("projectMessages", updatedMessages);
					this.loadChatMessages();
					uni.showToast({
						title: "回复失败，已写入错误详情",
						icon: "none",
						duration: 2600
					});
				} finally {
					this.isReplying = false;
				}
			},
			scrollToLatestMessage() {
				if (!this.chatMessages.length) return;
				const last = this.chatMessages[this.chatMessages.length - 1];
				const targetId = `msg-${last.id}`;
				this.chatScrollIntoView = "";
				this.$nextTick(() => {
					this.chatScrollIntoView = targetId;
				});
			},
			formatTime(time) {
				const date = new Date(time);
				const hour = date.getHours().toString().padStart(2, "0");
				const minute = date.getMinutes().toString().padStart(2, "0");
				return `${hour}:${minute}`;
			},
		},
	};
</script>

<style>
	@font-face {
		font-family: "iconfont";
		src: url("../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff2") format("woff2"),
			url("../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff") format("woff"),
			url("../../static/download/font_5162264_g3oiz4ouy1i/iconfont.ttf") format("truetype");
	}

	.iconfont {
		font-family: "iconfont" !important;
		font-size: 36rpx;
	}

	.chat-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f4f6fb;
	}

	.chat-header {
		height: 80rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #e8e8e8;
		display: flex;
		align-items: center;
		padding: 0 30rpx;
		flex-shrink: 0;
	}

	.back-button {
		font-size: 32rpx;
		margin-right: 30rpx;
	}

	.avatar-icon {
		font-family: 'iconfont' !important;
		font-size: 40rpx;
		margin-right: 16rpx;
	}

	.chat-title {
		font-size: 28rpx;
		font-weight: 600;
		flex: 1;
	}

	.chat-content {
		flex: 1;
		padding: 20rpx;
		padding-right: 28rpx;
		padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
		min-height: 0;
		width: 100%;
		box-sizing: border-box;
	}

	.employee-panel {
		padding: 20rpx;
		background: #f8faff;
		border-bottom: 1rpx solid #e8edf7;
	}

	.employee-item {
		background: #fff;
		border-radius: 12rpx;
		padding: 24rpx 22rpx;
		margin-bottom: 16rpx;
		min-height: 96rpx;
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.employee-id {
		font-size: 24rpx;
		color: #333;
		font-weight: 600;
	}

	.employee-raw {
		font-size: 22rpx;
		color: #999;
	}

	.employee-empty {
		display: block;
		font-size: 24rpx;
		color: #999;
		padding: 12rpx 0;
	}

	.chat-empty {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #999;
		font-size: 28rpx;
		min-height: 0;
	}

	.bubble-row {
		display: flex;
		flex-direction: column;
		margin-bottom: 20rpx;
		align-items: flex-start;
		width: 100%;
		box-sizing: border-box;
	}

	.bubble-row.my-message {
		align-items: flex-end;
	}

	.message-bubble {
		max-width: 70%;
		padding: 16rpx 20rpx;
		border-radius: 16rpx;
		background-color: #fff;
		box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
		box-sizing: border-box;
		word-break: break-word;
	}

	.message-bubble.my-message {
		background-color: #007aff;
		color: #fff;
	}

	.bubble-text {
		font-size: 24rpx;
		line-height: 1.5;
	}

	.message-bubble.my-message .bubble-text {
		color: #fff;
	}

	.bubble-meta-time {
		font-size: 20rpx;
		color: #999;
		margin-top: 8rpx;
	}

	.chat-input {
		min-height: 100rpx;
		padding-bottom: env(safe-area-inset-bottom);
		background-color: #fff;
		border-top: 1rpx solid #e8e8e8;
		display: flex;
		align-items: center;
		padding-left: 30rpx;
		padding-right: 30rpx;
		padding-top: 20rpx;
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		gap: 20rpx;
		z-index: 100;
		box-sizing: border-box;
	}

	.input-field {
		flex: 1;
		height: 60rpx;
		border: 1rpx solid #e8e8e8;
		border-radius: 30rpx;
		padding: 0 20rpx;
		font-size: 24rpx;
	}

	.send-button {
		padding: 12rpx 30rpx;
		background-color: #007aff;
		color: #fff;
		border-radius: 30rpx;
		font-size: 24rpx;
		font-weight: 600;
	}
</style>