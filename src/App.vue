<template>
  <div id="app">
    <header-view
      :info="headerInfo"
      v-model:addTaskDialogVisible="addTaskDialogVisible"
      v-model:configDialogVisible="configDialogVisible"
      :bulkSelected="bulkSelected"
      v-model:bulkAction="bulkAction"
      v-model:needRefreshHeader="needRefreshHeader"
      v-model:needRefreshFinished="needRefreshFinished"
      v-model:needRefreshUnfinished="needRefreshUnfinished"/>
    <el-main>
      <config-view
        v-model:connStringNew="connString"
        v-model:authStringNew="authString"
        :serverConfigOriginal="serverConfig"
        v-model:serverConfigNew="serverConfigLocal"
        v-model:dialogVisible="configDialogVisible"
        v-model:needRefreshHeader="needRefreshHeader"
        v-model:needRefreshFinished="needRefreshFinished"
        v-model:needRefreshUnfinished="needRefreshUnfinished"/>
      <add-task-view
        :config="serverConfig"
        v-model:newTask="newTask"
        v-model:dialogVisible="addTaskDialogVisible"/>

      <download-list-view
        :allTasks="allTasks"
        :rpc="rpcInstance"
        v-model:needRefreshHeader="needRefreshHeader"
        v-model:needRefreshFinished="needRefreshFinished"
        v-model:needRefreshUnfinished="needRefreshUnfinished"
        v-model:needDeleteGuid="needDeleteGuid"
        v-model:bulkSelected="bulkSelected"
        v-model:bulkAction="bulkAction"
        v-model:galleryVisible="galleryVisible"
        v-model:galleryGuid="galleryGuid"/>
    </el-main>
    <gallery-view
      :rpc="rpcInstance"
      v-model:guid="galleryGuid"
      v-model:dialogVisible="galleryVisible"/>
  </div>
</template>

<script>
import Header from '@/components/Header'
import Config from '@/components/Config'
import AddTask from '@/components/AddTask'
import DownloadList from '@/components/DownloadList'
import Gallery from '@/components/Gallery'
import JsonRPC from '@/assets/js/rpc.js'

const RPC_THRESHOLD = 100 // not sending requests within RPC_THRESHOLD ms
const MINIMUM_VERSION = '2.020'

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
      // finishedTasks: [],
      // unfinishedTasks: [],
      allTasks: [],
      allTasksKeys: {},
      serverConfigLocal: {}, // the local copy of serverConfig
      serverConfig: {}, // the serverConfig pulled from server
      newTask: {},
      needRefreshHeader: 0,
      needRefreshFinished: 0,
      needRefreshUnfinished: 0,
      needDeleteGuid: null, // trigger when deleting a task
      connString: null,
      authString: null,
      rpcInstance: null,
      configDialogVisible: false,
      addTaskDialogVisible: false,
      galleryVisible: false,
      galleryGuid: 0,
      bulkSelected: false,
      bulkAction: 0, // the bulk action that sent from Header to DownloadList
      versionMessageShown: false
    }
  },
  watch: {
    needRefreshFinished: function (val, old) {
      if (val - old < RPC_THRESHOLD) return
      var _this = this
      this.listTasks('finished', (r) => { _this.updateTasks(r) })
    },
    needRefreshUnfinished: function (val, old) {
      if (val - old < RPC_THRESHOLD) return
      var _this = this
      this.listTasks('!finished', (r) => { _this.updateTasks(r) })
    },
    needRefreshHeader: function (val, old) {
      if (val - old < RPC_THRESHOLD) return
      // auto refresh
      this.getInfo(true)
    },
    needDeleteGuid: function (val) {
      if (val && this.allTasksKeys[val] !== undefined) {
        var idx = this.allTasksKeys[val]
        this.allTasks.splice(idx, 1)
        delete this.allTasksKeys[val]
        // shrink index by 1
        for (var i = idx; i < this.allTasks.length; i++) {
          this.allTasksKeys[this.allTasks[i].guid]--
        }
      }
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
          _this.headerInfo = r
          if (!this.versionMessageShown && r && r.version && r.version < MINIMUM_VERSION) {
            _this.$message.warning(_this.$t(
              'This WebUI don\'t supports xeHentai earlier than {0}', [MINIMUM_VERSION]))
            this.versionMessageShown = true
          } else {
            quiet || _this.$message.success(_this.$t('Successfully connected to xeHentai'))
          }
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
      for (let idx in val[0]) {
        var url = val[0][idx]
        this.rpcInstance.call(
          'addTask',
          (r) => {
            _this.$message.success(_this.$t('Successfully add task #{0}', [r]))
            _this.refreshHeaderFunc()
            // _this.refreshFinishedFunc()
            _this.refreshUnfinishedFunc()
          },
          (e) => {
            _this.$message.warning(e.toString(_this.$t))
            _this.refreshUnfinishedFunc()
          },
          [url],
          val[1]
        )
      }
    },
    reloadAll () {
      this.refreshHeaderFunc()
      this.refreshFinishedFunc()
      this.refreshUnfinishedFunc()
      this.getConfig()
    },
    updateTasks (tasks) {
      // Merge each refreshed task into the row object already in the table
      // instead of replacing it. Replacing the object makes element-ui rebuild
      // every row and its cells; patching fields only repaints what changed.
      for (let task of tasks) {
        var idx = this.allTasksKeys[task.guid]
        if (idx === undefined) {
          this.allTasks.push(task)
          this.allTasksKeys[task.guid] = this.allTasks.length - 1
          continue
        }
        var row = this.allTasks[idx]
        if (row.state !== task.state) row.state = task.state
        if (row.failcode !== task.failcode) row.failcode = task.failcode
        if (row.url !== task.url) row.url = task.url
        this.mergeMeta(row.meta, task.meta)
      }
    },
    mergeMeta (target, source) {
      if (!source) return
      for (let key of ['title', 'gnname', 'gjname', 'total', 'finished']) {
        if (target[key] !== source[key]) target[key] = source[key]
      }
      // Tags only feed the detail popover; swap the array when it really
      // changed so rows do not re-render on every poll.
      if (source.tags && target.tags.join('#') !== source.tags.join('#')) {
        target.tags = source.tags.slice()
      }
    }
  },
  mounted () {
    this.rpcInstance = new JsonRPC(this.connString, this.authString)
    var _this = this
    this.refreshHeaderFunc = function () {
      _this.needRefreshHeader = Date.now()
      setTimeout(_this.refreshHeaderFunc, _this.$store.state.conn.refreshInterval * 1000)
    }
    this.refreshHeaderFunc()

    this.refreshFinishedFunc = function () {
      _this.needRefreshFinished = Date.now()
      setTimeout(_this.refreshFinishedFunc, _this.$store.state.conn.refreshInterval * 1000)
    }
    this.refreshFinishedFunc()

    this.refreshUnfinishedFunc = function () {
      _this.needRefreshUnfinished = Date.now()
      setTimeout(_this.refreshUnfinishedFunc, _this.$store.state.conn.refreshInterval * 2000)
    }
    this.refreshUnfinishedFunc()
  }
}
</script>

<style>
body {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
#app {
  margin-top: 60px;
}
/* element-ui's theme already sets the popover font size; leaving it in place
   keeps the 14px base the pre-Vite build rendered. */
.el-popover hr {
  border: 0.05em solid #cccccc;
}
</style>
