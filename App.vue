<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			this.cleanupLegacySeedMessages()
			this.initDarkMode()
			this.initFontSize()
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			cleanupLegacySeedMessages() {
				try {
					const messages = uni.getStorageSync('projectMessages') || []
					const cleaned = messages.filter(msg => {
						const pn = msg.projectName || ''
						const title = msg.title || ''
						const content = msg.content || ''
						const isSeed = pn.includes('工程部') || pn.includes('Engineering') ||
							title.includes('问候') || title.includes('Hello') ||
							content.includes('有什么问题') || content.includes('Any questions')
						return !isSeed
					})
					if (cleaned.length !== messages.length) {
						uni.setStorageSync('projectMessages', cleaned)
						console.log('[App] 已清理工程部示例消息')
					}
					uni.removeStorageSync('hasLaunched')
				} catch (e) {
					console.warn('[App] cleanupLegacySeedMessages error', e)
				}
			},
			normalizeFontSizeKey(raw) {
				const map = { 小: 'xs', 中: 'sm', 大: 'md', 特大: 'xl' }
				if (map[raw]) return map[raw]
				return ['xs', 'sm', 'md', 'xl'].includes(raw) ? raw : 'sm'
			},
			initFontSize() {
				try {
					const settings = uni.getStorageSync("userSettings")
					let parsed = {}
					if (settings) {
						parsed = typeof settings === 'string' ? JSON.parse(settings) : settings
					}
					this.applyFontSize(this.normalizeFontSizeKey(parsed.fontSize))
				} catch (e) {
					console.warn('[App] initFontSize error', e)
					this.applyFontSize('sm')
				}
			},
			applyFontSize(sizeKey = 'sm') {
				const key = this.normalizeFontSizeKey(sizeKey)
				const scaleMap = { xs: 0.92, sm: 1, md: 1.08, xl: 1.16 }
				const scale = scaleMap[key] || 1
				uni.setStorageSync('appFontSize', key)
				uni.setStorageSync('appFontScale', scale)
				if (typeof document !== 'undefined') {
					document.documentElement.style.setProperty('--app-font-scale', String(scale))
					document.documentElement.setAttribute('data-font-size', key)
					document.body && document.body.style.setProperty('--app-font-scale', String(scale))
					// H5 下 rpx 不跟随 root font-size，使用 zoom 才能看到整体字号变化
					document.documentElement.style.zoom = String(scale)
					document.body && (document.body.style.zoom = String(scale))
				}
				const pages = getCurrentPages()
				pages.forEach(page => {
					if (page && page.$vm && typeof page.$vm.$forceUpdate === 'function') {
						page.$vm.$forceUpdate()
					}
				})
			},
			initDarkMode() {
				try {
					const settings = uni.getStorageSync("userSettings")
					let parsed = {}
					if (settings) {
						parsed = typeof settings === 'string' ? JSON.parse(settings) : settings
					}
					const isDark = parsed.isDarkMode || false
					this.applyDarkMode(isDark)
				} catch (e) {
					console.warn('[App] initDarkMode error', e)
				}
			},
			applyDarkMode(isDark) {
				const theme = isDark ? 'dark' : 'light'
				uni.setStorageSync('currentTheme', theme)
				try {
					uni.setStorageSync('isDarkMode', isDark)
				} catch (e) {
					//
				}
				uni.setSystemTheme && uni.setSystemTheme({ theme: isDark ? 'dark' : 'light' })
				if (typeof document !== 'undefined') {
					document.documentElement.setAttribute('data-theme', theme)
					document.body && document.body.setAttribute('data-theme', theme)
				}
				try {
					uni.setNavigationBarColor({
						frontColor: isDark ? '#ffffff' : '#000000',
						backgroundColor: isDark ? '#1e293b' : '#ededed',
					})
				} catch (e) {
					//
				}
				const pages = getCurrentPages()
				pages.forEach(page => {
					if (page && page.$vm) {
						page.$vm.updateTheme && page.$vm.updateTheme(isDark)
						if (typeof page.$vm.$forceUpdate === 'function') {
							page.$vm.$forceUpdate()
						}
					}
				})
			}
		}
	}
