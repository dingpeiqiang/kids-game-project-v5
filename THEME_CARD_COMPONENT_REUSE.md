# 主题卡片组件复用指南

## 📖 概述

`ThemeCard.vue` 是一个**统一的主题卡片展示组件**，用于在创作者中心和后台管理之间复用相同的视觉展示逻辑。

## 🎯 设计理念

### 问题背景
- **创作者中心**的 `MyThemesManagement.vue` 和 **后台管理**的 `ThemeManagement.vue` 都需要展示主题卡片
- 两个组件各自实现了一套相似的卡片展示逻辑
- 导致代码重复、维护成本高、样式不一致

### 解决方案
提取共同的主题卡片展示逻辑为独立组件 `ThemeCard.vue`，通过插槽机制支持自定义操作按钮。

## 💻 组件结构

```
ThemeCard.vue (基础展示组件)
├── 卡片封面（支持缩略图）
├── 状态标签（使用中/审核中/下架）
├── 价格标签
├── 主题名称（悬停显示描述）
├── 标签区域（官方/我的/已购等）
├── 归属信息（游戏/作者）
├── 统计数据（下载量/收益/评分）
└── 操作按钮插槽（由父组件自定义）
```

## 📋 Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `theme` | `any` | 必填 | 主题数据对象 |
| `mode` | `'creator' \| 'admin'` | `'creator'` | 显示模式 |
| `thumbnailUrl` | `string` | - | 自定义缩略图 URL |

### Mode 差异

| 特性 | creator 模式 | admin 模式 |
|------|-------------|-----------|
| 标签显示 | ✅ 显示来源标签 | ❌ 隐藏 |
| 归属信息 | 游戏 + 作者 | 作者 + 价格 |
| 统计数据 | 下载量 + 评分 + 创建时间 | 下载量 + 总收益 |
| 卡片底部 | 插槽内容 | 插槽内容 |

## 🎨 使用示例

### 1. 创作者中心使用

```vue
<template>
  <div class="themes-grid">
    <ThemeCard
      v-for="theme in myThemes"
      :key="theme.id"
      :theme="theme"
      mode="creator"
    >
      <!-- 自定义操作按钮 -->
      <template #actions>
        <button @click="handleView(theme)">👁️ 查看</button>
        <button @click="handleDIY(theme)">✨ DIY</button>
        <button v-if="!theme.isDefault" @click="handleUse(theme)">🎯 使用</button>
      </template>
    </ThemeCard>
  </div>
</template>

<script setup lang="ts">
import ThemeCard from '@/core/theme/components/ThemeCard.vue'

const myThemes = ref([...])

function handleView(theme) { /* ... */ }
function handleDIY(theme) { /* ... */ }
function handleUse(theme) { /* ... */ }
</script>
```

### 2. 后台管理使用

```vue
<template>
  <div class="theme-grid">
    <ThemeCard
      v-for="theme in themes"
      :key="theme.themeId"
      :theme="theme"
      mode="admin"
    >
      <!-- 管理员操作按钮 -->
      <template #actions>
        <template v-if="theme.status === 'pending'">
          <button @click="approveTheme(theme, true)">✅ 通过</button>
          <button @click="approveTheme(theme, false)">❌ 拒绝</button>
        </template>
        <template v-else>
          <button @click="viewDetail(theme)">👁️ 查看</button>
          <button @click="editTheme(theme)">✏️ 编辑</button>
          <button @click="toggleStatus(theme)">
            {{ theme.status === 'on_sale' ? '📥 下架' : '📤 上架' }}
          </button>
          <button @click="deleteTheme(theme)">🗑️ 删除</button>
        </template>
      </template>
    </ThemeCard>
  </div>
</template>

<script setup lang="ts">
import ThemeCard from '@/core/theme/components/ThemeCard.vue'

const themes = ref([...])

function approveTheme(theme, approved) { /* ... */ }
function viewDetail(theme) { /* ... */ }
function editTheme(theme) { /* ... */ }
function toggleStatus(theme) { /* ... */ }
function deleteTheme(theme) { /* ... */ }
</script>
```

## 🔧 集成到现有组件

### 方案一：改造 MyThemesManagement.vue

```vue
<!-- MyThemesManagement.vue -->
<template>
  <section class="my-themes">
    <!-- 头部 -->
    <div class="section-header">...</div>

    <!-- 主题网格 -->
    <div class="my-themes-grid">
      <ThemeCard
        v-for="theme in themes"
        :key="theme.id"
        :theme="theme"
        mode="creator"
      >
        <template #actions>
          <!-- 创作者中心的操作按钮 -->
          <button class="btn-action btn-view" @click="handleView(theme)">👁️ 查看</button>
          <button class="btn-action btn-diy" @click="handleDIY(theme)">✨ DIY</button>
          <!-- 其他按钮... -->
        </template>
      </ThemeCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import ThemeCard from '@/core/theme/components/ThemeCard.vue'
// ... 其他代码
</script>
```

### 方案二：改造 ThemeManagement.vue

