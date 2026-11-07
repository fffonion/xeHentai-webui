import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import ElementPlus from 'element-plus'

import store from './store/index.js'
import App from './App.vue'
import Icon from './components/Icon.vue'

// element-plus ships its theme as a single stylesheet; it is imported before
// the component styles so the app's overrides still win.
import 'element-plus/dist/index.css'

import enUs from './assets/i18n/en-us.js'
import zhHans from './assets/i18n/zh-hans.js'
import zhHant from './assets/i18n/zh-hant.js'

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

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getLocale(),
  fallbackLocale: 'en-US',
  missingWarn: false,
  fallbackWarn: false,
  messages
})

const app = createApp(App)

app.component('icon', Icon)
app.use(store)
app.use(i18n)
app.use(ElementPlus)

app.mount('#app')
