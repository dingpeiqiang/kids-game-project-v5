# 主题管理组件复用指南

## 📖 概述

`MyThemesManagement.vue` 组件现已支持通过 `mode` prop 复用后台管理的主题管理功能。

## 🎯 核心特性

### 1. **模式切换**
通过 `mode` prop 区分不同使用场景：
- `'creator'` (默认): 创作者中心模式 - 显示 DIY、使用等创作相关功能
- `'admin'`: 后台管理模式 - 显示审批、上下架等管理功能

### 2. **功能差异**

#### 创作者中心模式 (`mode="creator"`)
- ✅ 查看主题
- ✨ DIY 主题
- 🎯 使用主题
- ⬆️/⬇️ 上架/下架（仅自己的主题）
- ✏️ 编辑（仅自己的主题）
- 🗑️ 删除（仅自己的主题）
- ⏳ 审核中状态提示

#### 后台管理模式 (`mode="admin"`)
- 👁️ 查看所有主题
- ✅ 通过审核（pending 状态）
- ❌ 拒绝审核（pending 状态）
- ✏️ 编辑任何主题
- 📤/📥 上架/下架任何主题
- 🗑️ 删除任何主题

## 💻 使用示例

### 1. 创作者中心使用

```vue
<template>
  <MyThemesManagement
    :themes="myThemes"
    :loading="loading"
    mode="creator"
    @view="handleView"
    @diy="handleDIY"
    @use="handleUse"
    @toggle="handleToggle"
    @edit="handleEdit"
    @delete="handleDelete"
  />
</template>

<script setup lang="ts">
import MyThemesManagement from '@/modules/creator-center/components/MyThemesManagement.vue'

const myThemes = ref([...]) // 当前用户的主题列表

function handleView(theme) { /* ... */ }
function handleDIY(theme) { /* ... */ }
function handleUse(theme) { /* ... */ }
function handleToggle(theme) { /* ... */ }
function handleEdit(theme) { /* ... */ }
function handleDelete(theme) { /* ... */ }
</script>
```

### 2. 后台管理使用

```vue
<template>
  <MyThemesManagement
    :themes="allThemes"
    :loading="loading"
    mode="admin"
    @view="handleView"
    @toggle="handleToggle"
    @edit="handleEdit"
    @delete="handleDelete"
    @approve="handleApprove"
  />
</template>

<script setup lang="ts">
import MyThemesManagement from '@/modules/creator-center/components/MyThemesManagement.vue'

const allThemes = ref([...]) // 所有主题列表

function handleView(theme) { /* ... */ }
function handleToggle(theme) { /* ... */ }
function handleEdit(theme) { /* ... */ }
function handleDelete(theme) { /* ... */ }
function handleApprove(theme, approved) { 
  // approved: true - 通过审核
  // approved: false - 拒绝审核
}
</script>
```

## 📋 Props 说明

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `themes` | `any[]` | 必填 | 主题列表数据 |
| `loading` | `boolean` | `false` | 是否显示加载状态 |
| `mode` | `'creator' \| 'admin'` | `'creator'` | 使用模式 |

## 📤 Events 说明

### 通用事件
- `view(theme)`: 查看主题详情
- `toggle(theme)`: 切换上下架状态
- `edit(theme)`: 编辑主题
- `delete(theme)`: 删除主题

### 创作者中心专用
- `diy(theme)`: DIY 主题
- `use(theme)`: 使用主题

### 后台管理专用
- `approve(theme, approved)`: 审批主题
  - `approved: true` - 通过
  - `approved: false` - 拒绝

## 🎨 UI 差异

### 标题显示
- **创作者中心**: `🎨 我的主题` + 描述文本
- **后台管理**: `🛡️ 主题管理`

### 操作按钮布局
- **创作者中心**: 2 列网格，支持 DIY、使用等按钮
- **后台管理**: 2 列网格，支持审批按钮

### 状态标签
- **创作者中心**: 显示来源标签（官方/我的/已购）
- **后台管理**: 简化显示，专注状态管理

## 🔧 实现细节

### 1. 模式判断逻辑
```typescript
// 模板中的条件渲染
<template v-if="mode === 'admin'">
  <!-- 后台管理功能 -->
</template>

<template v-else>
  <!-- 创作者中心功能 -->
</template>
```

### 2. 按钮样式
后台管理专用按钮样式：
```scss
.btn-approve {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
  border: 1px solid #52c41a;
}

.btn-reject {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
  border: 1px solid #f56c6c;
}
```

## ✅ 优势

1. **代码复用**: 避免重复实现相同的展示逻辑
2. **一致性**: 确保不同场景下的 UI 风格统一
3. **易维护**: 修改一处即可同时影响两个场景
4. **可扩展**: 易于添加新的模式和功能

## 🚀 最佳实践

1. **数据隔离**: 父组件负责传递正确的数据源
   - 创作者中心：仅传递当前用户的主题
   - 后台管理：传递所有主题

2. **事件处理**: 根据模式处理不同的业务逻辑
   ```typescript
   function handleToggle(theme) {
     if (mode === 'admin') {
       // 管理员操作逻辑
     } else {
       // 创作者操作逻辑
     }
   }
   ```

3. **权限控制**: 后端应验证用户权限
   - 创作者只能操作自己的主题
   - 管理员可以操作所有主题

## 📝 更新日志

- **2026-03-22**: 添加 `mode` prop 支持后台管理模式
- **2026-03-22**: 新增审批功能按钮
- **2026-03-22**: 优化按钮样式区分不同模式

## 🔗 相关文件

- 组件路径：`/kids-game-frontend/src/modules/creator-center/components/MyThemesManagement.vue`
- 后台管理：`/kids-game-frontend/src/modules/admin/components/ThemeManagement.vue`
- 创作者中心：`/kids-game-frontend/src/core/theme/CreatorCenter.vue`
