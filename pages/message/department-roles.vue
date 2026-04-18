<template>

	<view class="page-root">

		<scroll-view scroll-y class="scroll" :show-scrollbar="false">

			<view v-if="rows.length === 0" class="empty">

				<text class="empty-t">暂无该部门下的角色</text>

				<text class="empty-sub">请确认本地人设表已包含该部门分类；下拉刷新重试。</text>

			</view>

			<template v-else>

				<view class="hero">

					<text class="hero-title">可选角色</text>

					<text class="hero-meta">共 {{ rows.length }} 位 · 轻触进入对话</text>

				</view>

				<view

					v-for="row in rows"

					:key="row.id"

					class="card"

					hover-class="card-hover"

					@tap="openChat(row)"

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

	import {

		listPersonasByCategorySlug,

		personaChatTitle,

		personaSnippetLine,

	} from "@/utils/agentPersonaCatalog";



	export default {

		data() {

			return {

				slug: "",

				rows: [],

			};

		},

		onLoad(options) {

			this.slug = this.normalizeSlug(options.slug);

			const rawTitle = options.title || "";

			let navTitle = "岗位角色";

			try {

				navTitle = rawTitle ? decodeURIComponent(rawTitle) : navTitle;

			} catch {

				navTitle = rawTitle || navTitle;

			}

			try {

				uni.setNavigationBarTitle({ title: navTitle });

			} catch {

				//

			}

			this.reloadRows();

		},

		methods: {

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

			reloadRows() {

				this.rows = listPersonasByCategorySlug(this.slug);

			},

			displayTitle(row) {

				return personaChatTitle(row);

			},

			snippetPreview(row) {

				return personaSnippetLine(row);

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

				const t = personaChatTitle(row) || "?";

				return t.slice(0, 1);

			},

			openChat(row) {

				const title = encodeURIComponent(personaChatTitle(row));

				const id = encodeURIComponent(row.id);

				uni.navigateTo({

					url: `/pages/chat/chat?mode=virtual&kind=persona&id=${id}&title=${title}`,

				});

			},

		},

	};

</script>



<style scoped>

	.page-root {

		min-height: 100vh;

		background: linear-gradient(180deg, #eff6ff 0%, #f1f5f9 22%, #f1f5f9 100%);

		display: flex;

		flex-direction: column;

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

</style>
