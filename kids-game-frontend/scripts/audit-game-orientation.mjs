/**
 * CI：gameOrientation 目录、gameLayout.orientation、验收表「方向」列一致
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const CORE_GAMES = path.join(ROOT, 'src', 'games')
const ORIENTATION = path.join(CORE_GAMES, 'gameOrientation.ts')
const LAYOUT = path.join(CORE_GAMES, 'gameLayout.ts')
const REGISTRY = path.join(CORE_GAMES, 'gameRegistry.ts')
const ACCEPTANCE = path.join(ROOT, 'docs/MOBILE_ACCEPTANCE_CHECKLIST.md')

/** 与 audit-mobile-control-registry ACCEPTANCE_GAME_IDS 同步 */
const ACCEPTANCE_GAME_IDS = [
  'eliminate', 'tetris', 'jewelMatch', 'bubbleShooter', 'sort', 'memoryMatch', 'colorTap',
  'whackMole', 'pop', 'fruitSlice', 'cookieCut', 'dodge', 'neonRun', 'slimeJump', 'superMario',
  'snake', 'racingRun', 'starCatcher', 'bouncePath', 'stack', 'spaceShooter', 'towerDefense',
  'plantsVsZombies', 'rpgShooter', 'dragonShooter', 'beatDragon', 'kingBaby', 'rpgShooterTD',
  'contraRpg', 'wangzheRpg', 'happyDefense', 'plantZombieDefense', 'plantZombieDefense2d',
  'cloudBallRush3d', 'voxelRealm', 'skyFrenzy', 'cuteTankBattle', 'dnfRpg',
]

function extractVisibleIds(ts) {
  const re = /id:\s*'([^']+)'[\s\S]*?visible:\s*true/g
  const ids = []
  let m
  while ((m = re.exec(ts))) ids.push(m[1])
  return [...new Set(ids)]
}

function extractOrientationCatalog(ts) {
  const start = ts.indexOf('export const GAME_ORIENTATION_CATALOG')
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
  const map = {}
  const blockRe = /([a-zA-Z][a-zA-Z0-9_]*):\s*\{[^}]*orientation:\s*'(portrait|landscape)'/g
  let m
  while ((m = blockRe.exec(body))) {
    map[m[1]] = m[2]
  }
  return map
}

