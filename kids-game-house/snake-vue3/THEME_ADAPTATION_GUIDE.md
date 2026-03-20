# 贪吃蛇游戏主题资源架构适配指南

## 📋 任务完成清单

### ✅ 已完成的工作

1. **删除 frontend 中的贪吃蛇代码**
   - ✅ 已移除：`kids-game-frontend/src/modules/game/games/snake-vue3/`
   
2. **创建主题资源配置系统**
   - ✅ `src/config/theme.config.ts` - 主题配置定义
   - ✅ `src/config/game-assets.config.ts` - 游戏资源管理
   - ✅ `src/stores/theme.ts` - 主题状态管理
   - ✅ 更新 `tailwind.config.js` - 支持主题 CSS 变量
   - ✅ 更新 `src/main.ts` - 主题初始化

3. **迁移数据库脚本**
   - ✅ `register-game.sql` - 游戏注册脚本（已移至 snake-vue3 目录）

## 🎨 主题系统功能

### 支持的预设主题

1. **经典贪吃蛇** - 传统绿色风格
2. **糖果乐园** - 甜美可爱风格
3. **太空探索** - 未来科技风格
4. **海洋世界** - 海底世界风格
5. **暗黑之地** - 黑暗神秘风格

### 主题自定义能力

每个主题包含：
- **颜色方案**: 主色、背景色、强调色等 10 种颜色
- **资源资产**: 蛇头、蛇身、食物、背景等（支持 emoji 和图片）
- **音效配置**: BGM、吃食物、死亡等音效
- **UI 样式**: 按钮、面板、边框等样式

## 🚀 使用方式

### 在游戏中使用主题

```typescript
import { useThemeStore } from './stores/theme'

const themeStore = useThemeStore()

// 获取当前主题
console.log(themeStore.currentTheme)

// 切换主题
themeStore.switchTheme('candy')

// 获取主题列表
console.log(themeStore.themeList)
```

### 在 Vue 组件中使用主题

```vue
<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const currentTheme = themeStore.currentTheme
</script>

<template>
  <div :style="{ backgroundColor: currentTheme.colors.background }">
    <h1 :style="{ color: currentTheme.colors.text }">{{ currentTheme.name }}</h1>
  </div>
</template>
```

### 使用 Tailwind 主题类

```vue
<template>
  <div class="bg-theme-background text-theme-text">
    <button class="bg-theme-primary hover:bg-theme-secondary text-white rounded-theme">
      开始游戏
    </button>
  </div>
</template>
```

## 🎮 自定义资源

### 替换游戏资源

1. **准备资源文件**
   - 图片：PNG 格式，透明背景
   - 音频：MP3 或 WAV 格式
   
2. **放置资源文件**
   ```
   public/assets/game/
   ├── snake/
   │   ├── head.png
   │   ├── body.png
   │   └── tail.png
   ├── food/
   │   ├── apple.png
   │   ├── strawberry.png
   │   └── coin.png
   └── audio/
       ├── eat.mp3
       ├── die.mp3
       └── bgm.mp3
   ```

3. **修改资源配置**
   编辑 `src/config/game-assets.config.ts`：
   ```typescript
   export const SNAKE_ASSETS = {
     head: {
       type: 'image',
       defaultPath: 'assets/game/snake/head.png',
       customPath: 'assets/game/snake/custom-head.png', // 设置自定义路径
       fallback: 'emoji',
       emoji: '🐍',
       specs: { ... }
     }
   }
   ```

4. **刷新游戏** - 重新加载页面即可生效

## 📝 下一步优化建议

### 短期优化
1. 更新游戏组件以使用主题资源
2. 添加主题选择 UI 界面
3. 测试所有主题的视觉效果

### 中期优化
1. 支持自定义主题创建
2. 支持主题导入/导出
3. 添加更多预设主题

### 长期优化
1. 支持动态下载主题包
2. 支持玩家创作和分享主题
3. 主题商城系统

## 🔧 技术细节

### CSS 变量映射

主题系统会自动设置以下 CSS 变量：
```css
:root {
  --theme-primary: #4ade80;
  --theme-secondary: #22c55e;
  --theme-background: #1e293b;
  --theme-surface: #334155;
  --theme-text: #ffffff;
  --theme-text-secondary: #94a3b8;
  --theme-accent: #fbbf24;
  --theme-success: #22c55e;
  --theme-warning: #f59e0b;
  --theme-error: #ef4444;
  --theme-shadow: 0 4px 6px rgba(0,0,0,0.3);
  --theme-glow: 0 0 10px rgba(74,222,128,0.5);
  --theme-border: 2px solid #4ade80;
  --theme-border-radius: 8px;
}
```

### Tailwind 配置扩展

```javascript
theme: {
  extend: {
    colors: {
      'theme-primary': 'var(--theme-primary)',
      'theme-background': 'var(--theme-background)',
      // ... 其他主题色
    },
    boxShadow: {
      'theme': 'var(--theme-shadow)',
      'theme-glow': 'var(--theme-glow)'
    }
  }
}
```

## 📚 相关文件

- `src/config/theme.config.ts` - 主题配置定义
- `src/config/game-assets.config.ts` - 游戏资源配置
- `src/stores/theme.ts` - 主题状态管理
- `tailwind.config.js` - Tailwind 主题配置
- `src/main.ts` - 主题初始化
- `register-game.sql` - 数据库注册脚本

## ✅ 验证清单

- [x] 删除 frontend 中的贪吃蛇目录
- [ ] 运行游戏查看主题是否正常
- [ ] 测试切换主题功能
- [ ] 验证 CSS 变量是否正确应用
- [ ] 测试 Tailwind 主题类是否生效
- [ ] 执行数据库注册脚本
- [ ] 在游戏列表中查看贪吃蛇是否正常显示

---

**完成时间**: 2026-03-16  
**适配版本**: v2.0 (主题资源架构)
