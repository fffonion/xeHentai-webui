#!/usr/bin/env node
// Measures the WebUI against the mock backend: mount time, DOM weight, long
// tasks while the polling refresher runs, and frame pacing while scrolling a
// long download list. Prints a JSON report so "before" and "after" builds can
// be compared on identical fixtures.
//
//   node tools/probe.mjs --port 8040 --out report.json [--screenshot shot.png]
//                        [--settle-ms 1500] [--idle-ms 10000]

import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

function parseArgs (argv) {
  const options = { port: 8040, out: 'probe.json', screenshot: null, settleMs: 1500, idleMs: 10000 }
  for (let i = 0; i < argv.length; i += 1) {
    const next = () => argv[++i]
    if (argv[i] === '--port') options.port = Number(next())
    else if (argv[i] === '--out') options.out = path.resolve(next())
    else if (argv[i] === '--screenshot') options.screenshot = path.resolve(next())
    else if (argv[i] === '--settle-ms') options.settleMs = Number(next())
    else if (argv[i] === '--idle-ms') options.idleMs = Number(next())
  }
  return options
}

const options = parseArgs(process.argv.slice(2))
const url = `http://127.0.0.1:${options.port}/#host=127.0.0.1,port=${options.port},https=no,token=mock`
const refreshIntervalSeconds = 5

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function percentile (values, p) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))))
  return Number(sorted[index].toFixed(2))
}

async function readCdpMetrics (client) {
  const { metrics } = await client.send('Performance.getMetrics')
  const out = {}
  for (const metric of metrics) out[metric.name] = metric.value
  return out
}

function diffMetrics (before, after, names) {
  const out = {}
  for (const name of names) out[name] = Number((((after[name] || 0) - (before[name] || 0)) * 1000).toFixed(1))
  return out
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

const consoleErrors = []
page.on('pageerror', (error) => consoleErrors.push(String(error)))
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})

// Long-task accounting has to be installed before the app boots.
await page.addInitScript(() => {
  window.__longTasks = []
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__longTasks.push({ start: entry.startTime, duration: entry.duration })
      }
    }).observe({ entryTypes: ['longtask'] })
  } catch {
    // longtask unsupported: report stays empty
  }
})

const client = await context.newCDPSession(page)
await client.send('Performance.enable')

const startedAt = Date.now()
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(
  () => document.querySelectorAll('.el-table__body-wrapper tbody tr').length > 0,
  null,
  { timeout: 60000 }
)
const firstRowsMs = Date.now() - startedAt
await sleep(options.settleMs)

// First run without a saved connection opens the configuration dialog; it
// would otherwise swallow every synthetic pointer event. `.el-dialog__wrapper`
// is position:fixed, so `offsetParent` is always null — test `display` instead.
const configDialogOpen = await page.evaluate(() => {
  const overlay = document.querySelector('.config-view .el-overlay')
  return Boolean(overlay && getComputedStyle(overlay).display !== 'none')
})
if (configDialogOpen) {
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('.config-view .el-dialog__footer button')]
    const confirm = buttons.find((button) => button.className.includes('el-button--primary')) || buttons[0]
    if (confirm) confirm.click()
  })
  await page.waitForFunction(() => {
    const overlay = document.querySelector('.config-view .el-overlay')
    return !overlay || getComputedStyle(overlay).display === 'none'
  }, null, { timeout: 15000 })
  await sleep(500)
}

const snapshot = await page.evaluate(() => {
  const rows = document.querySelectorAll('.el-table__body-wrapper tbody tr').length
  const popovers = document.querySelectorAll('.el-popover').length
  const nodes = document.getElementsByTagName('*').length
  return {
    rows,
    popovers,
    nodes,
    pageHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    tableBodyChildren: document.querySelector('.el-table__body-wrapper')?.children.length || 0
  }
})

const before = await readCdpMetrics(client)
const longTasksBefore = await page.evaluate(() => window.__longTasks.length)
await sleep(options.idleMs)
const after = await readCdpMetrics(client)
const idleLongTasks = await page.evaluate((from) => window.__longTasks.slice(from), longTasksBefore)

