<template>

	<view class="page-root">

		<view class="navbar-wrap" :style="{ paddingTop: statusBarPx + 'px' }">

			<view class="navbar">

				<view class="navbar-side navbar-side-left">

					<NavBackClick />

				</view>

				<text class="navbar-title">{{ pageTitle }}</text>

				<view class="navbar-side navbar-side-right" @click="goCreateAgent">
					<text class="navbar-plus">＋</text>
				</view>

			</view>

		</view>

		<scroll-view scroll-y class="scroll" :show-scrollbar="false">

			<view v-if="rows.length === 0" class="empty">

				<text class="empty-t">{{ t('dept_roles_empty') }}</text>

				<text class="empty-sub">该部门还没有员工，点击右上角 + 创建后即可显示。</text>

			</view>

			<template v-else>

				<view class="hero">

					<text class="hero-title">{{ t('dept_roles_hero_title') }}</text>

					<text class="hero-meta">{{ t('dept_roles_hero_meta', { count: rows.length }) }}</text>

				</view>

				<view
					v-for="row in rows"
					:key="row.id"
					class="card"
					:class="{ 'card-deleting': isDeletingRole }"
					hover-class="card-hover"
					@tap="isDeletingRole ? null : openChat(row)"
				>
					<view class="avatar" :style="{ background: avatarBg(row) }">
						<text class="avatar-letter">{{ avatarLetter(row) }}</text>
					</view>
					<view class="card-body">
						<text class="cell-title">{{ displayTitle(row) }}</text>
					<text class="cell-sub">{{ snippetPreview(row) }}</text>
					</view>
					<text class="cell-arrow">›</text>
				</view>

			</template>

			<view class="pad"></view>

		</scroll-view>

	</view>

</template>



<script>
	import NavBackClick from "@/components/NavBackClick.vue";
	import { listMyUserAgents } from "@/clientApi/agentsApi";
	import { getApiErrorMessage } from "@/utils/apiHelpers";
	import { t, getLanguage } from "@/utils/lang";
	export default {
		components: { NavBackClick },
		data() {
			return {
				slug: "",
				rows: [],
				statusBarPx: 20,
				pageTitle: "",
			};
		},
		onLoad(options) {
			const sys = uni.getSystemInfoSync();
			this.statusBarPx = sys.statusBarHeight || 20;
			this.slug = this.normalizeSlug(options.slug);
			const rawTitle = options.title || "";
			let navTitle = t("dept_roles_nav", getLanguage());
			try {
				navTitle = rawTitle ? decodeURIComponent(rawTitle) : navTitle;
			} catch {
				navTitle = rawTitle || navTitle;
			}
			this.pageTitle = navTitle;
			this.reloadRows();
			try {
				uni.setNavigationBarTitle({ title: this.pageTitle });
			} catch (e) {
				//
			}
		},
		onShow() {
			this.reloadRows();
		},
		methods: {
			t(key, params = {}) {
				return t(key, getLanguage(), params);
			},
			normalizeSlug(raw) {
				if (raw == null || raw === "") return "";
				let s = raw;
				try {
					s = decodeURIComponent(String(raw));
				} catch {
					s = String(raw);
				}
				try {
					while (/%[0-9A-Fa-f]{2}/.test(s)) {
						const next = decodeURIComponent(s);
						if (next === s) break;
						s = next;
					}
				} catch {
					//
				}
				return String(s).trim();
			},
			async reloadRows() {
				try {
					const list = await listMyUserAgents();
					const rows = Array.isArray(list) ? list : [];
					const slugLower = String(this.slug || "").trim().toLowerCase();
					const titleLower = String(this.pageTitle || "").trim().toLowerCase();
					this.rows = rows.filter((r) => {
						const dept = String(r?.department || "").trim().toLowerCase();
						if (!dept) return false;
						if (slugLower && dept === slugLower) return true;
						if (titleLower && dept === titleLower) return true;
						if (slugLower && dept.includes(slugLower)) return true;
						if (titleLower && dept.includes(titleLower)) return true;
						return false;
					});
				} catch (e) {
					this.rows = [];
					uni.showToast({ title: getApiErrorMessage(e) || "加载部门角色失败", icon: "none" });
				}
			},
			displayTitle(row) {
				return row?.displayName || row?.name || "未命名 Agent";
			},
			snippetPreview(row) {
				const role = row?.jobTitle || row?.rolePosition || "未设置职位";
				const main = row?.mainWork ? ` · ${String(row.mainWork).slice(0, 24)}` : "";
				return `${role}${main}`;
			},
			avatarBg(row) {
				const colors = [
					"linear-gradient(145deg, #2563eb, #1d4ed8)",
					"linear-gradient(145deg, #7c3aed, #6d28d9)",
					"linear-gradient(145deg, #059669, #047857)",
					"linear-gradient(145deg, #d97706, #b45309)",
					"linear-gradient(145deg, #db2777, #be185d)",
					"linear-gradient(145deg, #0891b2, #0e7490)",
				];
				const s = row.id || row.title || "";
				let h = 0;
				for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
				return colors[h % colors.length];
			},
			avatarLetter(row) {
				const t = this.displayTitle(row) || "?";
				return t.slice(0, 1);
			},
			openChat(row) {
				const id = row?.id;
				if (!id) return;
				const title = encodeURIComponent(this.displayTitle(row));
				uni.navigateTo({
					url: `/pages/chat/chat?mode=virtual&kind=agent&id=${encodeURIComponent(id)}&title=${title}`,
				});
			},
			goCreateAgent() {
				const dept = encodeURIComponent(this.pageTitle || this.slug || "");
				uni.navigateTo({ url: `/pages/team/create-agent?department=${dept}` });
			},
		},
	};
