<template>
  <div class="gallery-view">
    <el-dialog
      :visible.sync="dialogVisible"
      :before-close="handleDialogClose"
      style="text-align: center;"
      top="1vh"
      width="80%">
      <el-pagination
        :current-page.sync="idx"
        layout="prev, pager, next, jumper"
        :page-size="1"
        :total="images.length">
      </el-pagination>
      <el-row v-loading="loading" width="80%">
      <img
        width="100%"
        @load="loadFunc"
        @error="errorFunc"
        :src="this.rpc ? this.rpc.endpoint + images[idx - 1] : ''"
        @click="idx+=1"/>
      </el-row>
      <el-pagination
        :current-page.sync="idx"
        layout="prev, pager, next, jumper"
        :page-size="1"
        :total="images.length">
      </el-pagination>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data () {
    return {
      images: [],
      idx: 0,
      loading: true
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
      this.loading = true
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
    loadFunc (e) {
      this.loading = false
    },
    errorFunc (e) {
      /** e.srcElement.style.width = '64px'
      e.srcElement.style.opacity = '0.1'
      e.srcElement.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxNzkyIDE3OTIiPjxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0xMDI0IDEzNzV2LTE5MHEwLTE0LTkuNS0yMy41dC0yMi41LTkuNWgtMTkycS0xMyAwLTIyLjUgOS41dC05LjUgMjMuNXYxOTBxMCAxNCA5LjUgMjMuNXQyMi41IDkuNWgxOTJxMTMgMCAyMi41LTkuNXQ5LjUtMjMuNXpNMTAyMiAxMDAxbDE4LTQ1OXEwLTEyLTEwLTE5LTEzLTExLTI0LTExaC0yMjBxLTExIDAtMjQgMTEtMTAgNy0xMCAyMWwxNyA0NTdxMCAxMCAxMCAxNi41dDI0IDYuNWgxODVxMTQgMCAyMy41LTYuNXQxMC41LTE2LjV6TTEwMDggNjdsNzY4IDE0MDhxMzUgNjMtMiAxMjYtMTcgMjktNDYuNSA0NnQtNjMuNSAxN2gtMTUzNnEtMzQgMC02My41LTE3dC00Ni41LTQ2cS0zNy02My0yLTEyNmw3NjgtMTQwOHExNy0zMSA0Ny00OXQ2NS0xOCA2NSAxOCA0NyA0OXoiIC8+PC9zdmc+' **/
    }
  }
}
</script>
