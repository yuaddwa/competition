import App from './App'
import { LANGUAGE_CHANGED_EVENT, getLanguage, t } from '@/utils/lang'
import { buildMessageDepartmentBlocks } from '@/utils/messageDepartmentConfig'

function forceRefreshOnLanguageChange(vm) {
  if (vm && typeof vm.$forceUpdate === 'function') {
    vm.$forceUpdate()
  }
}

function getTopPageVm() {
  if (typeof getCurrentPages !== 'function') return null
  const pages = getCurrentPages() || []
  const top = pages[pages.length - 1]
  return top && top.$vm ? top.$vm : null
}

function resolveTopPageNavTitle(vm) {
  if (!vm || !vm.$page || !vm.$page.route) return ''
  const route = String(vm.$page.route).replace(/^\/+/, '')
  const lang = getLanguage()
  const staticTitleKeyByRoute = {
    'pages/login/login': 'login',
    'pages/register/register': 'register',
    'pages/profile/settings': 'settings',
    'pages/profile/profile': 'profile',
    'pages/profile/profile-info': 'profile_info_nav',
    'pages/profile/change-password': 'change_password',
    'pages/profile/model-settings': 'model_api',
    'pages/project/project': 'workflow',
    'pages/add/add': 'add',
    'pages/message/message': 'message',
    'pages/chat/chat-search': 'chat_search_nav',
    'pages/chat/chat-settings': 'chat_settings_title',
  }

  if (route === 'pages/department/department' && typeof vm.syncDeptNavTitle === 'function') {
    vm.syncDeptNavTitle()
    return ''
  }

  if (route === 'pages/workflow/workbench') {
    const fallback = t('workbench', lang)
    return vm.screenTitle && vm.screenTitle !== fallback ? vm.screenTitle : fallback
  }

  if (route === 'pages/message/department-roles') {
    const slug = vm.slug
    if (slug) {
      const row = buildMessageDepartmentBlocks().find((item) => item.slug === slug)
      if (row && row.title) return row.title
    }
    return t('dept_roles_nav', lang)
  }

  const key = staticTitleKeyByRoute[route]
  return key ? t(key, lang) : ''
}

function refreshTopPageNavigationTitle(vm) {
  if (!vm || vm !== getTopPageVm()) return
  const title = resolveTopPageNavTitle(vm)
  if (!title) return
  try {
    uni.setNavigationBarTitle({ title })
  } catch (e) {
    // ignore
  }
}

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false

Vue.mixin({
  created() {
    if (typeof uni === 'undefined' || typeof uni.$on !== 'function') return
    this.__onLanguageChanged = () => {
      forceRefreshOnLanguageChange(this)
      refreshTopPageNavigationTitle(this)
    }
    uni.$on(LANGUAGE_CHANGED_EVENT, this.__onLanguageChanged)
  },
  beforeDestroy() {
    if (typeof uni === 'undefined' || typeof uni.$off !== 'function') return
    if (this.__onLanguageChanged) {
      uni.$off(LANGUAGE_CHANGED_EVENT, this.__onLanguageChanged)
      this.__onLanguageChanged = null
    }
  }
})

App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  app.mixin({
    created() {
      if (typeof uni === 'undefined' || typeof uni.$on !== 'function') return
      this.__onLanguageChanged = () => {
        forceRefreshOnLanguageChange(this)
        refreshTopPageNavigationTitle(this)
      }
      uni.$on(LANGUAGE_CHANGED_EVENT, this.__onLanguageChanged)
    },
    beforeUnmount() {
      if (typeof uni === 'undefined' || typeof uni.$off !== 'function') return
      if (this.__onLanguageChanged) {
        uni.$off(LANGUAGE_CHANGED_EVENT, this.__onLanguageChanged)
        this.__onLanguageChanged = null
      }
    }
  })
  return {
    app
  }
}
// #endif