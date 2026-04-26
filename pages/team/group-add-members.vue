<template>
	<scroll-view scroll-y class="page">
		<text class="hint">{{ t("group_invite_hint") }}</text>
		<view class="section-t">{{ t("cs_group_invite_members") }}</view>
		<view class="card">
			<view v-if="loadingEmployees" class="hint">{{ t("loading") }}</view>
			<view v-else-if="candidateAgents.length === 0" class="hint">{{ t("group_invite_none_available") }}</view>
			<view v-else>
				<view
					v-for="emp in candidateAgents"
					:key="emp.id"
					class="member-row"
					:class="{ 'member-row-active': selectedEmployeeIds.includes(emp.id) }"
					@tap="toggleMember(emp.id)"
				>
					<view class="member-check">{{ selectedEmployeeIds.includes(emp.id) ? "✓" : "" }}</view>
					<view class="member-main">
						<view class="member-name-row">
							<text class="member-name">{{ emp.name }}</text>
							<text class="member-model-pill">{{ modelShort(emp.id) }}</text>
						</view>
						<text class="member-meta">{{ emp.department || "—" }} · {{ emp.role || t("vt_member_default") }}</text>
					</view>
				</view>
			</view>
		</view>

		<button class="btn" type="primary" :loading="busy" :disabled="busy || candidateAgents.length === 0" @click="submit">
			{{ t("cs_group_invite_members") }}
		</button>
		<view class="foot-pad" />
	</scroll-view>
</template>

<script>
	import { addMembersToProjectGroup, getProjectGroupById } from "@/utils/virtualTeamStore";
	import { appendGroupInviteWelcomeFlow } from "@/utils/groupWelcome";
	import { t, getLanguage } from "@/utils/lang";

	function defaultModelLabel() {
		return getLanguage() === "en" ? "Default model" : "默认模型";
	}
	import { listMyUserAgents, listUserAgents } from "@/clientApi/agentsApi";
	import { getAgentModelOrDefault } from "@/utils/agentModelMap";

	export default {
		data() {
			return {
				groupId: "",
				loadingEmployees: false,
				employeeOptions: [],
				selectedEmployeeIds: [],
				busy: false,
			};
		},
		computed: {
			inGroupIdSet() {
				const g = getProjectGroupById(this.groupId);
				const arr = Array.isArray(g?.members) ? g.members : [];
				return new Set(arr.map((m) => String(m?.id || m?.agentId || "").trim()).filter(Boolean));
			},
			candidateAgents() {
				return this.employeeOptions.filter((e) => e.id && !this.inGroupIdSet.has(e.id));
			},
		},
		onLoad(options) {
			this.groupId = options && options.groupId ? decodeURIComponent(options.groupId) : "";
			const gname = options && options.gname ? decodeURIComponent(options.gname) : "";
			if (!this.groupId || !getProjectGroupById(this.groupId)) {
				uni.showToast({ title: this.t("load_failed_short"), icon: "none" });
				setTimeout(() => uni.navigateBack(), 500);
				return;
			}
			try {
				if (gname) uni.setNavigationBarTitle({ title: gname });
			} catch {
				//
			}
		},
		onShow() {
			this.loadEmployees();
			this.selectedEmployeeIds = this.selectedEmployeeIds.filter((id) =>
				this.candidateAgents.some((e) => e.id === id)
			);
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			async loadEmployees() {
				this.loadingEmployees = true;
				try {
					let rows = await listMyUserAgents();
					if (!Array.isArray(rows) || rows.length === 0) {
						rows = await listUserAgents();
					}
					this.employeeOptions = (Array.isArray(rows) ? rows : [])
						.map((r) => ({
							id: String(r?.id || r?.agentId || "").trim(),
							name: String(r?.displayName || r?.name || "").trim(),
							role: String(r?.jobTitle || r?.rolePosition || "").trim(),
							department: String(r?.department || "").trim(),
							avatar: String(r?.avatar || r?.avatarUrl || r?.headImg || r?.headimg || "").trim(),
						}))
						.filter((r) => r.id && r.name);
				} catch {
					this.employeeOptions = [];
					uni.showToast({ title: this.t("load_failed_short"), icon: "none" });
				} finally {
					this.loadingEmployees = false;
				}
			},
			toggleMember(id) {
				const i = this.selectedEmployeeIds.indexOf(id);
				if (i >= 0) this.selectedEmployeeIds.splice(i, 1);
				else this.selectedEmployeeIds.push(id);
			},
			modelShort(agentId) {
				const s = String(getAgentModelOrDefault(agentId) || "").trim();
				if (!s) return defaultModelLabel();
				return s.length > 26 ? `${s.slice(0, 24)}…` : s;
			},
			async submit() {
				if (!this.selectedEmployeeIds.length) {
					uni.showToast({ title: this.t("group_invite_pick_first"), icon: "none" });
					return;
				}
				const rows = this.candidateAgents
					.filter((e) => this.selectedEmployeeIds.includes(e.id))
					.map((e) => ({
						...e,
						model: getAgentModelOrDefault(e.id),
					}));
				this.busy = true;
				try {
					const { added } = addMembersToProjectGroup(this.groupId, rows);
					if (!added.length) {
						uni.showToast({ title: this.t("group_invite_already_all"), icon: "none" });
						return;
					}
					await appendGroupInviteWelcomeFlow(this.groupId, added);
					uni.showToast({ title: this.t("group_invite_added"), icon: "success" });
					setTimeout(() => uni.navigateBack(), 450);
				} catch (e) {
					console.warn("[group-add-members]", e);
					uni.showToast({ title: this.t("load_failed_short"), icon: "none" });
				} finally {
					this.busy = false;
				}
			},
		},
	};
</script>

<style>
	.page {
		min-height: 100vh;
		max-height: 100vh;
		background: #ededed;
		padding: 32rpx 24rpx 0;
		box-sizing: border-box;
	}
	.section-t {
		font-size: 28rpx;
		font-weight: 700;
		color: #888;
		margin: 8rpx 0 16rpx 8rpx;
	}
	.card {
		background: #fff;
		border-radius: 12rpx;
		padding: 28rpx;
		margin-bottom: 20rpx;
	}
	.hint {
		display: block;
		margin-bottom: 20rpx;
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.45;
		padding: 0 8rpx;
	}
	.member-row {
		display: flex;
		align-items: center;
		padding: 14rpx 0;
		border-bottom: 1rpx solid #f1f5f9;
	}
	.member-row-active {
		background: #f8fbff;
	}
	.member-check {
		width: 36rpx;
		height: 36rpx;
		line-height: 36rpx;
		text-align: center;
		border-radius: 50%;
		border: 1rpx solid #2563eb;
		color: #2563eb;
		font-size: 24rpx;
		margin-right: 12rpx;
	}
	.member-main {
		flex: 1;
		min-width: 0;
	}
	.member-name-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10rpx;
	}
	.member-name {
		font-size: 28rpx;
		color: #0f172a;
		font-weight: 600;
	}
	.member-model-pill {
		font-size: 20rpx;
		color: #475569;
		background: #f1f5f9;
		padding: 2rpx 12rpx;
		border-radius: 999rpx;
		border: 1rpx solid rgba(148, 163, 184, 0.4);
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.member-meta {
		display: block;
		margin-top: 4rpx;
		font-size: 22rpx;
		color: #64748b;
	}
	.btn {
		margin-top: 32rpx;
	}
	.foot-pad {
		height: 48rpx;
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
