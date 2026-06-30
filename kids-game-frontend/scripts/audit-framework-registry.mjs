/**
 * CI：FRAMEWORK_LIFECYCLE_GAME_IDS、frameworkLifecycle、destroy 与 GTRS 列表一致性
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const CORE_GAMES = path.join(ROOT, 'src', 'games')
const REGISTRY = path.join(CORE_GAMES, 'gameRegistry.ts')
const REGISTER_GTRS = path.join(CORE_GAMES, 'registerGtrsCanvasGames.ts')
const THEMES = path.join(ROOT, 'public/themes')

/** 与 gtrsThemeLoader LOCAL_THEME_FOLDER_ALIASES 保持一致 */
const THEME_FOLDER_ALIASES = {
  spaceShooter: ['spaceshooter'],
}

function hasThemeGtrs(gameId) {
  if (fs.existsSync(path.join(THEMES, gameId, 'gtrs.json'))) return true
  for (const alt of THEME_FOLDER_ALIASES[gameId] ?? []) {
    if (fs.existsSync(path.join(THEMES, alt, 'gtrs.json'))) return true
  }
  return false
}

function extractStringArray(ts, exportName) {
  const re = new RegExp(`export const ${exportName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`)
  const m = ts.match(re)
  if (!m) return []
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
}

function extractRegistryGameIds(ts) {
  const start = ts.indexOf('export const GAME_REGISTRY')
  const open = ts.indexOf('{', start)
  let depth = 0
  let end = -1
  for (let i = open; i < ts.length; i++) {
    if (ts[i] === '{') depth++
    else if (ts[i] === '}') {
      depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  const body = ts.slice(open + 1, end)
  const ids = []
  const re = /^\s{2}([a-zA-Z][a-zA-Z0-9_]*):\s*\{/gm
  let m
  while ((m = re.exec(body))) ids.push(m[1])
  return ids
}

function getRegistryEntryChunk(ts, id) {
  const marker = `\n  ${id}: {`
  const start = ts.indexOf(marker)
  if (start < 0) return ''
  const sub = ts.slice(start)
  const next = sub.slice(marker.length).search(/\n  [a-zA-Z][a-zA-Z0-9_]*: \{/)
  const sliceEnd = next >= 0 ? marker.length + next : sub.length
  return sub.slice(0, sliceEnd)
}

const registryTs = fs.readFileSync(REGISTRY, 'utf8')
const registerTs = fs.readFileSync(REGISTER_GTRS, 'utf8')

const listIds = extractStringArray(registryTs, 'FRAMEWORK_LIFECYCLE_GAME_IDS').sort()
const registryGameIds = extractRegistryGameIds(registryTs)
const frameworkInRegistry = registryGameIds
  .filter((id) => /frameworkLifecycle:\s*true/.test(getRegistryEntryChunk(registryTs, id)))
  .sort()

const adaptedIds = extractStringArray(registerTs, 'GTRS_CANVAS_ADAPTED_GAME_IDS').sort()

let failed = false
const report = (label, items) => {
  if (items.length) {
    failed = true
    console.error(`${label}:`)
    items.forEach((x) => console.error('  -', x))
  }
}

report(
  'In registry (frameworkLifecycle) but missing from FRAMEWORK_LIFECYCLE_GAME_IDS',
  frameworkInRegistry.filter((id) => !listIds.includes(id)),
)
report(
  'In FRAMEWORK_LIFECYCLE_GAME_IDS but registry missing frameworkLifecycle',
  listIds.filter((id) => !frameworkInRegistry.includes(id)),
)

const noDestroy = frameworkInRegistry.filter((id) => !/destroy\s*:/.test(getRegistryEntryChunk(registryTs, id)))
report('frameworkLifecycle games without destroy()', noDestroy)

report(
  'Framework games not in GTRS_CANVAS_ADAPTED_GAME_IDS',
  listIds.filter((id) => !adaptedIds.includes(id)),
)

report(
  'Framework games missing public/themes/{id}/gtrs.json',
  listIds.filter((id) => !hasThemeGtrs(id)),
)

if (!failed) {
  console.log(`OK: ${listIds.length} framework games — lifecycle, destroy, GTRS aligned.`)
}

process.exitCode = failed ? 1 : 0