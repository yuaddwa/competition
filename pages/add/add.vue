<template>
	<view class="add-page">
		<!-- 同 home：小程序原生 scroll-view 会盖住 fixed 自定义 Tab -->
		<view class="scroll">
			<view class="hero">
				<view class="hero-icon">⚡</view>
				<view class="hero-copy">
					<text class="head-title">布置任务</text>
					<text class="head-sub">写清目标即可；默认从 <text class="em">产品部</text> 下发至 <text class="em">工程部</text>。</text>
				</view>
			</view>

			<view class="steps">
				<view class="step" :class="{ done: !!workflowId }">
					<text class="step-n">1</text>
					<text class="step-t">选工作流</text>
				</view>
				<text class="step-line"></text>
				<view class="step" :class="{ done: goalTrimmed.length > 0 }">
					<text class="step-n">2</text>
					<text class="step-t">写任务</text>
				</view>
				<text class="step-line"></text>
				<view class="step">
					<text class="step-n">3</text>
					<text class="step-t">下发</text>
				</view>
			</view>

			<view class="wf-bar" @click="pickWorkflow">
				<view class="wf-info">
					<text class="wf-label">落到哪个工作流</text>
					<text class="wf-name">{{ workflowTitle || "点击选择" }}</text>
				</view>
				<text class="wf-arrow">›</text>
			</view>

			<view class="card">
				<text class="label">任务内容</text>
				<textarea
					class="goal"
					v-model="goal"
					:maxlength="2000"
					placeholder="例如：两周内上线可用 MVP，并完成首批用户验证。"
					placeholder-class="ph"
					:auto-height="false"
				/>
				<text class="counter">{{ goal.length }} / 2000</text>
			</view>

			<view class="card">
				<text class="label">优先级</text>
				<view class="pri-row">
					<view
						v-for="(p, i) in priorities"
						:key="p.key"
						class="pri"
						:class="{ on: priorityIdx === i }"
						@click="priorityIdx = i"
					>
						<text class="pri-t">{{ p.label }}</text>
					</view>
				</view>
			</view>

			<view class="actions">
				<button class="btn ghost" :disabled="submitting" @click="reset">清空</button>
				<button class="btn main" type="primary" :loading="submitting" @click="submit">下发任务</button>
			</view>

			<view class="hint-card">
				<text class="hint-title">小贴士</text>
				<text class="hint-t">还没有工作流？先到「项目」创建一个，再回到本页选择并下发。</text>
				<button class="hint-btn" @click="goProject">打开项目</button>
			</view>

			<view class="pad-bottom" />
		</view>
		<AppTabBar current="add" />
	</view>
</template>