const idle = diffMetrics(before, after, [
  'TaskDuration', 'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration',
  'V8CompileDuration'
])
idle.heapDeltaMb = Number(((after.JSHeapUsedSize - before.JSHeapUsedSize) / (1024 * 1024)).toFixed(1))

const idleLongTasksSummary = summarizeLongTasks(idleLongTasks)

// Frame pacing while scrolling the whole list.
const frames = await page.evaluate(async () => {
  const scroller = document.scrollingElement
  const samples = []
  const maxTop = scroller.scrollHeight - window.innerHeight
  await new Promise((resolve) => {
    let last = performance.now()
    let top = 0
    function step (ts) {
      samples.push(ts - last)
      last = ts
      top += 160
      scroller.scrollTop = top
      if (top < maxTop) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
  return samples
})

const scroll = summarizeFrames(frames)

// Re-render cost of a full refresh (same path the polling loop uses).
const refresh = await page.evaluate(async () => {
  const button = document.querySelector('.el-header .el-button-group:last-child .el-button:nth-child(2)')
  if (!button) return null
  const frames = []
  const start = performance.now()
  button.click()
  await new Promise((resolve) => {
    let last = performance.now()
    function step (ts) {
      frames.push(ts - last)
      last = ts
      if (ts - start < 1500) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
  return frames
})

if (options.screenshot) {
  await page.evaluate(() => { document.scrollingElement.scrollTop = 0 })
  await sleep(400)
  await page.screenshot({ path: options.screenshot, fullPage: false })
}

// Typing latency in the search box: the autocomplete rebuilds its suggestion
// list on every keystroke, so slow frames here mean per-key work over the whole
// task set.
let typing = null
const search = page.locator('.searchbox input')
if (await search.count()) {
  await page.evaluate(() => {
    window.__typing = []
    let last = performance.now()
    window.__typingOn = true
    const step = (ts) => {
      if (!window.__typingOn) return
      window.__typing.push(ts - last)
      last = ts
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
  await search.click()
  await search.type('mockgallery', { delay: 120 })
  await sleep(600)
  const typingFrames = await page.evaluate(() => {
    window.__typingOn = false
    return window.__typing
  })
  typing = summarizeFrames(typingFrames)
  await page.evaluate(() => {
    const input = document.querySelector('.searchbox input')
    if (input) {
      input.value = ''
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
  await sleep(300)
}

const report = {
  url,
  refreshIntervalSeconds,
  firstRowsMs,
  snapshot,
  idleWindowMs: options.idleMs,
  idle,
  idleLongTasks: idleLongTasksSummary,
  scroll,
  refresh: refresh ? summarizeFrames(refresh) : null,
  typing,
  consoleErrors: consoleErrors.slice(0, 10)
}

report.pass = {
  hasRows: snapshot.rows > 0,
  noConsoleErrors: consoleErrors.length === 0,
  scrollP95Under33ms: scroll.p95 < 33,
  refreshP95Under33ms: refresh ? summarizeFrames(refresh).p95 < 33 : true,
  typingP95Under33ms: typing ? typing.p95 < 33 : true
}

console.log(JSON.stringify(report, null, 2))
if (options.out) await writeFile(options.out, JSON.stringify(report, null, 2) + '\n')

await browser.close()

function summarizeLongTasks (entries) {
  const durations = entries.map((entry) => entry.duration)
  return {
    count: durations.length,
    totalMs: Number(durations.reduce((sum, value) => sum + value, 0).toFixed(1)),
    maxMs: Number((durations.length ? Math.max(...durations) : 0).toFixed(1)
    ),
    over50ms: durations.filter((value) => value >= 50).length
  }
}

function summarizeFrames (frames) {
  const values = frames.filter((value) => value > 0 && value < 2000)
  const total = values.reduce((sum, value) => sum + value, 0)
  return {
    frames: values.length,
    totalMs: Number(total.toFixed(1)),
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    max: percentile(values, 100),
    over33ms: values.filter((value) => value > 33).length
  }
}
