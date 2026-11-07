import { createStore } from 'vuex'
import VuexPersist from 'vuex-persist'
import conn from './modules/conn.js'
import cfg from './modules/cfg.js'

const vuexLocalStorage = new VuexPersist({
  key: 'xeHentaiWebUI',
  storage: window.localStorage
})

export default createStore({
  modules: {
    conn: conn,
    cfg: cfg
  },
  plugins: [vuexLocalStorage.plugin]
})
