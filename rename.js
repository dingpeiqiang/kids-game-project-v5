const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'kids-game-house', 'zhiwudazhanjiangshi');
const destDir = path.join(__dirname, 'kids-game-house', 'plants-vs-zombie');

console.log('Checking source:', srcDir);
console.log('Exists:', fs.existsSync(srcDir));

if (fs.existsSync(srcDir)) {
    fs.renameSync(srcDir, destDir);
    console.log('Renamed successfully to:', destDir);
} else {
    console.log('Source directory not found');
}
