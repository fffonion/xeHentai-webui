#!/usr/bin/env node
// Captures deterministic screenshots of the WebUI against the mock backend:
// the initial view (connection dialog open) and the task table after the
// dialog is confirmed. Used to prove the toolchain migration keeps the UI
// pixel-identical.
//
//   node tools/screenshot.mjs --port 8041 --prefix tmp/shot-before

import { chromium } from 'playwright'

function parseArgs (argv) {
  const options = { port: 8040, prefix: 'shot', waitMs: 1200 }
  for (let i = 0; i < argv.length; i += 1) {
    const next = () => argv[++i]
    if (argv[i] === '--port') options.port = Number(next())
    else if (argv[i] === '--prefix') options.prefix = next()
    else if (argv[i] === '--wait-ms') options.waitMs = Number(next())
  }
  return options
}

const options = parseArgs(process.argv.slice(2))
const url = `http://127.0.0.1:${options.port}/#host=127.0.0.1,port=${options.port},https=no,token=mock`

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: 'en-US'
})
const page = await context.newPage()
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => document.querySelectorAll('.el-table__body-wrapper tbody tr').length > 0, null, { timeout: 60000 })
await new Promise((resolve) => setTimeout(resolve, options.waitMs))

const initial = `${options.prefix}-initial.png`
await page.screenshot({ path: initial })

const overlayVisible = () => {
  const overlay = document.querySelector('.config-view .el-overlay')
  return Boolean(overlay && getComputedStyle(overlay).display !== 'none')
}
if (await page.evaluate(overlayVisible)) {
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('.config-view .el-dialog__footer button')]
    const confirm = buttons.find((button) => button.className.includes('el-button--primary')) || buttons[0]
    if (confirm) confirm.click()
  })
  await page.waitForFunction(() => {
    const overlay = document.querySelector('.config-view .el-overlay')
    return !overlay || getComputedStyle(overlay).display === 'none'
  }, null, { timeout: 15000 })
  await new Promise((resolve) => setTimeout(resolve, 600))
}

const table = `${options.prefix}-table.png`
await page.screenshot({ path: table })

// Popover + search suggestions give two more surfaces to compare.
await page.hover('.el-table__body-wrapper tbody tr:nth-child(2) .name-wrapper')
await new Promise((resolve) => setTimeout(resolve, 900))
const popover = `${options.prefix}-popover.png`
await page.screenshot({ path: popover })

// Park the pointer so the hover popover closes before the search box is used.
await page.mouse.move(1420, 8)
await new Promise((resolve) => setTimeout(resolve, 700))

await page.click('.searchbox input', { force: true })
await page.type('.searchbox input', 'Action', { delay: 40 })
await new Promise((resolve) => setTimeout(resolve, 900))
const search = `${options.prefix}-search.png`
await page.screenshot({ path: search })

const stats = await page.evaluate(() => ({
  rows: document.querySelectorAll('.el-table__body-wrapper tbody tr').length,
  nodes: document.getElementsByTagName('*').length,
  pageHeight: document.documentElement.scrollHeight
}))

console.log(JSON.stringify({ shots: [initial, table, popover, search], stats }, null, 2))
await browser.close()
