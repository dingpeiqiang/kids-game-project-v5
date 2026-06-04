# 游戏主题资源模板规范 v1.0

## 📋 概述

本文档定义了游戏主题资源的通用规范，所有游戏在开发阶段必须遵循此规范定义自己的资源模板。

**核心原则**：
1. ✅ **统一规范** - 所有游戏使用相同的资源模板格式
2. ✅ **游戏自治** - 每个游戏在开发阶段定义自己的资源模板
3. ✅ **动态加载** - 创作者中心根据游戏代码动态加载对应的资源模板
4. ✅ **向后兼容** - 规范支持版本升级和向后兼容

---

## 📁 资源模板文件结构

### 标准目录结构

```
kids-game-house/
├── {game-code}/
│   ├── src/
│   │   ├── config/
│   │   │   └── theme-template.json        # 主题资源模板定义（必需）
│   │   └── ...
│   └── public/
│       └── themes/
│           └── default/                   # 默认主题资源（可选）
│               ├── images/
│               ├── audio/
│               └── theme-config.json      # 默认主题配置
```

### theme-template.json 标准格式

```json
{
  "version": "1.0",
  "gameCode": "snake-vue3",
  "gameName": "贪吃蛇大冒险",
  "gameVersion": "1.0.0",
  
  "resources": {
    "images": {
      "snakeHead": {
        "label": "蛇头图片",
        "description": "蛇的头部图片",
        "required": true,
        "specs": {
          "width": 32,
          "height": 32,
          "format": ["png", "webp"],
          "transparent": true
        },
        "defaultValue": "/themes/snake-vue3/default/images/snakeHead.png"
      },
      "snakeBody": {
        "label": "蛇身图片",
        "description": "蛇的身体图片",
        "required": true,
        "specs": {
          "width": 32,
          "height": 32,
          "format": ["png", "webp"],
          "transparent": true
        },
        "defaultValue": "/themes/snake-vue3/default/images/snakeBody.png"
      }
    },
    
    "audio": {
      "bgm_main": {
        "label": "背景音乐",
        "description": "游戏主界面背景音乐",
        "required": false,
        "specs": {
          "duration": "30s+",
          "format": ["mp3", "ogg"],
          "loop": true
        },
        "defaultValue": "/themes/snake-vue3/default/audio/bgm_main.mp3"
      }
    },
    
    "colors": {
      "primaryColor": {
        "label": "主题色",
        "description": "游戏的主色调",
        "required": true,
        "defaultValue": "#4ECDC4"
      }
    },
    
    "configs": {
      "difficulty": {
        "label": "难度系数",
        "description": "游戏难度调整系数",
        "required": false,
        "type": "number",
        "defaultValue": 1.0,
        "range": [0.5, 2.0]
      }
    }
  },
  
  "metadata": {
    "author": "游戏开发团队",
    "createdAt": "2026-03-17",
    "updatedAt": "2026-03-17"
  }
}
```

---

## 📐 资源类型定义

### 1. 图片资源（images）

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| label | string | ✅ | 资源显示名称 |
| description | string | ✅ | 资源详细描述 |
| required | boolean | ✅ | 是否必需 |
| specs.width | number | ✅ | 图片宽度（像素） |
| specs.height | number | ✅ | 图片高度（像素） |
| specs.format | string[] | ✅ | 支持的格式（png, webp, jpg） |
| specs.transparent | boolean | ❌ | 是否支持透明背景 |
| specs.maxSize | number | ❌ | 最大文件大小（KB） |
| defaultValue | string | ❌ | 默认资源路径 |

### 2. 音频资源（audio）

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| label | string | ✅ | 资源显示名称 |
| description | string | ✅ | 资源详细描述 |
| required | boolean | ✅ | 是否必需 |
| specs.duration | string | ✅ | 建议时长（如"30s+"、"1-2s"） |
| specs.format | string[] | ✅ | 支持的格式（mp3, ogg, wav） |
| specs.loop | boolean | ❌ | 是否循环播放 |
| specs.maxSize | number | ❌ | 最大文件大小（KB） |
| defaultValue | string | ❌ | 默认资源路径 |

### 3. 颜色配置（colors）

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| label | string | ✅ | 配置显示名称 |
| description | string | ✅ | 配置详细描述 |
| required | boolean | ✅ | 是否必需 |
| defaultValue | string | ✅ | 默认颜色值（HEX格式） |

### 4. 数值配置（configs）

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| label | string | ✅ | 配置显示名称 |
| description | string | ✅ | 配置详细描述 |
| required | boolean | ✅ | 是否必需 |
| type | string | ✅ | 数据类型（number, string, boolean, object） |
| defaultValue | any | ✅ | 默认值 |
| range | array | ❌ | 数值范围（仅number类型） |
| options | array | ❌ | 可选项（仅string类型） |

---

## 🎮 游戏开发指南

### 步骤1：创建资源模板文件

在游戏项目中创建 `src/config/theme-template.json` 文件：

```bash
# 贪吃蛇游戏
kids-game-house/snake-vue3/src/config/theme-template.json

# 植物大战僵尸游戏
kids-game-house/plants-vs-zombie/src/config/theme-template.json
```

