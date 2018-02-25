<template>
  <div id="app">
    <header-view
      :info="headerInfo"
      :addTaskDialogVisible.sync="addTaskDialogVisible"
      :configDialogVisible.sync="configDialogVisible"
      :needRefreshHeader.sync="needRefreshHeader"
      :needRefreshFinished.sync="needRefreshFinished"
      :needRefreshUnfinished.sync="needRefreshUnfinished"/>
    <el-main>
      <config-view
        :connStringNew.sync="connString"
        :authStringNew.sync="authString"
        :serverConfigOriginal="serverConfig"
        :serverConfigNew.sync="serverConfigLocal"
        :dialogVisible.sync="configDialogVisible"
        :needRefreshHeader.sync="needRefreshHeader"
        :needRefreshFinished.sync="needRefreshFinished"
        :needRefreshUnfinished.sync="needRefreshUnfinished"/>
      <add-task-view
        :config="serverConfig"
        :newTask.sync="newTask"
        :dialogVisible.sync="addTaskDialogVisible"/>

      <download-list-view
        :finishedTasks="finishedTasks"
        :unfinishedTasks="unfinishedTasks"
        :rpc="rpcInstance"
        :galleryVisible.sync="galleryVisible"
        :galleryGuid.sync="galleryGuid"/>
    </el-main>
    <gallery-view
      :rpc="rpcInstance"
      :guid.sync="galleryGuid"
      :dialogVisible.sync="galleryVisible"/>
  </div>
</template>

<script>
import Header from '@/components/Header'
import Config from '@/components/Config'
import AddTask from '@/components/AddTask'
import DownloadList from '@/components/DownloadList'
import Gallery from '@/components/Gallery'
import JsonRPC from '@/assets/js/rpc.js'

export default {
  name: 'App',
  components: {
    'header-view': Header,
    'config-view': Config,
    'add-task-view': AddTask,
    'download-list-view': DownloadList,
    'gallery-view': Gallery
  },
  data () {
    return {
      headerInfo: {},
      finishedTasks: [],
      unfinishedTasks: [],
      serverConfigLocal: {}, // the local copy of serverConfig
      serverConfig: {}, // the serverConfig pulled from server
      newTask: {},
      needRefreshHeader: 0,
      needRefreshFinished: 0,
      needRefreshUnfinished: 0,
      connString: null,
      authString: null,
      rpcInstance: null,
      configDialogVisible: false,
      addTaskDialogVisible: false,
      galleryVisible: false,
      galleryGuid: 0
    }
  },
  watch: {
    needRefreshFinished: function (val) {
      var _this = this
      this.listTasks('finished', (r) => { _this.finishedTasks = r })
    },
    needRefreshUnfinished: function (val) {
      var _this = this
      this.listTasks('!finished', (r) => { _this.unfinishedTasks = r })
    },
    needRefreshHeader: function (val) {
      // auto refresh
      this.getInfo(true)
    },
    connString: function (val) {
      this.rpcInstance = new JsonRPC(val, this.authString)
      this.reloadAll()
    },
    authString: function (val) {
      this.rpcInstance = new JsonRPC(this.connString, val)
      this.reloadAll()
    },
    serverConfigLocal: function (val) {
      this.updateConfig(val)
    },
    newTask: function (val) {
      if (!val) return
      this.addTask(val)
      this.newTask = null
      this.reloadAll()
    }
  },
  methods: {
    listTasks (level, callback) {
      var _this = this
      this.rpcInstance.call(
        'listTasks',
        callback,
        (e) => {
          _this.$message.error(e.toString(_this.$t))
        },
        [level]
      )
    },
    getInfo (quiet) {
      var _this = this
      this.rpcInstance.call(
        'getInfo',
        (r) => {
          quiet || _this.$message.success(_this.$t('Successfully connected to xeHentai'))
          _this.headerInfo = r
        },
        (e) => {
          quiet || _this.$message.error(e.toString(_this.$t))
          _this.headerInfo = {}
        }
      )
    },
    updateConfig (config) {
      var _this = this
      this.rpcInstance.call(
        'updateConfig',
        (r) => {
          _this.serverConfig = r
        },
        (e) => {
          _this.$message.warning(e.toString(_this.$t))
        },
        [],
        config
      )
    },
    getConfig () {
      var _this = this
      this.rpcInstance.call(
        'getConfig',
        (r) => {
          _this.serverConfig = r
        },
        (e) => { },
        []
      )
    },
    addTask (val) {
      var _this = this
      this.rpcInstance.call(
        'addTask',
        (r) => {
          _this.$message.success(_this.$t('Successfully add task #{0}', [r]))
        },
        (e) => {
          _this.$message.warning(e.toString(_this.$t))
        },
        [val[0]],
        val[1]
      )
    },
    reloadAll () {
      this.$emit('update:needRefreshHeader', Date.now())
      this.$emit('update:needRefreshFinished', Date.now())
      this.$emit('update:needRefreshUnfinished', Date.now())
      this.getConfig()
    }
  },
  mounted () {
    this.rpcInstance = new JsonRPC(this.connString, this.authString)
    var _this = this
    this.refreshHeaderFunc = function () {
      _this.needRefreshHeader = Date.now()
      setTimeout(_this.refreshHeaderFunc, _this.$store.state.conn.refresh_interval * 1000)
    }
    this.refreshHeaderFunc()

    this.refreshFinishedFunc = function () {
      _this.needRefreshFinished = Date.now()
      setTimeout(_this.refreshFinishedFunc, _this.$store.state.conn.refresh_interval * 1000)
    }
    this.refreshFinishedFunc()

    this.refreshUnfinishedFunc = function () {
      _this.needRefreshUnfinished = Date.now()
      setTimeout(_this.refreshUnfinishedFunc, _this.$store.state.conn.refresh_interval * 2000)
    }
    this.refreshUnfinishedFunc()

    // display connection configuration if first run
    if (!this.$store.state.conn.host) {
      this.configDialogVisible = true
      this.$store.state.conn.host = location.hostname
      this.$store.state.conn.port = 8010
    }
  }
}
</script>

<style>
body {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  *text-align: center;
  color: #2c3e50;
}
#app {
  margin-top: 60px;
}
.el-popover {
  font-size: 0.8em;
}
.el-popover hr {
  border: 0.05em solid #cccccc;
}
</style>
