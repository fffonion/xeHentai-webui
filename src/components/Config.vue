<template>
  <div class="config-view">
    <el-dialog
      :title="$t('Configuration')"
      :visible.sync="dialogVisible"
      :before-close="handleDialogClose"
      top="10vh"
      width="45%">
      <el-tabs v-model="activeTabName" @tab-click="handleTabClick">
        <el-tab-pane :label="$t('Connection Configuration')" name="connection">
          <el-form ref="form-conn" :model="connConfig" label-width="100px" label-position="left">
            <el-form-item :label="$t('Server')" style="text-align: center">
              <el-row>
                <el-col :span="15">
                  <el-input v-model="connConfig.host" :placeholder="$t('Host')"
                    class="is-https"
                    :class="{ https : connConfig.isHttps }">
                    <template slot="prepend">
                      {{ connConfig.isHttps ? 'https://' : 'http://' }}
                    </template>
                  </el-input>
                </el-col>
                <el-col class="line" :span="1">:</el-col>
                <el-col :span="5">
                  <el-input v-model.number="connConfig.port" :placeholder="$t('Port')"
                    class="is-https" :class="{ https : connConfig.isHttps }">
                  </el-input>
                </el-col>
              </el-row>
            </el-form-item>
            <el-form-item label="HTTPS">
              <el-switch v-model="connConfig.isHttps"
              label="right"
              active-color="#13ce66"
              inactive-color="#c0ccda"></el-switch>
            </el-form-item>
            <el-form-item :label="$t('Secret')">
              <el-input v-model="connConfig.secret"></el-input>
            </el-form-item>
            <el-form-item :label="$t('Auto Refresh')">
              <el-row>
                <el-input-number v-model="connConfig.refreshInterval" :min="1"></el-input-number>
                {{ $t('seconds') }}
              </el-row>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane :label="$t('Basic Configuration')" name="basic">
          <el-form ref="form-basic" label-width="120px" label-position="left">
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
            <el-form-item :label="$t('Make archive')">
              <el-switch v-model="serverConfig.make_archive"></el-switch>
              <span class='conf-str'>make_archive</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane :label="$t('Advanced Configuration')" name="advanced">
          <el-form ref="form-advanced" label-width="130px" label-position="left">
            <el-form-item :label="$t('Proxy')">
              <el-tag
                v-for="proxy in serverConfig.proxy"
                v-bind:key="proxy"
                size="small"
                type="info"
                @close="removeProxy(proxy)"
                closable>{{ proxy }}</el-tag>
                <el-input
                  class="input-add-proxy"
                  v-if="addProxyInputVisible"
                  v-model="newProxy"
                  ref="addProxyInput"
                  size="mini"
                  @keyup.enter.native="addProxy"
                  @blur="addProxy">
                </el-input>
                <el-button v-else class="button-add-proxy" size="small" @click="showAddProxyInput">
                  + {{ $t('Add Proxy') }}
                </el-button>
                <span class='conf-str'>proxy</span>
            </el-form-item>
            <el-form-item :label="$t('Use proxy')">
              <el-switch v-model="serverConfig.proxy_image"></el-switch>
              <span class='conf-str'>proxy_image</span>
            </el-form-item>
            <el-form-item :label="$t('Proxy image only')">
              <el-switch v-model="serverConfig.proxy_image_only"></el-switch>
              <span class='conf-str'>proxy_image_only</span>
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
                <el-input-number v-model="serverConfig.download_timeout" :min="1"></el-input-number>
                  {{ $t('seconds') }} <span class='conf-str'>download_timeout</span>
              </el-row>
            </el-form-item>
            <el-form-item :label="$t('Low speed threshold')">
              <el-row>
                <el-input-number v-model="serverConfig.low_speed_threshold" :min="1"></el-input-number>
                  {{ $t('KB/s') }} <span class='conf-str'>low_speed_threshold</span>
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
            <el-form-item :label="$t('Log path')">
              <el-row>
                <el-col :span=20>
                  <el-input v-model="serverConfig.log_path"></el-input>
                </el-col>
                <el-col :span=4>
                  <span class='conf-str'>log_path</span>
                </el-col>
              </el-row>
            </el-form-item>
            <el-form-item :label="$t('Log verbose')">
              <el-row>
                <el-col :span=17>
                   <el-slider v-model="serverConfig.log_verbose"
                   :min=1 :max=3 :step=1 show-stops></el-slider>
                </el-col>
                <el-col :span=6 :offset=1>
                  <span class='conf-str'>log_verbose</span>
                </el-col>
              </el-row>
            </el-form-item>
            <el-form-item :label="$t('Save tasks')">
              <el-switch v-model="serverConfig.save_tasks"></el-switch>
              <span class='conf-str'>save_tasks</span>
            </el-form-item>
            <el-form-item :label="$t('Delete files')">
              <el-switch v-model="serverConfig.delete_task_files"></el-switch>
              <span class='conf-str'>delete_task_files</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleCancel">{{ $t('Cancel') }}</el-button>
        <el-button type="primary" @click="handleConfirm">{{ $t('Confirm') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import '../assets/css/config.scss'
import {mapGetters} from 'vuex'

export default {
  data () {
    return {
      activeTabName: 'connection',
      addProxyInputVisible: false,
      newProxy: '',
      addIgnoredErrnoInputVisible: false,
      newIgnoredErrno: '',
      connConfig: {
        isHttps: false,
        host: 'localhost',
        port: 8010
      },
      serverConfig: {}
    }
  },
  props: ['dialogVisible', 'needRefreshHeader', 'needRefreshFinished', 'needRefreshUnfinished',
    'connStringNew', 'authStringNew', 'serverConfigNew', 'serverConfigOriginal'
  ],
  watch: {
    serverConfigOriginal: function (val) {
      this.serverConfig = Object.assign({}, this.serverConfigOriginal)
    }
  },
  computed: {
    ...mapGetters({
      connString: 'connString',
      authString: 'authString'
    })
  },
  mounted () {
    // display connection configuration if first run
    if (!this.$store.state.conn.host) {
      this.$emit('update:dialogVisible', true)
      this.$store.state.conn.host = location.hostname
      this.$store.state.conn.port = 8010
      this.$store.state.conn.isHttps = location.protocol === 'https:'
    }
    // initial values, will load from vuex.persist
    this.$emit('update:connStringNew', this.connString)
    this.$emit('update:authStringNew', this.authString)
    this.connConfig = Object.assign({}, this.$store.state.conn)
  },
  methods: {
    handleTabClick (tab, event) { },
    handleCancel () {
      this.$emit('update:dialogVisible', false)
      // connection settings
      // revert to previous state
      this.connConfig = Object.assign({}, this.$store.state.conn)
      this.serverConfig = Object.assign({}, this.serverConfigOriginal)
    },
    handleConfirm () {
      this.$emit('update:dialogVisible', false)
      // connection settings
      this.$store.commit('setConnectionConfig', this.connConfig)
      this.$emit('update:connStringNew', this.connString)
      this.$emit('update:authStringNew', this.authString)

      // server settings
      this.$emit('update:serverConfigNew', this.serverConfig)
    },
    handleDialogClose () {
      this.handleCancel()
    },
    removeProxy (proxy) {
      this.serverConfig.proxy.splice(this.serverConfig.proxy.indexOf(proxy), 1)
    },
    addProxy () {
      if (this.newProxy.match(/^[^/]+:\/\/.+/)) {
        this.serverConfig.proxy.push(this.newProxy)
      } else if (this.newProxy) {
        this.$message.warning(this.$t('"{0}" is not a valid proxy string', [this.newProxy]))
      }
      this.addProxyInputVisible = false
      this.newProxy = ''
    },
    showAddProxyInput () {
      this.addProxyInputVisible = true
      this.$nextTick(_ => {
        this.$refs.addProxyInput.$refs.input.focus()
      })
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
