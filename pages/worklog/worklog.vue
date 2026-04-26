<template>
	<view class="wl-page" :class="{ 'theme-dark': isDarkMode }">
		<view class="wl-nav" :style="{ paddingTop: statusBarPx + 'px' }">
			<view class="wl-nav-row">
				<NavBackClick :fallback-tab="'/pages/profile/profile'" />
				<view class="wl-nav-actions">
					<text class="wl-ico" @click="onRegenTap">↻</text>
				</view>
			</view>
			<view class="wl-nav-title-block">
				<text class="wl-title">{{ t("worklog_nav_title") }}</text>
				<text class="wl-sub">{{ companyLine }}</text>
			</view>
		</view>

		<view class="wl-body">
			<view class="wl-filter-row">
				<text class="wl-hint">{{ t("worklog_view_hint") }}</text>
				<view class="wl-unread" @click="onlyUnread = !onlyUnread">
					<view class="wl-radio" :class="{ on: onlyUnread }" />
					<text class="wl-unread-t">{{ t("worklog_only_unread") }}</text>
				</view>
			</view>

			<view v-if="generating" class="wl-loading">
				<text>{{ t("worklog_generating") }}</text>
			</view>

			<scroll-view
				scroll-y
				class="wl-feed"
				:show-scrollbar="false"
				refresher-enabled
				:refresher-triggered="refreshing"
				@refresherrefresh="onPullRefresh"
			>
				<view v-if="!generating && filteredSections.length === 0" class="wl-empty">
					<text>{{ t("worklog_empty_feed") }}</text>
				</view>
				<template v-else>
					<template v-for="sec in filteredSections" :key="sec.key">
						<text class="wl-sec-label">{{ sec.label }}</text>
						<view v-for="item in sec.items" :key="item.entryId" class="wl-card">
							<view class="wl-card-head">
								<image v-if="item.avatarUrl" class="wl-av-img" :src="item.avatarUrl" mode="aspectFill" />
								<view v-else class="wl-av" :style="{ background: avatarColor(item.name) }">
									<text class="wl-av-t">{{ avatarLetter(item.name) }}</text>
								</view>
								<view class="wl-card-head-mid">
									<text class="wl-card-name">{{ item.name }}{{ t("worklog_entry_suffix") }}</text>
									<text class="wl-card-time">{{ sec.label }} {{ item.timeClock }}</text>
								</view>
								<text v-if="!item.read" class="wl-read-badge">{{ t("worklog_badge_unread") }}</text>
							</view>
							<text class="wl-body-label">{{ t("worklog_today_done_title") }}</text>
							<text class="wl-body-text">{{ item.body }}</text>
							<view v-if="item.comments && item.comments.length" class="wl-comment-list">
								<view v-for="c in item.comments" :key="c.id" class="wl-comment-row">
									<text class="wl-comment-text">{{ c.text }}</text>
								</view>
							</view>
							<view class="wl-card-actions">
								<text class="wl-act" @click="onMarkRead(item)">{{ readLabel(item) }}</text>
								<text class="wl-act" @click="openCommentSheet(item)">
									{{ t("worklog_action_comment") }}{{ item.commentCount ? ` (${item.commentCount})` : "" }}
								</text>
								<text class="wl-act" :class="{ liked: item.liked }" @click="onToggleLike(item)">
									{{ t("worklog_action_like") }}{{ item.likes ? ` ${item.likes}` : "" }}
								</text>
							</view>
						</view>
					</template>
				</template>
				<view class="wl-feed-pad" />
			</scroll-view>
		</view>

		<view v-if="commentEntry" class="wl-mask" @tap.self="closeCommentSheet">
			<view class="wl-sheet" @tap.stop>
				<text class="wl-sheet-title">{{ t("worklog_comment_title") }}</text>
				<textarea v-model="commentDraft" class="wl-sheet-ta" :placeholder="t('worklog_comment_placeholder')" />
				<view class="wl-sheet-btns">
					<button class="wl-sheet-btn ghost" @click="closeCommentSheet">{{ t("worklog_comment_cancel") }}</button>
					<button class="wl-sheet-btn primary" type="primary" @click="submitComment">{{ t("worklog_comment_send") }}</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import NavBackClick from "@/components/NavBackClick.vue";
	import { t, getLanguage } from "@/utils/lang";
	import { getUserInfo } from "@/utils/index";
	import { resolveAvatarDisplayUrl } from "@/clientApi/authApi";
	import { listMyUserAgents } from "@/clientApi/agentsApi";
	import { loadDigitalAgents } from "@/utils/virtualTeamStore";
	import { getLlmSettings } from "@/utils/llmSettings";
	import {
		localYmd,
		addDaysYmd,
		generateAndSaveDayLogs,
		getDayEntries,
		loadReactionsStore,
		mergeEntryWithReactions,
		markRead as persistMarkRead,
		toggleLike as persistToggleLike,
		addComment as persistAddComment,
		clearDayEntriesAndReactions,
	} from "@/utils/worklogDaily";

	export default {
		components: { NavBackClick },
		data() {
			return {
				statusBarPx: 20,
				isDarkMode: false,
				onlyUnread: false,
				generating: false,
				refreshing: false,
				sections: [],
				commentEntry: null,
				commentDraft: "",
			};
		},
		computed: {
			companyLine() {
				const u = getUserInfo() || {};
				const c = String(u.companyName || u.orgName || u.enterpriseName || "").trim();
				if (c) return c;
				return this.t("worklog_company_placeholder");
			},
			filteredSections() {
				return this.sections
					.map((s) => ({
						...s,
						items: s.items.filter((it) => {
							if (this.onlyUnread && it.read) return false;
							return true;
						}),
					}))
					.filter((s) => s.items.length > 0);
			},
		},
		onLoad() {
			try {
				const sys = uni.getSystemInfoSync();
				this.statusBarPx = sys.statusBarHeight || 20;
			} catch {
				this.statusBarPx = 20;
			}
			this.loadDarkMode();
		},
		onShow() {
			this.loadDarkMode();
			this.loadFeed(false);
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			loadDarkMode() {
				try {
					const settings = uni.getStorageSync("userSettings");
					const parsed = typeof settings === "string" ? JSON.parse(settings || "{}") : settings || {};
					this.isDarkMode = !!parsed.isDarkMode;
				} catch {
					this.isDarkMode = false;
				}
			},
			updateTheme(isDark) {
				this.isDarkMode = !!isDark;
			},
			async loadAgentRows() {
				let rows = [];
				try {
					const list = await listMyUserAgents();
					if (Array.isArray(list) && list.length) {
						rows = list.map((a) => ({
							id: String(a?.id || "").trim(),
							name: String(a?.displayName || a?.name || "").trim() || this.t("digital_employee_fallback"),
							role: String(a?.jobTitle || a?.rolePosition || "").trim(),
							mainWork: String(a?.mainWork || a?.description || "").trim(),
							avatar: String(a?.avatar || a?.avatarUrl || a?.headImg || "").trim(),
						}));
					}
				} catch {
					rows = [];
				}
				if (!rows.length) {
					rows = loadDigitalAgents().map((a) => ({
						id: String(a.id || "").trim(),
						name: String(a.name || "").trim(),
						role: String(a.role || "").trim(),
						mainWork: String(a.mainWork || a.personality || "").trim(),
						avatar: String(a.avatar || "").trim(),
					}));
				}
				return rows.filter((r) => r.id);
			},
			hydrateSections() {
				const lang = getLanguage();
				const today = localYmd();
				const yday = addDaysYmd(today, -1);
				const reactions = loadReactionsStore();
				const mapEntry = (e) => {
					const avatarUrl = resolveAvatarDisplayUrl(e.avatar || "");
					const merged = mergeEntryWithReactions(
						{
							...e,
							avatarUrl: avatarUrl || "",
						},
						reactions
					);
					return merged;
				};
				const todayItems = getDayEntries(today).map(mapEntry);
				const yItems = getDayEntries(yday).map(mapEntry);
				const out = [];
				if (todayItems.length) {
					out.push({ key: "today", label: this.t("worklog_section_today"), items: todayItems });
				}
				if (yItems.length) {
					out.push({ key: "yesterday", label: this.t("worklog_section_yesterday"), items: yItems });
				}
				this.sections = out;
			},
			async loadFeed(forceRegenToday) {
				const lang = getLanguage();
				const today = localYmd();
				const rows = await this.loadAgentRows();
				if (!rows.length) {
					this.sections = [];
					return;
				}
				let needGen = forceRegenToday;
				if (!needGen) {
					const existing = getDayEntries(today);
					needGen = !existing || !existing.length;
				}
				if (needGen) {
					this.sections = [];
					const { apiKey } = getLlmSettings();
					if (!apiKey) {
						uni.showToast({ title: this.t("toast_set_api_key_in_profile"), icon: "none", duration: 2600 });
					}
					this.generating = true;
					try {
						if (forceRegenToday) clearDayEntriesAndReactions(today);
						await generateAndSaveDayLogs(rows, today, lang);
					} catch (e) {
						console.warn(e);
						uni.showToast({ title: this.t("load_failed_short"), icon: "none" });
					} finally {
						this.generating = false;
					}
				}
				this.hydrateSections();
			},
			async onPullRefresh() {
				this.refreshing = true;
				try {
					await this.loadFeed(false);
				} finally {
					this.refreshing = false;
				}
			},
			onRegenTap() {
				uni.showModal({
					title: this.t("worklog_regen_title"),
					content: this.t("worklog_regen_confirm"),
					success: (res) => {
						if (res.confirm) this.loadFeed(true);
					},
				});
			},
			avatarColor(name) {
				const colors = ["#07c160", "#10aeff", "#576b95", "#fa9d3b", "#1485ee", "#9a6bff"];
				let h = 0;
				const s = String(name || "");
				for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
				return colors[h % colors.length];
			},
			avatarLetter(name) {
				const n = String(name || "").trim();
				return n ? n.slice(0, 1) : "·";
			},
			readLabel(item) {
				if (item.read) return this.t("worklog_action_read_all");
				const n = Math.min(99, Math.max(1, 1 + (item.commentCount || 0) + (item.likes || 0)));
				return this.t("worklog_action_read_partial", { n });
			},
			onMarkRead(item) {
				persistMarkRead(item.entryId);
				this.hydrateSections();
			},
			onToggleLike(item) {
				persistToggleLike(item.entryId);
				this.hydrateSections();
			},
			openCommentSheet(item) {
				this.commentEntry = item;
				this.commentDraft = "";
			},
			closeCommentSheet() {
				this.commentEntry = null;
				this.commentDraft = "";
			},
			submitComment() {
				const text = (this.commentDraft || "").trim();
				if (!text) {
					uni.showToast({ title: this.t("worklog_comment_empty"), icon: "none" });
					return;
				}
				if (!this.commentEntry) return;
				persistAddComment(this.commentEntry.entryId, text);
				this.closeCommentSheet();
				this.hydrateSections();
			},
		},
	};
