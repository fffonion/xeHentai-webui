#!/usr/bin/env node
// Dependency-free mock of the xeHentai RPC backend plus a static file server.
//
//   node mock/server.mjs [--tasks 300] [--port 8040] [--static dist]
//                         [--churn-ms 1000] [--latency-ms 0]
//
// It implements every `xeH.*` method the WebUI calls (getInfo, getConfig,
// updateConfig, listTasks, addTask, resumeTask, pauseTask, delTask, getImage)
// and the `/img` and `/zip` download routes, so the UI can be exercised
// without a real xeHentai instance. Task counters advance on a timer to
// reproduce the polling refresh the UI performs every few seconds.

import http from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { buildTasks, advance } from './tasks.mjs'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
}

// 1x1 transparent PNG plus an 8x8 grey tile, enough for the thumbnail column.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)
const PNG_TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAF0lEQVR42mP8z8BQz0AEYBxVSF+FAP5FDvcfRYWgPAAAAABJRU5ErkJggg==',
  'base64'
)

function parseArgs (argv) {
  const options = {
    tasks: 300,
    port: 8040,
    staticDir: null,
    churnMs: 1000,
    latencyMs: 0,
    seed: 20261106,
    prefix: 'mock'
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = () => argv[++i]
    if (arg === '--tasks') options.tasks = Number(next())
    else if (arg === '--port') options.port = Number(next())
    else if (arg === '--static') options.staticDir = path.resolve(next())
    else if (arg === '--churn-ms') options.churnMs = Number(next())
    else if (arg === '--latency-ms') options.latencyMs = Number(next())
    else if (arg === '--seed') options.seed = Number(next())
    else if (arg === '--prefix') options.prefix = next()
    else if (arg === '--help') {
      console.log('usage: node mock/server.mjs [--tasks N] [--port N] [--static DIR] [--churn-ms N] [--latency-ms N]')
      process.exit(0)
    }
  }
  return options
}

const options = parseArgs(process.argv.slice(2))
const tasks = buildTasks(options.tasks, options.seed, options.prefix)

const config = {
  daemon: false,
  dir: './mock-downloads',
  download_ori: false,
  jpn_title: true,
  rename_ori: false,
  proxy: [],
  proxy_image: true,
  proxy_image_only: false,
  make_archive: false,
  download_range: null,
  scan_thread_cnt: 2,
  download_thread_cnt: 5,
  download_timeout: 30,
  ignored_errors: [],
  log_path: 'eh.log',
  log_verbose: 2,
  save_tasks: true,
  delete_task_files: false,
  low_speed_threshold: 10,
  auto_update: 'download',
  update_beta_channel: false
}

const info = {
  version: '2.023',
  threads_zombie: 0,
  threads_running: 5,
  queue_pending: 0,
  queue_finished: 0,
  download_speed: 0
}

function tokenFrom (params) {
  const first = Array.isArray(params) && Array.isArray(params[0]) ? params[0] : []
  return first[0] && String(first[0]).startsWith('token:') ? String(first[0]) : null
}

function argsFrom (params) {
  const first = Array.isArray(params) && Array.isArray(params[0]) ? params[0] : []
  return first[0] ? first.slice(1) : first
}

function listTasks (level) {
  if (!level) return tasks
  const negate = String(level).startsWith('!')
  const wantFinished = String(level).replace(/^!/, '') === 'finished'
  return tasks.filter((task) => {
    const match = (task.state === 20) === wantFinished
    return negate ? !match : match
  })
}

