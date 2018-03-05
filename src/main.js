// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueI18n from 'vue-i18n'
import ElTable from 'element-ui'
import Icon from 'vue-awesome/components/Icon'
// import router from './router'
import store from './store'
import App from './App'

import 'element-ui/lib/theme-chalk/index.css'

// i18n
import enUs from './assets/i18n/en-us.js'
import zhHans from './assets/i18n/zh-hans.js'
import zhHant from './assets/i18n/zh-hant.js'

// FA icons
import 'vue-awesome/icons/play'
import 'vue-awesome/icons/pause'
import 'vue-awesome/icons/stop'
import 'vue-awesome/icons/trash'
import 'vue-awesome/icons/download'
import 'vue-awesome/icons/leanpub'
import 'vue-awesome/icons/dot-circle-o'
import 'vue-awesome/icons/check-circle'
import 'vue-awesome/icons/pause-circle'
import 'vue-awesome/icons/times-circle'
import 'vue-awesome/icons/refresh'
import 'vue-awesome/icons/sliders'
import 'vue-awesome/icons/plus'

import 'vue-awesome/icons/spinner'
import 'vue-awesome/icons/hourglass'
import 'vue-awesome/icons/list-ul'
import 'vue-awesome/icons/check'

import 'vue-awesome/icons/image'

Vue.use(ElTable)

Vue.use(VueI18n)

Vue.component('icon', Icon)

Vue.config.productionTip = false

function getLocale () {
  var lang = navigator.language || navigator.browserLanguage
  if (lang === 'zh' || lang === 'zh-CN') return 'zh-Hans'
  if (lang === 'zh-TW' || lang === 'zh-HK') return 'zh-Hant'
  return 'en-US'
}
const messages = {
  'en-US': enUs,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant
}
const i18n = new VueI18n({
  locale: getLocale(),
  silentTranslationWarn: true,
  messages
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  i18n,
  components: { App },
  template: '<App/>',
  render: h => h(App)
})
