import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('kids-game-frontend/src/shell');

function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p);
    else if (/\.(ts|vue|js|mjs)$/.test(name.name)) {
      let t = fs.readFileSync(p, 'utf8');
      const n = t.replace(/@simple\//g, '@shell/').replace(/@simple'/g, "@shell'");
      if (n !== t) {
        fs.writeFileSync(p, n);
        console.log('updated', p);
      }
    }
  }
}

walk(root);