const methods = {
  getInfo () {
    const running = tasks.filter((task) => task.state === 10).length
    const pending = tasks.length - tasks.filter((task) => task.state === 20).length
    info.threads_running = Math.min(running, 5)
    info.queue_pending = pending
    info.queue_finished = tasks.filter((task) => task.state === 20).length
    info.download_speed = running > 0 ? 1_200_000 + running * 90_000 : 0
    return info
  },
  getConfig () {
    return { ...config }
  },
  updateConfig (args, kwargs) {
    Object.assign(config, kwargs || {})
    return { ...config }
  },
  listTasks (args) {
    return listTasks(args[0])
  },
  addTask (args) {
    const url = args[0]
    const guid = `${options.prefix}${String(tasks.length + 1).padStart(6, '0')}`
    tasks.push({
      guid,
      url,
      state: 1,
      failcode: 0,
      meta: {
        title: `Added ${guid}`,
        gnname: '', gjname: '', tags: ['added'], total: 20, finished: 0
      }
    })
    return guid
  },
  resumeTask (args) {
    const task = tasks.find((item) => item.guid === args[0])
    if (task && task.state !== 20) task.state = 10
    return args[0]
  },
  pauseTask (args) {
    const task = tasks.find((item) => item.guid === args[0])
    if (task && task.state !== 20) task.state = 0
    return args[0]
  },
  delTask (args) {
    const index = tasks.findIndex((item) => item.guid === args[0])
    if (index >= 0) tasks.splice(index, 1)
    return args[0]
  },
  getImage (args) {
    const guid = args[0]
    const task = tasks.find((item) => item.guid === guid)
    const total = (task && task.meta.total) || 20
    const sign = 'mock-sign'
    const images = []
    for (let page = 1; page <= total; page += 1) {
      images.push(`/img/${sign}/${guid}/${page}.png`)
    }
    return images
  }
}

function rpcResponse (id, method, params) {
  const name = String(method || '').replace(/^xeH\./, '')
  const handler = methods[name]
  if (!handler) {
    return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method ${method} not found` } }
  }
  const args = argsFrom(params)
  const kwargs = (Array.isArray(params) && params[1]) || {}
  try {
    const result = handler(args, kwargs)
    return { jsonrpc: '2.0', id, result }
  } catch (error) {
    return { jsonrpc: '2.0', id, error: { code: -32603, message: String(error) } }
  }
}

function send (res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type || 'application/json-rpc',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  })
  res.end(body)
}

async function serveStatic (req, res, url) {
  if (!options.staticDir) {
    send(res, 404, 'static serving disabled; pass --static <dir>')
    return
  }
  const relative = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '')
  const target = path.join(options.staticDir, relative)
  if (!target.startsWith(options.staticDir)) {
    send(res, 403, 'forbidden')
    return
  }
  let stats = null
  try {
    stats = await stat(target)
  } catch {
    // SPA fallback: unknown paths are served the app shell.
    if (!path.extname(url.pathname)) {
      const index = path.join(options.staticDir, 'index.html')
      res.writeHead(200, { 'Content-Type': MIME['.html'] })
      createReadStream(index).pipe(res)
      return
    }
    send(res, 404, 'not found')
    return
  }
  if (stats.isDirectory()) {
    send(res, 404, 'not found')
    return
  }
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(target)] || 'application/octet-stream',
    'Content-Length': stats.size,
    'Cache-Control': 'no-store'
  })
  createReadStream(target).pipe(res)
}

let step = 0
if (options.churnMs > 0) {
  setInterval(() => {
    step += 1
    advance(tasks, step)
  }, options.churnMs).unref()
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

  if (req.method === 'OPTIONS') {
    send(res, 204, '')
    return
  }

  if (options.latencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, options.latencyMs))
  }

  if (url.pathname === '/jsonrpc' && req.method === 'POST') {
    let body = ''
    for await (const chunk of req) body += chunk
    let payload
    try {
      payload = JSON.parse(body)
    } catch {
      send(res, 400, JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }))
      return
    }
    if (!tokenFrom(payload.params)) {
      send(res, 200, JSON.stringify({ jsonrpc: '2.0', id: payload.id, error: { code: 403, message: 'Forbidden' } }))
      return
    }
    send(res, 200, JSON.stringify(rpcResponse(payload.id, payload.method, payload.params)))
    return
  }

  if (url.pathname.startsWith('/img/')) {
    const tile = url.searchParams.get('w') ? PNG_TILE : PNG_1X1
    res.writeHead(200, { 'Content-Type': MIME['.png'], 'Cache-Control': 'no-store' })
    res.end(tile)
    return
  }

  if (url.pathname.startsWith('/zip/')) {
    // A minimal store-only zip stream is unnecessary for UI work; a small
    // placeholder keeps downloads testable without pulling in a dependency.
    send(res, 200, 'mock archive', 'application/zip')
    return
  }

  if (url.pathname === '/mock/fixtures') {
    send(res, 200, JSON.stringify({ tasks, config, info }))
    return
  }

  await serveStatic(req, res, url)
})

server.listen(options.port, () => {
  console.log(`mock: http://localhost:${options.port} tasks=${tasks.length} static=${options.staticDir || 'off'} churnMs=${options.churnMs}`)
})