<script>
	import * as workflowApi from "@/api/workflowApi";
	import { pickId } from "@/utils/apiHelpers";
	import { switchMainTab } from "@/utils/tabNav";
	import AppTabBar from "@/components/AppTabBar.vue";

	const STORAGE_WF = "lastWorkflowId";
	const STORAGE_WF_TITLE = "lastWorkflowTitle";

	export default {
		components: { AppTabBar },
		data() {
			return {
				workflowId: "",
				workflowTitle: "",
				workflowList: [],
				goal: "",
				priorityIdx: 1,
				priorities: [
					{ key: "low", label: "低" },
					{ key: "mid", label: "中" },
					{ key: "high", label: "高" },
				],
				submitting: false,
			};
		},
		computed: {
			hierarchyLevel() {
				return this.priorityIdx + 1;
			},
			goalTrimmed() {
				return (this.goal || "").trim();
			},
		},
		onLoad() {
			uni.hideTabBar({ animation: false });
		},
		onShow() {
			uni.hideTabBar({ animation: false });
			this.workflowId = uni.getStorageSync(STORAGE_WF) || "";
			this.workflowTitle = uni.getStorageSync(STORAGE_WF_TITLE) || "";
			this.prefetchWorkflows();
		},
		methods: {
			async prefetchWorkflows() {
				try {
					const list = await workflowApi.listWorkflows();
					this.workflowList = Array.isArray(list) ? list : [];
					if (!this.workflowId && this.workflowList.length === 1) {
						const w = this.workflowList[0];
						const id = pickId(w);
						if (id) {
							this.workflowId = id;
							this.workflowTitle = w.title || w.name || "工作流";
							uni.setStorageSync(STORAGE_WF, id);
							uni.setStorageSync(STORAGE_WF_TITLE, this.workflowTitle);
						}
					}
				} catch {
					this.workflowList = [];
				}
			},
			wfLabel(w) {
				const id = pickId(w);
				const name = w.title || w.name || "工作流";
				return id ? `${name}` : name;
			},
			pickWorkflow() {
				const list = this.workflowList;
				if (!list.length) {
					uni.showModal({
						title: "暂无工作流",
						content: "需要先在「项目」里创建工作流，是否前往？",
						success: (res) => {
							if (res.confirm) {
								switchMainTab("project");
							}
						},
					});
					return;
				}
				const labels = list.map((w) => this.wfLabel(w));
				uni.showActionSheet({
					itemList: labels,
					success: (res) => {
						const w = list[res.tapIndex];
						const id = pickId(w);
						if (!id) return;
						this.workflowId = id;
						this.workflowTitle = w.title || w.name || "工作流";
						try {
							uni.setStorageSync(STORAGE_WF, id);
							uni.setStorageSync(STORAGE_WF_TITLE, this.workflowTitle);
						} catch {
							//
						}
					},
				});
			},
			goProject() {
				switchMainTab("project");
			},
			reset() {
				this.goal = "";
				this.priorityIdx = 1;
			},
			async submit() {
				const text = (this.goal || "").trim();
				if (!text) {
					uni.showToast({ title: "请先写任务内容", icon: "none" });
					return;
				}
				if (!this.workflowId) {
					uni.showModal({
						title: "还没有工作流",
						content: "请先到「项目」里创建并进入过一次，或点「选择」从列表里指定。",
						confirmText: "去项目",
						cancelText: "选择",
						success: (res) => {
							if (res.confirm) {
								switchMainTab("project");
							} else {
								this.pickWorkflow();
							}
						},
					});
					return;
				}
				this.submitting = true;
				try {
					await workflowApi.postCommand(this.workflowId, {
						sourceDepartment: "product",
						targetDepartment: "engineering",
						hierarchyLevel: this.hierarchyLevel,
						content: text,
						body: text,
						commandText: text,
					});
					uni.showToast({ title: "已下发", icon: "success" });
					this.goal = "";
				} catch {
					//
				} finally {
					this.submitting = false;
				}
			},
		},
	};
</script>

