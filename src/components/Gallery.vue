<template>
  <div class="gallery-view">
    <el-dialog
      :visible.sync="dialogVisible"
      :before-close="handleDialogClose"
      top="0"
      v-loading="loading"
      element-loading-background="unset"
      :close-on-click-modal="false"
      :fullscreen="true">
      <el-checkbox
        style="display: inline-block"
        v-model="doublePageMode">
        {{ $t('Double Page') }}
      </el-checkbox>
      <el-pagination
        :current-page.sync="idx"
        layout="prev, pager, next, jumper"
        :page-size="1"
        :total="images.length">
      </el-pagination>
      <div class="image-wrapper">
        <img
          @load="loadFunc"
          @error="errorFunc"
          :src="rpc ? rpc.endpoint + images[idx - 1] : ''"
          :class="doublePageMode ? '' : 'is-single-page'"
          @click="handleImgClick"/>
        <img
          v-if="doublePageMode"
          @load="loadFunc"
          @error="errorFunc"
          :src="rpc && idx < images.length ? rpc.endpoint + images[idx] : ''"
          @click="handleImgClick"/>
      </div>
      <!-- <el-pagination
        :current-page.sync="idx"
        layout="prev, pager, next, jumper"
        :page-size="1"
        :total="images.length">
      </el-pagination> -->
      <div class="el-dialog__header"></div>
    </el-dialog>
  </div>
</template>

<script>
import '../assets/css/gallery.scss'

export default {
  data () {
    return {
      images: [],
      idx: 0,
      loading: 0,
      doublePageMode: true
    }
  },
  props: ['dialogVisible', 'guid', 'rpc'],
  watch: {
    guid: function (val) {
      this.images = []
      this.idx = 0
      var _this = this
      this.rpc.call(
        'getImage',
        (r) => {
          _this.images = r
        },
        (e) => {
          _this.$message.error(e.toString())
        },
        [this.guid]
      )
    },
    idx: function (val) {
      this.loading = this.doublePageMode ? 2 : 1
    },
    doublePageMode: function (val) {
      this.loading = 0
    }
  },
  methods: {
    handleCancel () {
      this.$emit('update:dialogVisible', false)
    },
    handleConfirm () {
      this.$emit('update:dialogVisible', false)
    },
    handleDialogClose () {
      this.$emit('update:dialogVisible', false)
    },
    handleImgClick (e) {
      let sign = 1
      // click left part of screen to go back
      if (e.screenX < e.view.screen.width / 2) sign = -1
      if (this.idx > this.images.length - (this.doublePageMode ? 2 : 1) && sign > 0) {
        this.$emit('update:dialogVisible', false)
        return
      }
      this.idx = this.idx + sign * (this.doublePageMode ? 2 : 1)
      // .el-dialog.is-fullscreen
      e.path[3].scrollTop = 42
    },
    loadFunc (e) {
      this.loading = Math.max(0, this.loading - 1)
    },
    errorFunc (e) {
      this.loading = Math.max(0, this.loading - 1)
      /** e.srcElement.style.width = '64px'
      e.srcElement.style.opacity = '0.1'
      e.srcElement.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxNzkyIDE3OTIiPjxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0xMDI0IDEzNzV2LTE5MHEwLTE0LTkuNS0yMy41dC0yMi41LTkuNWgtMTkycS0xMyAwLTIyLjUgOS41dC05LjUgMjMuNXYxOTBxMCAxNCA5LjUgMjMuNXQyMi41IDkuNWgxOTJxMTMgMCAyMi41LTkuNXQ5LjUtMjMuNXpNMTAyMiAxMDAxbDE4LTQ1OXEwLTEyLTEwLTE5LTEzLTExLTI0LTExaC0yMjBxLTExIDAtMjQgMTEtMTAgNy0xMCAyMWwxNyA0NTdxMCAxMCAxMCAxNi41dDI0IDYuNWgxODVxMTQgMCAyMy41LTYuNXQxMC41LTE2LjV6TTEwMDggNjdsNzY4IDE0MDhxMzUgNjMtMiAxMjYtMTcgMjktNDYuNSA0NnQtNjMuNSAxN2gtMTUzNnEtMzQgMC02My41LTE3dC00Ni41LTQ2cS0zNy02My0yLTEyNmw3NjgtMTQwOHExNy0zMSA0Ny00OXQ2NS0xOCA2NSAxOCA0NyA0OXoiIC8+PC9zdmc+' **/
    }
  }
}
</script>
