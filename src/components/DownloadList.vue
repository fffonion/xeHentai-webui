<template>
  <el-table
    :data='tableData'
    :row-key='getRowKeys'
    style='width: auto; margin: 0 120px'
    @row-click='handleRowClick'>
    <el-table-column
      type="selection"
      width="35">
    </el-table-column>
    <el-table-column
      :label="$t('EroHon')"
      width='400'
      :sortable='true'
      :show-overflow-tooltip='true'
      align='left'>
      <template slot-scope='scope'>
        <el-popover
        trigger='hover'
        placement='right-end'
        width='500'
        @hide="() => handlePopoverHide(scope.row)">
          <div class="titles">
            <div class='main-title'>{{ scope.row.meta.title }}</div>
            <div class='sub-title' v-if="scope.row.meta.title !== scope.row.meta.gnname &&scope.row.meta.gnname">
              {{ scope.row.meta.gnname }}
            </div>
            <div class='sub-title' v-if="scope.row.meta.title !== scope.row.meta.gjname &&scope.row.meta.gjname">
              {{ scope.row.meta.gjname }}
            </div>
          </div>
          <el-row>
            <el-col :span="6">
              <a :href="scope.row.url" target="_blank">
                <img
                  v-if="isTaskStatusViewable(scope.row.state)"
                  width="100px"
                  @error="handleThumbFailed"
                  @load="handleThumbLoaded"
                  :data-thumb-id="scope.row.guid"
                  :src="getImage(scope.row, 1) + '?' + (thumbNeedReload[scope.row.guid] || 0)"/>
              </a>
            </el-col>
            <el-col :span="18">
              <a target="_blank"
                v-for="tag in scope.row.meta.tags"
                v-bind:key="tag"
                :href="getUrlPrefix(scope.row) + '/tag/' + encodeURIComponent(tag)">
                <el-tag size="mini" type="info" >
                  {{ tag }}
                </el-tag>
              </a>
              <div style="padding-top:1em"></div>
              <span> <icon name="image"/> {{ scope.row.meta.total }}p </span>
            </el-col>
          </el-row>
          <div slot='reference' class='name-wrapper'>
            <p size='medium' style='overflow:hidden'>{{ scope.row.meta.title }}</p>
          </div>
        </el-popover>
      </template>
    </el-table-column>
    <el-table-column
      width=200
      align=left>
      <template slot-scope='scope'>
        <el-progress
          :percentage='100 * scope.row.meta.finished / scope.row.meta.total'
          :status='mapStatus(scope.row.state)'
          :show-text='true'>
        </el-progress>
      </template>
    </el-table-column>
    <el-table-column
      width=30
      align=left>
      <template slot-scope='scope'>
        <span class='progress-indicator' v-if='isTaskStatusRunning(scope.row.state)'>
          <icon name='dot-circle-o' :class='mapStatus(scope.row.state)'></icon>
        </span>
         <span class='progress-indicator' v-else-if='isTaskStatusPaused(scope.row.state)'>
          <icon name='pause-circle' :class='mapStatus(scope.row.state)'></icon>
        </span>
        <span class='progress-indicator' v-else-if='isTaskStatusFailed(scope.row.state)'>
          <icon name='times-circle' :class='mapStatus(scope.row.state)'></icon>
        </span>
        <span class='progress-indicator' v-else-if='isTaskStatusFinished(scope.row.state)'>
          <icon name='check-circle' :class='mapStatus(scope.row.state)'></icon>
        </span>
        </template>
    </el-table-column>
    <el-table-column
      width=64>
    </el-table-column>
    <el-table-column
      align=left>
      <template slot-scope='scope'>
        <el-button-group>
          <el-button
            size='mini'
            v-if='!isTaskStatusFinished(scope.row.state)'
            @click='handleStart(scope.$index, scope.row)'><icon name='play'></icon></el-button>
          <el-button
            size='mini'
            v-if='!isTaskStatusFinished(scope.row.state)'
            @click='handlePause(scope.$index, scope.row)'><icon name='pause'></icon></el-button>
          <el-button
            size='mini'
            v-if='isTaskStatusFinished(scope.row.state)'
            @click='handleView(scope.$index, scope.row)'><icon name='leanpub'></icon></el-button>
          <a :href="getArchive(scope.row.guid, scope.row.meta.title)"
            :download="scope.row.meta.title + '.zip'">
            <el-button
              size='mini'
              v-if='isTaskStatusFinished(scope.row.state)'
              @click='handleDownload(scope.$index, scope.row)'><icon name='download'></icon></el-button>
          </a>
          <el-button
            size='mini'
            @click='handleDelete(scope.$index, scope.row)'><icon name='trash'></icon></el-button>
        </el-button-group>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
