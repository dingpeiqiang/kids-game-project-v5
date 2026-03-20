const fs = require('fs');
const src = 'c:/Users/a1521/Desktop/kids-game-project/kids-game-house/zhiwudazhanjiangshi';
const dest = 'c:/Users/a1521/Desktop/kids-game-project/kids-game-house/plants-vs-zombie';

if (fs.existsSync(src)) {
  fs.renameSync(src, dest);
  console.log('Folder renamed successfully!');
} else {
  console.log('Source folder not found:', src);
}
