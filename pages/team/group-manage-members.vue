<template>
	<scroll-view scroll-y class="page">
		<text class="hint">{{ t("group_manage_sub") }}</text>
		<view v-if="!group" class="empty">{{ t("load_failed_short") }}</view>
		<view v-else class="list">
			<view
				v-for="row in memberRows"
				:key="row.id"
				class="row"
				hover-class="row-hover"
				@click="onTapMember(row)"
			>
				<view class="row-left">
					<text class="row-title">{{ row.navTitle }}</text>
					<text v-if="row.badge" class="row-badge">{{ row.badge }}</text>
				</view>
				<text class="row-model">{{ row.modelShort }}</text>
				<text class="row-arrow">›</text>
			</view>
		</view>
	</scroll-view>
</template>

<script>
	import { getUserInfo } from "@/utils/index";
	import {
		getProjectGroupById,
		loadDigitalAgents,
		removeGroupMember,
		setGroupMemberAdminFlag,
		resolveGroupOwnerAgentId,
		VT_GROUP_OWNER_USER,
		formatAgentNavTitle,
		displayAgentName,
	} from "@/utils/virtualTeamStore";
	import { t, getLanguage } from "@/utils/lang";
	import { getAgentModelOrDefault } from "@/utils/agentModelMap";

	export default {
		data() {
			return {
				groupId: "",
				kind: "group",
				group: null,
			};
		},
		computed: {
			memberRows() {
				if (this.kind === "hq") {
					return loadDigitalAgents().map((m) => {
						const id = String(m?.id || "").trim();
						const navTitle =
							formatAgentNavTitle({ name: m.name, role: m.role }) || displayAgentName(m) || m.name || id;
						const full = String(m?.model || "").trim() || (id ? getAgentModelOrDefault(id) : "");
						const modelShort = full ? (full.length > 18 ? `${full.slice(0, 16)}…` : full) : "—";
						return { id, navTitle, modelShort, badge: "", isOwner: false, isUserOwner: false, isAdmin: false, raw: m };
					});
				}
				const g = this.group;
				if (!g || !Array.isArray(g.members)) return [];
				const ownerId = resolveGroupOwnerAgentId(g);
				const u = getUserInfo() || {};
				const meName =
					String(u.nickname || u.name || u.username || this.t("home_sender_me")).trim() ||
					this.t("home_sender_me");
				const ownerRow = {
					id: VT_GROUP_OWNER_USER,
					navTitle: meName,
					modelShort: "—",
					badge: this.t("group_badge_owner"),
					isOwner: true,
					isUserOwner: true,
					isAdmin: false,
					raw: null,
				};
				const rest = g.members.map((m) => {
					const id = String(m?.id || m?.agentId || "").trim();
					const navTitle =
						formatAgentNavTitle({ name: m.name, role: m.role }) || displayAgentName(m) || m.name || id;
					const full = String(m?.model || "").trim() || (id ? getAgentModelOrDefault(id) : "");
					const modelShort = full ? (full.length > 18 ? `${full.slice(0, 16)}…` : full) : "—";
					let badge = "";
					if (id && id === ownerId && ownerId !== VT_GROUP_OWNER_USER) badge = this.t("group_badge_owner");
					else if (m.isAdmin) badge = this.t("group_badge_admin");
					return { id, navTitle, modelShort, badge, isOwner: id === ownerId && ownerId !== VT_GROUP_OWNER_USER, isUserOwner: false, isAdmin: !!m.isAdmin, raw: m };
				});
				return [ownerRow, ...rest];
			},
		},
		onLoad(options) {
			this.kind = options && options.kind ? String(decodeURIComponent(options.kind)).trim().toLowerCase() : "group";
			this.groupId = options && options.groupId ? String(decodeURIComponent(options.groupId)).trim() : "";
			if (this.kind === "hq") {
				const gname = options && options.gname ? decodeURIComponent(options.gname) : this.t("hq_group");
				try {
					if (gname) uni.setNavigationBarTitle({ title: gname });
				} catch {
					//
				}
				return;
			}
			const gname = options && options.gname ? decodeURIComponent(options.gname) : "";
			if (!this.groupId) {
				uni.showToast({ title: this.t("load_failed_short"), icon: "none" });
				setTimeout(() => uni.navigateBack(), 400);
				return;
			}
			try {
				if (gname) uni.setNavigationBarTitle({ title: gname });
			} catch {
				//
			}
		},
		onShow() {
			this.refresh();
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			refresh() {
				if (this.kind === "hq") return;
				this.group = getProjectGroupById(this.groupId);
				if (!this.group) {
					uni.showToast({ title: this.t("load_failed_short"), icon: "none" });
				}
			},
			onTapMember(row) {
				if (!row) return;
				if (this.kind === "hq") {
					uni.navigateTo({
						url: `/pages/chat/chat?mode=virtual&kind=agent&id=${encodeURIComponent(row.id)}&title=${encodeURIComponent(row.navTitle || this.t("digital_employee_fallback"))}`,
					});
					return;
				}
				if (row.isUserOwner) {
					uni.showToast({ title: this.t("group_owner_is_me"), icon: "none" });
					return;
				}
				if (row.isOwner) {
					uni.showToast({ title: this.t("group_manage_owner_hint"), icon: "none" });
					return;
				}
				const items = [];
				const actions = [];
				if (!row.isAdmin) {
					items.push(this.t("group_action_set_admin"));
					actions.push("setAdmin");
				} else {
					items.push(this.t("group_action_unset_admin"));
					actions.push("unsetAdmin");
				}
				items.push(this.t("group_action_remove"));
				actions.push("remove");
				uni.showActionSheet({
					itemList: items,
					success: (res) => {
						const act = actions[res.tapIndex];
						if (act === "remove") this.confirmRemove(row);
						else if (act === "setAdmin") this.applyAdmin(row, true);
						else if (act === "unsetAdmin") this.applyAdmin(row, false);
					},
				});
			},
			applyAdmin(row, flag) {
				const r = setGroupMemberAdminFlag(this.groupId, row.id, flag);
				if (!r.ok) {
					if (r.code === "OWNER") uni.showToast({ title: this.t("toast_group_manage_owner"), icon: "none" });
					else uni.showToast({ title: this.t("load_failed_short"), icon: "none" });
					return;
				}
				if (r.unchanged) return;
				uni.showToast({ title: flag ? this.t("group_manage_admin_on") : this.t("group_manage_admin_off"), icon: "success" });
				this.refresh();
			},
			confirmRemove(row) {
				uni.showModal({
					title: this.t("cs_group_manage"),
					content: this.t("group_manage_remove_confirm", { name: row.navTitle }),
					success: (res) => {
						if (!res.confirm) return;
						const r = removeGroupMember(this.groupId, row.id);
						if (!r.ok) {
							if (r.code === "OWNER") uni.showToast({ title: this.t("toast_group_manage_owner"), icon: "none" });
							else if (r.code === "LAST_MEMBER")
								uni.showToast({ title: this.t("toast_group_manage_last"), icon: "none" });
							else if (r.code === "NOT_IN_GROUP")
								uni.showToast({ title: this.t("toast_group_manage_not_in_group"), icon: "none" });
							else uni.showToast({ title: this.t("load_failed_short"), icon: "none" });
							return;
						}
						uni.showToast({ title: this.t("group_manage_removed"), icon: "success" });
						this.refresh();
					},
				});
			},
		},
	};
