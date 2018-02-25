<template>
  <div class="add-task-view">
    <el-dialog
      :title="$t('Add Task')"
      :visible.sync="dialogVisible"
      :before-close="handleDialogClose"
      top="10vh"
      width="45%">
      <el-form ref="form" label-width="100px" label-position="left">
        <el-form-item label="URL" style="text-align: center">
          <el-input v-model="url"></el-input>
        </el-form-item>
        <el-collapse accordion>
          <el-collapse-item :title="$t('Basic Configuration')" name="basic">
            <el-form-item :label="$t('Download directory')">
              <el-row>
                <el-col :span=22>
                  <el-input v-model="serverConfig.dir"></el-input>
                </el-col>
                <el-col :span=2>
                  <span class='conf-str'>dir</span>
                </el-col>
              </el-row>
            </el-form-item>
            <el-form-item :label="$t('Download original')">
              <el-switch v-model="serverConfig.download_ori"></el-switch>
              <span class='conf-str'>download_ori</span>
            </el-form-item>
            <el-form-item :label="$t('Japanese title')">
              <el-switch v-model="serverConfig.jpn_title"></el-switch>
              <span class='conf-str'>jpn_title</span>
            </el-form-item>
            <el-form-item :label="$t('Rename')">
              <el-switch v-model="serverConfig.rename_ori"></el-switch>
              <span class='conf-str'>rename_ori</span>
            </el-form-item>
          </el-collapse-item>
          <el-collapse-item :title="$t('Advanced Configuration')" name="advanced">
            <el-form-item :label="$t('Use proxy')">
              <el-switch v-model="serverConfig.proxy_image"></el-switch>
              <span class='conf-str'>proxy_image</span>
            </el-form-item>
            <el-form-item :label="$t('Proxy image only')">
              <el-switch v-model="serverConfig.proxy_image_only"></el-switch>
              <span class='conf-str'>proxy_image_only</span>
            </el-form-item>
            <el-form-item :label="$t('Make archive')">
              <el-switch v-model="serverConfig.make_archive"></el-switch>
              <span class='conf-str'>make_archive</span>
            </el-form-item>
            <el-form-item :label="$t('Scan thread')">
              <el-input-number v-model="serverConfig.scan_thread_cnt" :min="1"></el-input-number>
              <span class='conf-str'>scan_thread_cnt</span>
            </el-form-item>
            <el-form-item :label="$t('Download thread')">
              <el-input-number v-model="serverConfig.download_thread_cnt" :min="1"></el-input-number>
              <span class='conf-str'>download_thread_cnt</span>
            </el-form-item>
            <el-form-item :label="$t('Download timeout')">
              <el-row>
                <el-col :span="12">
                  <el-input-number v-model="serverConfig.download_timeout" :min="1"></el-input-number>
                </el-col>
                <el-col :span="12">
                  {{ $t('seconds') }} <span class='conf-str'>download_timeout</span>
                </el-col>
              </el-row>
            </el-form-item>
            <el-form-item :label="$t('Ignored errors')">
              <el-tag
                v-for="errno in serverConfig.ignored_errors"
                v-bind:key="errno"
                size="small"
                type="info"
                @close="removeIgnoredErrno(errno)"
                closable>{{ errno }}</el-tag>
                <el-input
                  class="input-add-ignored-errno"
                  v-if="addIgnoredErrnoInputVisible"
                  v-model="newIgnoredErrno"
                  ref="addIgnoredErrnoInput"
                  size="mini"
                  @keyup.enter.native="addIgnoredErrno"
                  @blur="addIgnoredErrno">
                </el-input>
                <el-button v-else class="button-add-ignored-errno" size="small" @click="showAddIgnoredErrnoInput">
                  + {{ $t('Add Errno') }}
                </el-button>
                <span class='conf-str'>ignored_errors</span>
            </el-form-item>
          </el-collapse-item>
        </el-collapse>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleCancel">{{ $t('Cancel') }}</el-button>
        <el-button type="primary" @click="handleConfirm">{{ $t('Add') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import '../assets/css/add-task.css'

export default {
  data () {
    return {
      addIgnoredErrnoInputVisible: false,
      newIgnoredErrno: '',
      url: '',
      serverConfig: {} // local copy of the original serverConfig
    }
  },
  props: ['dialogVisible', 'config', 'newTask'],
  watch: {
    config: function (val) {
      // copy original serverConfig to local serverConfig
      this.serverConfig = Object.assign({}, this.config)
    }
  },
  methods: {
    handleCancel () {
      this.form = {
        url: '',
        config: {}
      }
      this.$emit('update:dialogVisible', false)
    },
    handleConfirm () {
      this.$emit('update:newTask', [this.url, this.serverConfig])
      this.handleCancel()
    },
    handleDialogClose () {
      this.handleCancel()
    },
    removeIgnoredErrno (errno) {
      this.serverConfig.ignored_errors.splice(this.serverConfig.ignored_errors.indexOf(errno), 1)
    },
    addIgnoredErrno () {
      let errno = parseInt(this.newIgnoredErrno)
      if (errno) {
        this.serverConfig.ignored_errors.push(errno)
      } else if (this.newIgnoredErrno) {
        this.$message.warning(this.$t('"{0}" is not a valid error number', [this.newIgnoredErrno]))
      }
      this.addIgnoredErrnoInputVisible = false
      this.newIgnoredErrno = ''
    },
    showAddIgnoredErrnoInput () {
      this.addIgnoredErrnoInputVisible = true
      this.$nextTick(_ => {
        this.$refs.addIgnoredErrnoInput.$refs.input.focus()
      })
    }
  }
}
</script>
