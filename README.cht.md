# xeHentai-webui

[English](README.md) [简体中文](README.chs.md)

這是一個 [xeHentai](https://github.com/fffonion/xeHentai) 的web界面

[演示](https://xehentai.yooooo.us/#host=localhost,port=8010,token=,https=no)

![Screenshot](https://dl.yooooo.us/share/xeHentai/WebUI-%E6%BC%94%E7%A4%BA.gif)

請先以 RPC 模式啟動[xeHentai](https://github.com/fffonion/xeHentai)，添加啟動參數`--rpc-port=8010`。

Windows 用戶可以直接運行`RPC模式.bat`。

## 構建設置

需要 [Bun](https://bun.sh) 1.2 或更新版本，鎖檔為 `bun.lock`。

``` bash
# 安裝依賴
bun install

# 熱更新開發模式 localhost:8080
bun run dev

# 構建生產版本到 dist/
bun run build

# 檢查 Vue 原始碼以及 mock/probe 腳本
bun run lint
```

構建基於 Vite：模板由 `@vitejs/plugin-vue2` 與 Vue 2.7 編譯，樣式使用 dart-sass。
產物仍輸出到 `static/`，`gh-pages` 目錄結構與 xeHentai 的 WebUI 代理維持不變。

## 使用 mock 後端開發

`mock/` 提供一個無依賴的 xeHentai RPC 服務替身，可在沒有真實實例、任務數量很多時除錯介面：

``` bash
# 300 個任務，進度計數每秒推進一次
bun run mock --tasks 300 --port 8040 --static dist

# 凍結計數，便於重複截圖比對
bun run mock --tasks 300 --port 8040 --static dist --churn-ms 0

# 透過 URL hash 固定連線參數後開啟
xdg-open 'http://localhost:8040/#host=localhost,port=8040,https=no,token=mock'
```

## 投票新功能

[![Feature Requests](http://feathub.com/fffonion/xeHentai-webui?format=svg)](http://feathub.com/fffonion/xeHentai-webui)
