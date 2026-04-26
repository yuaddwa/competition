<template>
	<view class="wl-page" :class="{ 'theme-dark': isDarkMode }">
		<view class="wl-nav" :style="{ paddingTop: statusBarPx + 'px' }">
			<view class="wl-nav-row">
				<NavBackClick :fallback-tab="'/pages/profile/profile'" />
				<view class="wl-nav-actions">
					<text class="wl-ico" @click="onSearchTap">⌕</text>
					<text class="wl-ico" @click="onMoreTap">⋯</text>
				</view>
			</view>
			<view class="wl-nav-title-block">
				<text class="wl-title">{{ t("worklog_nav_title") }}</text>
				<text class="wl-sub">{{ companyLine }}</text>
			</view>
		</view>

		<view v-if="viewMode === 'list'" class="wl-body">
			<scroll-view scroll-x class="wl-tabs-scroll" :show-scrollbar="false">
				<view class="wl-tabs">
					<text
						v-for="tab in mainTabs"
						:key="tab.key"
						class="wl-tab"
						:class="{ active: mainTab === tab.key }"
						@click="mainTab = tab.key"
					>
						{{ tab.label }}
					</text>
				</view>
			</scroll-view>

			<view class="wl-filter-row">
				<view class="wl-pills">
					<text class="wl-pill" :class="{ on: pillDaily === false }" @click="pillDaily = false">{{ t("worklog_pill_all") }}</text>
					<text class="wl-pill" :class="{ on: pillDaily === true }" @click="pillDaily = true">{{ t("worklog_pill_daily") }}</text>
				</view>
				<view class="wl-unread" @click="onlyUnread = !onlyUnread">
					<view class="wl-radio" :class="{ on: onlyUnread }" />
					<text class="wl-unread-t">{{ t("worklog_only_unread") }}</text>
				</view>
			</view>

			<scroll-view scroll-y class="wl-feed" :show-scrollbar="false">
				<view v-if="filteredSections.length === 0" class="wl-empty">
					<text>{{ emptyHint }}</text>
				</view>
				<template v-else>
					<template v-for="(sec, si) in filteredSections" :key="sec.key">
						<text class="wl-sec-label">{{ sec.label }}</text>
						<view v-for="item in sec.items" :key="item.id" class="wl-card">
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
							<view class="wl-card-actions">
								<text class="wl-act" @click="markRead(item)">{{ readLabel(item) }}</text>
								<text class="wl-act" @click="bumpComment(item)">{{ t("worklog_action_comment") }} {{ item.comments ? `(${item.comments})` : "" }}</text>
								<text class="wl-act" :class="{ liked: item.liked }" @click="toggleLike(item)">
									{{ t("worklog_action_like") }}{{ item.likes ? ` ${item.likes}` : "" }}
								</text>
							</view>
						</view>
					</template>
				</template>
				<view class="wl-feed-pad" />
			</scroll-view>
		</view>

		<view v-else-if="viewMode === 'write'" class="wl-write">
			<text class="wl-write-hint">{{ t("worklog_write_hint") }}</text>
			<textarea v-model="draftBody" class="wl-ta" :placeholder="t('worklog_write_placeholder')" />
			<button class="wl-submit" type="primary" @click="submitDraft">{{ t("worklog_write_submit") }}</button>
		</view>

		<view v-else class="wl-placeholder">
			<text class="wl-ph-t">{{ placeholderTitle }}</text>
			<text class="wl-ph-sub">{{ placeholderSub }}</text>
		</view>

		<view class="wl-bottom safe-bottom">
			<view
				v-for="b in bottomTabs"
				:key="b.key"
				class="wl-b-item"
				:class="{ on: viewMode === b.key }"
				@click="onBottomTab(b.key)"
			>
				<text class="wl-b-ico">{{ b.icon }}</text>
				<text class="wl-b-t">{{ b.label }}</text>
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
	import { loadDigitalAgents, getDailyBriefing } from "@/utils/virtualTeamStore";

	const K_SENT = "worklog_sent_entries_v1";

	export default {
		components: { NavBackClick },
		data() {
			return {
				statusBarPx: 20,
				isDarkMode: false,
				mainTab: "received",
				pillDaily: true,
				onlyUnread: false,
				viewMode: "list",
				draftBody: "",
				receivedEntries: [],
				sentEntries: [],
			};
		},
		computed: {
			companyLine() {
				const u = getUserInfo() || {};
				const c = String(u.companyName || u.orgName || u.enterpriseName || "").trim();
				if (c) return c;
				return this.t("worklog_company_placeholder");
			},
			mainTabs() {
				return [
					{ key: "received", label: this.t("worklog_tab_received") },
					{ key: "sent", label: this.t("worklog_tab_sent") },
					{ key: "team", label: this.t("worklog_tab_team") },
					{ key: "comments", label: this.t("worklog_tab_comments") },
				];
			},
			bottomTabs() {
				return [
					{ key: "list", icon: "📋", label: this.t("worklog_bottom_view") },
					{ key: "write", icon: "✎", label: this.t("worklog_bottom_write") },
					{ key: "stats", icon: "📈", label: this.t("worklog_bottom_stats") },
					{ key: "templates", icon: "⚙", label: this.t("worklog_bottom_templates") },
				];
			},
			rawSections() {
				return this.buildSectionsForTab(this.mainTab);
			},
			filteredSections() {
				const secs = this.rawSections.map((s) => ({
					...s,
					items: s.items.filter((it) => {
						if (this.onlyUnread && it.read) return false;
						if (this.pillDaily && it.kind !== "daily") return false;
						return true;
					}),
				}));
				return secs.filter((s) => s.items.length > 0);
			},
			emptyHint() {
				if (this.mainTab === "sent") return this.t("worklog_empty_sent");
				if (this.mainTab === "comments") return this.t("worklog_empty_comments");
				return this.t("worklog_empty_feed");
			},
			placeholderTitle() {
				if (this.viewMode === "stats") return this.t("worklog_bottom_stats");
				if (this.viewMode === "templates") return this.t("worklog_bottom_templates");
				return "";
			},
			placeholderSub() {
				if (this.viewMode === "stats") return this.t("worklog_toast_stats");
				if (this.viewMode === "templates") return this.t("worklog_toast_templates");
				return "";
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
			this.loadSentFromStorage();
		},
		onShow() {
			this.loadDarkMode();
			this.refreshFeed();
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
			loadSentFromStorage() {
				try {
					const raw = uni.getStorageSync(K_SENT);
					const arr = typeof raw === "string" ? JSON.parse(raw || "[]") : raw;
					this.sentEntries = Array.isArray(arr) ? arr : [];
				} catch {
					this.sentEntries = [];
				}
			},
			saveSentToStorage() {
				try {
					uni.setStorageSync(K_SENT, JSON.stringify(this.sentEntries));
				} catch {
					//
				}
			},
			async refreshFeed() {
				const lang = getLanguage();
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
				const briefing = getDailyBriefing();
				const yTimes = ["19:42", "17:46", "11:20", "16:05"];
				const bTimes = ["18:05", "09:30", "15:18"];
				this.receivedEntries = rows.map((a, i) => {
					const section = i % 2 === 0 ? "yesterday" : "before";
					const times = section === "yesterday" ? yTimes : bTimes;
					const timeClock = times[i % times.length];
					const line = briefing.employeeLines.find((l) => l.id === a.id) || briefing.employeeLines[i % Math.max(briefing.employeeLines.length, 1)];
					const body =
						(a.mainWork && a.mainWork.slice(0, 400)) ||
						(line && line.summary) ||
						t("briefing_employee_summary", lang, { role: a.role || t("vt_member_default", lang) });
					const avatarUrl = resolveAvatarDisplayUrl(a.avatar);
					return {
						id: `r_${a.id}_${i}`,
						kind: "daily",
						section,
						timeClock,
						name: a.name,
						role: a.role,
						avatarUrl: avatarUrl || "",
						body: String(body).trim(),
						read: i % 3 !== 0,
						likes: (i % 5) + (i % 2),
						liked: false,
						comments: i % 3,
					};
				});
			},
			buildSectionsForTab(tab) {
				const lang = getLanguage();
				const yLabel = t("worklog_section_yesterday", lang);
				const bLabel = t("worklog_section_before_yesterday", lang);
				const pick = (list) => {
					const y = [];
					const b = [];
					for (const it of list) {
						if (it.section === "yesterday") y.push(it);
						else b.push(it);
					}
					const out = [];
					if (y.length) out.push({ key: "yesterday", label: yLabel, items: y });
					if (b.length) out.push({ key: "before", label: bLabel, items: b });
					return out;
				};
				if (tab === "received" || tab === "team") {
					return pick(this.receivedEntries);
				}
				if (tab === "sent") {
					const items = this.sentEntries.map((e, i) => ({
						id: e.id || `s_${i}`,
						kind: "daily",
						section: "yesterday",
						timeClock: e.timeClock || "10:00",
						name: e.name || this.t("digital_employee_fallback"),
						role: "",
						avatarUrl: "",
						body: e.body || "",
						read: true,
						likes: 0,
						liked: false,
						comments: 0,
					}));
					return items.length ? [{ key: "yesterday", label: yLabel, items }] : [];
				}
				if (tab === "comments") {
					return [];
				}
				return [];
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
				const n = Math.min(9, Math.max(1, (item.comments || 0) + 1));
				return this.t("worklog_action_read_partial", { n });
			},
			markRead(item) {
				item.read = true;
				this.$forceUpdate();
			},
			bumpComment(item) {
				item.comments = (item.comments || 0) + 1;
				this.$forceUpdate();
			},
			toggleLike(item) {
				if (item.liked) {
					item.liked = false;
					item.likes = Math.max(0, (item.likes || 1) - 1);
				} else {
					item.liked = true;
					item.likes = (item.likes || 0) + 1;
				}
				this.$forceUpdate();
			},
			onBottomTab(key) {
				if (key === "list") {
					this.viewMode = "list";
					return;
				}
				if (key === "write") {
					this.viewMode = "write";
					this.draftBody = "";
					return;
				}
				if (key === "stats") {
					this.viewMode = "stats";
					uni.showToast({ title: this.t("worklog_toast_stats"), icon: "none" });
					return;
				}
				if (key === "templates") {
					this.viewMode = "templates";
					uni.showToast({ title: this.t("worklog_toast_templates"), icon: "none" });
				}
			},
			submitDraft() {
				const body = (this.draftBody || "").trim();
				if (!body) {
					uni.showToast({ title: this.t("worklog_write_empty"), icon: "none" });
					return;
				}
				const u = getUserInfo() || {};
				const name = String(u.nickname || u.name || u.username || this.t("home_sender_me")).trim() || "Me";
				this.sentEntries.unshift({
					id: `s_${Date.now()}`,
					body,
					name,
					timeClock: this.formatNowClock(),
				});
				this.saveSentToStorage();
				this.draftBody = "";
				uni.showToast({ title: this.t("worklog_write_ok"), icon: "success" });
				this.viewMode = "list";
				this.mainTab = "sent";
			},
			formatNowClock() {
				const d = new Date();
				const pad = (n) => (n < 10 ? "0" : "") + n;
				return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
			},
			onSearchTap() {
				uni.showToast({ title: this.t("worklog_toast_search"), icon: "none" });
			},
			onMoreTap() {
				uni.showToast({ title: this.t("worklog_toast_more"), icon: "none" });
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
		gap: 28rpx;
		padding-right: 20rpx;
	}
	.wl-ico {
		font-size: 36rpx;
		color: #64748b;
		line-height: 1;
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
	.wl-tabs-scroll {
		flex-shrink: 0;
		background: #fff;
		border-bottom: 1rpx solid #eef0f3;
	}
	.wl-tabs {
		display: flex;
		flex-direction: row;
		padding: 0 12rpx;
		white-space: nowrap;
	}
	.wl-tab {
		flex: 1;
		text-align: center;
		font-size: 26rpx;
		color: #64748b;
		padding: 20rpx 8rpx 16rpx;
		border-bottom: 4rpx solid transparent;
	}
	.wl-tab.active {
		color: #111827;
		font-weight: 700;
		border-bottom-color: #2563eb;
	}
	.wl-filter-row {
		flex-shrink: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 16rpx 24rpx;
		background: #fff;
	}
	.wl-pills {
		display: flex;
		flex-direction: row;
		gap: 16rpx;
	}
	.wl-pill {
		font-size: 24rpx;
		color: #64748b;
		padding: 10rpx 24rpx;
		border-radius: 999rpx;
		background: #f1f5f9;
		border: 1rpx solid #e2e8f0;
	}
	.wl-pill.on {
		color: #fff;
		background: #2563eb;
		border-color: #2563eb;
	}
	.wl-unread {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10rpx;
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
		height: 140rpx;
	}
	.wl-write {
		flex: 1;
		padding: 24rpx;
		min-height: 0;
	}
	.wl-write-hint {
		font-size: 24rpx;
		color: #64748b;
		margin-bottom: 16rpx;
	}
	.wl-ta {
		width: 100%;
		min-height: 280rpx;
		padding: 20rpx;
		font-size: 28rpx;
		border: 1rpx solid #e2e8f0;
		border-radius: 12rpx;
		background: #fff;
		box-sizing: border-box;
	}
	.wl-submit {
		margin-top: 24rpx;
	}
	.wl-placeholder {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 48rpx;
	}
	.wl-ph-t {
		font-size: 32rpx;
		font-weight: 700;
		color: #334155;
	}
	.wl-ph-sub {
		margin-top: 16rpx;
		font-size: 26rpx;
		color: #64748b;
		text-align: center;
		line-height: 1.5;
	}
	.wl-bottom {
		flex-shrink: 0;
		display: flex;
		flex-direction: row;
		border-top: 1rpx solid #e5e7eb;
		background: #fff;
		padding-top: 8rpx;
		padding-bottom: 8rpx;
	}
	.wl-b-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 8rpx 0;
	}
	.wl-b-item.on .wl-b-t {
		color: #2563eb;
		font-weight: 700;
	}
	.wl-b-ico {
		font-size: 36rpx;
		line-height: 1;
	}
	.wl-b-t {
		margin-top: 6rpx;
		font-size: 20rpx;
		color: #64748b;
	}
	.safe-bottom {
		padding-bottom: env(safe-area-inset-bottom);
	}
	.wl-page.theme-dark {
		background: #0f172a;
	}
	.wl-page.theme-dark .wl-nav,
	.wl-page.theme-dark .wl-tabs-scroll,
	.wl-page.theme-dark .wl-filter-row,
	.wl-page.theme-dark .wl-card,
	.wl-page.theme-dark .wl-bottom {
		background: #1e293b;
		border-color: #334155;
	}
	.wl-page.theme-dark .wl-title,
	.wl-page.theme-dark .wl-card-name,
	.wl-page.theme-dark .wl-body-text {
		color: #f8fafc;
	}
	.wl-page.theme-dark .wl-sub,
	.wl-page.theme-dark .wl-tab,
	.wl-page.theme-dark .wl-act {
		color: #94a3b8;
	}
	.wl-page.theme-dark .wl-tab.active {
		color: #f8fafc;
		border-bottom-color: #60a5fa;
	}
	.wl-page.theme-dark .wl-pill {
		background: #334155;
		border-color: #475569;
		color: #cbd5e1;
	}
	.wl-page.theme-dark .wl-pill.on {
		background: #2563eb;
		border-color: #2563eb;
		color: #fff;
	}
	.wl-page.theme-dark .wl-ta {
		background: #0f172a;
		border-color: #475569;
		color: #f8fafc;
	}
</style>
