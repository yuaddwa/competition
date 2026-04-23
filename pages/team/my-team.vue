<template>
	<view class="page">
		<scroll-view scroll-y class="scroll">
			<view class="header">
				<text class="title">我的团队</text>
				<text class="sub">按部门展示员工</text>
			</view>

			<view v-if="loading" class="empty">加载中...</view>
			<view v-else-if="groups.length === 0" class="empty">暂无员工</view>
			<view v-else>
				<view v-for="g in groups" :key="g.department" class="dept-card">
					<view class="dept-head">
						<text class="dept-name">{{ g.department }}</text>
						<text class="dept-count">{{ g.items.length }}人</text>
					</view>
					<view v-for="a in g.items" :key="a.id" class="member-row" @click="viewAgent(a)">
						<view class="avatar">{{ avatarLetter(a.displayName || a.name) }}</view>
						<view class="member-main">
							<text class="member-name">{{ a.displayName || a.name || "未命名 Agent" }}</text>
							<text class="member-sub">{{ a.jobTitle || a.rolePosition || "-" }}</text>
						</view>
						<text class="arrow">›</text>
					</view>
				</view>
			</view>
			<view class="pad" />
		</scroll-view>

		<view class="footer">
			<button class="btn" @click="goCreateAgent">＋ 招聘新员工</button>
		</view>
	</view>
</template>

<script>
import { listMyUserAgents, getUserAgentById } from "@/clientApi/agentsApi";
import { getApiErrorMessage } from "@/utils/apiHelpers";

export default {
	data() {
		return {
			loading: false,
			agents: [],
		};
	},
	computed: {
		groups() {
			const map = new Map();
			for (const row of this.agents) {
				const key = String(row?.department || "未分配部门").trim() || "未分配部门";
				if (!map.has(key)) map.set(key, []);
				map.get(key).push(row);
			}
			return Array.from(map.entries()).map(([department, items]) => ({ department, items }));
		},
	},
	onShow() {
		this.loadAgents();
	},
	methods: {
		async loadAgents() {
			this.loading = true;
			try {
				const list = await listMyUserAgents();
				this.agents = Array.isArray(list) ? list : [];
			} catch (e) {
				this.agents = [];
				uni.showToast({ title: getApiErrorMessage(e) || "加载员工失败", icon: "none" });
			} finally {
				this.loading = false;
			}
		},
		avatarLetter(name) {
			const s = String(name || "").trim();
			return s ? s.slice(0, 1) : "员";
		},
		async viewAgent(agent) {
			const id = agent?.id;
			if (!id) return;
			try {
				const full = await getUserAgentById(id);
				uni.showModal({
					title: full?.displayName || "Agent详情",
					content: `职位：${full?.jobTitle || "-"}\n部门：${full?.department || "-"}\n主要工作：${full?.mainWork || "-"}`,
					showCancel: false,
				});
			} catch {
				//
			}
		},
		goCreateAgent() {
			uni.navigateTo({ url: "/pages/team/create-agent" });
		},
	},
};
</script>

<style>
.page { min-height: 100vh; background: #eef2f7; display: flex; flex-direction: column; }
.scroll { flex: 1; height: 0; padding: 20rpx; box-sizing: border-box; }
.header { padding: 8rpx 6rpx 14rpx; }
.title { display: block; font-size: 42rpx; font-weight: 700; color: #0f172a; }
.sub { display: block; margin-top: 8rpx; font-size: 24rpx; color: #64748b; }
.empty { margin-top: 20rpx; background: #fff; border-radius: 16rpx; padding: 48rpx 20rpx; text-align: center; color: #94a3b8; font-size: 28rpx; }
.dept-card { background: #fff; border-radius: 16rpx; padding: 8rpx 0; margin-bottom: 14rpx; }
.dept-head { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 20rpx; border-bottom: 1rpx solid #eef2f7; }
.dept-name { font-size: 30rpx; font-weight: 700; color: #1e293b; }
.dept-count { font-size: 24rpx; color: #64748b; }
.member-row { display: flex; align-items: center; padding: 20rpx; border-bottom: 1rpx solid #f8fafc; }
.member-row:last-child { border-bottom: none; }
.avatar { width: 64rpx; height: 64rpx; border-radius: 14rpx; background: #5b7bb2; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 32rpx; font-weight: 700; margin-right: 16rpx; }
.member-main { flex: 1; min-width: 0; }
.member-name { display: block; font-size: 30rpx; color: #0f172a; font-weight: 600; }
.member-sub { display: block; margin-top: 6rpx; font-size: 24rpx; color: #64748b; }
.arrow { color: #cbd5e1; font-size: 34rpx; }
.pad { height: 120rpx; }
.footer { padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom)); background: #eef2f7; }
.btn { width: 100%; height: 86rpx; line-height: 86rpx; border-radius: 43rpx; background: linear-gradient(135deg, #2563eb, #4f46e5) !important; color: #fff !important; font-size: 32rpx; font-weight: 700; }
</style>
