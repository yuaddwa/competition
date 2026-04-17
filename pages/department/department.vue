<template>
	<view class="department-page" v-if="department">
		<view class="header-card">
			<text class="department-name">{{ cleanLabel(department.name) }}</text>
			<text class="department-desc">{{ department.desc }}</text>
			<view class="stat-row">
				<view class="stat-item">
					<text class="stat-value">{{ department.services.length }}</text>
					<text class="stat-label">可调度角色</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">{{ selectedAgentIds.length }}</text>
					<text class="stat-label">已编组</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">{{ urgencyLabel }}</text>
					<text class="stat-label">当前优先级</text>
				</view>
			</view>
		</view>

		<view class="console-card">
			<text class="block-title">老板指令台</text>
			<textarea
				v-model="objective"
				class="objective-input"
				placeholder="输入目标，例如：2周内上线可用 MVP，并完成首批用户验证"
			/>
			<view class="urgency-row">
				<text class="label">优先级</text>
				<view class="chip-wrap">
					<view
						v-for="level in urgencyOptions"
						:key="level.value"
						class="urgency-chip"
						:class="{ active: urgency === level.value }"
						@click="urgency = level.value"
					>
						{{ level.label }}
					</view>
				</view>
			</view>
		</view>

		<view class="agents-card">
			<view class="block-head">
				<text class="block-title">角色编组</text>
				<text class="block-subtitle">点击角色卡加入/移除编组，长按查看详情</text>
			</view>

			<view class="role-list">
				<view
					v-for="service in department.services"
					:key="service.id"
					class="role-card"
					:class="{ selected: selectedAgentIds.includes(service.id) }"
					@click="toggleAgent(service.id)"
					@longpress="showAgent(service)"
				>
					<view class="role-top">
						<text class="role-name">{{ cleanLabel(service.name) }}</text>
						<text class="role-tag">{{ selectedAgentIds.includes(service.id) ? "已加入" : "可加入" }}</text>
					</view>
					<text class="role-intro">{{ service.intro }}</text>
				</view>
			</view>
		</view>

		<view class="plan-card">
			<view class="block-head">
				<text class="block-title">执行蓝图预览</text>
				<text class="block-subtitle">根据目标和编组自动生成</text>
			</view>
			<view v-if="planLines.length > 0" class="plan-list">
				<view class="plan-item" v-for="(line, index) in planLines" :key="index">
					<text class="plan-index">{{ index + 1 }}</text>
					<text class="plan-text">{{ line }}</text>
				</view>
			</view>
			<text v-else class="empty-plan">先输入目标并至少选择 1 个角色</text>
		</view>

		<view class="action-row">
			<button class="btn secondary" @click="resetPlan">重置</button>
			<button class="btn primary" @click="createPlanTask">创建任务单</button>
		</view>

		<view v-if="activeAgent" class="agent-panel-mask" @click="activeAgent = null">
			<view class="agent-panel" @click.stop>
				<view class="agent-head">
					<text class="agent-title">{{ cleanLabel(activeAgent.name) }}</text>
					<text class="agent-close" @click="activeAgent = null">关闭</text>
				</view>
				<text class="agent-detail">{{ activeAgent.detail }}</text>
				<text class="agent-meta">专业：{{ activeAgent.expertise }}</text>
				<text class="agent-meta">适用时机：{{ activeAgent.whenToUse }}</text>
			</view>
		</view>
	</view>

	<view class="empty-page" v-else><text>未找到该部门</text></view>
</template>

<script>
	import agentDepartments from "@/data/agentDepartments";

	export default {
		data() {
			return {
				department: null,
				objective: "",
				urgency: "normal",
				selectedAgentIds: [],
				activeAgent: null,
				urgencyOptions: [
					{ label: "低", value: "low" },
					{ label: "中", value: "normal" },
					{ label: "高", value: "high" }
				]
			};
		},
		onLoad(options) {
			const id = (options && options.id) || "";
			this.department = agentDepartments.find((item) => item.id === id) || null;
		},
		computed: {
			urgencyLabel() {
				return this.urgencyOptions.find((item) => item.value === this.urgency)?.label || "中";
			},
			selectedAgents() {
				if (!this.department) return [];
				return this.department.services.filter((item) => this.selectedAgentIds.includes(item.id));
			},
			planLines() {
				if (!this.objective.trim() || this.selectedAgents.length === 0) return [];
				const lines = [
					`目标定义：${this.objective.trim()}`,
					`优先级：${this.urgencyLabel}（建议在 ${this.urgency === "high" ? "24 小时内" : "72 小时内"}启动）`,
					`角色分工：${this.selectedAgents.map((item) => this.cleanLabel(item.name)).join("、")}`
				];
				this.selectedAgents.forEach((agent) => {
					lines.push(`${this.cleanLabel(agent.name)}：负责 ${agent.intro}`);
				});
				return lines;
			}
		},
		methods: {
			cleanLabel(label = "") {
				return label.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, "").trim();
			},
			toggleAgent(agentId) {
				if (this.selectedAgentIds.includes(agentId)) {
					this.selectedAgentIds = this.selectedAgentIds.filter((id) => id !== agentId);
					return;
				}
				this.selectedAgentIds = [...this.selectedAgentIds, agentId];
			},
			showAgent(service) {
				this.activeAgent = service;
			},
			resetPlan() {
				this.objective = "";
				this.urgency = "normal";
				this.selectedAgentIds = [];
			},
			createPlanTask() {
				if (!this.objective.trim()) {
					uni.showToast({ title: "请先输入目标", icon: "none" });
					return;
				}
				if (this.selectedAgentIds.length === 0) {
					uni.showToast({ title: "请至少选择1个角色", icon: "none" });
					return;
				}
				uni.showToast({ title: "任务单已生成（待接入后端）", icon: "none" });
			}
		}
	};