</script>

<style scoped>
	.page {
		min-height: 100vh;
		max-height: 100vh;
		background: #ededed;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.hint {
		display: block;
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.45;
		margin-bottom: 24rpx;
		padding: 0 8rpx;
	}
	.empty {
		font-size: 28rpx;
		color: #94a3b8;
		text-align: center;
		padding: 48rpx;
	}
	.list {
		background: #fff;
		border-radius: 12rpx;
		overflow: hidden;
		border: 1rpx solid #e8e8ed;
	}
	.row {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 24rpx 20rpx;
		border-bottom: 1rpx solid #f1f5f9;
	}
	.row:last-child {
		border-bottom: none;
	}
	.row-hover {
		background: #f8fafc;
	}
	.row-left {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		gap: 10rpx;
	}
	.row-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #0f172a;
	}
	.row-badge {
		font-size: 20rpx;
		color: #2563eb;
		background: #eff6ff;
		padding: 2rpx 12rpx;
		border-radius: 999rpx;
		border: 1rpx solid rgba(37, 99, 235, 0.25);
	}
	.row-model {
		font-size: 22rpx;
		color: #64748b;
		max-width: 200rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-right: 8rpx;
	}
	.row-arrow {
		font-size: 32rpx;
		color: #cbd5e1;
		font-weight: 300;
	}
</style>
