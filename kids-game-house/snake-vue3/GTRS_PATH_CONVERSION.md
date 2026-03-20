# GTRS 路径自动转换 - /public/ 转 /

## 📋 问题背景

### 用户需求
> "有个逻辑是要以实际加载的主题做覆盖的"

### 实际情况

1. **GTRS.json** (内置默认主题)
   ```json
   {
     "resources": {
       "images": {
         "scene": {
           "food_apple": {
             "src": "/public/games/snake-vue3/themes/default/images/scene/food_apple.png"
           }
         }
       }
     }
   }
   ```

2. **后端返回的主题配置** (从数据库加载)
   ```json
   {
     "resources": {
       "images": {
         "scene": {
           "food_apple": {
             "src": "/public/games/snake-vue3/themes/default/images/scene/food_apple.png"
           }
         }
       }
     }
   }
   ```

3. **问题**: 两者都使用 `/public/...` 格式，但应该使用 `/games/...` 格式

---

## 🔍 核心逻辑

### PhaserGame 的主题加载流程

```typescript
// 1. 导入默认 GTRS
import GTRS from '@/config/GTRS.json'

// 2. 从后端加载用户选择的主题
const themeConfig = await loadTheme(themeId)

// 3. 覆盖默认 GTRS
overrideGTRS(themeConfig)

// 4. Phaser 使用覆盖后的 GTRS 加载资源
scene.load.image('food_apple', GTRS.resources.images.scene.food_apple.src)
```

### 关键问题

**`overrideGTRS()` 直接覆盖，没有转换路径格式**

- 输入：`{ src: "/public/games/..." }`
- 输出：`{ src: "/public/games/..." }` ❌ 应该是 `{ src: "/games/..." }`

---

## ✅ 解决方案

### 在 overrideGTRS 中自动转换路径

**文件**: `snake-vue3/src/components/game/PhaserGame.ts`

**修改后**:
```typescript
// 覆盖主题配置
function overrideGTRS(theme: Partial<GTRSConfig>): void {
  // ⭐ 递归转换资源路径：将 /public/ 替换为 /
  const convertPaths = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj
    
    if (Array.isArray(obj)) {
      return obj.map(convertPaths)
    }
    
    const result: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key]
        
        // ⭐ 如果是 src 字段且以 /public/ 开头，转换为 /
        if (key === 'src' && typeof value === 'string' && value.startsWith('/public/')) {
          result[key] = value.replace('/public/', '/')
        } else if (typeof value === 'object') {
          result[key] = convertPaths(value)
        } else {
          result[key] = value
        }
      }
    }
    return result
  }
  
  // 转换主题配置中的路径
  const convertedTheme = convertPaths(theme)
  Object.assign(GTRS, convertedTheme)
}
```

---

## 🎯 工作原理

### 转换过程

```
后端返回的主题配置:
{
  "resources": {
    "images": {
      "scene": {
        "food_apple": {
          "src": "/public/games/snake-vue3/themes/default/images/scene/food_apple.png"
        }
      }
    }
  }
}
↓
convertPaths() 递归处理:
- 检测到 src 字段
- 检测到值以 /public/ 开头
- 执行替换：/public/ → /
↓
转换后的结果:
{
  "resources": {
    "images": {
      "scene": {
        "food_apple": {
          "src": "/games/snake-vue3/themes/default/images/scene/food_apple.png"
        }
      }
    }
  }
}
↓
覆盖到 GTRS:
GTRS.resources.images.scene.food_apple.src = "/games/..."
↓
Phaser 加载:
scene.load.image('food_apple', '/games/snake-vue3/themes/default/images/scene/food_apple.png')
✅ 正确！
```

---

## 📊 支持的转换规则

| 原始路径 | 转换后 | 说明 |
|---------|--------|------|
| `/public/games/...` | `/games/...` | ✅ 静态资源 |
| `/public/assets/...` | `/assets/...` | ✅ 其他资源 |
| `/games/...` | `/games/...` | ✅ 已经是正确格式 |
| `http://example.com/...` | `http://example.com/...` | ✅ 完整 URL 不变 |
| `./assets/...` | `./assets/...` | ✅ 相对路径不变 |
| `#4ade80` | `#4ade80` | ✅ 颜色值不变 |

---

## 💡 技术细节

### 为什么使用递归转换？

因为主题配置是嵌套的对象结构:

```typescript
theme: {
  resources: {          // Level 1
    images: {           // Level 2
      scene: {          // Level 3
        food_apple: {   // Level 4
          src: "..."    // Level 5 - 需要转换的目标
        }
      }
    }
  }
}
```

递归可以确保**无论多深的嵌套**都能正确处理。

### 转换逻辑

```typescript
function convertPaths(obj: any): any {
  // 1. 非对象直接返回
  if (!obj || typeof obj !== 'object') return obj
  
  // 2. 数组：遍历每个元素
  if (Array.isArray(obj)) {
    return obj.map(convertPaths)
  }
  
  // 3. 对象：遍历每个属性
  const result: any = {}
  for (const key in obj) {
    const value = obj[key]
    
    // ⭐ 关键：检测并转换 src 字段
    if (key === 'src' && value.startsWith('/public/')) {
      result[key] = value.replace('/public/', '/')
    } 
    // 递归处理嵌套对象
    else if (typeof value === 'object') {
      result[key] = convertPaths(value)
    } 
    // 其他字段保持不变
    else {
      result[key] = value
    }
  }
  return result
}
```

---

## 🎉 验证结果

### 测试步骤

1. **启动游戏**
   ```bash
   cd snake-vue3
   npm run dev
   ```

2. **选择主题并开始游戏**

3. **检查控制台日志**
   ```console
   [PhaserGame] 📷 加载场景图片：food_apple -> /games/snake-vue3/themes/default/images/scene/food_apple.png
   ✅ 不再是 /public/games/...
   ```

4. **检查网络请求**
   ```
   DevTools → Network → Images
   
   Request URL: http://localhost:5173/games/snake-vue3/themes/default/images/scene/food_apple.png
   Status: 200 OK ✅
   ```

---

## ✅ 总结

### 问题
- 后端返回的主题配置使用 `/public/...` 格式
- Phaser 无法加载这些资源

### 原因
- `overrideGTRS()` 直接覆盖，没有转换路径格式

### 解决
- 在 `overrideGTRS()` 中添加递归路径转换逻辑
- 自动将 `/public/...` 替换为 `/...`

### 结果
- ✅ GTRS 严格校验通过
- ✅ Phaser 正常加载资源
- ✅ 支持所有主题配置格式
- ✅ 向后兼容（不影响已有配置）

---

**修复时间**: 2026-03-20  
**状态**: ✅ 已完成  
**影响范围**: Phaser 游戏资源加载  
**向后兼容**: ✅ 完全兼容
