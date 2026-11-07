#!/usr/bin/env node
// End-to-end smoke test for the WebUI against the mock RPC backend. It drives
// the real interface and asserts on observable state, so a component library
// or framework upgrade cannot silently break a workflow.
//
//   node tools/smoke.mjs --port 8050

import { chromium } from 'playwright'

function parseArgs (argv) {
  const options = { port: 8050 }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--port') options.port = Number(argv[++i])
  }
  return options
}

const options = parseArgs(process.argv.slice(2))
const url = `http://127.0.0.1:${options.port}/#host=127.0.0.1,port=${options.port},https=no,token=mock`
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const results = []
function check (name, ok, detail) {
  results.push({ name, ok: Boolean(ok), detail })
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || !detail ? '' : ' — ' + detail}`)
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })
const page = await context.newPage()
const consoleErrors = []
page.on('pageerror', (error) => consoleErrors.push(String(error)))
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})

const rows = () => page.evaluate(() =>
  [...document.querySelectorAll('.el-table__body tbody tr, .el-table__body-wrapper tbody tr')].length)

async function closeDialogIfOpen (kind) {
  const open = await page.evaluate((cls) => {
    const overlay = document.querySelector(`${cls} .el-overlay`)
    return Boolean(overlay && getComputedStyle(overlay).display !== 'none')
  }, kind)
  if (!open) return false
  await page.evaluate((cls) => {
    const buttons = [...document.querySelectorAll(`${cls} .el-dialog__footer button`)]
    const cancel = buttons.find((button) => button.innerText.trim() === 'Cancel') || buttons[0]
    if (cancel) cancel.click()
  }, kind)
  await sleep(600)
  return true
}

await page.goto(url, { waitUntil: 'load' })
await page.waitForFunction(() => document.querySelectorAll('.el-table__body tbody tr, .el-table__body-wrapper tbody tr').length > 0, null, { timeout: 60000 })
await sleep(800)

// The first run opens the connection dialog.
const firstRunDialog = await page.evaluate(() => {
  const overlay = document.querySelector('.config-view .el-overlay')
  return Boolean(overlay && getComputedStyle(overlay).display !== 'none')
})
check('connection dialog opens on first run', firstRunDialog)
await closeDialogIfOpen('.config-view')
await sleep(500)
check('rows render after closing the dialog', await rows() > 0, `${await rows()} rows`)

// Header numbers come from getInfo.
const header = await page.evaluate(() => {
  const tags = [...document.querySelectorAll('.el-header .el-tag')]
  return tags.map((tag) => tag.innerText.replace(/\s+/g, ' ').trim())
})
check('header shows the server version', header.some((text) => /2\.0\d+/.test(text)), header.join(' | '))
check('header shows the speed badge', header.some((text) => /MB\/s|KB\/s|B\/s/.test(text)), header.join(' | '))

// Search filters the table and offers suggestions.
const searchInput = page.locator('.searchbox input')
await searchInput.click()
await searchInput.type('Gallery 12', { delay: 60 })
await sleep(1200)
const suggestions = await page.evaluate(() => {
  const list = document.querySelector('.el-autocomplete-suggestion li')
  return list ? list.innerText.trim() : null
})
check('autocomplete offers suggestions', Boolean(suggestions), String(suggestions))
const filtered = await rows()
check('search narrows the table', filtered > 0 && filtered < await page.evaluate(() => 300), `${filtered} rows`)
await searchInput.fill('')
await sleep(900)

// Sorting by the title column reorders rows.
const firstTitleBefore = await page.evaluate(() => document.querySelector('.el-table__body tbody tr, .el-table__body-wrapper tbody tr')?.querySelector('.name-wrapper')?.innerText.trim())
await page.evaluate(() => {
  const headers = [...document.querySelectorAll('.el-table__header th')]
  const ascending = headers[1] && headers[1].querySelector('.sort-caret.ascending')
  if (ascending) ascending.dispatchEvent(new MouseEvent('click', { bubbles: true }))
})
await sleep(900)
const firstTitleAfter = await page.evaluate(() => document.querySelector('.el-table__body tbody tr, .el-table__body-wrapper tbody tr')?.querySelector('.name-wrapper')?.innerText.trim())
check('title sort changes the first row', firstTitleBefore !== firstTitleAfter, `${firstTitleBefore} -> ${firstTitleAfter}`)

// Hovering a finished row shows the detail popover, including its thumbnail.
const finishedRowIndex = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.el-table__body tbody tr, .el-table__body-wrapper tbody tr')]
  const index = rows.findIndex((row) => row.querySelector('.el-progress.is-success'))
  return index
})
check('a finished row is visible', finishedRowIndex >= 0, String(finishedRowIndex))
await page.hover(`.el-table__body tbody tr:nth-child(${finishedRowIndex + 1}) .name-wrapper, .el-table__body-wrapper tbody tr:nth-child(${finishedRowIndex + 1}) .name-wrapper`)
await sleep(700)
const popover = await page.evaluate(() => {
  const popper = [...document.querySelectorAll('.el-popover')].find((el) => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0)
  if (!popper) return null
  return { text: popper.innerText.replace(/\s+/g, ' ').slice(0, 80), tags: popper.querySelectorAll('.el-tag').length, image: Boolean(popper.querySelector('img')) }
})
check('hover popover renders details', popover && popover.text.length > 0, JSON.stringify(popover))
check('popover lists tags and a thumbnail', popover && popover.tags > 0 && popover.image, JSON.stringify(popover))

// Bulk selection exposes the bulk action buttons.
await page.click('.el-table__header th .el-checkbox')
await sleep(600)
const selection = await page.evaluate(() => {
  const groups = [...document.querySelectorAll('.el-header .el-button-group')]
  return {
    groups: groups.length,
    bulkVisible: Boolean(groups[0] && groups[0].style.display !== 'none'),
    checked: document.querySelectorAll('.el-table__body tbody tr .el-checkbox.is-checked, .el-table__body-wrapper tbody tr .el-checkbox.is-checked').length
  }
})
check('select all ticks every row', selection.checked > 0, JSON.stringify(selection))
check('select all reveals bulk actions', selection.bulkVisible, JSON.stringify(selection))

// Config dialog: tabs and the advanced form.
await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('.el-header .el-button')]
  const config = buttons.find((button) => button.querySelector('.fa-icon') && button.innerHTML.includes('fa-icon'))
  return config ? true : false
})
await page.evaluate(() => {
  const groups = [...document.querySelectorAll('.el-header .el-button-group')]
  const last = groups[groups.length - 1]
  const buttons = last ? [...last.querySelectorAll('button')] : []
  if (buttons[2]) buttons[2].click()
})
await sleep(700)
const configOpen = await page.evaluate(() => {
  const overlay = document.querySelector('.config-view .el-overlay')
  return Boolean(overlay && getComputedStyle(overlay).display !== 'none')
})
check('config dialog opens from the toolbar', configOpen)
const advancedTab = await page.evaluate(() => {
  const tabs = [...document.querySelectorAll('.config-view .el-tabs__item')]
  const advanced = tabs.find((tab) => tab.innerText.trim() === 'Advanced')
  if (advanced) advanced.click()
  return tabs.length
})
await sleep(600)
const advancedFields = await page.evaluate(() => document.querySelectorAll('.config-view .el-form-item').length)
check('config dialog has the three tabs', advancedTab === 3, `${advancedTab} tabs`)
check('advanced tab renders its fields', advancedFields > 5, `${advancedFields} fields`)
await closeDialogIfOpen('.config-view')

// Add task dialog.
await page.evaluate(() => {
  const groups = [...document.querySelectorAll('.el-header .el-button-group')]
  const last = groups[groups.length - 1]
  const buttons = last ? [...last.querySelectorAll('button')] : []
  if (buttons[0]) buttons[0].click()
})
await sleep(700)
const addTaskOpen = await page.evaluate(() => {
  const overlay = document.querySelector('.add-task-view .el-overlay')
  return Boolean(overlay && getComputedStyle(overlay).display !== 'none')
})
check('add-task dialog opens', addTaskOpen)
const collapse = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.add-task-view .el-collapse-item__header')]
  if (items[0]) items[0].click()
  return items.length
})
await sleep(400)
check('add-task dialog has the collapsible config', collapse === 2, `${collapse} sections`)
await closeDialogIfOpen('.add-task-view')

// Gallery viewer for a finished task.
await page.evaluate((index) => {
  const rows = [...document.querySelectorAll('.el-table__body tbody tr, .el-table__body-wrapper tbody tr')]
  const finished = rows[index]
  const buttons = finished ? [...finished.querySelectorAll('button')] : []
  if (buttons[0]) buttons[0].click()
}, finishedRowIndex)
await sleep(1500)
const gallery = await page.evaluate(() => {
  const overlay = document.querySelector('.gallery-view .el-overlay')
  const img = document.querySelector('.gallery-view img')
  return {
    open: Boolean(overlay && getComputedStyle(overlay).display !== 'none'),
    image: Boolean(img && img.getAttribute('src')),
    src: img ? img.getAttribute('src').slice(0, 60) : null
  }
})
check('gallery viewer opens', gallery.open)
check('gallery viewer loads an image', gallery.image, String(gallery.src))
await page.evaluate(() => {
  const overlay = document.querySelector('.gallery-view .el-overlay')
  if (overlay) overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }))
})
await sleep(500)

check('no console errors during the run', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' || '))

const failed = results.filter((result) => !result.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
await browser.close()
process.exit(failed.length === 0 ? 0 : 1)