</script>

<style>
	:root {
		--app-font-scale: 1;
		--bg-primary: #f1f5f9;
		--bg-secondary: #ffffff;
		--bg-tertiary: #eff6ff;
		--text-primary: #0f172a;
		--text-secondary: #64748b;
		--text-tertiary: #94a3b8;
		--border-color: #e2e8f0;
		--card-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
		--tab-bar-bg: #ffffff;
		--navbar-bg: #ededed;
		--input-bg: #f8fafc;
		--input-border: #e2e8f0;
		--input-placeholder: #94a3b8;
		--cell-hover: #f8fafc;
		--success-color: #07c160;
		--primary-color: #2563eb;
		--danger-color: #dc2626;
	}

	[data-theme="dark"] {
		--bg-primary: #0f172a;
		--bg-secondary: #1e293b;
		--bg-tertiary: #334155;
		--text-primary: #f8fafc;
		--text-secondary: #94a3b8;
		--text-tertiary: #64748b;
		--border-color: #334155;
		--card-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.3);
		--tab-bar-bg: #1e293b;
		--navbar-bg: #1e293b;
		/* 输入区：略浅于页面底、略深于卡片边线，配独立描边与占位符，长时间输入更不累眼 */
		--input-bg: #1a2332;
		--input-border: #3f4f63;
		--input-placeholder: #94a3b8;
		--cell-hover: #334155;
	}

	page {
		background-color: var(--bg-primary);
		color: var(--text-primary);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	view {
		box-sizing: border-box;
	}

	/* 通用深色模式适配 */
	.page-root,
	.main-scroll,
	.scroll,
	.scroll-clip,
	.chat-page,
	.profile-page,
	.add-page,
	.page {
		background-color: var(--bg-primary) !important;
		color: var(--text-primary);
	}

	.cell-group,
	.card,
	.wf-card,
	.popup,
	.dialog,
	.agent-popup,
	.agent-item,
	.wx-cell,
	.dept-wrap,
	.profile-header,
	.ceo-header,
	.team-overview,
	.team-stat-card,
	.quick-action-item,
	.hint-card,
	.msg-tab-strip,
	.navbar-wrap,
	.navbar,
	.hero,
	.wf-bar,
	.steps,
	.hero-header {
		background-color: var(--bg-secondary) !important;
		color: var(--text-primary);
	}

	.cell,
	.wx-cell,
	.agent-item,
	.wx-cell-dept {
		border-color: var(--border-color) !important;
	}

	.cell-title,
	.wx-title,
	.nick,
	.wf-title,
	.wf-desc,
	.wf-id,
	.agent-name,
	.popup-title,
	.cell-text-wrap,
	.cell-title,
	.head-title,
	.wf-name,
	.label,
	.team-stat-num,
	.team-stat-label,
	.quick-action-text,
	.about-line,
	.hint-title,
	.hint-t,
	.page-title {
		color: var(--text-primary) !important;
	}

	.cell-sub,
	.wx-sub,
	.wx-time,
	.agent-last-msg,
	.cell-extra,
	.cell-value,
	.about-line.sub,
	.hint-t,
	.page-sub,
	.account-line,
	.cell-sub,
	.bubble-sender,
	.hall-name,
	.hall-time,
	.bubble-meta-time {
		color: var(--text-secondary) !important;
	}

	.cell-arrow,
	.wf-go,
	.wx-chevron,
	.agent-arrow,
	.team-stat-arrow {
		color: var(--text-tertiary) !important;
	}

	.cell-arrow,
	.wx-chevron {
		color: var(--text-tertiary);
	}

	.group-spacer,
	.wx-pad,
	.bottom-spacer,
	.scroll-pad {
		background-color: var(--bg-primary) !important;
	}

	.popup-footer,
	.popup-header,
	.cell-static,
	.wx-cell-dept {
		border-color: var(--border-color) !important;
	}

	.popup-count,
	.agent-role {
		color: var(--text-secondary) !important;
		background-color: var(--bg-tertiary) !important;
	}

	.popup-btn,
	.btn.main,
	.fab-btn,
	.empty-primary {
		background: linear-gradient(135deg, var(--primary-color), #4f46e5) !important;
	}

	.bg-model {
		background: linear-gradient(145deg, #4f46e6, #6366f1) !important;
	}

	.popup-btn,
	.fab-btn,
	.empty-primary {
		box-shadow: var(--card-shadow) !important;
	}

	.input-field,
	textarea,
	.dialog-input {
		background-color: var(--input-bg) !important;
		color: var(--text-primary) !important;
		border-color: var(--input-border) !important;
	}

	.chat-scroll,
	.feed-scroll,
	.scroll {
		background-color: var(--bg-primary) !important;
	}

	.chat-input,
	.mask,
	.bottom-anchor {
		background-color: var(--bg-secondary) !important;
	}

	.send-button {
		background-color: var(--primary-color) !important;
	}

	.hall-bubble,
	.wx-avatar {
		background-color: var(--bg-secondary) !important;
	}

	.hall-bubble.manager {
		background-color: rgba(232, 245, 233, 1) !important;
		border-color: #c8e6c9 !important;
	}

	.hall-text,
	.bubble-text {
		color: var(--text-primary) !important;
	}

	/* 自己发出的消息：绿泡 + 黑字（与微信一致，且不受深色主题变量影响） */
	.hall-bubble.mine .hall-text {
		color: #191919 !important;
	}

	.hall-bubble.mine {
		background-color: #95ec69 !important;
	}

	.message-bubble {
		background-color: var(--bg-secondary) !important;
	}

	.message-bubble.my-message {
		background-color: #95ec69 !important;
	}

	.message-bubble.my-message .bubble-text {
		color: #191919 !important;
	}

	/* TabBar适配 */
	.tab-bar {
		background-color: var(--tab-bar-bg) !important;
		border-top-color: var(--border-color) !important;
	}

	.mask {
		/* 全局弹层遮罩调浅，避免操作时整屏过暗 */
		background: rgba(15, 23, 42, 0.16) !important;
	}

	/* uni-app 原生弹窗（ActionSheet / Modal / Picker）遮罩统一调浅 */
	.uni-mask,
	uni-mask,
	.uni-modal__mask {
		background: rgba(15, 23, 42, 0.16) !important;
	}

	.wx-loading,
	.loading-t,
	.wx-empty-t,
	.wx-empty-sub,
	.tip-t {
		color: var(--text-secondary) !important;
	}

	.wx-tag,
	.wx-badge,
	.agent-badge {
		background-color: #fa5151 !important;
	}

	.pri {
		background-color: var(--bg-tertiary) !important;
		color: var(--text-secondary) !important;
	}

	.pri.on {
		background-color: rgba(37, 99, 235, 0.1) !important;
		border-color: var(--primary-color) !important;
	}

	.pri.on .pri-t {
		color: var(--primary-color) !important;
	}

	.placeholder,
	.ph,
	.iph,
	.cell-placeholder {
		color: var(--input-placeholder) !important;
	}

	/* 深色模式：输入框描边、光标与内阴影，层次更清晰 */
	[data-theme="dark"] .input-field,
	[data-theme="dark"] textarea,
	[data-theme="dark"] .dialog-input,
	[data-theme="dark"] .inp,
	[data-theme="dark"] .ta {
		background-color: var(--input-bg) !important;
		color: var(--text-primary) !important;
		border-color: var(--input-border) !important;
		box-shadow: inset 0 1rpx 3rpx rgba(0, 0, 0, 0.35) !important;
		caret-color: #93c5fd;
	}

	[data-theme="dark"] .inp:focus,
	[data-theme="dark"] .input-field:focus,
	[data-theme="dark"] textarea:focus {
		border-color: rgba(59, 130, 246, 0.65) !important;
		box-shadow:
			inset 0 1rpx 3rpx rgba(0, 0, 0, 0.3),
			0 0 0 2rpx rgba(37, 99, 235, 0.25) !important;
	}

	.picker-line {
		color: var(--text-primary) !important;
	}

	/* AppTabBar适配 */
	.app-tab-bar {
		background-color: var(--tab-bar-bg) !important;
	}

	.app-tab-bar-item-text {
		color: var(--text-secondary) !important;
	}

	.app-tab-bar-item-text.active {
		color: var(--primary-color) !important;
	}

	/*
	 * 深色模式：各页 scoped / 硬编码浅色背景较多，用 [data-theme="dark"] + !important 统一压过，
	 * 避免「半白半黑」、聊天气泡黑字看不见等问题。
	 */
	[data-theme="dark"] .page,
	[data-theme="dark"] .add-page,
	[data-theme="dark"] .profile-page,
	[data-theme="dark"] .auth-page {
		background-color: var(--bg-primary) !important;
	}

	/* 部分页面用 linear-gradient 写在 background 上，需覆盖整条 background */
	[data-theme="dark"] .page-root {
		background: var(--bg-primary) !important;
	}

	[data-theme="dark"] .auth-card {
		background-color: var(--bg-secondary) !important;
		box-shadow: var(--card-shadow) !important;
	}

	[data-theme="dark"] .brand {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .sub,
	[data-theme="dark"] .lab {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .navbar-wrap,
	[data-theme="dark"] .navbar {
		background-color: var(--navbar-bg) !important;
		border-bottom-color: var(--border-color) !important;
	}

	[data-theme="dark"] .navbar-title,
	[data-theme="dark"] .chat-title {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .navbar-sub {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .navbar-more {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .navbar-plus {
		color: var(--primary-color) !important;
	}

	[data-theme="dark"] .msg-tab-strip {
		background-color: var(--bg-secondary) !important;
		border-bottom-color: var(--border-color) !important;
	}

	[data-theme="dark"] .msg-tab-text {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .msg-tab-active .msg-tab-text {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .msg-row-card {
		background-color: var(--bg-secondary) !important;
		box-shadow: var(--card-shadow) !important;
	}

	[data-theme="dark"] .msg-row-card-hover {
		background-color: var(--cell-hover) !important;
	}

	[data-theme="dark"] .msg-empty-card {
		background-color: var(--bg-secondary) !important;
		box-shadow: var(--card-shadow) !important;
	}

	[data-theme="dark"] .msg-empty-t,
	[data-theme="dark"] .msg-title {
		color: var(--text-primary) !important;
	}

	/* 协作 Tab：部门 PNG（含项目管理/项目群相关图）在深色底上发闷，用浅灰衬底提高对比 */
	[data-theme="dark"] .msg-dept-icon {
		background-color: #cbd5e1 !important;
		padding: 12rpx;
		box-sizing: border-box;
		box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.14);
	}

	[data-theme="dark"] .chat-page,
	[data-theme="dark"] .chat-header-wrap,
	[data-theme="dark"] .chat-header {
		background-color: var(--bg-primary) !important;
		border-bottom-color: var(--border-color) !important;
	}

	[data-theme="dark"] .chat-more {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .chat-header .avatar-icon {
		color: #7dd3fc !important;
	}

	[data-theme="dark"] .chat-input {
		background-color: var(--bg-secondary) !important;
		border-top-color: var(--border-color) !important;
	}

	[data-theme="dark"] .multi-bar {
		background-color: var(--bg-secondary) !important;
		border-top-color: var(--border-color) !important;
	}

	[data-theme="dark"] .multi-count,
	[data-theme="dark"] .bubble-meta-time,
	[data-theme="dark"] .bubble-sender,
	[data-theme="dark"] .chat-empty {
		color: var(--text-tertiary) !important;
	}

	[data-theme="dark"] .message-bubble:not(.my-message) {
		background-color: var(--bg-secondary) !important;
		border: 1rpx solid var(--border-color) !important;
		box-shadow: none !important;
	}

	[data-theme="dark"] .message-bubble:not(.my-message) .bubble-text {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .float-to-bottom {
		background-color: rgba(30, 41, 59, 0.92) !important;
		border-color: var(--border-color) !important;
	}

	[data-theme="dark"] .float-to-bottom-icon {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .hall-bubble:not(.mine) {
		background-color: var(--bg-secondary) !important;
	}

	[data-theme="dark"] .hall-bubble.manager {
		background-color: rgba(34, 197, 94, 0.15) !important;
		border-color: rgba(74, 222, 128, 0.35) !important;
	}

	[data-theme="dark"] .hall-text {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .hall-bubble.mine .hall-text {
		color: #191919 !important;
	}

	[data-theme="dark"] .hall-name {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .hall-time {
		color: var(--text-tertiary) !important;
	}

	[data-theme="dark"] .page-root .chat-input {
		background-color: var(--bg-secondary) !important;
		border-top-color: var(--border-color) !important;
	}

	[data-theme="dark"] .page-root .input-field {
		background-color: var(--input-bg) !important;
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .page .cell {
		background-color: var(--bg-secondary) !important;
	}

	[data-theme="dark"] .page .cell-title {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .page .cell-value {
		color: var(--text-tertiary) !important;
	}

	[data-theme="dark"] .page .hint {
		color: var(--text-secondary) !important;
	}

	/* —— 以下：部门页 / 工作台 / 个人中心 / 弹层等，scoped 内大量硬编码浅色 —— */
	[data-theme="dark"] .shell {
		background: var(--bg-primary) !important;
	}

	[data-theme="dark"] scroll-view.page,
	[data-theme="dark"] .page {
		background: var(--bg-primary) !important;
	}

	[data-theme="dark"] .hero {
		background: var(--bg-tertiary) !important;
		border-color: var(--border-color) !important;
	}

	[data-theme="dark"] .card {
		background: var(--bg-secondary) !important;
		border-color: var(--border-color) !important;
		box-shadow: var(--card-shadow) !important;
	}

	[data-theme="dark"] .title,
	[data-theme="dark"] .h,
	[data-theme="dark"] .nm {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .desc,
	[data-theme="dark"] .sm,
	[data-theme="dark"] .jd {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .eyebrow,
	[data-theme="dark"] .jk {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .tab {
		background: var(--bg-tertiary) !important;
		border-color: var(--border-color) !important;
	}

	[data-theme="dark"] .tab.on {
		background: rgba(37, 99, 235, 0.18) !important;
		border-color: var(--primary-color) !important;
	}

	[data-theme="dark"] .pick,
	[data-theme="dark"] .ta {
		background: var(--input-bg) !important;
		color: var(--text-primary) !important;
		border-color: var(--input-border) !important;
		box-shadow: inset 0 1rpx 3rpx rgba(0, 0, 0, 0.35) !important;
	}

	[data-theme="dark"] .btn.ghost {
		background: var(--bg-tertiary) !important;
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .list .li {
		border-bottom-color: var(--border-color) !important;
	}

	/* 工作台 */
	[data-theme="dark"] .wb {
		background: var(--bg-primary) !important;
	}

	[data-theme="dark"] .hero-title {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .hero-sub {
		color: var(--text-tertiary) !important;
	}

	[data-theme="dark"] .seg {
		background: var(--bg-tertiary) !important;
	}

	[data-theme="dark"] .seg-item.on {
		background: var(--bg-secondary) !important;
		box-shadow: var(--card-shadow) !important;
	}

	[data-theme="dark"] .seg-text {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .subseg-item {
		background: rgba(37, 99, 235, 0.12) !important;
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .subseg-item.on {
		background: rgba(37, 99, 235, 0.22) !important;
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .blk-title {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .card-t {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .badge {
		background: var(--bg-tertiary) !important;
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .project-container,
	[data-theme="dark"] .scroll-clip {
		background: transparent !important;
	}

	[data-theme="dark"] .hero-header {
		background: var(--bg-secondary) !important;
		border-color: var(--border-color) !important;
		box-shadow: var(--card-shadow) !important;
	}

	[data-theme="dark"] .empty {
		background: var(--bg-secondary) !important;
		border-color: var(--border-color) !important;
	}

	[data-theme="dark"] .page-title,
	[data-theme="dark"] .page-sub {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .page-sub {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .loading-row {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .empty-title {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .empty-desc {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .dialog {
		background: var(--bg-secondary) !important;
		border-color: var(--border-color) !important;
	}

	[data-theme="dark"] .dialog-title {
		color: var(--text-primary) !important;
	}

	/* 个人中心：卡片 / 区块 */
	[data-theme="dark"] .header-section {
		background: linear-gradient(165deg, #1e293b 0%, #0f172a 48%, #020617 100%) !important;
	}

	[data-theme="dark"] .profile-header,
	[data-theme="dark"] .team-overview,
	[data-theme="dark"] .stat-card,
	[data-theme="dark"] .quick-tile,
	[data-theme="dark"] .hint-card,
	[data-theme="dark"] .ceo-header {
		background: var(--bg-secondary) !important;
		border-color: var(--border-color) !important;
	}

	[data-theme="dark"] .profile-page .cell-group .cell,
	[data-theme="dark"] .profile-page .cell {
		background: var(--bg-secondary) !important;
	}

	[data-theme="dark"] .nick,
	[data-theme="dark"] .about-line,
	[data-theme="dark"] .team-stat-num {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .account-line,
	[data-theme="dark"] .team-stat-label {
		color: var(--text-secondary) !important;
	}

	/* 底部抽屉 */
	[data-theme="dark"] .drawer-panel {
		background: var(--bg-secondary) !important;
	}

	[data-theme="dark"] .drawer-title {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .drawer-description,
	[data-theme="dark"] .drawer-meta {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .drawer-close {
		color: var(--text-tertiary) !important;
	}

	/* 自定义返回 */
	[data-theme="dark"] .nav-back-arrow,
	[data-theme="dark"] .nav-back-label {
		color: var(--text-primary) !important;
	}

	/* 底部 Tab 图标色 */
	[data-theme="dark"] .app-tab-bar .tab-icon {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .app-tab-bar .tab-item.active .tab-icon {
		color: var(--primary-color) !important;
	}

	/* 通用：仍漏网的浅底块（勿覆盖渐变按钮主色） */
	[data-theme="dark"] .wx-cell,
	[data-theme="dark"] .msg-row-card,
	[data-theme="dark"] .department-card,
	[data-theme="dark"] .department-header,
	[data-theme="dark"] .service-item {
		background-color: var(--bg-secondary) !important;
		border-color: var(--border-color) !important;
	}

	[data-theme="dark"] .department-title,
	[data-theme="dark"] .service-name {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .department-desc,
	[data-theme="dark"] .service-intro {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .splash {
		background: var(--bg-primary) !important;
	}

	[data-theme="dark"] .main-scroll {
		background: var(--bg-primary) !important;
	}

	[data-theme="dark"] .employee-panel {
		background: var(--bg-secondary) !important;
		border-bottom-color: var(--border-color) !important;
	}

	[data-theme="dark"] .employee-item {
		background: var(--bg-tertiary) !important;
	}

	[data-theme="dark"] .employee-id {
		color: var(--text-primary) !important;
	}

	[data-theme="dark"] .employee-raw,
	[data-theme="dark"] .employee-empty {
		color: var(--text-secondary) !important;
	}

	[data-theme="dark"] .chat-inner {
		background: transparent !important;
	}

	/*
	 * 系统 Toast / Loading / Modal 默认层级常低于页面内 fixed 蒙层（如 1e5～1e6），
	 * 会导致提示被挡住；统一抬到浏览器可表示的较高 z-index。
	 * 小程序端多为原生组件，下列选择器无效也可接受；H5/App 端生效。
	 */
	uni-toast,
	.uni-toast,
	.uni-toast__container,
	.uni-simple-toast,
	.uni-loading,
	.uni-load,
	.uni-load__mask,
	uni-loading,
	.open-type-toast,
	.uni-system-preview,
	uni-modal,
	.uni-modal,
	.uni-modal__mask,
	.uni-modal__wrap,
	.uni-mask {
		z-index: 2147483000 !important;
	}
</style>
