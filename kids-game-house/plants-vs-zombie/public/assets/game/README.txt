游戏资源说明
==============

本目录包含游戏的占位资源文件。

目录结构:
- plants/     - 植物图片
- zombies/    - 僵尸图片  
- projectiles/- 子弹图片
- audio/      - 音效文件

自定义资源替换:
---------------
1. 准备符合规格的图片/音频文件
2. 将文件放到对应目录
3. 修改 src/config/game-assets.config.ts 中的 customPath
4. 示例: 将 customPath 改为 'assets/game/plants/mysunflower.png'

资源规格要求:
-------------
植物/僵尸: 64x64 PNG 透明背景
子弹: 16x16 PNG 透明背景
阳光: 48x48 PNG 透明背景
音效: MP3 或 WAV 格式
