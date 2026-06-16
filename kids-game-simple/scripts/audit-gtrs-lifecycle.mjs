/**
 * 检查：FRAMEWORK 游戏是否有 public/themes/{id}/gtrs.json；
 * GTRS_CANVAS_ADAPTED 列表是否与主题文件一致。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const THEMES = path.join(ROOT, 'public/themes')
const REGISTRY = path.join(ROOT, 'src/games/gameRegistry.ts')
const REGISTER_GTRS = path.join(ROOT, 'src/games/registerGtrsCanvasGames.ts')

function extractStringArray(ts, exportName) {
  const re = new RegExp(`export const ${exportName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`)
  const m = ts.match(re)
  if (!m) return []
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
}

const registryTs = fs.readFileSync(REGISTRY, 'utf8')
const registerTs = fs.readFileSync(REGISTER_GTRS, 'utf8')
const frameworkIds = extractStringArray(registryTs, 'FRAMEWORK_LIFECYCLE_GAME_IDS')
const adaptedIds = extractStringArray(registerTs, 'GTRS_CANVAS_ADAPTED_GAME_IDS')

const missingGtrsFramework = frameworkIds.filter((id) => !fs.existsSync(path.join(THEMES, id, 'gtrs.json')))
const missingGtrsAdapted = adaptedIds.filter((id) => !fs.existsSync(path.join(THEMES, id, 'gtrs.json')))
const extraThemeDirs = fs
  .readdirSync(THEMES, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((id) => !adaptedIds.includes(id) && fs.existsSync(path.join(THEMES, id, 'gtrs.json')))

console.log('Framework lifecycle games:', frameworkIds.length)
console.log('GTRS adapted (registered):', adaptedIds.length)
console.log('')
if (missingGtrsFramework.length) {
  console.log('Missing public/themes/{id}/gtrs.json (framework):')
  missingGtrsFramework.forEach((id) => console.log('  -', id))
} else {
  console.log('OK: every framework game has gtrs.json')
}
console.log('')
if (missingGtrsAdapted.length) {
  console.log('Missing gtrs.json (GTRS_CANVAS_ADAPTED list):')
  missingGtrsAdapted.forEach((id) => console.log('  -', id))
}
if (extraThemeDirs.length) {
  console.log('')
  console.log('Theme folders not in GTRS_CANVAS_ADAPTED (optional):', extraThemeDirs.join(', '))
}
process.exitCode = missingGtrsFramework.length || missingGtrsAdapted.length ? 1 : 0