</script>

<style scoped>
	.wl-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f2f4f8;
		box-sizing: border-box;
	}
	.wl-nav {
		flex-shrink: 0;
		background: #fff;
		border-bottom: 1rpx solid #e5e7eb;
		padding-bottom: 12rpx;
	}
	.wl-nav-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 0 8rpx 0 0;
		min-height: 72rpx;
	}
	.wl-nav-actions {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding-right: 20rpx;
	}
	.wl-ico {
		font-size: 40rpx;
		color: #64748b;
		line-height: 1;
		padding: 8rpx;
	}
	.wl-nav-title-block {
		padding: 0 28rpx 8rpx;
	}
	.wl-title {
		display: block;
		font-size: 40rpx;
		font-weight: 700;
		color: #0f172a;
		text-align: center;
	}
	.wl-sub {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #64748b;
		text-align: center;
	}
	.wl-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}
	.wl-filter-row {
		flex-shrink: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 16rpx 24rpx;
		background: #fff;
		border-bottom: 1rpx solid #eef0f3;
		gap: 16rpx;
	}
	.wl-hint {
		flex: 1;
		font-size: 22rpx;
		color: #94a3b8;
		line-height: 1.4;
	}
	.wl-unread {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10rpx;
		flex-shrink: 0;
	}
	.wl-radio {
		width: 28rpx;
		height: 28rpx;
		border-radius: 50%;
		border: 2rpx solid #94a3b8;
		box-sizing: border-box;
	}
	.wl-radio.on {
		border-color: #2563eb;
		background: radial-gradient(circle, #2563eb 50%, transparent 52%);
	}
	.wl-unread-t {
		font-size: 24rpx;
		color: #475569;
	}
	.wl-loading {
		padding: 24rpx;
		text-align: center;
		font-size: 26rpx;
		color: #64748b;
		background: #fff;
	}
	.wl-feed {
		flex: 1;
		height: 0;
		padding: 0 20rpx;
		box-sizing: border-box;
	}
	.wl-empty {
		padding: 80rpx 24rpx;
		text-align: center;
		font-size: 26rpx;
		color: #94a3b8;
	}
	.wl-sec-label {
		display: block;
		font-size: 26rpx;
		font-weight: 600;
		color: #64748b;
		margin: 24rpx 0 12rpx 8rpx;
	}
	.wl-card {
		background: #fff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		border: 1rpx solid #e8eaef;
		box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.04);
	}
	.wl-card-head {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		margin-bottom: 16rpx;
	}
	.wl-av-img,
	.wl-av {
		width: 80rpx;
		height: 80rpx;
		border-radius: 12rpx;
		flex-shrink: 0;
	}
	.wl-av {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.wl-av-t {
		font-size: 32rpx;
		font-weight: 700;
		color: #fff;
	}
	.wl-card-head-mid {
		flex: 1;
		margin-left: 20rpx;
		min-width: 0;
	}
	.wl-card-name {
		font-size: 30rpx;
		font-weight: 600;
		color: #0f172a;
	}
	.wl-card-time {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: #94a3b8;
	}
	.wl-read-badge {
		font-size: 20rpx;
		color: #64748b;
		background: #f1f5f9;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
		flex-shrink: 0;
	}
	.wl-body-label {
		display: block;
		font-size: 24rpx;
		font-weight: 600;
		color: #334155;
		margin-bottom: 8rpx;
	}
	.wl-body-text {
		font-size: 28rpx;
		line-height: 1.55;
		color: #1e293b;
		white-space: pre-wrap;
		word-break: break-word;
		font-family: "PingFang SC", "KaiTi", "STKaiti", serif;
	}
	.wl-comment-list {
		margin-top: 16rpx;
		padding: 12rpx 16rpx;
		background: #f8fafc;
		border-radius: 12rpx;
		border: 1rpx solid #eef2f7;
	}
	.wl-comment-row {
		padding: 8rpx 0;
		border-bottom: 1rpx solid #e2e8f0;
	}
	.wl-comment-row:last-child {
		border-bottom: none;
	}
	.wl-comment-text {
		font-size: 24rpx;
		color: #475569;
		line-height: 1.45;
	}
	.wl-card-actions {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		gap: 32rpx;
		margin-top: 20rpx;
		padding-top: 16rpx;
		border-top: 1rpx solid #f1f5f9;
	}
	.wl-act {
		font-size: 24rpx;
		color: #64748b;
	}
	.wl-act.liked {
		color: #2563eb;
		font-weight: 600;
	}
	.wl-feed-pad {
		height: 48rpx;
	}
	.wl-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(15, 23, 42, 0.45);
		z-index: 1000;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}
	.wl-sheet {
		width: 100%;
		background: #fff;
		border-radius: 24rpx 24rpx 0 0;
		padding: 28rpx 28rpx calc(28rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}
	.wl-sheet-title {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 16rpx;
	}
	.wl-sheet-ta {
		width: 100%;
		min-height: 200rpx;
		padding: 16rpx;
		font-size: 28rpx;
		border: 1rpx solid #e2e8f0;
		border-radius: 12rpx;
		box-sizing: border-box;
	}
	.wl-sheet-btns {
		display: flex;
		flex-direction: row;
		justify-content: flex-end;
		gap: 20rpx;
		margin-top: 20rpx;
	}
	.wl-sheet-btn {
		min-width: 160rpx;
		font-size: 28rpx;
	}
	.wl-sheet-btn.ghost {
		background: #f1f5f9;
		color: #475569;
	}
	.safe-bottom {
		padding-bottom: env(safe-area-inset-bottom);
	}
	.wl-page.theme-dark {
		background: #0f172a;
	}
	.wl-page.theme-dark .wl-nav,
	.wl-page.theme-dark .wl-filter-row,
	.wl-page.theme-dark .wl-loading,
	.wl-page.theme-dark .wl-card,
	.wl-page.theme-dark .wl-sheet {
		background: #1e293b;
		border-color: #334155;
	}
	.wl-page.theme-dark .wl-title,
	.wl-page.theme-dark .wl-card-name,
	.wl-page.theme-dark .wl-body-text,
	.wl-page.theme-dark .wl-sheet-title {
		color: #f8fafc;
	}
	.wl-page.theme-dark .wl-sub,
	.wl-page.theme-dark .wl-hint,
	.wl-page.theme-dark .wl-act {
		color: #94a3b8;
	}
	.wl-page.theme-dark .wl-sheet-ta {
		background: #0f172a;
		border-color: #475569;
		color: #f8fafc;
	}
	.wl-page.theme-dark .wl-comment-list {
		background: #0f172a;
		border-color: #334155;
	}
	.wl-page.theme-dark .wl-comment-text {
		color: #cbd5e1;
	}
</style>
