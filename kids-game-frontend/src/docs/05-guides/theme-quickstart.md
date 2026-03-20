# 主题系统快速开始指南

## 5分钟快速上手

### 1. 检查后端服务

确保后端服务已启动，游戏API和主题API可用：

```bash
# 测试游戏列表API
curl http://localhost:8080/api/game/list

# 测试主题列表API（需要token）
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/theme/list?applicableScope=specific&gameCode=plane-shooter
```

### 2. 创作者中心创建主题

1. 访问创作者中心：`http://localhost:5173/creator-center`
2. 选择"游戏主题"范围
3. 选择具体游戏（如：飞机大战）
4. 点击"创建主题"按钮
5. 填写主题信息并上传资源
6. 点击"发布"

### 3. 游戏中应用主题

1. 打开任意游戏：`http://localhost:5173/game/plane-shooter`
2. 点击右上角"🎨 主题"按钮
3. 从列表中选择一个主题
4. 游戏自动重新加载并应用主题

## 主题创作步骤

### 步骤1：准备资源

准备以下资源（支持CDN URL）：

```
theme-resources/
├── images/
│   ├── bg-main.png          # 主背景
│   ├── player.png           # 玩家角色
│   ├── food.png             # 食物/道具
│   └── thumbnail.png        # 缩略图
└── audio/
    ├── bgm-main.mp3         # 背景音乐
    ├── sfx-click.mp3        # 点击音效
    └── sfx-success.mp3      # 成功音效
```

### 步骤2：上传资源到CDN

将资源上传到你的CDN或文件服务器，获取访问URL：

- `https://cdn.example.com/themes/my-theme/bg-main.png`
- `https://cdn.example.com/themes/my-theme/bgm-main.mp3`

### 步骤3：配置主题

在创作者中心填写主题配置：

```json
{
  "default": {
    "name": "我的炫酷主题",
    "author": "主题创作者",
    "description": "这是一个炫酷的游戏主题",
    "applicableScope": "specific",
    "gameCode": "plane-shooter",

    "styles": {
      "colors": {
        "primary": "#FF6B6B",
        "secondary": "#4ECDC4",
        "background": "#1a1a2e",
        "surface": "#16213e",
        "text": "#ffffff"
      }
    },

    "assets": {
      "bg_main": {
        "type": "image",
        "url": "https://cdn.example.com/themes/my-theme/bg-main.png"
      },
      "player": {
        "type": "image",
        "url": "https://cdn.example.com/themes/my-theme/player.png"
      },
      "food": {
        "type": "image",
        "url": "https://cdn.example.com/themes/my-theme/food.png"
      }
    },

    "audio": {
      "bgm_main": {
        "type": "audio",
        "url": "https://cdn.example.com/themes/my-theme/bgm-main.mp3",
        "volume": 0.5,
        "loop": true
      }
    }
  }
}
```

### 步骤4：发布主题

点击"发布"按钮，主题将保存到数据库并上架销售。

## 游戏集成示例

### Phaser3 游戏加载主题

```typescript
class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // 获取主题ID
    const urlParams = new URLSearchParams(window.location.search);
    const themeId = urlParams.get('theme_id');

    if (themeId) {
      this.loadTheme(parseInt(themeId));
    } else {
      // 加载默认资源
      this.loadDefaultAssets();
    }
  }

  async loadTheme(themeId: number) {
    try {
      const response = await fetch(`/api/theme/download?id=${themeId}`);
      const result = await response.json();

      if (result.code === 200 && result.data) {
        const themeConfig = JSON.parse(result.data.configJson);
        const themeData = themeConfig.default;

        // 加载主题资源
        if (themeData.assets) {
          Object.entries(themeData.assets).forEach(([key, asset]: [string, any]) => {
            if (asset.type === 'image' && asset.url) {
              this.load.image(key, asset.url);
            }
          });
        }

        // 加载音频资源
        if (themeData.audio) {
          Object.entries(themeData.audio).forEach(([key, audio]: [string, any]) => {
            if (audio.type === 'audio' && audio.url) {
              this.load.audio(key, audio.url);
            }
          });
        }

        // 开始加载
        this.load.start();
      }
    } catch (error) {
      console.error('加载主题失败:', error);
      this.loadDefaultAssets();
    }
  }

  loadDefaultAssets() {
    // 加载默认资源
    this.load.image('bg_main', '/assets/default/bg.png');
    this.load.image('player', '/assets/default/player.png');
    this.load.image('food', '/assets/default/food.png');
    this.load.audio('bgm_main', '/assets/default/bgm.mp3');
  }

  create() {
    // 使用主题资源创建游戏对象
    const bg = this.add.image(0, 0, 'bg_main');
    bg.setOrigin(0, 0);

    const player = this.physics.add.sprite(400, 300, 'player');

    // 播放背景音乐
    const bgm = this.sound.play('bgm_main', { loop: true, volume: 0.5 });
  }
}
```

