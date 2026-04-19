// 消息相关工具函数

import { t, getLanguage } from "./lang.js";

/**
 * 分组消息按项目名
 * @param {Array} messages - 消息列表
 * @returns {Array} 分组后的消息列表
 */
export function groupMessagesByProject(messages) {
	const grouped = {}
	messages.forEach(msg => {
		if (!grouped[msg.projectName]) {
			grouped[msg.projectName] = {
				projectName: msg.projectName,
				messages: [],
				unread: 0
			}
		}
		grouped[msg.projectName].messages.push(msg)
		if (!msg.read) {
			grouped[msg.projectName].unread++
		}
	})
	const result = Object.values(grouped).map(group => {
		group.messages.sort((a, b) => new Date(b.time) - new Date(a.time))
		group.latestMessage = group.messages[0]
		return group
	})
	return result.sort((a, b) => new Date(b.latestMessage.time) - new Date(a.latestMessage.time))
}

/**
 * 加载消息（包含首次启动逻辑）
 * @returns {Array} 消息列表
 */
export function loadMessages() {
	let stored = uni.getStorageSync('projectMessages') || []
	const firstLaunch = !uni.getStorageSync('hasLaunched')
	if (firstLaunch) {
		const lang = getLanguage();
		const bossMessage = {
			id: 'boss-' + Date.now(),
			projectName: t("engineering_department", lang),
			title: t("seed_inbox_title", lang),
			content: t("seed_inbox_question", lang),
			time: new Date().toISOString(),
			url: '',
			read: false
		}
		stored.unshift(bossMessage)
		uni.setStorageSync('projectMessages', stored)
		uni.setStorageSync('hasLaunched', true)
	}
	return stored.sort((a, b) => new Date(b.time) - new Date(a.time))
}

/**
 * 加载指定项目的聊天消息
 * @param {string} projectName - 项目名称
 * @returns {Array} 聊天消息列表
 */
export function loadChatMessages(projectName) {
	const allMessages = uni.getStorageSync('projectMessages') || []
	return allMessages.filter(msg => msg.projectName === projectName)
		.sort((a, b) => new Date(a.time) - new Date(b.time))
		.map(msg => ({
			...msg,
			isMine: msg.sender === 'me'
		}))
}

/**
 * 标记消息为已读
 * @param {string} projectName - 项目名称
 */
export function markMessagesAsRead(projectName) {
	const allMessages = uni.getStorageSync('projectMessages') || []
	const updatedMessages = allMessages.map(msg => {
		if (msg.projectName === projectName) {
			return { ...msg, read: true }
		}
		return msg
	})
	uni.setStorageSync('projectMessages', updatedMessages)
}

/** 清空某个本地单聊（如「老板」）在 projectMessages 中的记录 */
export function clearLocalProjectChat(projectName) {
	if (!projectName) return
	const allMessages = uni.getStorageSync('projectMessages') || []
	const filtered = allMessages.filter((msg) => msg.projectName !== projectName)
	uni.setStorageSync('projectMessages', filtered)
}

export function removeLocalProjectMessage(projectName, messageId) {
	if (!projectName || !messageId) return
	const allMessages = uni.getStorageSync('projectMessages') || []
	const filtered = allMessages.filter((msg) => !(msg.projectName === projectName && msg.id === messageId))
	uni.setStorageSync('projectMessages', filtered)
}

export function removeLocalProjectMessagesByIds(projectName, messageIds) {
	if (!projectName || !messageIds || !messageIds.length) return
	const set = new Set(messageIds)
	const allMessages = uni.getStorageSync('projectMessages') || []
	const filtered = allMessages.filter((msg) => !(msg.projectName === projectName && set.has(msg.id)))
	uni.setStorageSync('projectMessages', filtered)
}