import {mapGetters} from 'vuex'
import '../assets/css/download-list.css'

const TASK_STATE_PAUSED = 0
const TASK_STATE_WAITING = 1
/** const TASK_STATE_GET_META = 2
const TASK_STATE_SCAN_PAGE = 3
const TASK_STATE_SCAN_IMG = 4
const TASK_STATE_SCAN_ARCHIVE = 5**/
const TASK_STATE_DOWNLOAD = 10
/** const TASK_STATE_MAKE_ARCHIVE = 19**/
const TASK_STATE_FINISHED = 20
const TASK_STATE_FAILED = -1

export default {
  data () {
    return {
      getRowKeys (row) {
        return row.guid
      },
      expanded_rows: [],
      thumbNeedReload: {}
    }
  },
  props: ['finishedTasks', 'unfinishedTasks', 'rpc', 'needRefreshFinished', 'needRefreshUnfinished'],
  computed: {
    ...mapGetters({
      connString: 'connString',
      authString: 'authString'
    }),
    tableData () {
      return this.unfinishedTasks.concat(this.finishedTasks)
    }
  },
  methods: {
    handleRowClick (row, e, column) {
      // if click on the buttons, we don't toggle expansion
      for (let p of e.path) {
        if (p.type === 'button') return
      }

      var idx = this.expanded_rows.indexOf(row.guid)
      if (idx > -1) {
        this.expanded_rows.splice(idx, 1)
      } else {
        this.expanded_rows.push(row.guid)
      }
    },
    handleView (index, row) {
      this.$emit('update:galleryGuid', row.guid)
      this.$emit('update:galleryVisible', true)
    },
    handleDownload (index, row) { },
    _taskCmd (row, action) {
      var _this = this
      this.rpc.call(
        action + 'Task',
        (e) => {
          console.log('ok', _this)
          _this.$emit('update:needRefreshHeader', Date.now())
          _this.$emit('update:needRefreshFinished', Date.now())
          _this.$emit('update:needRefreshUnfinished', Date.now())
        },
        (e) => {
          _this.$message.error(_this.$t('Task #{0}: {1}', [row.guid, e.message]))
        },
        [row.guid]
      )
    },
    handleStart (index, row) {
      this._taskCmd(row, 'resume')
    },
    handlePause (index, row) {
      this._taskCmd(row, 'pause')
    },
    handleDelete (index, row) {
      this._taskCmd(row, 'del')
    },
    handleThumbFailed (e) {
      var id = e.srcElement.getAttribute('data-thumb-id')
      if (!this.thumbNeedReload[id]) {
        this.thumbNeedReload[id] = 1
      }
      setTimeout(() => { e.srcElement.src = '' }, 0)
    },
    handleThumbLoaded (e) {
      var id = e.srcElement.getAttribute('data-thumb-id')
      delete this.thumbNeedReload[id]
    },
    handlePopoverHide (row) {
      var id = row.guid
      if (this.thumbNeedReload[id]) {
        // let's just make something change
        row.meta.title += ' '
        this.thumbNeedReload[id] += 1
      }
    },
    isTaskStatusFailed (val) {
      return val === TASK_STATE_FAILED
    },
    isTaskStatusPaused (val) {
      return val === TASK_STATE_PAUSED
    },
    isTaskStatusRunning (val) {
      return TASK_STATE_WAITING <= val && val < TASK_STATE_FINISHED
    },
    isTaskStatusViewable (val) {
      return val >= TASK_STATE_DOWNLOAD
    },
    isTaskStatusFinished (val) {
      return val === TASK_STATE_FINISHED
    },
    mapStatus (val) {
      if (this.isTaskStatusFailed(val)) {
        return 'exception'
      } else if (this.isTaskStatusPaused(val)) {
        return 'paused'
      } else if (this.isTaskStatusRunning(val)) {
        return 'running'
      }
      return 'success'
    },
    getUrlPrefix (task) {
      return task.url.match((/^https*:\/\/[^/]+/))[0]
    },
    getImage (task, fid) {
      var uri = task.guid + '/' + fid
      return this.connString + '/img/' + this.rpc.getSign(uri) + '/' + uri
    },
    getArchive (guid, title) {
      var uri = guid + '/' + title + '.zip'
      return this.connString + '/zip/' + this.rpc.getSign(guid) + '/' + uri
    }
  }
}
</script>
