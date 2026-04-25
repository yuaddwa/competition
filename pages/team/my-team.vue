<template>
	<view class="page">
		<scroll-view scroll-y class="scroll">
			<view class="header">
				<text class="title">我的团队</text>
				<text class="sub">{{ isDepartmentMode ? `${currentDepartment} · 员工列表` : "按部门查看员工" }}</text>
			</view>

			<view v-if="loading" class="empty">加载中...</view>
			<view v-else-if="isDepartmentMode && currentMembers.length === 0" class="empty">该部门暂无员工</view>
			<view v-else-if="!isDepartmentMode && groups.length === 0" class="empty">暂无部门</view>
			<view v-else-if="isDepartmentMode">
				<view class="dept-card">
					<view v-for="a in currentMembers" :key="a.id" class="member-row" @tap="goChat(a)">
						<view class="avatar">{{ avatarLetter(displayMemberName(a)) }}</view>
						<view class="member-main">
							<text class="member-name">{{ displayMemberName(a) }}</text>
							<text class="member-sub">{{ memberRole(a) }}</text>
						</view>
						<text class="arrow">›</text>
					</view>
				</view>
			</view>
			<view v-else>
				<view v-for="g in groups" :key="g.department" class="dept-card">
					<view class="dept-head dept-row" @tap="openDepartment(g.department)">
						<text class="dept-name">{{ g.department }}</text>
						<view class="dept-right">
							<text class="dept-count">{{ g.items.length }}人</text>
							<text class="arrow">›</text>
						</view>
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
import { listMyUserAgents, listUserAgentDepartments } from "@/clientApi/agentsApi";
import { getApiErrorMessage } from "@/utils/apiHelpers";
import { agentNameToZh, departmentToZh, normalizeDeptKey, roleToZh } from "@/utils/agentDisplayZh";
import { buildMessageDepartmentBlocks } from "@/utils/messageDepartmentConfig";

export default {
	data() {
		return {
			loading: false,
			agents: [],
			currentDepartment: "",
			departmentMap: {},
			departmentPool: [],
		};
	},
	computed: {
		isDepartmentMode() {
			return !!this.currentDepartment;
		},
		groups() {
			const map = new Map();
			for (const row of this.agents) {
				const key = departmentToZh(row?.department, this.departmentMap);
				if (!map.has(key)) map.set(key, []);
				map.get(key).push(row);
			}
			const fromAgents = Array.from(map.entries()).map(([department, items]) => ({ department, items }));
			const existing = new Set(fromAgents.map((g) => String(g.department || "").trim()).filter(Boolean));
			const poolExtras = (this.departmentPool || [])
				.filter((d) => d && !existing.has(d))
				.map((d) => ({ department: d, items: [] }));
			const all = [...fromAgents, ...poolExtras];
			all.sort((a, b) => String(a.department || "").localeCompare(String(b.department || ""), "zh-Hans-CN"));
			return all;
		},
		currentMembers() {
			if (!this.isDepartmentMode) return [];
			const hit = this.groups.find((x) => x.department === this.currentDepartment);
			return hit ? hit.items : [];
		},
	},
	onLoad(options) {
		const raw = String(options?.department || "").trim();
		try {
			this.currentDepartment = raw ? decodeURIComponent(raw) : "";
		} catch {
			this.currentDepartment = raw;
		}
	},
	onShow() {
		try {
			uni.setNavigationBarTitle({
				title: this.isDepartmentMode ? this.currentDepartment : "我的团队",
			});
		} catch {
			//
		}
		this.loadAgents();
	},
	methods: {
		async loadAgents() {
			this.loading = true;
			try {
				await this.loadDepartmentMap();
				const list = await listMyUserAgents();
				this.agents = Array.isArray(list) ? list : [];
				if (this.currentDepartment) {
					this.currentDepartment = departmentToZh(this.currentDepartment, this.departmentMap);
					try {
						uni.setNavigationBarTitle({ title: this.currentDepartment });
					} catch {
						//
					}
				}
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
		async loadDepartmentMap() {
			try {
				const list = await listUserAgentDepartments();
				const map = {};
				const pool = [];
				(Array.isArray(list) ? list : []).forEach((item) => {
					if (typeof item === "string") {
						const n = item.trim();
						if (!n) return;
						const zh = departmentToZh(n);
						map[normalizeDeptKey(n)] = zh;
						pool.push(zh);
						return;
					}
					const id = String(item?.id || "").trim();
					const name = String(item?.name || "").trim();
					const zh = departmentToZh(name || id);
					if (id) map[normalizeDeptKey(id)] = zh;
					if (name) map[normalizeDeptKey(name)] = zh;
					if (zh) pool.push(zh);
				});
				this.departmentMap = map;
				const messagePool = buildMessageDepartmentBlocks()
					.map((b) => String(b.title || "").trim())
					.filter(Boolean);
				this.departmentPool = [...new Set([...messagePool, ...pool.filter(Boolean)])];
			} catch {
				this.departmentMap = {};
				this.departmentPool = buildMessageDepartmentBlocks()
					.map((b) => String(b.title || "").trim())
					.filter(Boolean);
			}
		},
		openDepartment(department) {
			const d = String(department || "").trim();
			if (!d) return;
			uni.navigateTo({
				url: `/pages/team/my-team?department=${encodeURIComponent(d)}`,
			});
		},
		goChat(agent) {
			const id = agent?.id;
			if (!id) return;
			uni.navigateTo({
				url: `/pages/chat/chat?mode=virtual&kind=agent&id=${encodeURIComponent(id)}`,
				fail: () => uni.showToast({ title: "打开会话失败", icon: "none" }),
			});
		},
		memberRole(agent) {
			return roleToZh(agent?.jobTitle || agent?.rolePosition || "") || "-";
		},
		displayMemberName(agent) {
			const raw = String(agent?.displayName || agent?.name || "").trim();
			return agentNameToZh(raw) || "未命名员工";
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
.dept-row { border-bottom: none; }
.dept-right { display: flex; align-items: center; column-gap: 12rpx; }
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
