<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			this.initDarkMode()
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
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
				uni.setSystemTheme && uni.setSystemTheme({ theme: isDark ? 'dark' : 'light' })
				if (typeof document !== 'undefined') {
					document.documentElement.setAttribute('data-theme', theme)
					document.body && document.body.setAttribute('data-theme', theme)
				}
				const pages = getCurrentPages()
				pages.forEach(page => {
					if (page && page.$vm) {
						page.$vm.updateTheme && page.$vm.updateTheme(isDark)
					}
				})
			}
		}
	}
</script>

<style>
	:root {
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
		--input-bg: #334155;
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
		border-color: var(--border-color) !important;
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
		color: #191919 !important;
	}

	.hall-bubble.mine {
		background-color: #95ec69 !important;
	}

	.message-bubble {
		background-color: #ffffff !important;
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
		background: rgba(0, 0, 0, 0.45) !important;
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
		color: var(--text-tertiary) !important;
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
</style>
