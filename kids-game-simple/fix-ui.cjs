const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'games', 'rpgShooterTowerDefense', 'init.ts');

// 读取文件
let content = fs.readFileSync(filePath, 'utf8');

// 替换开始界面
content = content.replace(
  /ctx\.fillRect\(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT\)\s+ctx\.fillStyle = '#fff'\s+ctx\.font = 'bold 32px sans-serif'\s+ctx\.textAlign = 'center'\s+ctx\.fillText\('.*?RPG.*?塔防射击'/s,
  `ctx.fillRect(0, CANVAS_HEIGHT / 2 - 65, CANVAS_WIDTH, 130)\n      \n      ctx.fillStyle = '#fff'\n      ctx.font = 'bold 24px sans-serif'\n      ctx.textAlign = 'center'\n      ctx.fillText('\\u{1F3F0} RPG塔防射击'`
);

// 替换结束界面  
content = content.replace(
  /ctx\.fillText\('游戏结束'/g,
  `ctx.fillText('\\u{1F3C6} 游戏结束'`
);

// 写回文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ 文件修改成功！');
