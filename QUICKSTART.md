# 🚀 快速开始

三步生成植物大战僵尸的像素艺术图片！

## 第1步：配置 bitart-generator

```bash
cd kids-game-frame-factory/bitart-generator
npm install -g .
bitart
```

按提示操作：
1. 选择模型（推荐 DALL-E 3）
2. 输入 OpenAI API Key
3. 完成配置！

## 第2步：生成图片

返回项目根目录，运行：

```bash
# 方式1：交互式向导（推荐）
node quick-generate.js

# 方式2：一键生成所有
node pixel-art-generator.js all

# 方式3：生成特定植物
node pixel-art-generator.js plant peashooter

# 方式4：生成特定僵尸
node pixel-art-generator.js zombie buckethead
```

## 第3步：使用生成的图片

图片会保存在：
```
kids-game-house/games/pvz/assets/generated/
```

将图片复制到：
```
kids-game-house/games/pvz/assets/sprites/
```

然后运行游戏！

## 📖 详细文档

查看 `GENERATE_ASSETS.md` 获取完整使用说明。

## 🎨 生成的内容

### 植物 (7种)
- 🌻 向日葵 (sunflower)
- 🫛 豌豆射手 (peashooter)
- ❄️ 寒冰射手 (iceshooter)
- 🌵 双发射手 (repeater)
- 💣 樱桃炸弹 (cherrybomb)
- 🥔 土豆雷 (potatomine)
- 🌰 坚果墙 (wallnut)

### 僵尸 (4种)
- 🧟 普通僵尸 (normal)
- 🟠 路障僵尸 (conehead)
- ⚪ 铁桶僵尸 (buckethead)
- 📰 读报僵尸 (newspaper)

### 其他素材
- 🟢 豌豆 (pea)
- ☀️ 阳光 (sun)

---

有问题？查看 `GENERATE_ASSETS.md`！