```vue
<!-- ThemeManagement.vue -->
<template>
  <div class="theme-management">
    <!-- 顶部操作栏 -->
    <div class="action-bar">...</div>

    <!-- 主题网格 -->
    <div class="theme-grid">
      <ThemeCard
        v-for="theme in themes"
        :key="theme.themeId"
        :theme="theme"
        mode="admin"
      >
        <template #actions>
          <!-- 后台管理的操作按钮 -->
          <button @click="approveTheme(theme, true)" class="btn-approve">✅ 通过</button>
          <button @click="approveTheme(theme, false)" class="btn-reject">❌ 拒绝</button>
          <!-- 其他按钮... -->
        </template>
      </ThemeCard>
    </div>

    <!-- 分页 -->
    <div class="pagination">...</div>
  </div>
</template>

<script setup lang="ts">
import ThemeCard from '@/core/theme/components/ThemeCard.vue'
// ... 其他代码
</script>
```

## ✨ 优势

### 1. **代码复用**
- 消除重复的卡片展示代码
- 统一的视觉风格
- 减少维护成本

### 2. **灵活性**
- 通过插槽支持自定义操作
- 通过 mode prop 区分场景
- 易于扩展新功能

### 3. **一致性**
- 所有场景使用相同的卡片布局
- 数据统计展示自动适配场景
- 样式修改一处生效

## 📝 最佳实践

### 1. 数据格式标准化

确保传递给 `theme` prop 的数据包含以下字段：

```typescript
interface ThemeData {
  // 基本信息
  id?: number;
  themeId?: number;
  name?: string;
  themeName?: string;
  description?: string;
  
  // 状态
  status: 'on_sale' | 'offline' | 'pending';
  isCurrent?: boolean;
  isOfficial?: boolean;
  isDefault?: boolean;
  
  // 价格和统计
  price: number;
  downloadCount: number;
  totalRevenue?: number;
  rating?: number;
  
  // 媒体资源
  thumbnailUrl?: string;
  coverUrl?: string;
  
  // 归属信息
  authorName?: string;
  gameName?: string;
  ownerType?: 'GAME' | 'APPLICATION';
  
  // 来源标识（creator 模式）
  source?: 'official' | 'mine' | 'purchased';
  
  // 时间戳
  createdAt: string | number;
}
```

### 2. 响应式布局

使用 CSS Grid 实现自适应布局：

```scss
.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .themes-grid {
    grid-template-columns: 1fr;
  }
}
```

### 3. 事件处理

在父组件中统一处理业务逻辑：

```typescript
// 创作者中心
function handleToggleSale(theme: CloudThemeInfo) {
  // 调用后端 API 切换上下架
  await themeApi.toggleSale(theme.id);
  // 刷新列表
  await loadThemes();
}

// 后台管理
function approveTheme(theme: ThemeInfo, approved: boolean) {
  // 调用后端 API 审批
  await axios.post('/api/theme/approve', null, {
    params: { themeId: theme.themeId, approved }
  });
  // 刷新列表
  await loadThemes();
}
```

## 🚀 迁移步骤

### 阶段 1：创建基础组件
✅ 已完成：`ThemeCard.vue`

### 阶段 2：改造创作者中心
1. 在 `MyThemesManagement.vue` 中引入 `ThemeCard`
2. 移除原有的卡片模板代码
3. 使用插槽传递操作按钮
4. 测试功能正常

### 阶段 3：改造后台管理
1. 在 `ThemeManagement.vue` 中引入 `ThemeCard`
2. 移除原有的卡片模板代码
3. 使用插槽传递操作按钮
4. 测试功能正常

### 阶段 4：清理优化
1. 删除重复的样式代码
2. 更新相关文档
3. 进行代码审查

## 📊 对比分析

### 改造前
```
MyThemesManagement.vue (800+ 行)
├── 卡片模板（150 行）
├── 样式代码（300 行）
└── 业务逻辑（350 行）

ThemeManagement.vue (1000+ 行)
├── 卡片模板（150 行）
├── 样式代码（300 行）
└── 业务逻辑（550 行）

总计：~1800 行，重复代码 ~450 行
```

### 改造后
```
ThemeCard.vue (500 行) - 可复用组件
MyThemesManagement.vue (400 行) - 仅保留业务逻辑
ThemeManagement.vue (500 行) - 仅保留业务逻辑

总计：~1400 行，消除重复 ~400 行
```

## 🔗 相关文件

- 组件路径：`/kids-game-frontend/src/core/theme/components/ThemeCard.vue`
- 创作者中心：`/kids-game-frontend/src/modules/creator-center/components/MyThemesManagement.vue`
- 后台管理：`/kids-game-frontend/src/modules/admin/components/ThemeManagement.vue`

## 📝 更新日志

- **2026-03-22**: 创建统一的主题卡片组件 `ThemeCard.vue`
- **2026-03-22**: 支持 mode prop 区分不同场景
- **2026-03-22**: 实现插槽机制支持自定义操作

## ✅ 检查清单

在使用 `ThemeCard` 组件时，请确保：

- [ ] 正确传递 `theme` prop（包含必需字段）
- [ ] 设置正确的 `mode`（creator 或 admin）
- [ ] 提供 `#actions` 插槽内容（操作按钮）
- [ ] 处理所有需要的事件回调
- [ ] 验证响应式布局效果
- [ ] 测试不同状态下的显示（审核中/上架/下架）

---

**最后更新**: 2026-03-22  
**维护者**: 开发团队