### 步骤2：定义游戏资源

根据游戏需求，在模板中定义所需的所有资源：

```json
{
  "version": "1.0",
  "gameCode": "your-game-code",
  "gameName": "游戏名称",
  "gameVersion": "1.0.0",
  "resources": {
    "images": { ... },
    "audio": { ... },
    "colors": { ... },
    "configs": { ... }
  }
}
```

### 步骤3：提供默认资源（可选）

在游戏项目的 `public/themes/default/` 目录中提供默认主题资源：

```
public/themes/default/
├── images/
│   ├── snakeHead.png
│   └── snakeBody.png
├── audio/
│   └── bgm_main.mp3
└── theme-config.json
```

### 步骤4：在游戏代码中加载主题

游戏启动时，从URL参数或本地存储加载主题配置：

```typescript
// 伪代码示例
async function loadTheme() {
  const themeId = getThemeIdFromURL();
  
  if (themeId) {
    // 从API加载主题
    const theme = await fetch(`/api/theme/download?id=${themeId}`);
    return theme;
  } else {
    // 使用默认主题
    return loadDefaultTheme();
  }
}
```

---

## 🔄 创作者中心集成

### API接口

**获取游戏资源模板**

```http
GET /api/game/theme-template?gameCode={gameCode}

Response:
{
  "code": 200,
  "data": {
    "version": "1.0",
    "gameCode": "snake-vue3",
    "gameName": "贪吃蛇大冒险",
    "resources": { ... }
  }
}
```

**资源路径映射**

| 资源类型 | 访问路径 | 说明 |
|---------|---------|------|
| 游戏资源模板 | `/games/{gameCode}/config/theme-template.json` | 前端静态文件 |
| 默认主题资源 | `/games/{gameCode}/themes/default/` | 游戏内置默认资源 |
| 自定义主题资源 | `/themes/{gameCode}/{themeId}/` | 用户上传的主题资源 |

---

## 📊 主题配置JSON格式

用户创作的主题配置JSON必须遵循以下格式：

```json
{
  "themeName": "主题名称",
  "themeId": 1001,
  "version": "1.0",
  "gameCode": "snake-vue3",
  "author": "创作者名称",
  "createdAt": "2026-03-17",
  
  "resources": {
    "images": {
      "snakeHead": {
        "url": "/themes/snake-vue3/1001/images/snakeHead.png",
        "hash": "md5hash"
      }
    },
    "audio": {
      "bgm_main": {
        "url": "/themes/snake-vue3/1001/audio/bgm_main.mp3",
        "hash": "md5hash"
      }
    },
    "colors": {
      "primaryColor": "#FF6B6B"
    },
    "configs": {
      "difficulty": 1.2
    }
  }
}
```

---

## ✅ 资源模板验证

创作者中心在用户上传主题时，会验证资源是否符合模板规范：

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  resourceKey: string;
  message: string;
  type: 'missing' | 'invalid' | 'size_exceeded' | 'format_unsupported';
}

interface ValidationWarning {
  resourceKey: string;
  message: string;
  type: 'optional_missing' | 'size_warning' | 'quality_warning';
}
```

---

## 🔧 工具和辅助函数

### 生成资源模板骨架

```bash
# 创建游戏资源模板
npm run create-theme-template -- --game-code=my-game

# 输出文件：src/config/theme-template.json
```

### 验证资源模板

```bash
# 验证模板是否符合规范
npm run validate-theme-template -- --game-code=my-game
```

### 生成文档

```bash
# 生成资源模板文档
npm run generate-theme-docs -- --game-code=my-game

# 输出文件：docs/theme-resources.md
```

---

## 📚 最佳实践

### 1. 资源命名规范

- 使用驼峰命名法：`snakeHead`、`bgm_main`
- 见名知意：`plant_peashooter` 而不是 `plant1`
- 统一前缀：`plant_`、`zombie_`、`ui_`

### 2. 资源尺寸规范

- 2的幂次方：32x32、64x64、128x128
- 根据实际需要设置，不要过大
- 考虑移动端性能

### 3. 必需与可选

- 必需资源：游戏核心功能必需
- 可选资源：增强体验但非必需
- 提供默认值：即使可选资源也应有默认值

### 4. 版本兼容性

- 模板版本号：`version: "1.0"`
- 向后兼容：新增资源标记为可选
- 弃用资源：保留但标记为 `deprecated: true`

---

## 🎯 检查清单

游戏开发完成后，请检查：

- [ ] 已创建 `theme-template.json` 文件
- [ ] 所有必需资源已定义
- [ ] 资源规格描述清晰准确
- [ ] 提供了默认主题资源
- [ ] 游戏代码支持动态加载主题
- [ ] 已测试主题加载功能
- [ ] 文档已更新

---

## 📝 更新日志

### v1.0 (2026-03-17)
- ✅ 初始版本发布
- ✅ 定义通用资源模板规范
- ✅ 支持4种资源类型（images、audio、colors、configs）
- ✅ 提供验证机制
- ✅ 提供工具和辅助函数

---

**维护者**：游戏开发团队  
**联系方式**：dev@example.com  
**文档版本**：v1.0  
**最后更新**：2026-03-17
