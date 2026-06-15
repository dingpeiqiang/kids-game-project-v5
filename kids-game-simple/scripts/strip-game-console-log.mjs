import fs from 'fs'
import path from 'path'

import { fileURLToPath } from 'url'
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/games')

function walk(dir) {
  let changed = 0
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) changed += walk(p)
    else if (/\.(ts|tsx)$/.test(name)) {
      const raw = fs.readFileSync(p, 'utf8')
      const next = raw
        .split(/\r?\n/)
        .filter((line) => !/^\s*console\.log\(/.test(line))
        .join('\n')
      if (next !== raw) {
        fs.writeFileSync(p, next)
        changed++
        console.error('stripped:', path.relative(root, p))
      }
    }
  }
  return changed
}

const n = walk(root)
console.error(`done: ${n} files`)