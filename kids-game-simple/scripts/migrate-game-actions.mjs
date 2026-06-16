/**
 * 将玩法层 engine.addScore / engine.endGame 迁移为 gameActions（GTRS 统一规范）
 * 用法: node scripts/migrate-game-actions.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GAMES = path.join(__dirname, '../src/games')

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p, acc)
    else if (p.endsWith('.ts')) acc.push(p)
  }
  return acc
}

const replacements = [
  [/this\.engine\.addScore\(/g, 'gameActions.addScore('],
  [/engine\.addScore\(/g, 'gameActions.addScore('],
]

let updated = 0
for (const file of walk(GAMES)) {
  let text = fs.readFileSync(file, 'utf8')
  const before = text
  for (const [re, rep] of replacements) {
    text = text.replace(re, rep)
  }
  if (text !== before) {
    fs.writeFileSync(file, text)
    updated++
    console.log('updated:', path.relative(GAMES, file))
  }
}
console.log('done, files updated:', updated)