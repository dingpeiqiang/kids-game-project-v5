/**
 * 删除 src/games 根目录下已迁入子目录的重复 *.ts / *.lifecycle.ts
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GAMES = path.join(__dirname, '../src/games')

const KEEP_ROOT = new Set([
  'gameRegistry.ts',
  'gameLayout.ts',
  'embeddedCanvasGames.ts',
  'gameThemeBridge.ts',
  'registerGtrsCanvasGames.ts',
  'index.ts',
])

function hasMigratedGameDir(gameId) {
  const dir = path.join(GAMES, gameId)
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return false
  return (
    fs.existsSync(path.join(dir, 'index.ts')) ||
    fs.existsSync(path.join(dir, 'game.ts'))
  )
}

function main() {
  const removed = []
  const skipped = []

  for (const f of fs.readdirSync(GAMES)) {
    if (!f.endsWith('.ts') || KEEP_ROOT.has(f)) continue

    const rootPath = path.join(GAMES, f)
    if (!fs.statSync(rootPath).isFile()) continue

    let gameId
    if (f.endsWith('.lifecycle.ts')) {
      gameId = f.slice(0, -'.lifecycle.ts'.length)
      const inDir = path.join(GAMES, gameId, f)
      if (!fs.existsSync(inDir)) {
        skipped.push(`${f}: no ${gameId}/${f}`)
        continue
      }
      if (!hasMigratedGameDir(gameId)) {
        skipped.push(`${f}: ${gameId}/ not migrated`)
        continue
      }
      fs.unlinkSync(rootPath)
      removed.push(f)
      continue
    }

    gameId = f.slice(0, -3)
    if (!hasMigratedGameDir(gameId)) continue

    // 子目录已接管：根目录同名 ts 为旧单体或薄 re-export
    fs.unlinkSync(rootPath)
    removed.push(f)
  }

  console.log('Removed:\n' + (removed.length ? removed.map((r) => '  ' + r).join('\n') : '  (none)'))
  if (skipped.length) console.log('Skipped:\n' + skipped.map((s) => '  ' + s).join('\n'))
  console.log(`\nTotal removed: ${removed.length}`)
}

main()