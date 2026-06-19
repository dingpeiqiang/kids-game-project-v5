/**
 * 从 git HEAD 恢复 gameRegistry.ts，提取 guide.ts，并从 registry 安全移除 guide 字段
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const repoRoot = path.join(root, '..')
const registryPath = path.join(root, 'src/games/gameRegistry.ts')
const gitPath = 'kids-game-simple/src/games/gameRegistry.ts'

const folderMap = {
  sort: 'colorSort',
  spaceShooter: 'spaceshooter',
  rpgShooterTD: 'rpgShooterTowerDefense',
}

function resolveFolder(gameId) {
  return folderMap[gameId] ?? gameId
}

function loadCleanRegistry() {
  return execSync(`git show HEAD:${gitPath}`, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 12 * 1024 * 1024,
  })
}

/** 从 pos 起找到与 openingBrace 匹配的闭合 }，返回闭合后下标（不含） */
function findMatchingBraceEnd(text, openingBraceIndex) {
  let depth = 0
  for (let i = openingBraceIndex; i < text.length; i++) {
    const c = text[i]
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return i + 1
    }
  }
  return -1
}

function extractGuideObject(block, gameId) {
  const marker = '\n    guide: {'
  const idx = block.indexOf(marker)
  if (idx < 0) return null
  const braceStart = idx + marker.length - 1
  const braceEnd = findMatchingBraceEnd(block, braceStart)
  if (braceEnd < 0) {
    console.warn(`[${gameId}] guide brace match failed`)
    return null
  }
  return {
    objectText: block.slice(braceStart, braceEnd),
    removeStart: idx,
    removeEnd: braceEnd,
  }
}

function stripGuideFromBlock(block) {
  const marker = '\n    guide: {'
  const idx = block.indexOf(marker)
  if (idx < 0) return block
  const braceStart = idx + marker.length - 1
  const braceEnd = findMatchingBraceEnd(block, braceStart)
  if (braceEnd < 0) return block
  let end = braceEnd
  if (block[end] === ',') end++
  while (end < block.length && (block[end] === '\r' || block[end] === '\n')) end++
  return block.slice(0, idx) + block.slice(end)
}

let clean = loadCleanRegistry()
fs.writeFileSync(registryPath, clean, 'utf8')
console.log('Restored gameRegistry.ts from git HEAD')

const regOpen = clean.indexOf('export const GAME_REGISTRY')
const regBodyStart = clean.indexOf('{', regOpen)
const regClose = clean.indexOf('\n}\n\nexport const GAMES', regBodyStart)
const registryBody = clean.slice(regBodyStart + 1, regClose)

const gameKeyRe = /^  ([a-zA-Z][\w]*): \{/gm
const games = []
let m
while ((m = gameKeyRe.exec(registryBody)) !== null) {
  games.push({ id: m[1], start: m.index })
}
for (let i = 0; i < games.length; i++) {
  games[i].end = i + 1 < games.length ? games[i + 1].start : registryBody.length
}

const extracted = []
for (const g of games) {
  const block = registryBody.slice(g.start, g.end)
  const guide = extractGuideObject(block, g.id)
  if (!guide) continue
  const folder = resolveFolder(g.id)
  const guidePath = path.join(root, 'src/games', folder, 'guide.ts')
  const fileContent = `import type { GameGuide } from '../../types'

export const guide: GameGuide = ${guide.objectText}
`
  fs.mkdirSync(path.dirname(guidePath), { recursive: true })
  fs.writeFileSync(guidePath, fileContent, 'utf8')
  extracted.push(g.id)
}

let newBody = registryBody
for (let i = games.length - 1; i >= 0; i--) {
  const g = games[i]
  const block = newBody.slice(g.start, g.end)
  const stripped = stripGuideFromBlock(block)
  if (stripped !== block) {
    newBody = newBody.slice(0, g.start) + stripped + newBody.slice(g.end)
  }
}

const newRegistry =
  clean.slice(0, regBodyStart + 1) + newBody + clean.slice(regClose)
fs.writeFileSync(registryPath, newRegistry, 'utf8')

console.log(`Extracted ${extracted.length} guide.ts files`)
extracted.forEach(id => console.log(`  ${id}`))