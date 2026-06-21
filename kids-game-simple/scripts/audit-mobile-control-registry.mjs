/**
 * G7 代码层：gameRegistry 可见游戏须在 gameControlRegistry 登记 preset；
 * 验收清单所列游戏应已引用 platform 绑定 API（静态扫描）。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const REGISTRY = path.join(ROOT, 'src/games/gameRegistry.ts')
const GAME_CONTROL = path.join(ROOT, 'src/platform/mobileControls/gameControlRegistry.ts')
const ACCEPTANCE = path.join(ROOT, 'docs/MOBILE_ACCEPTANCE_CHECKLIST.md')
const GAMES_DIR = path.join(ROOT, 'src/games')

const PLATFORM_BIND_RE =
  /bindGameCanvasControls|bindMobileControlPreset|bindGame3dCanvasControls|bindHorizontalSwipePan|bindCanvasDragFollowAndLaneTap|bindCanvasTapDragSwap/

/** 验收表 §三 中列出的 id（与文档同步） */
const ACCEPTANCE_GAME_IDS = [
  'eliminate', 'tetris', 'jewelMatch', 'bubbleShooter', 'sort', 'memoryMatch', 'colorTap',
  'whackMole', 'pop', 'fruitSlice', 'cookieCut', 'dodge', 'neonRun', 'slimeJump', 'superMario',
  'snake', 'racingRun', 'starCatcher', 'bouncePath', 'stack', 'spaceShooter', 'towerDefense',
  'plantsVsZombies', 'rpgShooter', 'dragonShooter', 'beatDragon', 'kingBaby', 'rpgShooterTD',
  'contraRpg', 'wangzheRpg', 'happyDefense', 'plantZombieDefense', 'plantZombieDefense2d',
  'cloudBallRush3d', 'voxelRealm', 'skyFrenzy', 'cuteTankBattle', 'dnfRpg',
]

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

function extractVisibleIds(ts) {
  const re = /id:\s*'([^']+)'[\s\S]*?visible:\s*true/g
  const ids = []
  let m
  while ((m = re.exec(ts))) ids.push(m[1])
  return [...new Set(ids)]
}

function extractPresetMap(ts) {
  const start = ts.indexOf('const GAME_CONTROL_PRESETS')
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
  for (const line of body.split('\n')) {
    const m = line.match(/^\s*([a-zA-Z][a-zA-Z0-9_]*):\s*'([^']+)'/)
    if (m) map[m[1]] = m[2]
  }
  return map
}

/** gameId → 源码目录名（与 gameRegistry import 路径一致） */
const GAME_FOLDER_ALIASES = {
  spaceShooter: 'spaceshooter',
  sort: 'colorSort',
  stack: 'stack-game',
  rpgShooterTD: 'rpgShooterTowerDefense',
}

function gameFolderHasPlatformBind(gameId) {
  const folder = GAME_FOLDER_ALIASES[gameId] ?? gameId
  const dir = path.join(GAMES_DIR, folder)
  if (!fs.existsSync(dir)) return { ok: false, reason: `no folder ${folder}` }
  const files = []
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name)
      if (ent.isDirectory()) walk(p)
      else if (/\.(ts|vue)$/.test(ent.name)) files.push(p)
    }
  }
  walk(dir)
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8')
    if (PLATFORM_BIND_RE.test(text)) return { ok: true, file: path.relative(ROOT, f) }
  }
  return { ok: false, reason: 'no platform bind in tree' }
}

const registryTs = fs.readFileSync(REGISTRY, 'utf8')
const controlTs = fs.readFileSync(GAME_CONTROL, 'utf8')
const presets = extractPresetMap(controlTs)
const registryIds = new Set(extractRegistryGameIds(registryTs))
const visibleIds = extractVisibleIds(registryTs).filter((id) => registryIds.has(id))

let failed = false
const lines = []

const missingPreset = visibleIds.filter((id) => !presets[id])
if (missingPreset.length) {
  failed = true
  lines.push(`[FAIL] GAME_DISPLAY visible 但未在 GAME_CONTROL_PRESETS 登记: ${missingPreset.join(', ')}`)
} else {
  lines.push(`[OK] ${visibleIds.length} 个可见游戏均已登记 preset（显式键，不含仅 default tap）`)
}

const noBind = []
for (const id of ACCEPTANCE_GAME_IDS) {
  const r = gameFolderHasPlatformBind(id)
  if (!r.ok) noBind.push(`${id} (${r.reason})`)
}
if (noBind.length) {
  failed = true
  lines.push(`[FAIL] 验收表游戏未扫描到 platform 绑定:`)
  noBind.forEach((x) => lines.push(`       - ${x}`))
} else {
  lines.push(`[OK] 验收表 ${ACCEPTANCE_GAME_IDS.length} 款均含 platform 绑定引用`)
}

if (fs.existsSync(ACCEPTANCE)) {
  const acc = fs.readFileSync(ACCEPTANCE, 'utf8')
  const tableIds = [...acc.matchAll(/\|\s*\d+\s*\|\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\|/g)].map((m) => m[1])
  const uniqueTable = [...new Set(tableIds)]
  const notInAcceptanceList = ACCEPTANCE_GAME_IDS.filter((id) => !uniqueTable.includes(id))
  if (notInAcceptanceList.length) {
    lines.push(`[WARN] 脚本 ACCEPTANCE_GAME_IDS 与文档表不一致（缺于文档）: ${notInAcceptanceList.join(', ')}`)
  }
}

console.log('audit-mobile-control-registry (G7 code layer)\n')
lines.forEach((l) => console.log(l))
if (failed) {
  console.error('\naudit failed')
  process.exit(1)
}
console.log('\naudit passed')