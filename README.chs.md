# xeHentai-webui

[English](README.md) [繁體中文](README.cht.md)

这是一个 [xeHentai](https://github.com/fffonion/xeHentai) 的web界面

[演示](https://xehentai.yooooo.us/#host=localhost,port=8010,token=,https=no)

![Screenshot](https://dl.yooooo.us/share/xeHentai/WebUI-%E6%BC%94%E7%A4%BA.gif)

请先以 RPC 模式启动[xeHentai](https://github.com/fffonion/xeHentai)，添加启动参数`--rpc-port=8010`。

Windows 用户可以直接运行`RPC模式.bat`。

## 构建设置

需要 [Bun](https://bun.sh) 1.2 或更新版本，锁文件为 `bun.lock`。

``` bash
# 安装依赖
bun install

# 热更新开发模式 localhost:8080
bun run dev

# 构建生产版本到 dist/
bun run build

# 检查 Vue 源码以及 mock/probe 脚本
bun run lint
```

构建基于 Vite：模板由 `@vitejs/plugin-vue` 与 Vue 3.5 编译，样式使用 dart-sass。
界面组件库为 element-plus，状态管理为 vuex 4，翻译为 vue-i18n 11。用到的 Font Awesome 4
图标已收进 `src/assets/icons`（来自 vue-awesome 2.3.8，MIT 许可），由 `src/components/Icon.vue`
渲染。产物仍输出到 `static/`，`gh-pages` 目录结构与 xeHentai 的 WebUI 代理保持不变。

## 使用 mock 后端开发

`mock/` 提供一个无依赖的 xeHentai RPC 服务替身，可以在没有真实实例、任务数量很多时调试界面：

``` bash
# 300 个任务，进度计数每秒推进一次
bun run mock --tasks 300 --port 8040 --static dist

# 冻结计数，便于重复截图对比
bun run mock --tasks 300 --port 8040 --static dist --churn-ms 0

# 通过 URL hash 固定连接参数后打开
xdg-open 'http://localhost:8040/#host=localhost,port=8040,https=no,token=mock'
```

`tools/probe.mjs` 会测量首屏时间、DOM 规模、轮询刷新期间的长任务、滚动帧率与搜索输入延迟；
`tools/screenshot.mjs` 采集同样的界面用于视觉比对。

## 投票新功能

[![Feature Requests](http://feathub.com/fffonion/xeHentai-webui?format=svg)](http://feathub.com/fffonion/xeHentai-webui)
