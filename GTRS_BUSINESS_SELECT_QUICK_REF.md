# GTRS 编辑器业务选择优化 - 快速参考

## 🎯 核心变化

### 一个字段 → 两个字段

| 修改前 | 修改后 |
|--------|--------|
| 适用游戏（1 个字段） | **适用业务类型** + **适用业务**（2 个字段） |

---

## 📋 字段说明

### 1. 适用业务类型 (ownerType)

- **类型**：`'GAME' | 'APPLICATION'`
- **选项**：
  - ○ 游戏
  - ○ 应用
- **作用**：确定主题所属的大类
- **提示**："选择主题所属的业务类型"

---

### 2. 适用业务 (ownerId)

- **类型**：`number`（数据库主键）
- **数据源**：根据 `ownerType` 动态加载
  - GAME → 游戏列表
  - APPLICATION → 应用列表
- **显示格式**：`名称 + 编码`
  ```
  贪吃蛇大冒险    snake-vue3
  植物大战僵尸    pvz
  ```
- **作用**：确定具体的业务，决定资源加载路径
- **提示**："选择具体的 XX，将决定主题的资源加载路径"

---

## 🔧 数据结构

```typescript
type BusinessItem = { 
  label: string      // 显示名称
  value: string      // 前端标识
  dbId: number       // 数据库主键
  code: string       // 业务编码
}

// 当前业务列表（根据类型动态切换）
const currentBusinessList = computed(() => {
  if (formData.value.ownerType === 'GAME') {
    return gameList.value
  } else {
    return appList.value
  }
})
```

---

## 🎨 界面效果

### 业务类型选择

```
┌──────────────────────┐
│ 适用业务类型 *       │
│ [请选择业务类型 ▼]   │
│                      │
│ ○ 游戏               │
│ ○ 应用               │
└──────────────────────┘
ℹ️ 选择主题所属的业务类型
```

### 业务选择（带编码显示）

```
┌─────────────────────────────────┐
│ 适用业务 *                      │
│ [请选择游戏 ▼]                  │
│ ┌─────────────────────────────┐ │
│ │ 贪吃蛇大冒险    snake-vue3 │ │ ← 右侧灰色显示编码
│ │ 植物大战僵尸    pvz        │ │
│ │ 超级染色体      chromosome │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
ℹ️ 选择具体的游戏，将决定主题的资源加载路径
```

---

## ⚡ 交互逻辑

### 切换业务类型

```typescript
handleOwnerTypeChange(newOwnerType) {
  // 1. 检查是否禁用
  if (disabled) {
    showWarning('当前模式不可更改业务类型')
    return
  }
  
  // 2. 重置已选择的业务
  formData.ownerId = undefined
  
  console.log('切换业务类型:', newOwnerType)
}
```

**效果**：从"游戏"切换到"应用"时，会自动清空已选择的游戏

---

### 选择具体业务

```typescript
handleBusinessChange(selectedDbId) {
  // 1. 检查是否禁用
  if (disabled) {
    showWarning('当前模式不可更改适用业务')
    return
  }
  
  // 2. 查找选中的业务
  const selected = currentBusinessList.find(g => g.dbId === selectedDbId)
  
  // 3. 生成主题 ID
  if (selected) {
    const businessCode = selected.code.replace(/-/g, '_')
    formData.themeId = `theme_${businessCode}_${Date.now()}`
  }
  
  console.log('选择业务:', selectedDbId)
}
```

**效果**：选择"贪吃蛇"后，自动生成主题 ID `theme_snake_vue3_xxx`

---

## 📊 数据流转

```
用户操作 → 表单数据 → 发布数据
     ↓          ↓          ↓
选择类型 → ownerType → ownerType: 'GAME'
选择业务 → ownerId   → ownerId: 1
                     → gameCode: 'SNAKE_VUE3' (从 code 转换)
```

---

## ✅ 验证清单

在浏览器控制台检查：

```javascript
// 1. 查看表单数据
console.log(this.formData)
// 应该看到：
{
  ownerType: "GAME",
  ownerId: 1,
  themeId: "theme_snake_vue3_xxx"
}

// 2. 查看业务列表
console.log(this.currentBusinessList)
// 应该看到：
[
  {
    label: "贪吃蛇大冒险",
    dbId: 1,
    code: "snake-vue3"
  },
  ...
]

// 3. 查看下拉选项渲染
// 每个选项应该显示：
// 左侧：贪吃蛇大冒险
// 右侧：snake-vue3 (灰色小字)
```

---

## 🐛 常见问题

### Q1: 为什么要拆分为两个字段？

**A**: 
- 让用户清楚地知道选择了什么类型的业务
- 避免游戏和应用混在一起难以查找
- 为未来扩展更多业务类型做准备

---

### Q2: 切换业务类型会发生什么？

**A**: 
- ✅ 会清空已选择的业务
- ✅ 下拉列表会刷新为新类型的业务
- ✅ 主题 ID 会重新生成

---

### Q3: 业务编码有什么用？

**A**: 
- 用于生成主题 ID
- 用于转换 gameCode（资源加载标识）
- 帮助用户识别具体业务

---

## 📚 相关文档

- [完整优化说明](./GTRS_EDITOR_BUSINESS_SELECT_OPTIMIZATION.md)
- [GTRS 规范重构](./GTRS_SCHEMA_REFACTOR_OWNER_FIELDS.md)
- [快速参考](./GTRS_REFACTOR_QUICK_REFERENCE.md)

---

**更新时间**：2026-03-22  
**维护者**：Kids Game Platform Team
