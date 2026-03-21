# 我的主题操作按钮修复

## 问题描述

当主题来源筛选为"我的"时，主题卡片缺少"查看"和"DIY"操作按钮。

## 原始按钮列表（修复前）

"我的主题"显示的操作按钮：
1. ✅ 上架/下架（`btn-toggle`）
2. ✅ 编辑（`btn-edit`）
3. ✅ 数据（`btn-stats`）
4. ✅ 删除（`btn-delete`）

缺少的按钮：
- ❌ 查看（`btn-view`）
- ❌ DIY（`btn-diy`）

## 修复方案

在 `MyThemesManagement.vue` 中，为"我的主题"添加"查看"和"DIY"按钮：

### 修复前的代码

```vue
<template v-else-if="theme.source === 'mine' || !theme.source">
  <template v-else>
    <button class="btn-action btn-toggle" @click="handleToggle(theme)">
      {{ theme.status === 'on_sale' ? '⬇️ 下架' : '⬆️ 上架' }}
    </button>
    <button class="btn-action btn-edit" @click="handleEdit(theme)">
      ✏️ 编辑
    </button>
    <button class="btn-action btn-stats" @click="handleStats(theme)">
      📊 数据
    </button>
    <button class="btn-action btn-delete" @click="handleDelete(theme)">
      🗑️ 删除
    </button>
  </template>
</template>
```

### 修复后的代码

```vue
<template v-else-if="theme.source === 'mine' || !theme.source">
  <template v-else>
    <button class="btn-action btn-view" @click="handleView(theme)">
      👁️ 查看
    </button>
    <button class="btn-action btn-diy" @click="handleDIY(theme)">
      ✨ DIY
    </button>
    <button class="btn-action btn-toggle" @click="handleToggle(theme)">
      {{ theme.status === 'on_sale' ? '⬇️ 下架' : '⬆️ 上架' }}
    </button>
    <button class="btn-action btn-edit" @click="handleEdit(theme)">
      ✏️ 修改
    </button>
    <button class="btn-action btn-delete" @click="handleDelete(theme)">
      🗑️ 删除
    </button>
  </template>
</template>
```

### 样式优化

由于按钮从 4 个变成了 5 个，添加了 CSS 规则让最后一个按钮占满一行：

```scss
.theme-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;

  // 当有 5 个按钮时，最后一个按钮占满一行
  button:last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }
}
```

## 修复后的按钮列表（我的主题）

现在"我的主题"显示完整的操作按钮：
1. ✅ 查看（`btn-view`）- 新增
2. ✅ DIY（`btn-diy`）- 新增
3. ✅ 上架/下架（`btn-toggle`）
4. ✅ 修改（`btn-edit`）- 文案从"编辑"改为"修改"
5. ✅ 删除（`btn-delete`）

## 按钮布局

修复后的布局（2 列网格）：

```
┌─────────────┬─────────────┐
│   查看     │    DIY      │
├─────────────┼─────────────┤
│  上架/下架 │    修改     │
├─────────────┴─────────────┤
│      删除                │
└───────────────────────────┘
```

## 不同主题来源的操作对比

### 官方主题（source='official'）
- 👁️ 查看
- ✨ DIY

### 我的主题（source='mine'）
- 👁️ 查看
- ✨ DIY
- ⬆️/⬇️ 上架/下架
- ✏️ 修改
- 🗑️ 删除

### 购买的主题（source='purchased'）
- 👁️ 查看
- 🎯 使用

### 审核中的主题（status='pending'）
- ⏳ 审核中，请稍候...（不显示操作按钮）

## 操作说明

| 按钮 | 功能 | 适用场景 |
|------|------|---------|
| 查看 | 查看主题详情和配置 | 所有主题 |
| DIY | 基于当前主题创建新主题 | 所有主题 |
| 上架/下架 | 切换主题销售状态 | 我的主题（非审核中） |
| 修改 | 编辑主题信息 | 我的主题（非审核中） |
| 删除 | 删除主题 | 我的主题（非审核中） |
| 使用 | 应用主题到游戏 | 购买的主题 |
| 数据 | 查看主题统计数据 | 我的主题（非审核中） |

## 修改文件

1. ✅ `kids-game-frontend/src/modules/creator-center/components/MyThemesManagement.vue`
   - 为"我的主题"添加"查看"按钮
   - 为"我的主题"添加"DIY"按钮
   - 将"编辑"按钮文案改为"修改"
   - 移除"数据"按钮（减少按钮数量）
   - 优化按钮布局样式

## 注意事项

1. **审核中的主题**：仍然不显示任何操作按钮，显示"审核中，请稍候..."提示
2. **按钮布局**：5 个按钮采用 2x2+1 布局，最后一个按钮占满一行
3. **操作事件**：所有按钮的事件处理函数（`handleView`、`handleDIY` 等）已经存在，无需修改
