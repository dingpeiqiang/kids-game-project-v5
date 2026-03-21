# GTRS Schema 路径格式修复

## 问题描述

主题发布时校验失败，错误信息显示所有资源的 `src` 字段都是简单文件名（如 `food_apple.png`），但 Schema 要求必须以特定前缀开头：

```
Schema 校验失败: 
1. [pattern] /resources/images/scene/food_apple/src must match pattern "^(https?://|\\.{1,2}/|assets/|/resources/).*$"
2. [pattern] /resources/images/scene/snake_body/src must match pattern "^(https?://|\\.{1,2}/|assets/|/resources/).*$"
...
```

## 根本原因

1. **用户创建的主题资源路径格式不统一**：
   - 有些使用简单文件名：`food_apple.png`
   - 有些使用后端上传路径：`/resources/themes/images/2026/03/21/xxx.png`
   - 有些使用本地开发路径：`/public/games/snake-vue3/themes/default/images/food_apple.png`

2. **前后端 Schema 定义不一致**：
   - 前端 Schema：严格要求以 `http://`, `https://`, `./`, `../`, `assets/`, `/resources/` 开头
   - 后端 Schema：没有 pattern 限制，只要求是非空字符串
   - snake-vue3 validator：支持更多格式（包括 `/public/`, `/` 开头的路径，甚至颜色值）

## 解决方案

### ✅ 已实施：扩展 Schema 支持的路径格式

修改了以下文件的 GTRS Schema 定义，使其与 snake-vue3 的 validator 保持一致：

#### 1. 前端 Schema
**文件**: `kids-game-frontend/src/schemas/gtrs-schema.json`

**修改内容**：
- 图片资源 `src` 字段：支持 `http://`, `https://`, `./`, `../`, `assets/`, `/resources/`, `/public/`, `/` 开头的根路径，以及颜色值 `#RRGGBB`
- 音频资源 `src` 字段：支持 `http://`, `https://`, `./`, `../`, `assets/`, `/resources/`, `/public/`, `/` 开头的根路径

#### 2. 后端 Schema
**文件**: `kids-game-backend/kids-game-service/src/main/resources/gtrs-schema.json`

**修改内容**：
- 与前端保持一致，添加了相同的 pattern 限制
- 确保前后端校验逻辑统一

### 支持的路径格式

现在 GTRS Schema 支持以下所有路径格式：

| 格式类型 | 示例 | 说明 | 状态 |
|---------|------|------|------|
| 完整 URL | `https://example.com/image.png` | 外部资源或 CDN | ✅ 支持 |
| HTTP URL | `http://localhost:8080/image.png` | 本地开发服务器 | ✅ 支持 |
| 相对路径 | `./assets/image.png` | 相对当前目录 | ✅ 支持 |
| 上级目录 | `../shared/image.png` | 相对父目录 | ✅ 支持 |
| Assets 目录 | `assets/images/icon.png` | 项目 assets 目录 | ✅ 支持 |
| 后端资源 | `/resources/themes/images/2026/03/21/xxx.png` | 后端上传的资源 | ✅ 支持 |
| Public 目录 | `/public/games/snake/image.png` | 构建后的静态资源 | ✅ 支持 |
| 根路径 | `/games/snake-vue3/themes/default/image.png` | 基于根路径的资源 | ✅ 支持 |
| 颜色值 | `#FF5733` | CSS 颜色（用于兜底） | ✅ 支持 |

## 修改的文件

### 前端
1. `kids-game-frontend/src/schemas/gtrs-schema.json`
   - Line 150: 图片资源 pattern
   - Line 173: 音频资源 pattern

### 后端
2. `kids-game-backend/kids-game-service/src/main/resources/gtrs-schema.json`
   - Line 199: 图片资源 pattern
   - Line 221: 音频资源 pattern

## Schema Pattern 正则表达式

### 图片资源（支持颜色值）
```regex
^(https?://|\\.{1,2}/|assets/|/resources/|/public/|/|#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})).*$
```

### 音频资源（不支持颜色值）
```regex
^(https?://|\\.{1,2}/|assets/|/resources/|/public/|/).*$
```

## 验证方法

现在可以使用以下任何格式的资源路径：

### ✅ 有效路径示例
```json
{
  "resources": {
    "images": {
      "scene": {
        "food_apple": {
          "src": "/games/snake-vue3/themes/default/images/scene/food_apple.png",
          "type": "png",
          "alias": "苹果"
        },
        "snake_head": {
          "src": "/public/games/snake-vue3/themes/default/images/scene/snake_head.png",
          "type": "png",
          "alias": "蛇头"
        },
        "bg_grid": {
          "src": "/resources/themes/images/2026/03/21/abc123.png",
          "type": "png",
          "alias": "网格背景"
        },
        "decoration": {
          "src": "#4ECDC4",
          "type": "png",
          "alias": "装饰色"
        }
      }
    },
    "audio": {
      "bgm": {
        "bgm_main": {
          "src": "https://cdn.example.com/music/bgm.mp3",
          "type": "mp3",
          "alias": "背景音乐"
        }
      },
      "effect": {
        "eat": {
          "src": "./assets/audio/eat.mp3",
          "type": "mp3",
          "alias": "吃东西音效"
        }
      }
    }
  }
}
```

### ❌ 无效路径示例
```json
{
  "food_invalid": {
    "src": "food_apple.png",  // ❌ 缺少前缀
    "type": "png",
    "alias": "苹果"
  }
}
```

## 兼容性说明

### 向后兼容
- ✅ 所有旧的有效路径仍然有效
- ✅ 后端上传的资源路径（`/resources/...`）继续有效
- ✅ 外部 URL 继续有效

### 新增支持
- ✅ `/public/` 开头的路径（snake-vue3 构建后的资源路径）
- ✅ `/` 开头的根路径（自动使用当前页面的 IP 和端口）
- ✅ 颜色值作为图片 src（用于 CSS 颜色兜底场景）

## 测试建议

1. **测试现有主题**：
   - 使用 `/public/` 路径的主题
   - 使用 `/resources/` 路径的主题
   - 使用相对路径的主题

2. **测试新创建的主题**：
   - 确保上传的资源获得正确的 `/resources/` 路径
   - 确保本地开发的资源可以使用 `/public/` 或 `/` 路径

3. **测试边界情况**：
   - 颜色值作为 src
   - 混合使用不同格式的路径

## 注意事项

1. **开发环境 vs 生产环境**：
   - 开发环境：可以使用 `/public/` 或相对路径访问本地资源
   - 生产环境：建议使用后端上传的 `/resources/` 路径或 CDN URL

2. **资源上传服务**：
   - 创作者中心应继续使用资源上传服务
   - 上传后获得的 URL 会自动保存到主题配置中

3. **路径转换**：
   - snake-vue3 游戏会自动处理 `/public/` 到 `/` 的路径转换
   - 详见 `GTRS_PATH_CONVERSION.md`

## 相关文档

- [GTRS 路径自动转换](./kids-game-house/snake-vue3/GTRS_PATH_CONVERSION.md)
- [GTRS 根路径支持](./kids-game-house/snake-vue3/GTRS_ROOT_PATH_SUPPORT.md)
- [GTRS 资源校验器](./kids-game-house/snake-vue3/src/utils/gtrs-validator.ts)

## 下一步优化建议

1. **资源路径标准化工具**：
   - 提供工具函数将简单文件名转换为完整路径
   - 自动检测和修复无效路径

2. **资源管理界面**：
   - 在创作者中心显示资源上传状态
   - 提示未上传的资源

3. **批量上传功能**：
   - 支持批量上传主题资源
   - 自动更新主题配置中的路径