</script>

<style>
	.department-page {
		min-height: 100vh;
		padding: 24rpx;
		background: #f6f8fb;
		box-sizing: border-box;
		padding-bottom: 40rpx;
	}

	.header-card {
		padding: 28rpx;
		background: #fff;
		border-radius: 18rpx;
		border: 1rpx solid #dfe6f2;
	}

	.department-name {
		display: block;
		font-size: 36rpx;
		font-weight: 700;
		color: #1f2d3d;
	}

	.department-desc {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #6f7a89;
	}

	.stat-row {
		margin-top: 20rpx;
		display: flex;
		gap: 12rpx;
	}

	.stat-item {
		flex: 1;
		background: #f4f7ff;
		border-radius: 12rpx;
		padding: 14rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-value {
		font-size: 28rpx;
		font-weight: 700;
		color: #3858e8;
	}

	.stat-label {
		margin-top: 6rpx;
		font-size: 20rpx;
		color: #6f7a89;
	}

	.console-card,
	.agents-card,
	.plan-card {
		margin-top: 18rpx;
		padding: 22rpx;
		background: #fff;
		border-radius: 16rpx;
		border: 1rpx solid #dfe6f2;
	}

	.block-head {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.block-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #1f2d3d;
	}

	.block-subtitle {
		font-size: 22rpx;
		color: #8a97a8;
	}

	.objective-input {
		margin-top: 14rpx;
		width: 100%;
		min-height: 130rpx;
		background: #f7f9fc;
		border-radius: 12rpx;
		padding: 16rpx;
		box-sizing: border-box;
		font-size: 24rpx;
	}

	.urgency-row {
		margin-top: 14rpx;
	}

	.label {
		font-size: 22rpx;
		color: #617187;
	}

	.chip-wrap {
		margin-top: 10rpx;
		display: flex;
		gap: 10rpx;
	}

	.urgency-chip {
		padding: 8rpx 18rpx;
		border-radius: 999rpx;
		font-size: 22rpx;
		background: #edf2ff;
		color: #4761ea;
	}

	.urgency-chip.active {
		background: #4761ea;
		color: #fff;
	}

	.role-list {
		margin-top: 12rpx;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.role-card {
		background: #f8faff;
		border-radius: 14rpx;
		border: 1rpx solid #e2e9fb;
		padding: 18rpx;
	}

	.role-card.selected {
		background: #edf2ff;
		border-color: #6380ff;
	}

	.role-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10rpx;
	}

	.role-name {
		font-size: 28rpx;
		font-weight: 600;
		color: #243447;
	}

	.role-tag {
		padding: 4rpx 12rpx;
		border-radius: 999rpx;
		font-size: 20rpx;
		background: #e9efff;
		color: #4a61d8;
	}

	.role-intro {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #6f7a89;
		line-height: 1.45;
	}

	.plan-list {
		margin-top: 12rpx;
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	.plan-item {
		display: flex;
		gap: 10rpx;
		align-items: flex-start;
	}

	.plan-index {
		width: 34rpx;
		height: 34rpx;
		line-height: 34rpx;
		border-radius: 50%;
		text-align: center;
		background: #edf2ff;
		color: #4b63e8;
		font-size: 20rpx;
		flex-shrink: 0;
	}

	.plan-text {
		flex: 1;
		font-size: 23rpx;
		color: #42536a;
		line-height: 1.45;
	}

	.empty-plan {
		margin-top: 12rpx;
		font-size: 23rpx;
		color: #8a97a8;
	}

	.action-row {
		margin-top: 18rpx;
		display: flex;
		gap: 14rpx;
	}

	.btn {
		flex: 1;
		height: 74rpx;
		line-height: 74rpx;
		font-size: 26rpx;
		border-radius: 37rpx;
	}

	.btn.primary {
		background: linear-gradient(135deg, #3f5dff, #6f54ff);
		color: #fff;
	}

	.btn.secondary {
		background: #edf2ff;
		color: #4a5af2;
	}

	.agent-panel-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.38);
		display: flex;
		align-items: flex-end;
		z-index: 999;
	}

	.agent-panel {
		width: 100%;
		background: #fff;
		border-top-left-radius: 20rpx;
		border-top-right-radius: 20rpx;
		padding: 24rpx;
		padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.agent-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.agent-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #1f2d3d;
	}

	.agent-close {
		font-size: 22rpx;
		color: #7f8a9a;
	}

	.agent-detail {
		display: block;
		margin-top: 14rpx;
		font-size: 24rpx;
		line-height: 1.55;
		color: #45576f;
	}

	.agent-meta {
		display: block;
		margin-top: 10rpx;
		font-size: 22rpx;
		color: #62748c;
	}

	.empty-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #7f8a9a;
		font-size: 28rpx;
	}
</style>

