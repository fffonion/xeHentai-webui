import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersist from 'vuex-persist'
import conn from './modules/conn.js'
import cfg from './modules/cfg.js'

Vue.use(Vuex)

const vuexLocalStorage = new VuexPersist({
  key: 'xeHentaiWebUI',
  storage: window.localStorage
})

export default new Vuex.Store({
  modules: {
    conn: conn,
    cfg: cfg
  },
  plugins: [vuexLocalStorage.plugin]
})