<style scoped>
	.add-page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f1f5f9;
	}

	.scroll {
		flex: 1;
		height: 0;
		padding: 28rpx 28rpx 0;
		box-sizing: border-box;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}

	.hero {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 20rpx;
		padding: 28rpx;
		margin-bottom: 22rpx;
		background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
		border-radius: 24rpx;
		border: 1rpx solid #e0e7ff;
		box-shadow: 0 16rpx 40rpx rgba(37, 99, 235, 0.08);
	}

	.hero-icon {
		width: 72rpx;
		height: 72rpx;
		line-height: 72rpx;
		text-align: center;
		font-size: 40rpx;
		background: linear-gradient(135deg, #2563eb, #7c3aed);
		border-radius: 20rpx;
		flex-shrink: 0;
		box-shadow: 0 8rpx 20rpx rgba(37, 99, 235, 0.25);
	}

	.hero-copy {
		flex: 1;
		min-width: 0;
	}

	.head-title {
		display: block;
		font-size: 38rpx;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.02em;
	}

	.head-sub {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.55;
	}

	.em {
		color: #1d4ed8;
		font-weight: 700;
	}

	.steps {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 22rpx;
		padding: 18rpx 16rpx;
		background: #fff;
		border-radius: 18rpx;
		border: 1rpx solid #e2e8f0;
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
		flex: 1;
		min-width: 0;
	}

	.step-n {
		width: 44rpx;
		height: 44rpx;
		line-height: 44rpx;
		text-align: center;
		border-radius: 50%;
		font-size: 22rpx;
		font-weight: 800;
		color: #94a3b8;
		background: #f1f5f9;
	}

	.step.done .step-n {
		color: #fff;
		background: linear-gradient(135deg, #2563eb, #4f46e5);
	}

	.step-t {
		font-size: 22rpx;
		color: #64748b;
		font-weight: 600;
	}

	.step.done .step-t {
		color: #1e293b;
	}

	.step-line {
		width: 40rpx;
		height: 2rpx;
		background: #e2e8f0;
		flex-shrink: 0;
	}

	.wf-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #fff;
		border-radius: 18rpx;
		padding: 22rpx 24rpx;
		margin-bottom: 20rpx;
		border: 1rpx solid #e2e8f0;
		box-shadow: 0 8rpx 24rpx rgba(30, 58, 138, 0.06);
	}

	.wf-info {
		flex: 1;
		min-width: 0;
	}

	.wf-label {
		display: block;
		font-size: 22rpx;
		color: #94a3b8;
		margin-bottom: 6rpx;
	}

	.wf-name {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #1e293b;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.wf-arrow {
		font-size: 40rpx;
		color: #cbd5e1;
		font-weight: 300;
		padding-left: 16rpx;
	}

	.card {
		background: #fff;
		border-radius: 18rpx;
		padding: 22rpx 24rpx;
		margin-bottom: 18rpx;
		border: 1rpx solid #e8ecf3;
		box-shadow: 0 8rpx 22rpx rgba(15, 23, 42, 0.05);
	}

	.label {
		display: block;
		font-size: 26rpx;
		font-weight: 700;
		color: #334155;
		margin-bottom: 14rpx;
	}

	.goal {
		width: 100%;
		min-height: 280rpx;
		font-size: 30rpx;
		line-height: 1.55;
		color: #0f172a;
		box-sizing: border-box;
		padding: 16rpx;
		background: #f8fafc;
		border-radius: 14rpx;
		border: 1rpx solid #e2e8f0;
	}

	.ph {
		color: #94a3b8;
	}

	.counter {
		display: block;
		text-align: right;
		font-size: 22rpx;
		color: #94a3b8;
		margin-top: 10rpx;
	}

	.pri-row {
		display: flex;
		gap: 14rpx;
	}

	.pri {
		flex: 1;
		text-align: center;
		padding: 20rpx 12rpx;
		border-radius: 14rpx;
		background: #f1f5f9;
		border: 2rpx solid transparent;
		transition: background 0.15s ease;
	}

	.pri.on {
		background: #dbeafe;
		border-color: #2563eb;
	}

	.pri-t {
		font-size: 28rpx;
		font-weight: 700;
		color: #475569;
	}

	.pri.on .pri-t {
		color: #1d4ed8;
	}

	.actions {
		display: flex;
		gap: 16rpx;
		margin-top: 8rpx;
		margin-bottom: 20rpx;
	}

	.btn {
		flex: 1;
		height: 92rpx;
		line-height: 92rpx;
		border-radius: 46rpx;
		font-size: 30rpx;
		font-weight: 700;
	}

	.btn.ghost {
		background: #fff;
		color: #475569;
		border: 1rpx solid #e2e8f0;
	}

	.btn.main {
		flex: 1.4;
		box-shadow: 0 10rpx 28rpx rgba(37, 99, 235, 0.35);
	}

	.hint-card {
		padding: 24rpx;
		background: #fff;
		border-radius: 18rpx;
		border: 1rpx dashed #cbd5e1;
		margin-bottom: 24rpx;
	}

	.hint-title {
		display: block;
		font-size: 26rpx;
		font-weight: 700;
		color: #334155;
		margin-bottom: 10rpx;
	}

	.hint-t {
		display: block;
		font-size: 24rpx;
		color: #94a3b8;
		line-height: 1.5;
		margin-bottom: 20rpx;
	}

	.hint-btn {
		width: 100%;
		height: 76rpx;
		line-height: 76rpx;
		border-radius: 38rpx;
		font-size: 28rpx;
		font-weight: 700;
		background: #f8fafc !important;
		color: #2563eb !important;
		border: 2rpx solid #bfdbfe !important;
	}

	.hint-btn::after {
		border: none;
	}

	.pad-bottom {
		height: 200rpx;
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
