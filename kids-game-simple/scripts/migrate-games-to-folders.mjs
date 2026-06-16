/**
 * 将 src/games 根目录下的单文件游戏迁入同名子目录。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GAMES = path.join(__dirname, '../src/games')

const SKIP_ROOT = new Set([
  'gameRegistry',
  'gameLayout',
  'embeddedCanvasGames',
  'gameThemeBridge',
  'registerGtrsCanvasGames',
  'index',
])

function bumpImportsToParent(content) {
  return content
    .replace(/from '\.\.\/([^']+)'/g, "from '../../$1'")
    .replace(/from "\.\.\/([^"]+)"/g, 'from "../../$1"')
}

function listRootGameTs() {
  return fs.readdirSync(GAMES).filter((f) => {
    if (!f.endsWith('.ts')) return false
    const base = f.slice(0, -3)
    if (SKIP_ROOT.has(base)) return false
    if (base.endsWith('.lifecycle')) return false
    return fs.statSync(path.join(GAMES, f)).isFile()
  })
}

function isThinShim(content) {
  return (
    content.length < 1500 &&
    /export function destroy/.test(content) &&
    /createLifecycleContext/.test(content) &&
    !/function start\w+Lifecycle\s*\(/.test(content)
  )
}

function moveLifecycle(gameId, dir) {
  const lifecycleRoot = path.join(GAMES, `${gameId}.lifecycle.ts`)
  if (!fs.existsSync(lifecycleRoot)) return
  const lcDest = path.join(dir, `${gameId}.lifecycle.ts`)
  if (fs.existsSync(lcDest)) {
    fs.unlinkSync(lifecycleRoot)
    return
  }
  let lc = bumpImportsToParent(fs.readFileSync(lifecycleRoot, 'utf8'))
  lc = lc.replace(new RegExp(`from '\\./${gameId}/game'`, 'g'), "from './game'")
  lc = lc.replace(new RegExp(`from '\\./${gameId}'`, 'g'), "from './index'")
  lc = lc.replace(new RegExp(`from '\\./${gameId}\\.ts'`, 'g'), "from './index'")
  fs.writeFileSync(lcDest, lc)
  fs.unlinkSync(lifecycleRoot)
}

/** 根目录仅有 *.lifecycle.ts、子目录已存在 */
function migrateOrphanLifecycles() {
  const results = []
  for (const f of fs.readdirSync(GAMES)) {
    if (!f.endsWith('.lifecycle.ts')) continue
    const gameId = f.slice(0, -'.lifecycle.ts'.length)
    const dir = path.join(GAMES, gameId)
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      results.push({ gameId, status: 'lifecycle-no-dir' })
      continue
    }
    moveLifecycle(gameId, dir)
    results.push({ gameId, status: 'lifecycle->folder' })
  }
  return results
}

/** 根目录薄 re-export（如 export from './x.lifecycle'） */
function migrateRootShims() {
  const results = []
  for (const f of listRootGameTs()) {
    const gameId = f.slice(0, -3)
    const dir = path.join(GAMES, gameId)
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue
    const rootFile = path.join(GAMES, f)
    const content = fs.readFileSync(rootFile, 'utf8')
    if (content.length > 800) continue
  const lcName = `${gameId}.lifecycle`
    const indexPath = path.join(dir, 'index.ts')
    let indexBody = content
      .replace(new RegExp(`from '\\./${gameId}\\.lifecycle'`, 'g'), `from './${lcName}'`)
      .replace(new RegExp(`from '\\./${gameId}/game'`, 'g'), "from './game'")
      .replace(new RegExp(`from '\\./${gameId}'`, 'g'), "from './game'")
    if (fs.existsSync(indexPath)) {
      const ex = fs.readFileSync(indexPath, 'utf8').trim()
      if (ex && !ex.includes('lifecycle') && /from '\.\/game'/.test(ex)) {
        indexBody = `${indexBody.trim()}\n${ex}\n`
      }
    }
    fs.writeFileSync(indexPath, indexBody.endsWith('\n') ? indexBody : `${indexBody}\n`)
    fs.unlinkSync(rootFile)
    moveLifecycle(gameId, dir)
    results.push({ gameId, status: 'root-shim->index' })
  }
  return results
}

