# xeHentai-webui

[简体中文](README.chs.md) [繁體中文](README.cht.md)

This is a web interface for [xeHentai](https://github.com/fffonion/xeHentai)

[Demo](https://xehentai.yooooo.us/#host=localhost,port=8010,token=,https=no)

![Screenshot](https://dl.yooooo.us/share/xeHentai/WebUI-%E6%BC%94%E7%A4%BA.gif)

Please start [xeHentai](https://github.com/fffonion/xeHentai) in RPC mode first by adding `--rpc-port=8010`
to arguments.

## Build Setup

Requires [Bun](https://bun.sh) 1.2 or newer (the lockfile is `bun.lock`).

``` bash
# install dependencies
bun install

# serve with hot reload at localhost:8080
bun run dev

# build for production into dist/
bun run build

# lint the Vue sources and the mock/probe tooling
bun run lint
```

The build is Vite based: templates are compiled with `@vitejs/plugin-vue` for
Vue 3.5, styles with dart-sass. The UI runs on element-plus, store on vuex 4 and
translations on vue-i18n 11. The Font Awesome 4 glyphs the interface uses are
vendored in `src/assets/icons` (vue-awesome 2.3.8 data, MIT) and rendered by
`src/components/Icon.vue`, so no Vue 2 icon component is needed. Assets still
land under `static/`, so the published `gh-pages` layout and the xeHentai
binary's WebUI proxy keep working.

## Development against a mock backend

`mock/` contains a dependency-free stand-in for the xeHentai RPC server, so the
UI can be exercised without a real instance (and with hundreds of tasks):

``` bash
# 300 tasks, advancing the progress counters once per second
bun run mock --tasks 300 --port 8040 --static dist

# freeze the counters (screenshots stay reproducible)
bun run mock --tasks 300 --port 8040 --static dist --churn-ms 0

# open it with the connection pinned through the URL hash
xdg-open 'http://localhost:8040/#host=localhost,port=8040,https=no,token=mock'
```

`tools/probe.mjs` measures mount time, DOM weight, long tasks while the polling
refresher runs, scroll frame pacing and search-typing latency against that
backend; `tools/screenshot.mjs` captures the same surfaces for visual diffs;
`tools/smoke.mjs` drives the actual workflows (connection dialog, search, sort,
bulk actions, config tabs, add task, gallery viewer) and asserts on the result.

``` bash
bun run probe --port 8040 --out report.json
node tools/screenshot.mjs --port 8040 --prefix /tmp/shot
```

Playwright's browser is not downloaded by `bun install`; run
`bunx playwright install chromium` once, or point `PLAYWRIGHT_BROWSERS_PATH` at
an existing browser cache.

## Request a feature

[![Feature Requests](http://feathub.com/fffonion/xeHentai-webui?format=svg)](http://feathub.com/fffonion/xeHentai-webui)
