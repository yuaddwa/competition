<template>
	<view class="page-root">
		<view class="navbar-wrap" :style="{ paddingTop: statusBarPx + 'px' }">
			<view class="msg-top">
				<view class="msg-top-left">
					<view class="msg-title-row">
						<text class="msg-page-title">{{ t("message") }}</text>
						<view class="msg-title-dot" />
					</view>
					<text class="msg-page-sub">{{ t("message_page_subtitle") }}</text>
				</view>
				<view class="msg-top-actions">
					<view v-if="isDeletingDept" class="msg-done-pill" @tap="showAddMenu">
						<text class="msg-done-t">{{ t("done") }}</text>
					</view>
					<template v-else>
						<view class="msg-head-circle" @tap="openSearch">
							<text class="msg-head-ico">🔍</text>
						</view>
						<view class="msg-head-circle msg-head-circle-primary" @tap="showAddMenu">
							<text class="msg-head-plus">＋</text>
						</view>
					</template>
				</view>
			</view>

			<view class="seg-outer">
				<view class="seg-bar">
					<view class="seg-item" :class="{ 'seg-active': messageTab === 0 }" @tap="messageTab = 0">
						<text class="seg-emoji">💬</text>
						<text class="seg-label">{{ t("conversation") }}</text>
						<view v-if="messageTab === 0" class="seg-line" />
					</view>
					<view class="seg-item seg-item-wide" :class="{ 'seg-active': messageTab === 1 }" @tap="messageTab = 1">
						<text class="seg-emoji">📁</text>
						<text class="seg-label seg-label-shrink">{{ t("collaboration") }}</text>
						<view class="seg-mini-avs">
							<view
								v-for="(a, ix) in deptTabAvatars"
								:key="ix"
								class="seg-mini-av"
								:style="{ marginLeft: ix ? '-10rpx' : '0', zIndex: 3 - ix, background: a.bg }"
							>
								<text class="seg-mini-t">{{ a.t }}</text>
							</view>
						</view>
						<text class="seg-chev">›</text>
						<view v-if="messageTab === 1" class="seg-line" />
					</view>
				</view>
			</view>

			<scroll-view v-if="messageTab === 0" scroll-x class="chip-scroll" :show-scrollbar="false">
				<view class="chip-row">
					<view class="chip-card" :class="{ 'chip-on': quickFilter === 'all' }" @tap="quickFilter = 'all'">
						<text class="chip-ico chip-ico-blue">💬</text>
						<text class="chip-t">{{ t("msg_chip_all") }}</text>
						<view class="chip-badge"><text class="chip-badge-n">{{ quickCounts.all }}</text></view>
					</view>
					<view class="chip-card" :class="{ 'chip-on': quickFilter === 'at' }" @tap="quickFilter = 'at'">
						<text class="chip-ico">@</text>
						<text class="chip-t">{{ t("msg_chip_at") }}</text>
						<view class="chip-badge"><text class="chip-badge-n">{{ quickCounts.at }}</text></view>
					</view>
					<view class="chip-card" :class="{ 'chip-on': quickFilter === 'unread' }" @tap="quickFilter = 'unread'">
						<text class="chip-ico">🔔</text>
						<text class="chip-t">{{ t("msg_chip_unread") }}</text>
						<view class="chip-badge"><text class="chip-badge-n">{{ quickCounts.unread }}</text></view>
					</view>
					<view class="chip-card" :class="{ 'chip-on': quickFilter === 'later' }" @tap="quickFilter = 'later'">
						<text class="chip-ico chip-ico-warn">🕐</text>
						<text class="chip-t">{{ t("msg_chip_later") }}</text>
					</view>
					<view class="chip-card" :class="{ 'chip-on': quickFilter === 'star' }" @tap="quickFilter = 'star'">
						<text class="chip-ico chip-ico-star">⭐</text>
						<text class="chip-t">{{ t("msg_chip_star") }}</text>
					</view>
				</view>
			</scroll-view>

			<view v-if="messageTab === 0" class="filter-bar">
				<view class="filter-left">
					<text class="filter-arrow">▼</text>
					<text class="filter-t">{{ t("msg_filter_expand") }}</text>
				</view>
				<view class="filter-right" @tap="onFilterTap">
					<text class="filter-ico">⚙</text>
					<text class="filter-action">{{ t("filter_action") }}</text>
				</view>
			</view>
		</view>

		<scroll-view scroll-y class="feed-scroll" :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
			<view v-if="messageTab === 1" class="tip-line">
				<text class="tip-t">{{ t("department_tip") }}</text>
			</view>

			<view v-if="loading" class="wx-loading"><text>{{ t('loading') }}</text></view>
			<template v-else>
				<template v-if="messageTab === 0">
					<view v-if="displayRows.length === 0" class="msg-empty-card">
						<text class="msg-empty-emoji">💬</text>
						<text class="msg-empty-t">{{ t('no_conversation') }}</text>
						<text class="msg-empty-sub">{{ t('create_group_agent') }}</text>
					</view>
					<view v-else class="msg-list">
						<view
							v-for="row in displayRows"
							:key="row.id"
							class="swipe-wrap"
							@touchstart="onRowTouchStart($event, row)"
							@touchmove="onRowTouchMove($event, row)"
							@touchend="onRowTouchEnd(row)"
						>
							<view v-if="swipeRowId === row.id" class="swipe-actions">
								<view class="swipe-pin" @tap.stop="onPinRow(row)">{{ isRowPinned(row) ? '取消置顶' : '置顶' }}</view>
								<view class="swipe-delete" @tap.stop="onDeleteRow(row)">删除</view>
							</view>
							<view class="msg-row-card" :class="{ 'msg-row-open': swipeRowId === row.id }" hover-class="msg-row-card-hover" @click="onRowTap(row)">
								<view class="msg-avatar" :style="{ background: avatarBg(row) }">
									<text class="msg-avatar-t">{{ avatarLetter(row) }}</text>
								</view>
								<view class="msg-body">
									<view class="msg-row-top">
										<view class="msg-title-wrap">
											<text class="msg-title">{{ row.title }}</text>
											<text v-if="isRowPinned(row)" class="msg-tag msg-tag-pin">{{ t("tag_pinned") }}</text>
											<text v-if="isRowWorkflow(row)" class="msg-tag msg-tag-run">{{ t("tag_in_progress") }}</text>
											<text v-if="row.badge && !isRowWorkflow(row)" class="msg-pill">{{ row.badge }}</text>
										</view>
										<view class="msg-col-right">
											<text class="msg-time">{{ formatRowTime(row.time) }}</text>
											<view class="msg-right-badges">
												<view v-if="row.unread > 0" class="msg-unread">{{ row.unread > 99 ? "99+" : row.unread }}</view>
												<text v-if="isRowPinned(row)" class="msg-pin-ico">📌</text>
											</view>
										</view>
									</view>
									<text class="msg-preview msg-preview-2">{{ row.subtitle }}</text>
									<view v-if="rowTagPills(row).length" class="msg-tag-row">
										<text v-for="(tg, ti) in rowTagPills(row)" :key="ti" class="msg-tag-pill">{{ tg }}</text>
									</view>
								</view>
							</view>
						</view>
					</view>
				</template>

				<template v-if="messageTab === 1">
					<view class="msg-list">
						<view
							v-for="block in departmentBlocks"
							:key="block.slug"
							class="msg-row-card msg-row-dept"
							:class="{ 'msg-row-deleting': isDeletingDept }"
							hover-class="msg-row-card-hover"
							@tap="isDeletingDept ? null : goDepartmentRoles(block)"
						>
							<image class="msg-dept-icon" :src="block.icon" mode="aspectFit" />
							<view class="msg-body">
								<view class="msg-row-top">
									<view class="msg-title-wrap">
										<text class="msg-title">{{ block.title }}</text>
									</view>
									<text class="msg-dept-count">{{ block.count }}{{ t('role_count_suffix') }}</text>
								</view>
								<text v-if="block.desc" class="msg-preview msg-preview-multi">{{ block.desc }}</text>
							</view>
							<text v-if="!isDeletingDept" class="msg-chevron">›</text>
							<text v-else class="msg-dept-delete" @tap.stop="removeDepartment(block)">×</text>
						</view>
					</view>
				</template>
			</template>
			<view class="wx-pad"></view>
		</scroll-view>

		<AppTabBar current="message"></AppTabBar>

		<view v-if="showAddDeptPopup" class="mask" @click="closeAddDeptPopup">
			<view class="add-dept-popup" @click.stop>
				<view class="popup-header">
					<text class="popup-title">{{ t('add_department') }}</text>
					<text class="popup-close" @click="closeAddDeptPopup">×</text>
				</view>
				<view class="add-dept-create">
					<input class="add-dept-input" v-model="newDeptName" placeholder="输入新部门名" placeholder-class="add-dept-input-ph" />
					<button class="add-dept-create-btn" :loading="addingDept" @click="createDepartment">新增并添加</button>
				</view>
				<scroll-view scroll-y class="add-dept-list">
					<view v-if="availableDepts.length === 0" class="add-dept-empty">
						<text>{{ t('no_department_to_add') }}</text>
					</view>
					<view
						v-for="dept in availableDepts"
						:key="dept.slug"
						class="add-dept-item"
						:class="{ 'add-dept-selected': selectedAddDepts.includes(dept.slug) }"
						@click="toggleAddDept(dept.slug)"
					>
						<view class="add-dept-check-box">
							<text v-if="selectedAddDepts.includes(dept.slug)" class="add-dept-check">✓</text>
						</view>
						<text class="add-dept-name">{{ dept.title }}</text>
					</view>
				</scroll-view>
				<view class="popup-footer">
					<button class="popup-btn" :disabled="!selectedAddDepts.length" @click="confirmAddDepts">
						{{ t('confirm_add') }} ({{ selectedAddDepts.length }})
					</button>
				</view>
			</view>
		</view>

		<view v-if="showQuickMenu" class="sheet-mask" @tap.self="closeQuickMenu">
			<view class="sheet-panel" @tap.stop>
				<view class="sheet-handle" />
				<view
					v-for="item in quickMenuItems"
					:key="item.key"
					class="sheet-row"
					@tap="onQuickMenuSelect(item)"
				>
					<text class="sheet-row-t">{{ item.label }}</text>
				</view>
				<view class="sheet-cancel" @tap="closeQuickMenu">
					<text class="sheet-cancel-t">{{ t('cancel') }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import AppTabBar from "@/components/AppTabBar.vue";
	import * as agentsApi from "@/clientApi/agentsApi";
	import { listMyUserAgents } from "@/clientApi/agentsApi";
	import { getApiErrorMessage } from "@/utils/apiHelpers";
	import { t, getLanguage } from "@/utils/lang";
	import { loadUnifiedConversationList } from "@/utils/conversationInbox";
	import {
		buildMessageDepartmentBlocks,
		getCustomDepartments,
		setCustomDepartments,
		getHiddenDepartments,
		setHiddenDepartments,
		FALLBACK_ICON,
	} from "@/utils/messageDepartmentConfig";
	import { departmentToZh, normalizeDeptKey } from "@/utils/agentDisplayZh";
	import { deleteProjectGroupById, clearVirtualChatMessages, touchAgentLastMsg } from "@/utils/virtualTeamStore";

	export default {
		components: { AppTabBar },
		data() {
			return {
				statusBarPx: 20,
				departmentBlocks: [],
				feedRows: [],
				briefing: {
					managerSummary: "",
					scheduleNote: "",
					managerTime: "",
					employeeLines: [],
				},
				refreshing: false,
				loading: true,
				/** 0 会话 · 1 协作与部门 */
				messageTab: 0,
				isDeletingDept: false,
				showAddDeptPopup: false,
				showQuickMenu: false,
				quickMenuItems: [],
				availableDepts: [],
				selectedAddDepts: [],
				newDeptName: "",
				addingDept: false,
				listReqId: 0,
				lastLoadedAt: 0,
				lastSuccessFeedRows: [],
				departmentMap: {},
				apiDepartmentRows: [],
				swipeRowId: "",
				swipeStartX: 0,
				swipeDeltaX: 0,
				quickFilter: "all",
			};
		},
		computed: {
			deptTabAvatars() {
				const blocks = this.departmentBlocks || [];
				const gradient = [
					"linear-gradient(145deg,#ec4899,#f9a8d4)",
					"linear-gradient(145deg,#f59e0b,#fcd34d)",
					"linear-gradient(145deg,#3b82f6,#93c5fd)",
				];
				return blocks.slice(0, 3).map((b, i) => ({
					t: (b.title || "?").slice(0, 1),
					bg: gradient[i % gradient.length],
				}));
			},
			quickCounts() {
				const rows = this.feedRows || [];
				return {
					all: rows.length,
					at: rows.filter((r) => /[@＠]/.test(`${r.subtitle || ""}${r.title || ""}`)).length,
					unread: rows.filter((r) => (r.unread || 0) > 0).length,
					later: rows.filter(
						(r) => (r.unread || 0) > 0 && (r.convType === "workflow" || r.convType === "vgroup")
					).length,
					star: rows.filter((r) => this.isRowPinned(r)).length,
				};
			},
			displayRows() {
				const rows = this.feedRows || [];
				const f = this.quickFilter;
				if (f === "at") {
					return rows.filter((r) => /[@＠]/.test(`${r.subtitle || ""}${r.title || ""}`));
				}
				if (f === "unread") {
					return rows.filter((r) => (r.unread || 0) > 0);
				}
				if (f === "later") {
					return rows.filter(
						(r) => (r.unread || 0) > 0 && (r.convType === "workflow" || r.convType === "vgroup")
					);
				}
				if (f === "star") {
					return rows.filter((r) => this.isRowPinned(r));
				}
				return rows;
			},
		},
		onLoad() {
			const sys = uni.getSystemInfoSync();
			this.statusBarPx = sys.statusBarHeight || 20;
			uni.hideTabBar({ animation: false });
			this.loadList(true);
		},
		onShow() {
			uni.hideTabBar({ animation: false });
			try {
				uni.setNavigationBarTitle({ title: this.t("message") });
			} catch (e) {
				//
			}
			// 避免页面切回时短时间重复加载，降低“加载中”停留时间
			if (Date.now() - this.lastLoadedAt > 3000) {
				this.loadList();
			}
		},
		methods: {
			syncTabMessageBadge() {
				const sum = (this.feedRows || []).reduce((s, r) => s + (Number(r.unread) || 0), 0);
				try {
					uni.setStorageSync("tab_message_badge", String(sum));
				} catch {
					//
				}
				try {
					uni.$emit("app-tab-badge-refresh");
				} catch {
					//
				}
			},
			openSearch() {
				uni.navigateTo({ url: "/pages/chat/chat-search" });
			},
			onFilterTap() {
				uni.showToast({ title: this.t("filter_action"), icon: "none" });
			},
			isRowWorkflow(row) {
				return row && row.convType === "workflow";
			},
			rowTagPills(row) {
				if (!row) return [];
				const pills = [];
				if (row.convType === "vgroup") pills.push(this.t("conv_tag_group"));
				if (row.convType === "workflow") pills.push(this.t("conv_tag_workflow"));
				const m = String(row.title || "").match(/\((\d+)\)\s*$/);
				if (m) pills.push(this.t("conv_member_count", { n: m[1] }));
				return pills.slice(0, 4);
			},
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			sessionKeyFromRow(row) {
				const n = row && row.navigate;
				if (!n) return "";
				if (n.mode === "virtual") return `v_${String(n.kind || "").trim()}_${String(n.id || "").trim()}`;
				if (n.mode === "remote")
					return `r_${String(n.workflowId || "").trim()}_${String(n.threadId || "").trim()}`;
				return `l_${String(row.title || "").trim()}`;
			},
			isRowPinned(row) {
				const k = this.sessionKeyFromRow(row);
				if (!k) return false;
				return uni.getStorageSync(`chat_pin_${k}`) === "1";
			},
			isRowDeleted(row) {
				const k = this.sessionKeyFromRow(row);
				if (!k) return false;
				return uni.getStorageSync(`chat_deleted_${k}`) === "1";
			},
			rebuildDepartmentBlocks() {
				const preset = buildMessageDepartmentBlocks().map((b) => {
					const title = departmentToZh(b.title || b.slug, this.departmentMap);
					return { ...b, title };
				});
				const existed = new Set(
					preset.map((b) => this.normalizeDeptText(b.slug)).filter(Boolean)
				);
				const extras = (this.apiDepartmentRows || [])
					.map((d) => {
						const slug = String(d.slug || "").trim();
						if (!slug) return null;
						const key = this.normalizeDeptText(slug);
						if (!key || existed.has(key)) return null;
						return {
							slug,
							agentDeptId: "",
							title: departmentToZh(d.name || slug, this.departmentMap),
							desc: "",
							count: 0,
							icon: FALLBACK_ICON,
							isCustom: true,
						};
					})
					.filter(Boolean);
				this.departmentBlocks = [...preset, ...extras];
			},
			normalizeDeptText(v) {
				return normalizeDeptKey(v);
			},
			async loadDepartmentMap() {
				try {
					const list = await agentsApi.listUserAgentDepartments();
					const map = {};
					const apiRows = [];
					(Array.isArray(list) ? list : []).forEach((item) => {
						if (typeof item === "string") {
							const n = item.trim();
							if (!n) return;
							map[normalizeDeptKey(n)] = departmentToZh(n);
							apiRows.push({ slug: n, name: n });
							return;
						}
						const id = String(item?.id || "").trim();
						const name = String(item?.name || "").trim();
						if (id) map[normalizeDeptKey(id)] = departmentToZh(name || id);
						if (name) map[normalizeDeptKey(name)] = departmentToZh(name);
						if (name || id) apiRows.push({ slug: name || id, name: name || id });
					});
					this.departmentMap = map;
					this.apiDepartmentRows = apiRows;
				} catch {
					this.departmentMap = {};
					this.apiDepartmentRows = [];
				}
			},
			async refreshDepartmentCounts() {
				try {
					const list = await listMyUserAgents();
					const rows = Array.isArray(list) ? list : [];
					const countMap = new Map();
					rows.forEach((a) => {
						const key = this.normalizeDeptText(a?.department);
						if (!key) return;
						countMap.set(key, (countMap.get(key) || 0) + 1);
					});
					this.departmentBlocks = (this.departmentBlocks || []).map((b) => {
						const slugKey = this.normalizeDeptText(b.slug);
						const titleKey = this.normalizeDeptText(b.title);
						const count =
							countMap.get(slugKey) ??
							countMap.get(titleKey) ??
							0;
						return { ...b, count };
					});
				} catch {
					//
				}
			},
			goDepartmentRoles(block) {
				if (!block || !block.slug) return;
				const title = block.title || block.slug;
				uni.navigateTo({
					url: `/pages/message/department-roles?slug=${encodeURIComponent(block.slug)}&title=${encodeURIComponent(title)}`,
				});
			},
			async loadList(force = false) {
				const reqId = ++this.listReqId;
				this.loading = force ? true : this.feedRows.length === 0;
				try {
					await this.loadDepartmentMap();
					this.rebuildDepartmentBlocks();
					this.refreshDepartmentCounts();
					// 会话列表使用前端本地会话，先回填上次成功数据避免闪烁
					this.feedRows = this.lastSuccessFeedRows.length ? this.lastSuccessFeedRows : [];
					this.loading = false;

					const unified = await loadUnifiedConversationList();
					const mapped = (Array.isArray(unified) ? unified : [])
						.map((u) => ({
							id: u.id,
							rowKind: "unified",
							convType: u.convType,
							title: u.title,
							subtitle: u.subtitle || "",
							time: u.time,
							unread: u.unread || 0,
							badge: u.convType === "vgroup" ? "项目群" : "",
							navigate: u.navigate,
						}))
						.filter((row) => !this.isRowDeleted(row));
					mapped.sort((a, b) => {
						const ap = this.isRowPinned(a) ? 1 : 0;
						const bp = this.isRowPinned(b) ? 1 : 0;
						if (ap !== bp) return bp - ap;
						return new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime();
					});
					if (reqId !== this.listReqId) return;
					this.feedRows = mapped;
					this.lastSuccessFeedRows = mapped;
					this.lastLoadedAt = Date.now();
					this.syncTabMessageBadge();
				} catch (e) {
					console.warn("[message] load", e);
					this.rebuildDepartmentBlocks();
					// 网络异常时保留上次成功列表，避免“会话突然消失”
					this.feedRows = this.lastSuccessFeedRows.length ? this.lastSuccessFeedRows : [];
				} finally {
					if (reqId === this.listReqId) {
						this.loading = false;
						this.refreshing = false;
						this.syncTabMessageBadge();
					}
				}
			},
			async onRefresh() {
				this.refreshing = true;
				await this.loadList();
			},
			showAddMenu() {
				if (this.isDeletingDept) {
					this.isDeletingDept = false;
					return;
				}
				if (this.messageTab === 1) {
					this.quickMenuItems = [
						{ key: "add_department", label: this.t('add_department') },
						{ key: "remove_department", label: this.t('remove_department') },
					];
				} else {
					this.quickMenuItems = [
						{ key: "create_group", label: this.t('create_project_group') },
						{ key: "create_agent", label: this.t('create_digital_employee') },
					];
				}
				this.showQuickMenu = true;
			},
			closeQuickMenu() {
				this.showQuickMenu = false;
				this.quickMenuItems = [];
			},
			onQuickMenuSelect(item) {
				if (!item || !item.key) return;
				this.closeQuickMenu();
				if (item.key === "add_department") {
					this.addDepartment();
					return;
				}
				if (item.key === "remove_department") {
					this.isDeletingDept = true;
					return;
				}
				if (item.key === "create_group") {
					uni.navigateTo({ url: "/pages/team/create-group" });
					return;
				}
				if (item.key === "create_agent") {
					uni.navigateTo({ url: "/pages/team/create-agent" });
				}
			},
			async addDepartment() {
				await this.loadAvailableDepartments();
				this.selectedAddDepts = [];
				this.newDeptName = "";
				this.showAddDeptPopup = true;
			},
			async loadAvailableDepartments() {
				try {
					const rows = await agentsApi.listUserAgentDepartments();
					const custom = getCustomDepartments();
					const existing = new Set(custom.map((c) => String(c.slug || "").trim()).filter(Boolean));
					this.availableDepts = (Array.isArray(rows) ? rows : [])
						.map((r) => {
							const raw = typeof r === "string" ? r.trim() : String(r?.name || r?.id || "").trim();
							return {
								slug: raw,
								title: departmentToZh(raw, this.departmentMap),
							};
						})
						.filter((d) => d.slug && !existing.has(d.slug));
				} catch (e) {
					this.availableDepts = [];
					uni.showToast({ title: getApiErrorMessage(e) || "读取部门失败", icon: "none" });
				}
			},
			closeAddDeptPopup() {
				this.showAddDeptPopup = false;
				this.selectedAddDepts = [];
				this.newDeptName = "";
			},
			toggleAddDept(slug) {
				const idx = this.selectedAddDepts.indexOf(slug);
				if (idx > -1) {
					this.selectedAddDepts.splice(idx, 1);
				} else {
					this.selectedAddDepts.push(slug);
				}
			},
			confirmAddDepts() {
				if (!this.selectedAddDepts.length) return;
				const custom = getCustomDepartments();
				const existed = new Set(custom.map((c) => String(c.slug || "").trim()));
				const picked = this.availableDepts
					.filter((d) => this.selectedAddDepts.includes(d.slug) && !existed.has(d.slug))
					.map((d) => ({
						slug: d.slug,
						title: d.title,
						icon: FALLBACK_ICON,
						count: 0,
						desc: "",
					}));
				if (picked.length > 0) {
					setCustomDepartments([...custom, ...picked]);
				}
				const hidden = getHiddenDepartments().filter((s) => !this.selectedAddDepts.includes(s));
				setHiddenDepartments(hidden);
				this.rebuildDepartmentBlocks();
				this.closeAddDeptPopup();
				uni.showToast({ title: this.t('added'), icon: 'success' });
			},
			async createDepartment() {
				const name = String(this.newDeptName || "").trim();
				if (!name) {
					uni.showToast({ title: "请输入部门名", icon: "none" });
					return;
				}
				this.addingDept = true;
				try {
					await agentsApi.createUserAgentDepartment(name);
					const custom = getCustomDepartments();
					const exists = custom.some((c) => String(c.slug || "").trim() === name);
					if (!exists) {
						setCustomDepartments([
							...custom,
							{
								slug: name,
								title: departmentToZh(name, this.departmentMap),
								icon: FALLBACK_ICON,
								count: 0,
								desc: "",
							},
						]);
					}
					this.rebuildDepartmentBlocks();
					this.newDeptName = "";
					this.closeAddDeptPopup();
					uni.showToast({ title: "已新增并添加", icon: "success" });
				} catch (e) {
					uni.showToast({ title: getApiErrorMessage(e) || "新增部门失败", icon: "none" });
				} finally {
					this.addingDept = false;
				}
			},
			removeDepartment(block) {
				if (!block) return;
				if (block.isCustom) {
					const custom = getCustomDepartments().filter((c) => c.slug !== block.slug);
					setCustomDepartments(custom);
				} else {
					const hidden = getHiddenDepartments();
					if (!hidden.includes(block.slug)) {
						hidden.push(block.slug);
						setHiddenDepartments(hidden);
					}
				}
				this.rebuildDepartmentBlocks();
				uni.showToast({ title: this.t('deleted'), icon: 'success' });
			},
			onRowTouchStart(e, row) {
				if (!row) return;
				this.swipeStartX = Number(e?.changedTouches?.[0]?.clientX || 0);
				this.swipeDeltaX = 0;
			},
			onRowTouchMove(e, row) {
				if (!row) return;
				const x = Number(e?.changedTouches?.[0]?.clientX || 0);
				this.swipeDeltaX = x - this.swipeStartX;
			},
			onRowTouchEnd(row) {
				if (!row) return;
				if (this.swipeDeltaX <= -36) this.swipeRowId = row.id;
				else if (this.swipeDeltaX >= 12) this.swipeRowId = "";
				this.swipeDeltaX = 0;
			},
			onPinRow(row) {
				const key = this.sessionKeyFromRow(row);
				if (!key) return;
				const pinned = this.isRowPinned(row);
				if (pinned) uni.removeStorageSync(`chat_pin_${key}`);
				else uni.setStorageSync(`chat_pin_${key}`, "1");
				this.swipeRowId = "";
				this.loadList(true);
			},
			onDeleteRow(row) {
				const n = row?.navigate || {};
				const title = row?.title || "会话";
				uni.showModal({
					title: "删除会话",
					content: `确认删除「${title}」吗？`,
					success: (res) => {
						if (!res.confirm) return;
						const key = this.sessionKeyFromRow(row);
						if (n.mode === "virtual") {
							const kind = String(n.kind || "").trim();
							const id = String(n.id || "").trim();
							if (kind === "group") {
								if (!deleteProjectGroupById(id)) return;
							} else if (id) {
								clearVirtualChatMessages(kind, id);
								if (kind === "agent") touchAgentLastMsg(id, this.t("chat_no_messages"));
							}
						}
						if (key) {
							uni.setStorageSync(`chat_deleted_${key}`, "1");
							uni.removeStorageSync(`chat_pin_${key}`);
						}
						this.swipeRowId = "";
						this.loadList(true);
						uni.showToast({ title: "已删除", icon: "success" });
					},
				});
			},
			avatarBg(row) {
				/* 项目群：固定偏亮渐变，避免哈希到深蓝/紫导致「图案」发暗难辨 */
				if (row && (row.rowKind === "group" || row.convType === "vgroup")) {
					return "linear-gradient(145deg, #38bdf8, #2563eb)";
				}
				const colors = [
					"linear-gradient(145deg, #3b82f6, #2563eb)",
					"linear-gradient(145deg, #8b5cf6, #7c3aed)",
					"linear-gradient(145deg, #10b981, #059669)",
					"linear-gradient(145deg, #f59e0b, #d97706)",
					"linear-gradient(145deg, #ec4899, #db2777)",
					"linear-gradient(145deg, #22d3ee, #0891b2)",
				];
				const s = row.id || row.title || "";
				let h = 0;
				for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
				return colors[h % colors.length];
			},
			avatarLetter(row) {
				if (row.convType === "manager" || row.rowKind === "manager") return this.t("abbr_manager");
				if (row.convType === "vgroup" || row.rowKind === "group") return this.t("abbr_group");
				if (row.rowKind === "unified" && row.convType === "workflow") return this.t("abbr_project");
				const tit = (row.title || "?").trim();
				return tit.slice(0, 1);
			},
			formatWxTime(iso) {
				const d = new Date(iso);
				if (Number.isNaN(d.getTime())) return "";
				const now = new Date();
				const pad = (n) => (n < 10 ? "0" + n : "" + n);
				const sameDay = d.toDateString() === now.toDateString();
				if (sameDay) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
				const yest = new Date(now);
				yest.setDate(yest.getDate() - 1);
				if (d.toDateString() === yest.toDateString()) return this.t("time_yesterday");
				return this.t("date_month_day", { month: d.getMonth() + 1, day: d.getDate() });
			},
			formatRowTime(t) {
				if (t == null || t === "") return "";
				const d = new Date(t);
				if (!Number.isNaN(d.getTime())) return this.formatWxTime(t);
				return String(t);
			},
			onRowTap(row) {
				if (this.swipeRowId && this.swipeRowId === row.id) {
					this.swipeRowId = "";
					return;
				}
				if (row.rowKind === "unified" && row.navigate) {
					const n = row.navigate;
					if (n.mode === "virtual") {
						const q = [
							"mode=virtual",
							`kind=${encodeURIComponent(n.kind || "")}`,
							`id=${encodeURIComponent(n.id || "")}`,
							`title=${encodeURIComponent(n.title || row.title || "")}`,
						].join("&");
						uni.navigateTo({ url: `/pages/chat/chat?${q}` });
						return;
					}
					if (n.mode === "remote") {
						const q = [
							`workflowId=${encodeURIComponent(n.workflowId)}`,
							`threadId=${encodeURIComponent(n.threadId)}`,
							`workflowTitle=${encodeURIComponent(n.workflowTitle || "")}`,
							`threadTitle=${encodeURIComponent(n.threadTitle || "")}`,
							`threadKind=${encodeURIComponent(n.kind || "THREAD")}`,
						].join("&");
						uni.navigateTo({ url: `/pages/chat/chat?${q}` });
						return;
					}
					return;
				}
			},
		},
	};
</script>

<style>
	.page-root {
		height: 100vh;
		display: flex;
		flex-direction: column;
<<<<<<< HEAD
		background: linear-gradient(180deg, #f0f4ff 0%, #f5f7fa 32%, #f5f7fa 100%);
=======
		background: transparent;
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
		box-sizing: border-box;
	}

	.navbar-wrap {
<<<<<<< HEAD
		background: transparent;
=======
		background: var(--navbar-bg);
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
		flex-shrink: 0;
		padding: 8rpx 24rpx 16rpx;
	}

	.msg-top {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 20rpx;
	}

	.msg-top-left {
		flex: 1;
		min-width: 0;
	}

	.msg-title-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12rpx;
	}

	.msg-page-title {
		font-size: 48rpx;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.5rpx;
	}

	.msg-title-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #3b82f6, #6366f1);
		box-shadow: 0 0 12rpx rgba(59, 130, 246, 0.45);
	}

	.msg-page-sub {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #94a3b8;
		line-height: 1.4;
	}

	.msg-top-actions {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 16rpx;
		flex-shrink: 0;
		padding-top: 8rpx;
	}

	.msg-head-circle {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		background: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.08);
	}

	.msg-head-circle-primary {
		background: linear-gradient(145deg, #3b82f6, #2563eb);
		box-shadow: 0 10rpx 28rpx rgba(37, 99, 235, 0.38);
	}

	.msg-head-ico {
		font-size: 30rpx;
		line-height: 1;
	}

	.msg-head-plus {
		font-size: 40rpx;
		font-weight: 300;
		color: #fff;
		line-height: 1;
	}

	.msg-done-pill {
		padding: 12rpx 28rpx;
		background: rgba(37, 99, 235, 0.12);
		border-radius: 999rpx;
	}

	.msg-done-t {
		font-size: 28rpx;
		font-weight: 600;
		color: #2563eb;
	}

	.seg-outer {
		margin-bottom: 20rpx;
	}

	.seg-bar {
		display: flex;
		flex-direction: row;
		background: #fff;
		border-radius: 20rpx;
		padding: 8rpx 10rpx;
		box-shadow: 0 8rpx 28rpx rgba(15, 23, 42, 0.06);
	}

	.seg-item {
		flex: 1;
		position: relative;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		padding: 20rpx 8rpx 24rpx;
		border-radius: 16rpx;
		min-height: 72rpx;
		box-sizing: border-box;
	}

	.seg-item-wide {
		flex: 1.15;
		padding-left: 4rpx;
		padding-right: 4rpx;
	}

	.seg-active {
		background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
	}

	.seg-emoji {
		font-size: 28rpx;
		line-height: 1;
	}

	.seg-label {
		font-size: 26rpx;
		color: #64748b;
		font-weight: 600;
		max-width: 200rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.seg-label-shrink {
		max-width: 160rpx;
	}

	.seg-active .seg-label {
		color: #2563eb;
	}

	.seg-line {
		position: absolute;
		bottom: 8rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 56rpx;
		height: 6rpx;
		background: linear-gradient(90deg, #2563eb, #6366f1);
		border-radius: 3rpx;
	}

	.seg-item-wide .seg-line {
		width: 80rpx;
	}

	.seg-mini-avs {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-left: 6rpx;
	}

	.seg-mini-av {
		width: 32rpx;
		height: 32rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2rpx solid #fff;
		box-sizing: border-box;
	}

	.seg-mini-t {
		font-size: 18rpx;
		font-weight: 700;
		color: #fff;
	}

	.seg-chev {
		font-size: 26rpx;
		color: #cbd5e1;
		font-weight: 300;
		margin-left: 4rpx;
	}

	.chip-scroll {
		width: 100%;
		white-space: nowrap;
		margin-bottom: 16rpx;
	}

	.chip-row {
		display: inline-flex;
		flex-direction: row;
		gap: 16rpx;
		padding: 0 4rpx 4rpx 0;
	}

	.chip-card {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-width: 120rpx;
		padding: 18rpx 14rpx 14rpx;
		background: #fff;
		border-radius: 20rpx;
		box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.06);
		position: relative;
		box-sizing: border-box;
	}

	.chip-on {
		box-shadow: 0 10rpx 28rpx rgba(37, 99, 235, 0.15);
		border: 2rpx solid rgba(37, 99, 235, 0.25);
	}

	.chip-ico {
		font-size: 32rpx;
		line-height: 1;
		margin-bottom: 8rpx;
		color: #64748b;
	}

	.chip-ico-blue {
		color: #2563eb;
	}

	.chip-ico-warn {
		color: #ea580c;
	}

	.chip-ico-star {
		color: #9333ea;
	}

	.chip-t {
		font-size: 22rpx;
		color: #475569;
		font-weight: 600;
	}

	.chip-badge {
		position: absolute;
		top: -6rpx;
		right: -6rpx;
		min-width: 32rpx;
		padding: 0 8rpx;
		height: 32rpx;
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 3rpx solid #f5f7fa;
		box-sizing: border-box;
	}

	.chip-badge-n {
		font-size: 20rpx;
		font-weight: 700;
		color: #fff;
	}

	.filter-bar {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
<<<<<<< HEAD
		padding: 0 6rpx 8rpx;
		margin-bottom: 8rpx;
=======
		padding: 0 8rpx 0 24rpx;
		border-bottom: 1rpx solid var(--border-color);
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
	}

	.filter-left {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8rpx;
		flex: 1;
<<<<<<< HEAD
		min-width: 0;
	}

	.filter-arrow {
		font-size: 20rpx;
		color: #94a3b8;
=======
		text-align: center;
		font-size: 34rpx;
		font-weight: 700;
		color: var(--text-primary);
	}

	.navbar-plus {
		font-size: 40rpx;
		font-weight: 400;
		color: var(--primary-color);
		line-height: 1;
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
	}

	.filter-t {
		font-size: 24rpx;
		color: #64748b;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.filter-right {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6rpx;
		flex-shrink: 0;
	}

	.filter-ico {
		font-size: 26rpx;
		color: #94a3b8;
	}

	.filter-action {
		font-size: 24rpx;
		color: #64748b;
		font-weight: 600;
	}

	.feed-scroll {
		flex: 1;
		height: 0;
	}

<<<<<<< HEAD
=======
	.msg-tab-strip {
		flex-shrink: 0;
		display: flex;
		flex-direction: row;
		background: var(--bg-secondary);
		border-bottom: 1rpx solid var(--border-color);
		padding: 0 40rpx;
	}

	.msg-tab-item {
		flex: 1;
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		padding: 22rpx 0 18rpx;
		min-height: 76rpx;
		box-sizing: border-box;
	}

	.msg-tab-text {
		font-size: 30rpx;
		color: var(--text-secondary);
		line-height: 1.2;
	}

	.msg-tab-active .msg-tab-text {
		color: var(--text-primary);
		font-weight: 700;
	}

	.msg-tab-underline {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 48rpx;
		height: 6rpx;
		background: linear-gradient(90deg, #2563eb, #7c3aed);
		border-radius: 3rpx;
	}

>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
	.tip-line {
		padding: 20rpx 28rpx 16rpx;
		background: transparent;
	}

	.tip-t {
		font-size: 24rpx;
		color: #64748b;
		line-height: 1.45;
	}

	.wx-loading {
		padding: 80rpx;
		text-align: center;
		color: #64748b;
		font-size: 28rpx;
	}

	.msg-empty-card {
		margin: 8rpx 24rpx 24rpx;
		padding: 56rpx 32rpx;
		text-align: center;
		background: #fff;
		border-radius: 24rpx;
		border: none;
		box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
	}

	.msg-empty-emoji {
		display: block;
		font-size: 64rpx;
		margin-bottom: 16rpx;
	}

	.msg-empty-t {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #0f172a;
	}

	.msg-empty-sub {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #94a3b8;
		line-height: 1.5;
	}

	.msg-list {
		padding: 8rpx 24rpx 24rpx;
	}
	.swipe-wrap {
		position: relative;
		margin-bottom: 20rpx;
		border-radius: 36rpx;
		overflow: hidden;
	}
	.swipe-actions {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 264rpx;
		display: flex;
		flex-direction: row;
	}
	.swipe-pin {
		width: 132rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #64748b;
		color: #fff;
		font-size: 26rpx;
		font-weight: 700;
	}
	.swipe-delete {
		width: 132rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #ef4444;
		color: #fff;
		font-size: 28rpx;
		font-weight: 700;
	}

	.msg-row-card {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		padding: 28rpx 24rpx;
		margin-bottom: 0;
<<<<<<< HEAD
		background: #fff;
		border-radius: 36rpx;
		border: none;
		box-shadow: 0 10rpx 40rpx rgba(15, 23, 42, 0.06);
=======
		background: var(--bg-secondary);
		border-radius: 20rpx;
		border: 1rpx solid var(--border-color);
		box-shadow: var(--card-shadow-soft);
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
		transition: transform 0.16s ease;
	}
	.msg-row-open {
		transform: translateX(-264rpx);
	}

	.msg-row-card-hover {
		background: var(--cell-hover) !important;
	}

	.msg-row-dept {
		align-items: center;
	}

	.msg-avatar {
		width: 96rpx;
		height: 96rpx;
		border-radius: 20rpx;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 22rpx;
		box-shadow: 0 6rpx 18rpx rgba(37, 99, 235, 0.2);
	}

	.msg-avatar-t {
		font-size: 34rpx;
		font-weight: 700;
		color: #fff;
	}

	.msg-dept-icon {
		width: 96rpx;
		height: 96rpx;
		border-radius: 20rpx;
		flex-shrink: 0;
		margin-right: 22rpx;
		background: var(--bg-tertiary);
		border: 1rpx solid var(--border-color);
	}

	.msg-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 4rpx 0;
	}

	.msg-row-top {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 10rpx;
	}

	.msg-title-wrap {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		gap: 10rpx;
		padding-right: 12rpx;
	}

	.msg-title {
<<<<<<< HEAD
		font-size: 30rpx;
		color: #0f172a;
		font-weight: 700;
=======
		font-size: 32rpx;
		color: var(--text-primary);
		font-weight: 600;
>>>>>>> ad1c6de4f0bea327ec94fdb24bcb98f03e317115
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}

	.msg-tag {
		font-size: 20rpx;
		font-weight: 700;
		padding: 4rpx 12rpx;
		border-radius: 999rpx;
		flex-shrink: 0;
	}

	.msg-tag-pin {
		color: #7c3aed;
		background: rgba(124, 58, 237, 0.1);
	}

	.msg-tag-run {
		color: #2563eb;
		background: rgba(37, 99, 235, 0.1);
	}

	.msg-pill {
		font-size: 20rpx;
		font-weight: 600;
		color: #b45309;
		background: #fffbeb;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
		border: 1rpx solid #fde68a;
		flex-shrink: 0;
	}

	.msg-col-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8rpx;
		flex-shrink: 0;
	}

	.msg-right-badges {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8rpx;
	}

	.msg-pin-ico {
		font-size: 26rpx;
		line-height: 1;
		opacity: 0.85;
	}

	.msg-time {
		font-size: 22rpx;
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.msg-preview-2 {
		white-space: normal;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-height: 1.45;
		margin-bottom: 10rpx;
	}

	.msg-tag-row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 8rpx;
	}

	.msg-tag-pill {
		font-size: 20rpx;
		color: #64748b;
		background: #f1f5f9;
		padding: 4rpx 14rpx;
		border-radius: 999rpx;
		font-weight: 500;
	}

	.msg-row-bottom {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
	}

	.msg-preview {
		font-size: 26rpx;
		color: var(--text-secondary);
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.msg-preview-multi {
		white-space: normal;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-height: 1.45;
	}

	.msg-unread {
		min-width: 36rpx;
		height: 36rpx;
		padding: 0 10rpx;
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: #fff;
		font-size: 22rpx;
		font-weight: 700;
		border-radius: 18rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: 0 4rpx 12rpx rgba(37, 99, 235, 0.28);
	}

	.msg-dept-count {
		font-size: 24rpx;
		font-weight: 600;
		color: #2563eb;
		flex-shrink: 0;
	}

	.msg-chevron {
		font-size: 34rpx;
		color: #cbd5e1;
		flex-shrink: 0;
		padding-left: 8rpx;
		align-self: center;
	}

	.msg-dept-delete {
		width: 48rpx;
		height: 48rpx;
		font-size: 32rpx;
		color: #ef4444;
		background: #fef2f2;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-left: 12rpx;
		line-height: 1;
	}

	.wx-pad {
		height: 24rpx;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(15, 23, 42, 0.18);
		z-index: 100000;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.add-dept-popup {
		width: 100%;
		max-height: 70vh;
		background: #fff;
		border-radius: 24rpx 24rpx 0 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.popup-header {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 32rpx 28rpx 24rpx;
		border-bottom: 1rpx solid #e2e8f0;
	}

	.popup-title {
		font-size: 34rpx;
		font-weight: 800;
		color: #0f172a;
	}

	.popup-close {
		font-size: 48rpx;
		color: #94a3b8;
		font-weight: 300;
		line-height: 1;
		padding: 0 8rpx;
	}

	.add-dept-list {
		flex: 1;
		overflow-y: auto;
		padding: 16rpx 28rpx;
	}

	.add-dept-create {
		display: flex;
		align-items: center;
		gap: 16rpx;
		padding: 16rpx 28rpx 12rpx;
		border-bottom: 1rpx solid #eef2f7;
	}

	.add-dept-input {
		flex: 1;
		height: 72rpx;
		background: #f8fafc;
		border-radius: 12rpx;
		padding: 0 18rpx;
		font-size: 28rpx;
		color: #0f172a;
	}

	.add-dept-input-ph {
		color: #94a3b8;
	}

	.add-dept-create-btn {
		height: 72rpx;
		line-height: 72rpx;
		padding: 0 24rpx;
		font-size: 24rpx;
		border-radius: 36rpx;
		background: #2563eb !important;
		color: #fff !important;
	}

	.add-dept-empty {
		padding: 80rpx 0;
		text-align: center;
		color: #94a3b8;
		font-size: 28rpx;
	}

	.add-dept-item {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 24rpx 16rpx;
		border-radius: 16rpx;
		margin-bottom: 12rpx;
		background: #f8fafc;
	}

	.add-dept-selected {
		background: #eff6ff;
	}

	.add-dept-check-box {
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		border: 2rpx solid #cbd5e1;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
		flex-shrink: 0;
		background: #fff;
	}

	.add-dept-selected .add-dept-check-box {
		border-color: #2563eb;
		background: #2563eb;
	}

	.add-dept-check {
		font-size: 24rpx;
		color: #fff;
		font-weight: 700;
		line-height: 1;
	}

	.add-dept-name {
		font-size: 30rpx;
		color: #0f172a;
		flex: 1;
	}

	.popup-footer {
		padding: 20rpx 28rpx;
		padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
		border-top: 1rpx solid #e2e8f0;
	}

	.popup-btn {
		width: 100%;
		height: 88rpx;
		line-height: 88rpx;
		background: linear-gradient(135deg, #2563eb, #4f46e5) !important;
		color: #fff;
		font-size: 30rpx;
		font-weight: 700;
		border-radius: 44rpx;
	}

	.popup-btn[disabled] {
		opacity: 0.5;
	}

	.sheet-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(15, 23, 42, 0.14);
		z-index: 100000;
		display: flex;
		align-items: flex-end;
	}

	.sheet-panel {
		width: 100%;
		background: #eef2ff;
		border-radius: 24rpx 24rpx 0 0;
		padding-bottom: env(safe-area-inset-bottom);
		overflow: hidden;
	}

	.sheet-handle {
		width: 72rpx;
		height: 8rpx;
		border-radius: 999rpx;
		background: #cbd5e1;
		margin: 14rpx auto 12rpx;
	}

	.sheet-row {
		background: #fff;
		padding: 30rpx 32rpx;
		border-top: 1rpx solid #eef2f7;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sheet-row-t {
		font-size: 30rpx;
		color: #0f172a;
		font-weight: 600;
	}

	.sheet-cancel {
		margin-top: 14rpx;
		background: #fff;
		padding: 28rpx 32rpx;
		display: flex;
		justify-content: center;
	}

	.sheet-cancel-t {
		font-size: 30rpx;
		color: #64748b;
		font-weight: 600;
	}
</style>
