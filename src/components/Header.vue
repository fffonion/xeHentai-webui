<template>
  <div>
    <el-header>
      <el-row type="flex" justify="space-between" align="middle">
        <el-col :span="14">
          <span class="header">{{ $t('xeHentai WebUI') }}</span>
          <el-tag type="info" size="mini">
            {{ info.version !== undefined ? info.version : $t('disconneted')}}
          </el-tag>
          <el-popover
            ref="running-stat-popover"
            width="320"
            trigger="hover">
            <el-row class="running-stat-popover">
              <el-col :span="1.5"><icon :spin="info.threads_running ? true : false" name="spinner"/></el-col>
              <el-col :span="8">{{ $t('Running threads') }}:</el-col>
              <el-col :span="2">{{ info.threads_running }}</el-col>
              <el-col :span="1.5" :offset="1"><icon name="hourglass"/></el-col>
              <el-col :span="8">{{ $t('Zombie threads') }}:</el-col>
              <el-col :span="2">{{ info.threads_zombie }}</el-col>
            </el-row>
            <el-row>
              &nbsp;
            </el-row>
            <el-row class="running-stat-popover">
              <el-col :span="1.5"><icon name="list-ul"/></el-col>
              <el-col :span="8">{{ $t('Queued images') }}:</el-col>
              <el-col :span="2">{{ info.queue_pending }}</el-col>
              <el-col :span="1.5" :offset="1"><icon name="check"/></el-col>
              <el-col :span="8">{{ $t('Finished images') }}:</el-col>
              <el-col :span="2">{{ info.queue_finished }}</el-col>
            </el-row>
          </el-popover>
          <el-popover
            ref="download-speed-popover"
            width="480"
            trigger="hover">
            <speed-chart
              :data=historySpeed
              :size=speedChartSize
              v-bind:height="120">
            </speed-chart>
          </el-popover>
          <el-tag
            size="mini"
            :type="info.threads_zombie ? 'warning' : (info.threads_running ? 'success' : 'info')"
            v-show="info.threads_running !== undefined"
            v-popover:running-stat-popover>
            <icon
            :spin="info.threads_running ? true : false"
            name="spinner"/>
            {{ info.threads_running }}
            <icon name="hourglass"/>
            {{ info.threads_zombie }}
            &nbsp;&nbsp;
            <icon name="list-ul"/>
            {{ info.queue_pending }}
            <icon name="check"/>
            {{ info.queue_finished }}
          </el-tag>
          <el-tag
            size="mini"
            :type="speedColor(info.download_speed)"
            v-show="info.download_speed !== undefined"
            v-popover:download-speed-popover>
            <icon name="download"/>
            {{ humanSpeed(info.download_speed) }}
          </el-tag>
        </el-col>
        <!-- <el-button-group>
          <el-button
            size='mini'
            round
            @click='handleStart(scope.$index, scope.row)'><icon name="play"></icon></el-button>
          <el-button
            size='mini'
            round
            @click='handlePause(scope.$index, scope.row)'><icon name="pause"></icon></el-button>
          <el-button
            size='mini'
            round
            @click='handleDelete(scope.$index, scope.row)'><icon name="trash"></icon></el-button>
        </el-button-group> -->
         <el-col :span="4">
          <el-button-group v-show="bulkSelected">
            <el-button
              size='mini'
              round
              @click="$emit('update:bulkAction', 'resume')"><icon name="play"></icon></el-button>
            <el-button
              size='mini'
              round
              @click="$emit('update:bulkAction', 'pause')"><icon name="pause"></icon></el-button>
            <el-button
              size='mini'
              round
              @click="$emit('update:bulkAction', 'del')"><icon name="trash"></icon></el-button>
          </el-button-group>
        </el-col>
        <el-col :span="4">
        <el-button-group>
          <el-button
            size='mini'
            round
            @click="$emit('update:addTaskDialogVisible', true)"><icon name="plus"></icon></el-button>
          <el-button
            size='mini'
            round
            @click='handleRefresh()'><icon name="refresh"></icon></el-button>
          <el-button
            size='mini'
            round
            @click="$emit('update:configDialogVisible', true)"><icon name="sliders"></icon></el-button>
        </el-button-group>
        </el-col>
      </el-row>
    </el-header>
  </div>
</template>

<script>
import SpeedChart from '@/components/SpeedChart'
import '../assets/css/header.scss'
import util from '@/assets/js/util.js'

export default {
  props: ['info', 'addTaskDialogVisible', 'configDialogVisible', 'bulkSelected',
    'needRefreshHeader', 'needRefreshFinished', 'needRefreshUnfinished'
  ],
  components: {
    'speed-chart': SpeedChart
  },
  data () {
    return {
      historySpeed: [],
      speedChartSize: 60
    }
  },
  methods: {
    handleRefresh () {
      this.$emit('update:needRefreshHeader', Date.now())
      this.$emit('update:needRefreshFinished', Date.now())
      this.$emit('update:needRefreshUnfinished', Date.now())
    },
    speedColor (speed) {
      if (speed !== undefined) {
        if (speed === 0) {
          return 'info'
        } else if (speed < 10240) {
          return 'warning'
        } else {
          return 'success'
        }
      }
    },
    humanSpeed (v) {
      return util.humanSpeed(v)
    }
  },
  mounted () {
    var _this = this
    this.refreshSpeedFunc = function () {
      if (_this.historySpeed.length === 0) {
        for (var i = 0; i < _this.speedChartSize; i++) {
          _this.historySpeed.push(undefined)
        }
      }
      var d = _this.info.download_speed
      if (d === undefined) {
        d = 0
      }
      // shift left
      for (var j = 0; j < _this.speedChartSize - 1; j++) {
        _this.historySpeed[j] = _this.historySpeed[j + 1]
      }
      _this.historySpeed[_this.speedChartSize - 1] = d
      // this is hacky but i don't know how to emit a proper update :-/
      _this.historySpeed.push(0)
      _this.historySpeed.pop()

      setTimeout(_this.refreshSpeedFunc, 2000)
    }
    this.refreshSpeedFunc()
  }
}
</script>
