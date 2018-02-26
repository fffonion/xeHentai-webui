<template>
  <div>
    <el-header>
      <el-row type="flex" justify="space-between" align="middle">
        <el-col :span="14">
          <span class="header">xeHentai WebUI</span>
          <el-tag type="info" size="mini">
            {{ info.version !== undefined ? info.version : $t('disconneted')}}
          </el-tag>
          <el-popover
            ref="running-stat-popover"
            width="320"
            trigger="hover">
            <el-row class="running-stat-popover">
              <el-col :span="2"><icon name="spinner"/></el-col>
              <el-col :span="8">{{ $t('Running threads') }}:</el-col>
              <el-col :span="1">{{ info.threads_running }}</el-col>
              <el-col :span="2" :offset="1"><icon name="hourglass"/></el-col>
              <el-col :span="8">{{ $t('Zombie threads') }}:</el-col>
              <el-col :span="1">{{ info.threads_zombie }}</el-col>
            </el-row>
            <el-row>
              &nbsp;
            </el-row>
            <el-row class="running-stat-popover">
              <el-col :span="2"><icon name="list-ul"/></el-col>
              <el-col :span="8">{{ $t('Queued images') }}:</el-col>
              <el-col :span="1">{{ info.queue_pending }}</el-col>
              <el-col :span="2" :offset="1"><icon name="check"/></el-col>
              <el-col :span="8">{{ $t('Finished images') }}:</el-col>
              <el-col :span="1">{{ info.queue_finished }}</el-col>
            </el-row>
          </el-popover>
          <el-tag
            size="mini"
            :type="info.threads_zombie ? 'warning' : (info.threads_running ? 'success' : 'info')"
            v-show="info.threads_running !== undefined"
            v-popover:running-stat-popover>
            <icon name="spinner"/>
            {{ info.threads_running }}
            <icon name="hourglass"/>
            {{ info.threads_zombie }}
            &nbsp;&nbsp;
            <icon name="list-ul"/>
            {{ info.queue_pending }}
            <icon name="check"/>
            {{ info.queue_finished }}
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
        <el-col :span="6" :offset="4">
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
import '../assets/css/header.scss'
export default {
  props: ['info', 'addTaskDialogVisible', 'configDialogVisible',
    'needRefreshHeader', 'needRefreshFinished', 'needRefreshUnfinished'
  ],
  methods: {
    handleRefresh () {
      this.$emit('update:needRefreshHeader', Date.now())
      this.$emit('update:needRefreshFinished', Date.now())
      this.$emit('update:needRefreshUnfinished', Date.now())
    }
  }
}
</script>