### Vue3 游戏加载主题

```typescript
// 在游戏组件中
import { gameThemeLoader } from '@/core/game-theme/GameThemeLoader';

async function loadGameTheme() {
  const themeId = route.query.theme_id as string;

  if (themeId) {
    const theme = await gameThemeLoader.loadTheme(parseInt(themeId));

    if (theme) {
      // 背景图片
      const bgUrl = gameThemeLoader.getBackground();
      if (bgUrl) {
        document.body.style.backgroundImage = `url(${bgUrl})`;
      }

      // 背景音乐
      const bgmUrl = gameThemeLoader.getBackgroundMusic();
      if (bgmUrl) {
        const bgm = new Audio(bgmUrl);
        bgm.loop = true;
        bgm.play();
      }

      // 获取样式
      const primaryColor = gameThemeLoader.getStyle('colors.primary');
      if (primaryColor) {
        document.body.style.setProperty('--theme-primary', primaryColor);
      }
    }
  }
}
```

## API 快速参考

### 获取游戏列表

```bash
GET /api/game/list
```

### 获取主题列表

```bash
# 获取应用主题
GET /api/theme/list?applicableScope=all

# 获取游戏主题
GET /api/theme/list?applicableScope=specific&gameCode=plane-shooter&status=on_sale
```

### 上传主题

```bash
POST /api/theme/upload
Content-Type: application/json

{
  "themeName": "我的主题",
  "authorName": "创作者",
  "applicableScope": "specific",
  "gameCode": "plane-shooter",
  "price": 100,
  "description": "主题描述",
  "thumbnailUrl": "https://cdn.example.com/themes/thumb.png",
  "config": {...主题配置...}
}
```

### 下载主题

```bash
GET /api/theme/download?id=1
```

### 检查购买状态

```bash
GET /api/theme/check-purchase?themeId=1
```

## 常见问题

### Q1: 游戏列表加载失败

**A:** 检查后端游戏API是否正常：
```bash
curl http://localhost:8080/api/game/list
```

如果返回404，检查GameController的路由配置。

### Q2: 主题列表为空

**A:** 确保：
1. 已创建主题且状态为on_sale
2. applicableScope设置为specific
3. gameCode与游戏代码匹配
4. 检查主题API：
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8080/api/theme/list?applicableScope=specific&gameCode=plane-shooter"
```

### Q3: 主题资源加载失败

**A:** 检查：
1. 资源URL是否可访问
2. 网络请求是否被CORS阻止
3. 浏览器控制台是否有错误信息

### Q4: 主题切换后游戏不重新加载

**A:** 检查：
1. 是否正确调用了reloadGame()函数
2. 浏览器是否缓存了旧资源
3. 尝试硬刷新（Ctrl+Shift+R）

## 下一步

- 阅读完整文档：[GTRS 主题系统概述](./gtrs-overview.md)
- 查看主题类型定义：`kids-game-frontend/src/types/theme.types.ts`
- 了解主题加载器实现：`kids-game-frontend/src/core/game-theme/GameThemeLoader.ts`
- 查看主题选择器组件：`kids-game-frontend/src/components/game/GameThemeSelector.vue`

## 技术支持

如遇问题，请查看：
1. 浏览器控制台日志
2. 后端日志
3. 网络请求面板
4. 完整集成文档：[GTRS 游戏集成指南](./gtrs-integration.md)