/** 子目录 index 误指向 game 的 init/destroy 时，改指向 lifecycle */
function fixIndexExportFromLifecycle() {
  const results = []
  for (const ent of fs.readdirSync(GAMES, { withFileTypes: true })) {
    if (!ent.isDirectory() || SKIP_ROOT.has(ent.name)) continue
    const gameId = ent.name
    const lcInDir = path.join(GAMES, gameId, `${gameId}.lifecycle.ts`)
    const indexPath = path.join(GAMES, gameId, 'index.ts')
    if (!fs.existsSync(lcInDir) || !fs.existsSync(indexPath)) continue
    const idx = fs.readFileSync(indexPath, 'utf8')
    if (idx.includes('.lifecycle')) continue
    const lc = fs.readFileSync(lcInDir, 'utf8')
    const initM = lc.match(/export async function (init\w+)/)
    const destroyM = lc.match(/export function (destroy\w+)/)
    if (!initM || !destroyM) continue
    if (!new RegExp(`from '\\./game'`).test(idx)) continue
    const lines = []
    if (/start\w+Lifecycle/.test(idx)) {
      const startM = idx.match(/export \{[^}]*?(start\w+Lifecycle)[^}]*\} from '\.\/game'/m)
      if (startM) lines.push(`export { ${startM[1]} } from './game'`)
    }
    lines.push(`export { ${destroyM[1]}, ${initM[1]} } from './${gameId}.lifecycle'`)
    fs.writeFileSync(indexPath, `${lines.join('\n')}\n`)
    results.push({ gameId, status: 'index->lifecycle' })
  }
  return results
}

function migrate(gameId) {
  const rootFile = path.join(GAMES, `${gameId}.ts`)
  if (!fs.existsSync(rootFile)) return { gameId, status: 'no-root' }

  const rootContent = fs.readFileSync(rootFile, 'utf8')
  const dir = path.join(GAMES, gameId)
  const hasDir = fs.existsSync(dir) && fs.statSync(dir).isDirectory()
  const thin = isThinShim(rootContent)

  if (hasDir) {
    const indexPath = path.join(dir, 'index.ts')
    if (thin) {
      const indexContent = bumpImportsToParent(rootContent)
      const existing = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : ''
      if (existing.length > 500 && /export function init/.test(existing)) {
        const legacyPath = path.join(dir, '_legacy_monolithic.ts')
        if (!fs.existsSync(legacyPath)) {
          fs.writeFileSync(legacyPath, existing)
        }
      }
      fs.writeFileSync(indexPath, indexContent)
      moveLifecycle(gameId, dir)
      fs.unlinkSync(rootFile)
      return { gameId, status: 'shim->index', legacy: existing.length > 500 }
    }

    const gamePath = path.join(dir, 'game.ts')
    if (!fs.existsSync(gamePath)) {
      fs.writeFileSync(gamePath, bumpImportsToParent(rootContent))
      const destroyMatch = rootContent.match(/export function (destroy\w+)/)
      const initMatch = rootContent.match(/export (?:async )?function (init\w+)/)
      if (destroyMatch && initMatch) {
        const indexBody = `export { ${destroyMatch[1]}, ${initMatch[1]} } from './game'\n`
        if (fs.existsSync(indexPath)) {
          const ex = fs.readFileSync(indexPath, 'utf8')
          if (ex.length > 300) fs.writeFileSync(path.join(dir, '_legacy_index.ts.bak'), ex)
        }
        fs.writeFileSync(indexPath, indexBody)
      }
      moveLifecycle(gameId, dir)
      fs.unlinkSync(rootFile)
      return { gameId, status: 'root->game.ts' }
    }
    return { gameId, status: 'skip-dir-has-game' }
  }

  fs.mkdirSync(dir, { recursive: true })
  const gamePath = path.join(dir, 'game.ts')
  fs.writeFileSync(gamePath, bumpImportsToParent(rootContent))
  const destroyMatch = rootContent.match(/export function (destroy\w+)/)
  const initMatch = rootContent.match(/export (?:async )?function (init\w+)/)
  if (destroyMatch && initMatch) {
    fs.writeFileSync(
      path.join(dir, 'index.ts'),
      `export { ${destroyMatch[1]}, ${initMatch[1]} } from './game'\n`,
    )
  } else {
    fs.writeFileSync(path.join(dir, 'index.ts'), `export * from './game'\n`)
  }
  moveLifecycle(gameId, dir)
  fs.unlinkSync(rootFile)
  return { gameId, status: 'new-dir' }
}

const phase1 = listRootGameTs().map((f) => migrate(f.slice(0, -3)))
const phase2 = migrateOrphanLifecycles()
const phase3 = migrateRootShims()
const phase4 = fixIndexExportFromLifecycle()
const results = [...phase1, ...phase2, ...phase3, ...phase4]
console.log(
  results
    .map((r) => `${r.gameId}: ${r.status}${r.legacy ? ' (legacy saved)' : ''}`)
    .join('\n') || '(no changes)',
)