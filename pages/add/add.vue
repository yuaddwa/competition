<template>
	<view class="add-page">
		<scroll-view scroll-y class="scroll" :show-scrollbar="false">
			<view class="head">
				<text class="head-title">一句话下任务</text>
				<text class="head-sub">写清楚目标即可，其余按默认协作关系提交（产品部 → 工程部）。</text>
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

			<view class="hint">
				<text class="hint-t">还没有工作流？先去「项目」建一个，再回来输入。</text>
			</view>

			<view class="pad-bottom" />
		</scroll-view>

		<view class="tab-bar">
			<view class="tab-item" :class="{ active: currentPage === 'home' }" @click="navigateTo('home')">
				<text class="tab-icon iconfont">&#xe64f;</text>
				<text class="tab-text">首页</text>
			</view>
			<view class="tab-item" :class="{ active: currentPage === 'project' }" @click="navigateTo('project')">
				<text class="tab-icon iconfont">&#xe620;</text>
				<text class="tab-text">项目</text>
			</view>
			<view class="tab-item center-item">
				<view class="center-button" @click="navigateTo('add')">
					<text class="center-icon iconfont"></text>
				</view>
			</view>
			<view class="tab-item" :class="{ active: currentPage === 'message' }" @click="navigateTo('message')">
				<text class="tab-icon iconfont">&#xe87c;</text>
				<text class="tab-text">消息</text>
			</view>
			<view class="tab-item" :class="{ active: currentPage === 'profile' }" @click="navigateTo('profile')">
				<text class="tab-icon iconfont">&#xe654;</text>
				<text class="tab-text">个人</text>
			</view>
		</view>
	</view>
</template>

<script>
	import * as workflowApi from "@/api/workflowApi";
	import { pickId } from "@/utils/apiHelpers";

	const STORAGE_WF = "lastWorkflowId";
	const STORAGE_WF_TITLE = "lastWorkflowTitle";

	export default {
		data() {
			return {
				currentPage: "add",
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
		},
		onShow() {
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
								uni.redirectTo({ url: "/pages/project/project" });
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
								uni.redirectTo({ url: "/pages/project/project" });
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
			navigateTo(page) {
				uni.redirectTo({
					url: `/pages/${page}/${page}`,
				});
			},
		},
	};
</script>

<style>
	@font-face {
		font-family: 'iconfont';
		src: url('../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff2') format('woff2'),
			 url('../../static/download/font_5162264_g3oiz4ouy1i/iconfont.woff') format('woff'),
			 url('../../static/download/font_5162264_g3oiz4ouy1i/iconfont.ttf') format('truetype');
	}

	.iconfont {
		font-family: 'iconfont' !important;
		font-size: 36rpx;
	}

	.add-page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #eef2ff;
	}

	.scroll {
		flex: 1;
		height: 0;
		padding: 28rpx 28rpx 0;
		box-sizing: border-box;
	}

	.head {
		margin-bottom: 24rpx;
	}

	.head-title {
		display: block;
		font-size: 44rpx;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.02em;
	}

	.head-sub {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.5;
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

	.hint {
		padding: 8rpx 8rpx 24rpx;
	}

	.hint-t {
		font-size: 22rpx;
		color: #94a3b8;
		line-height: 1.45;
	}

	.pad-bottom {
		height: 200rpx;
	}

	.tab-bar {
		display: flex;
		align-items: center;
		height: 100rpx;
		background-color: #fff;
		border-top: 1rpx solid #e8e8e8;
		position: relative;
		z-index: 50;
	}

	.tab-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		height: 100%;
	}

	.tab-icon {
		font-size: 36rpx;
		margin-bottom: 8rpx;
	}

	.tab-text {
		font-size: 20rpx;
		color: #666;
	}

	.tab-item.active .tab-text {
		color: #333;
		font-weight: bold;
	}

	.center-item {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		flex: 1;
	}

	.center-button {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background-color: #007aff;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: -40rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.3);
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}

	.center-icon {
		font-size: 40rpx;
		color: #fff;
	}
</style>
