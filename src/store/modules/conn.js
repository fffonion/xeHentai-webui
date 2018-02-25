export default {
  state: {
    host: null,
    port: null,
    isHttps: false,
    secret: null,
    refreshInterval: 5
  },
  getters: {
    connString: (state) => {
      return (state.host && state.port
        ? ((state.isHttps ? 'https://' : 'http://') + state.host + ':' + state.port)
        : null)
    },
    authString: state => (state.secret ? 'token:' + state.secret : ''),
    connCfg: (state) => {
      return Object.assign({}, state)
    }
  },
  mutations: {
    setConnectionConfig (state, cfg) {
      state.host = cfg.host
      state.port = cfg.port
      state.isHttps = cfg.isHttps
      state.secret = cfg.secret
      state.refreshInterval = cfg.refreshInterval
    }
  }
}
