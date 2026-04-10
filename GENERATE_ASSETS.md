# 🎨 植物大战僵尸 - 图片生成工具

使用 bitart-generator 为植物大战僵尸游戏生成像素艺术图片！

## 📋 前置准备

### 1. 安装 bitart-generator

首先需要运行一次 bitart-generator 来配置 API Key：

```bash
cd kids-game-frame-factory/bitart-generator
npm install -g .
bitart
```

这会提示你：
- 选择模型（推荐 DALL-E 3 或 GPT Image 1.5）
- 输入 OpenAI API Key
- 设置输出文件夹

### 2. 确认可以正常运行

配置完成后，测试一下：

```bash
bitart -p "pixel art sunflower" -o test.png
```

如果能正常生成图片，说明配置成功！

## 🚀 使用方法

### 方法一：简单命令行工具（推荐）

使用 `pixel-art-generator.js` 快速生成：

```bash
# 生成单个植物
node pixel-art-generator.js plant sunflower

# 生成单个僵尸
node pixel-art-generator.js zombie buckethead

# 生成所有图片
node pixel-art-generator.js all

# 自定义生成
node pixel-art-generator.js "pixel art tree" tree.png
```

**生成的植物：**
- `sunflower` - 向日葵
- `peashooter` - 豌豆射手
- `iceshooter` - 寒冰射手
- `repeater` - 双发射手
- `cherrybomb` - 樱桃炸弹
- `potatomine` - 土豆雷
- `wallnut` - 坚果墙

**生成的僵尸：**
- `normal` - 普通僵尸
- `conehead` - 路障僵尸
- `buckethead` - 铁桶僵尸
- `newspaper` - 读报僵尸

### 方法二：完整批量生成

使用 `generate-pvz-assets.js` 一次性生成所有素材：

```bash
node generate-pvz-assets.js
```

这会生成：
- 7种植物
- 4种僵尸
- 豌豆和阳光素材

### 方法三：在代码中调用

```javascript
const PixelArtGenerator = require('./pixel-art-generator.js');

// 创建生成器实例
const generator = new PixelArtGenerator({
  outputDir: './my-custom-folder'
});

// 生成单个植物
generator.generatePlant('peashooter');

// 生成单个僵尸
generator.generateZombie('buckethead');

// 生成所有
generator.generateAll();

// 自定义生成
generator.generate('pixel art dragon', 'dragon.png');
```

## 📁 输出位置

生成的图片会保存在：
```
kids-game-house/games/pvz/assets/generated/
```

## 🔧 在游戏中使用生成的图片

生成图片后，更新 `sprites.json` 文件：

```json
{
  "textures": [
    {
      "name": "sprites",
      "image": "assets/generated/sunflower.png",
      "frames": [
        { "name": "sunflower.png", "x": 0, "y": 0, "width": 32, "height": 32 }
      ]
    }
  ]
}
```

或者将生成的图片复制到 `assets/sprites/` 目录。

## 💡 提示词建议

你可以自定义提示词来生成不同风格的图片：

```javascript
// 更卡通风格
generator.generatePlant('sunflower', 
  'cute pixel art sunflower, chibi style, transparent background');

// 更复古风格
generator.generatePlant('peashooter',
  '8-bit pixel art peashooter, NES style, retro game sprite');

// 不同颜色
generator.generatePlant('iceshooter',
  'pixel art ice shooter, dark blue ice, Plants vs Zombies style');
```

## ⚙️ 高级配置

### 自定义输出目录

```javascript
const generator = new PixelArtGenerator({
  outputDir: '/path/to/your/folder',
  bitartPath: '/path/to/bitart'
});
```

### 生成 GIF 动画

```javascript
generator.generate(
  'pixel art zombie walking animation',
  'zombie-walk.gif',
  { gif: true }
);
```

## 📝 注意事项

1. **API Key**: 需要有效的 OpenAI API Key
2. **网络连接**: 需要能够访问 OpenAI 服务
3. **生成时间**: 每张图片约 10-30 秒
4. **API 限流**: 批量生成时会自动等待 2 秒避免限流

## 🎯 下一步

- 生成图片后，更新游戏的 sprites.json
- 或者直接替换 assets/sprites/ 中的图片
- 运行游戏查看效果！

---

有问题？查看 bitart-generator 的官方文档：
`kids-game-frame-factory/bitart-generator/README.md`
