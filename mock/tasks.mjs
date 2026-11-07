// Deterministic task fixtures shared by the mock server and the perf harness.
//
// The shape mirrors what xeHentai's `xeH.listTasks` returns: `guid`, `url`,
// `state`, `meta` with the title/tag/book counters the WebUI renders.
// Everything is generated from a seed so a 300-task run is byte-identical
// between the "before" and "after" builds.

const STATES = {
  PAUSED: 0,
  WAITING: 1,
  DOWNLOAD: 10,
  FINISHED: 20,
  FAILED: -1
}

const TAGS = [
  'language:chinese', 'language:english', 'language:japanese',
  'artist:alpha', 'artist:beta', 'artist:gamma', 'artist:delta',
  'group:one', 'group:two', 'group:three',
  'male', 'female', 'mixed', 'full-color', 'tankoubon',
  'webtoon', 'doujinshi', 'manga', 'artbook', 'cosplay'
]

const GENRES = [
  'Action', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural'
]

function mulberry32 (seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick (rand, list) {
  return list[Math.floor(rand() * list.length)]
}

function stateFor (index, total) {
  const ratio = index / Math.max(1, total)
  if (ratio < 0.45) return STATES.FINISHED
  if (ratio < 0.7) return STATES.DOWNLOAD
  if (ratio < 0.85) return STATES.WAITING
  if (ratio < 0.95) return STATES.PAUSED
  return STATES.FAILED
}

export function buildTasks (count, seed = 20261106, prefix = 'mock') {
  const rand = mulberry32(seed)
  const tasks = []
  for (let i = 0; i < count; i += 1) {
    const total = 18 + Math.floor(rand() * 42)
    const state = stateFor(i, count)
    const finished = state === STATES.FINISHED
      ? total
      : Math.floor(total * (0.1 + rand() * 0.7))
    const tags = []
    const tagCount = 2 + Math.floor(rand() * 3)
    while (tags.length < tagCount) {
      const tag = pick(rand, TAGS)
      if (!tags.includes(tag)) tags.push(tag)
    }
    const title = `Mock Gallery ${String(i + 1).padStart(3, '0')}`
    tasks.push({
      guid: `${prefix}${String(i + 1).padStart(6, '0')}`,
      url: `https://e-hentai.org/g/${100000 + i}/${prefix}${i}/`,
      state,
      failcode: state === STATES.FAILED ? 1021 : 0,
      meta: {
        title,
        gnname: `${title} / ${GENRES[i % GENRES.length]} Collection`,
        gjname: `${title} / 日本語コレクション`,
        tags,
        total,
        finished
      }
    })
  }
  return tasks
}

// Progress the "before"/"after" fixtures identically so both builds receive
// the same update stream from the polling refresher. Task states stay put so
// a screenshot taken at any time renders the same row set.
export function advance (tasks, step) {
  for (const task of tasks) {
    if (task.state !== STATES.DOWNLOAD) continue
    const next = task.meta.finished + 1
    task.meta.finished = next >= task.meta.total ? task.meta.total - 1 : next
  }
  return tasks
}

export { STATES }
