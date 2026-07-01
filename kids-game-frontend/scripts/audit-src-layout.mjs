/**
 * 源码布局约定（见 docs/kids-game-frontend-structure.md）：
 * - src/games 不得依赖 src/modules 业务页面
 * - src/shared 不得依赖 Vue 页面（modules / views / shell/views）
 * - 管理端路由应使用 modules/admin，禁止 @/views/admin
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(__dirname, '..', 'src')

const CODE_EXT = new Set(['.ts', '.tsx', '.vue', '.js', '.mjs'])

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name)
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === 'dist') continue
      walk(full, out)
    } else if (CODE_EXT.has(path.extname(name.name))) {
      out.push(full)
    }
  }
  return out
}

function findImportViolations(file, content, rules) {
  const hits = []
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const rule of rules) {
      if (rule.test.test(line)) {
        hits.push({ file, line: i + 1, rule: rule.id, snippet: line.trim().slice(0, 120) })
      }
    }
  }
  return hits
}

const gamesDir = path.join(SRC, 'games')
const sharedDir = path.join(SRC, 'shared')
const allSrc = walk(SRC)

const gamesRules = [
  { id: 'games→modules', test: /from\s+['"]@\/modules\// },
  { id: 'games→modules(rel)', test: /from\s+['"]\.\.\/\.\.\/modules\// },
  { id: 'games→views/admin', test: /from\s+['"]@\/views\/admin\// },
]

const sharedRules = [
  { id: 'shared→modules', test: /from\s+['"]@\/modules\// },
  { id: 'shared→views', test: /from\s+['"]@\/views\// },
  { id: 'shared→shell/views', test: /from\s+['"]@shell\/views\// },
]

const globalRules = [{ id: 'deprecated views/admin import', test: /from\s+['"]@\/views\/admin\// }]

let violations = []

for (const file of walk(gamesDir)) {
  const content = fs.readFileSync(file, 'utf8')
  violations.push(...findImportViolations(file, content, gamesRules))
}

for (const file of walk(sharedDir)) {
  const content = fs.readFileSync(file, 'utf8')
  violations.push(...findImportViolations(file, content, sharedRules))
}

for (const file of allSrc) {
  const rel = path.relative(SRC, file)
  if (rel.startsWith(`views${path.sep}admin`)) continue
  const content = fs.readFileSync(file, 'utf8')
  violations.push(...findImportViolations(file, content, globalRules))
}

const legacyAdminDir = path.join(SRC, 'views', 'admin')
let legacyAdminFiles = []
if (fs.existsSync(legacyAdminDir)) {
  legacyAdminFiles = fs.readdirSync(legacyAdminDir).filter((f) => f.endsWith('.vue'))
}

console.log('[audit-src-layout] games import boundary:', violations.filter((v) => v.rule.startsWith('games')).length === 0 ? 'OK' : 'FAIL')
console.log('[audit-src-layout] shared import boundary:', violations.filter((v) => v.rule.startsWith('shared')).length === 0 ? 'OK' : 'FAIL')
console.log('[audit-src-layout] @/views/admin imports:', violations.filter((v) => v.rule.includes('views/admin')).length === 0 ? 'OK' : 'FAIL')

if (legacyAdminFiles.length) {
  console.log('')
  console.warn('[audit-src-layout] legacy folder still present (prefer modules/admin only):')
  legacyAdminFiles.forEach((f) => console.warn('  - src/views/admin/' + f))
}

if (violations.length) {
  console.error('')
  console.error('Layout violations:')
  for (const v of violations) {
    console.error(`  ${v.rule}  ${path.relative(path.join(__dirname, '..'), v.file)}:${v.line}`)
    console.error(`    ${v.snippet}`)
  }
}

const failLegacy = legacyAdminFiles.length > 0
process.exitCode = violations.length || failLegacy ? 1 : 0
if (process.exitCode === 0) {
  console.log('')
  console.log('OK: src layout conventions satisfied')
}