/**
 * 从 gameRegistry.ts 提取 guide 块到各游戏目录 guide.ts
 * 运行: node scripts/extract-game-guides.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const registryPath = path.join(root, 'src/games/gameRegistry.ts')
let src = fs.readFileSync(registryPath, 'utf8')

const folderMap = {
  sort: 'colorSort',
  spaceShooter: 'spaceshooter',
  rpgShooterTD: 'rpgShooterTowerDefense',
}

function resolveFolder(gameId) {
  return folderMap[gameId] ?? gameId
}

const gameBlockRe = /^\s{2}(\w+):\s*\{/gm
const blocks = []
let m
while ((m = gameBlockRe.exec(src)) !== null) {
  blocks.push({ id: m[1], start: m.index })
}
for (let i = 0; i < blocks.length; i++) {
  blocks[i].end = i + 1 < blocks.length ? blocks[i + 1].start : src.length
}

const extracted = []

for (const block of blocks) {
  const chunk = src.slice(block.start, block.end)
  const guideIdx = chunk.search(/\n    guide:\s*\{/)
  if (guideIdx < 0) continue

  let depth = 0
  let i = guideIdx + chunk.indexOf('{', guideIdx)
  const guideStart = i
  for (; i < chunk.length; i++) {
    const c = chunk[i]
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) {
        i++
        break
      }
    }
  }
  const guideInner = chunk.slice(guideStart, i)
  const folder = resolveFolder(block.id)
  const guidePath = path.join(root, 'src/games', folder, 'guide.ts')
  const fileContent = `import type { GameGuide } from '../../types'

export const guide: GameGuide = ${guideInner}
`
  fs.mkdirSync(path.dirname(guidePath), { recursive: true })
  fs.writeFileSync(guidePath, fileContent, 'utf8')
  extracted.push({ id: block.id, folder })

  const fullGuideStart = block.start + guideIdx
  let removeEnd = block.start + i
  if (src[removeEnd] === ',') removeEnd++
  if (src[removeEnd] === '\n') removeEnd++
  src = src.slice(0, fullGuideStart) + src.slice(removeEnd)
}

fs.writeFileSync(registryPath, src, 'utf8')
console.log(`Extracted ${extracted.length} guides:`)
for (const e of extracted) console.log(`  ${e.id} -> games/${e.folder}/guide.ts`)