function extractLayoutOverridesOrientation(ts) {
  const start = ts.indexOf('const LAYOUT_OVERRIDES')
  if (start < 0) return {}
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
  const map = {}
  const idRe = /^\s{2}([a-zA-Z][a-zA-Z0-9_]*):\s*\{/gm
  const ids = []
  let m
  while ((m = idRe.exec(body))) ids.push({ id: m[1], index: m.index })

  for (let i = 0; i < ids.length; i++) {
    const chunkStart = ids[i].index
    const chunkEnd = i + 1 < ids.length ? ids[i + 1].index : body.length
    const chunk = body.slice(chunkStart, chunkEnd)
    const om = chunk.match(/orientation:\s*'(portrait|landscape)'/)
    if (om) map[ids[i].id] = om[1]
  }
  return map
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

function extractAcceptanceTableRows(md) {
  const rows = []
  const re = /^\|\s*\d+\s*\|\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\|[^|]*\|\s*([^|]+?)\s*\|/gm
  let m
  while ((m = re.exec(md))) {
    const directionCell = m[2].trim()
    rows.push({ id: m[1], directionLabel: directionCell })
  }
  return rows
}

function expectedAcceptanceLabel(catalogOrient, gameId) {
  if (catalogOrient === 'landscape') {
    const threeD = [
      'happyDefense',
      'plantZombieDefense',
      'cloudBallRush3d',
      'voxelRealm',
      'skyFrenzy',
      'skyRush3d',
    ]
    if (threeD.includes(gameId)) return '3D横'
    return '横'
  }
  return '竖'
}

const orientTs = fs.readFileSync(ORIENTATION, 'utf8')
const layoutTs = fs.readFileSync(LAYOUT, 'utf8')
const registryTs = fs.readFileSync(REGISTRY, 'utf8')
const catalog = extractOrientationCatalog(orientTs)
const layoutOrient = extractLayoutOverridesOrientation(layoutTs)
const registryIds = extractRegistryGameIds(registryTs)

let failed = false
const lines = []

const missingCatalog = registryIds.filter((id) => !catalog[id])
if (missingCatalog.length) {
  failed = true
  lines.push(`[FAIL] GAME_REGISTRY 有 id 但 GAME_ORIENTATION_CATALOG 缺失: ${missingCatalog.join(', ')}`)
} else {
  lines.push(`[OK] ${registryIds.length} 个注册游戏均在方向目录中`)
}

const layoutMismatch = []
for (const [id, lo] of Object.entries(layoutOrient)) {
  const co = catalog[id]
  if (!co) continue
  if (lo !== co) layoutMismatch.push(`${id} layout=${lo} catalog=${co}`)
}
if (layoutMismatch.length) {
  failed = true
  lines.push(`[FAIL] LAYOUT_OVERRIDES.orientation 与目录不一致:`)
  layoutMismatch.forEach((x) => lines.push(`       - ${x}`))
} else {
  lines.push(`[OK] LAYOUT_OVERRIDES 中显式 orientation 与目录一致`)
}

if (fs.existsSync(ACCEPTANCE)) {
  const acc = fs.readFileSync(ACCEPTANCE, 'utf8')
  const table = extractAcceptanceTableRows(acc)
  const accMismatch = []
  for (const row of table) {
    const co = catalog[row.id]
    if (!co) {
      accMismatch.push(`${row.id}: 不在方向目录（验收表有行）`)
      continue
    }
    const expected = expectedAcceptanceLabel(co, row.id)
    if (row.directionLabel !== expected) {
      accMismatch.push(
        `${row.id}: 文档「${row.directionLabel}」应为「${expected}」（catalog=${co}）`,
      )
    }
  }
  if (accMismatch.length) {
    failed = true
    lines.push(`[FAIL] MOBILE_ACCEPTANCE_CHECKLIST 方向列与目录不一致:`)
    accMismatch.forEach((x) => lines.push(`       - ${x}`))
  } else {
    lines.push(`[OK] 验收表 ${table.length} 款方向列与 gameOrientation 一致`)
  }
} else {
  lines.push(`[WARN] 未找到 ${path.relative(ROOT, ACCEPTANCE)}`)
}

if (fs.existsSync(ACCEPTANCE)) {
  const acc = fs.readFileSync(ACCEPTANCE, 'utf8')
  const tableIds = [...acc.matchAll(/\|\s*\d+\s*\|\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\|/g)].map((m) => m[1])
  const uniqueTable = [...new Set(tableIds)]
  const scriptSet = new Set(ACCEPTANCE_GAME_IDS)
  const inScriptNotDoc = ACCEPTANCE_GAME_IDS.filter((id) => !uniqueTable.includes(id))
  const inDocNotScript = uniqueTable.filter((id) => !scriptSet.has(id))
  if (inScriptNotDoc.length) {
    failed = true
    lines.push(`[FAIL] ACCEPTANCE_GAME_IDS 有 id 但验收表 §三 无行: ${inScriptNotDoc.join(', ')}`)
  }
  if (inDocNotScript.length) {
    failed = true
    lines.push(`[FAIL] 验收表 §三 有 id 但 ACCEPTANCE_GAME_IDS 未收录: ${inDocNotScript.join(', ')}`)
  }
  if (!inScriptNotDoc.length && !inDocNotScript.length) {
    lines.push(`[OK] 验收表 §三 与 ACCEPTANCE_GAME_IDS 双向一致（${ACCEPTANCE_GAME_IDS.length} 款）`)
  }
}

const visibleIds = extractVisibleIds(registryTs).filter((id) => registryIds.includes(id))
const notInAcceptance = visibleIds.filter((id) => !ACCEPTANCE_GAME_IDS.includes(id))
if (notInAcceptance.length) {
  lines.push(
    `[WARN] GAME_DISPLAY visible 但未列入验收清单（${notInAcceptance.length}）: ${notInAcceptance.join(', ')}`,
  )
} else {
  lines.push(`[OK] 全部 ${visibleIds.length} 个可见游戏均在 ACCEPTANCE_GAME_IDS 中`)
}

console.log('audit-game-orientation\n')
lines.forEach((l) => console.log(l))
if (failed) {
  console.error('\naudit failed')
  process.exit(1)
}
console.log('\naudit passed')