</script>



<style scoped>

	.page-root {

		height: 100vh;

		min-height: 100vh;

		background: linear-gradient(180deg, #eff6ff 0%, #f1f5f9 22%, #f1f5f9 100%);

		display: flex;

		flex-direction: column;

		box-sizing: border-box;

	}

	.navbar-wrap {

		background: #ededed;

		flex-shrink: 0;

		border-bottom: 1rpx solid #d9d9d9;

	}

	.navbar {

		height: 88rpx;

		display: flex;

		flex-direction: row;

		align-items: center;

		justify-content: space-between;

		padding: 0 8rpx 0 12rpx;

		box-sizing: border-box;

	}

	.navbar-side {

		width: 88rpx;

		min-height: 1px;

		flex-shrink: 0;

	}

	.navbar-side-left {

		width: auto;

		min-width: 0;

		display: flex;

		align-items: center;

		justify-content: flex-start;

	}

	.navbar-side-right {

		width: 88rpx;

	}

	.navbar-title {

		flex: 1;

		min-width: 0;

		text-align: center;

		font-size: 34rpx;

		font-weight: 600;

		color: #111;

		overflow: hidden;

		text-overflow: ellipsis;

		white-space: nowrap;

		padding: 0 8rpx;

	}



	.scroll {

		flex: 1;

		height: 0;

		box-sizing: border-box;

		padding: 0 24rpx;

	}



	.hero {

		padding: 28rpx 8rpx 20rpx;

	}



	.hero-title {

		display: block;

		font-size: 34rpx;

		font-weight: 700;

		color: #0f172a;

		letter-spacing: 0.5rpx;

	}



	.hero-meta {

		display: block;

		margin-top: 12rpx;

		font-size: 24rpx;

		color: #64748b;

		line-height: 1.4;

	}



	.empty {

		padding: 120rpx 32rpx;

		text-align: center;

	}



	.empty-t {

		font-size: 28rpx;

		color: #64748b;

		display: block;

	}



	.empty-sub {

		margin-top: 16rpx;

		font-size: 22rpx;

		color: #94a3b8;

		display: block;

		line-height: 1.5;

	}



	.card {

		display: flex;

		flex-direction: row;

		align-items: center;

		padding: 26rpx 28rpx;

		margin-bottom: 20rpx;

		background: #ffffff;

		border-radius: 20rpx;

		box-shadow: 0 8rpx 32rpx rgba(15, 23, 42, 0.06);

		border: 1rpx solid rgba(226, 232, 240, 0.9);

	}



	.card-hover {

		background: #f8fafc !important;

		transform: scale(0.995);

	}



	.avatar {

		width: 96rpx;

		height: 96rpx;

		border-radius: 20rpx;

		flex-shrink: 0;

		display: flex;

		align-items: center;

		justify-content: center;

		margin-right: 24rpx;

		box-shadow: 0 6rpx 20rpx rgba(37, 99, 235, 0.22);

	}



	.avatar-letter {

		font-size: 40rpx;

		font-weight: 700;

		color: #ffffff;

		line-height: 1;

	}



	.card-body {

		flex: 1;

		min-width: 0;

		padding-right: 12rpx;

	}



	.cell-title {

		font-size: 30rpx;

		color: #0f172a;

		font-weight: 600;

		line-height: 1.35;

		display: block;

		margin-bottom: 12rpx;

	}



	.cell-sub {

		font-size: 24rpx;

		color: #64748b;

		line-height: 1.5;

		overflow: hidden;

		display: -webkit-box;

		-webkit-box-orient: vertical;

		-webkit-line-clamp: 2;

	}



	.cell-arrow {

		font-size: 34rpx;

		color: #cbd5e1;

		flex-shrink: 0;

		font-weight: 300;

		padding-left: 8rpx;

	}



	.pad {

		height: calc(48rpx + env(safe-area-inset-bottom));

	}

	.navbar-plus {
		font-size: 40rpx;
		font-weight: 400;
		color: #2563eb;
		line-height: 1;
	}

	.navbar-done {
		font-size: 28rpx;
		font-weight: 500;
		color: #2563eb;
		line-height: 1;
	}

	.role-delete {
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

	.mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(15, 23, 42, 0.16);
		z-index: 100000;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.add-role-popup {
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

	.add-role-list {
		flex: 1;
		overflow-y: auto;
		padding: 16rpx 28rpx;
	}

	.add-role-empty {
		padding: 80rpx 0;
		text-align: center;
		color: #94a3b8;
		font-size: 28rpx;
	}

	.add-role-item {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 24rpx 16rpx;
		border-radius: 16rpx;
		margin-bottom: 12rpx;
		background: #f8fafc;
	}

	.add-role-selected {
		background: #eff6ff;
	}

	.add-role-check-box {
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

	.add-role-selected .add-role-check-box {
		border-color: #2563eb;
		background: #2563eb;
	}

	.add-role-check {
		font-size: 24rpx;
		color: #fff;
		font-weight: 700;
		line-height: 1;
	}

	.add-role-name {
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
