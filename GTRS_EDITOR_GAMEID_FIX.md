# GTRS 编辑器业务选择 - gameId 修正

## 📋 问题描述

用户反馈："不对，使用业务的枚举 不要使用 code，应该是 gameId"

**核心问题**：
- ❌ 之前使用了 `gameCode` 作为选项的 value
- ❌ 主题 ID 生成基于 gameCode（如 `theme_snake_vue3_xxx`）
- ✅ **应该直接使用数据库主键 gameId**

---

## ✅ 修正方案

### 1. 数据结构调整

#### 修改前
```typescript
type BusinessItem = { 
  label: string      // 显示名称
  value: string      // ❌ 前端标识（game_snake_v3）
  dbId: number       // 数据库主键
  code: string       // 业务编码
}
```

#### 修改后
```typescript
type BusinessItem = { 
  label: string      // 显示名称
  value: number      // ⭐ 数据库主键（gameId）
  dbId: number       // 数据库主键（与 value 相同）
  code?: string      // 业务编码（仅用于显示）
}
```

---

### 2. 数据加载逻辑

#### 修改前
```typescript
gameList.value = games.map((g: any) => ({
  label: g.gameName || '未知游戏',
  value: `game_${(g.gameCode || '').toLowerCase()}`,  // ❌ 错误：使用 gameCode
  dbId: g.gameId,
  code: g.gameCode
}))
```

#### 修改后
```typescript
gameList.value = games.map((g: any) => ({
  label: g.gameName || '未知游戏',
  value: g.gameId,    // ⭐ 正确：直接使用数据库主键 gameId
  dbId: g.gameId,     // 与 value 相同
  code: g.gameCode    // 仅用于显示
}))
```

---

### 3. 主题 ID 生成规则

#### 修改前
```typescript
// ❌ 基于 gameCode 生成
const businessCode = selected.code.replace(/-/g, '_')
formData.themeId = `theme_${businessCode}_${Date.now()}`
// 结果：theme_snake_vue3_1711094400
```

#### 修改后
```typescript
// ⭐ 基于数据库主键 gameId 生成
formData.themeId = `theme_${formData.ownerType.toLowerCase()}_${selectedDbId}_${Date.now()}`
// 结果：theme_game_1_1711094400
```

---

## 🎯 完整示例

### 后端返回数据
```json
[
  {
    "gameId": 1,           // ⭐ 数据库主键
    "gameCode": "snake-vue3",
    "gameName": "贪吃蛇大冒险"
  },
  {
    "gameId": 2,
    "gameCode": "pvz",
    "gameName": "植物大战僵尸"
  }
]
```

### 前端转换结果
```typescript
gameList.value = [
  {
    label: "贪吃蛇大冒险",
    value: 1,        // ⭐ 数据库主键
    dbId: 1,         // 与 value 相同
    code: "snake-vue3"  // 仅用于显示
  },
  {
    label: "植物大战僵尸",
    value: 2,        // ⭐ 数据库主键
    dbId: 2,
    code: "pvz"
  }
]
```

### 用户选择后的效果

```
用户选择：贪吃蛇大冒险 (gameId=1)
    ↓
表单数据：
{
  ownerType: "GAME",
  ownerId: 1,              // ⭐ 直接存储数据库主键
  themeId: "theme_game_1_1711094400"  // ⭐ 基于 gameId 生成
}
    ↓
发布数据：
{
  ownerType: "GAME",
  ownerId: 1,              // ⭐ 数据库主键
  gameCode: "SNAKE_VUE3"   // 从 gameId 查询得到
}
```

---

## 📊 对比分析

### 旧方案（基于 gameCode）

| 步骤 | 操作 | 问题 |
|------|------|------|
| 1 | 用户选择游戏 | value = "game_snake_v3" |
| 2 | 生成主题 ID | theme_snake_vue3_xxx |
| 3 | 发布时 | 需要从 gameCode 反查 gameId |
| 4 | 数据库存储 | 需要额外查询，性能低 |

**缺点**：
- ❌ 需要额外的查询来关联 gameId
- ❌ gameCode 可能变化，导致主题 ID 不稳定
- ❌ 增加后端复杂度

---

### 新方案（基于 gameId）

| 步骤 | 操作 | 优势 |
|------|------|------|
| 1 | 用户选择游戏 | value = 1（数据库主键） |
| 2 | 生成主题 ID | theme_game_1_xxx |
| 3 | 发布时 | 直接使用 ownerId=1 |
| 4 | 数据库存储 | 无需额外查询，直接关联 |

**优点**：
- ✅ 直接使用数据库主键，无需转换
- ✅ 性能最优，无额外查询
- ✅ 数据一致性强
- ✅ 符合数据库设计规范

---

## 🔧 关键代码改动

### 1. TypeScript 类型定义

```typescript
// ⭐ 修改 value 的类型为 number
type BusinessItem = { 
  label: string      
  value: number      // ← 从 string 改为 number
  dbId: number       
  code?: string      
}
```

---

### 2. 数据映射

```typescript
// ⭐ 直接使用 gameId
gameList.value = games.map((g: any) => ({
  label: g.gameName || '未知游戏',
  value: g.gameId,    // ← 关键改动
  dbId: g.gameId,
  code: g.gameCode
}))
```

---

### 3. 主题 ID 生成

```typescript
// ⭐ 基于数据库主键生成
const handleBusinessChange = (selectedDbId: number) => {
  const selected = currentBusinessList.value.find(g => g.dbId === selectedDbId)
  if (selected) {
    // theme_{业务类型}_{ownerId}_{时间戳}
    formData.value.themeId = `theme_${formData.value.ownerType.toLowerCase()}_${selectedDbId}_${Date.now()}`
  }
}
```

---

## 📝 UI 展示

### 下拉选项格式

```
┌─────────────────────────────┐
│ 请选择游戏                  │
├─────────────────────────────┤
│ 贪吃蛇大冒险          1     │ ← 左侧显示名称，右侧显示 gameId
│ 植物大战僵尸          2     │
│ 超级染色体            3     │
└─────────────────────────────┘
```

**代码实现**：
```vue
<el-option
  v-for="item in currentBusinessList"
  :key="item.dbId"
  :label="item.label"
  :value="item.dbId"  <!-- ⭐ number 类型 -->
>
  <span style="float: left">{{ item.label }}</span>
  <span style="float: right; color: #8492a6; font-size: 13px">
    {{ item.dbId }}  <!-- ⭐ 显示 gameId -->
  </span>
</el-option>
```

---

## 🎯 数据流转

### 完整流程

```
1. 后端返回游戏列表
   [
     { gameId: 1, gameCode: "snake-vue3", gameName: "贪吃蛇" },
     { gameId: 2, gameCode: "pvz", gameName: "植物大战僵尸" }
   ]
   ↓
2. 前端转换为 BusinessItem
   [
     { label: "贪吃蛇", value: 1, dbId: 1, code: "snake-vue3" },
     { label: "植物大战僵尸", value: 2, dbId: 2, code: "pvz" }
   ]
   ↓
3. 用户选择游戏
   选中：value = 1
   ↓
4. 生成主题 ID
   theme_game_1_1711094400
   ↓
5. 表单数据
   {
     ownerType: "GAME",
     ownerId: 1,           // ⭐ 数据库主键
     themeId: "theme_game_1_1711094400"
   }
   ↓
6. 发布到后端
   {
     ownerType: "GAME",
     ownerId: 1,           // ⭐ 直接使用
     gameCode: "SNAKE_VUE3" // 可选：从 gameId 查询得到
   }
```

---

## ✅ 验证清单

### 浏览器控制台检查

```javascript
// 1. 查看游戏列表数据结构
console.log(this.gameList)
// 应该看到：
// [
//   { label: "贪吃蛇", value: 1, dbId: 1, code: "snake-vue3" },
//   ...
// ]

// 2. 查看选中的值
console.log(this.formData.ownerId)
// 应该是一个数字，如：1

// 3. 查看生成的主题 ID
console.log(this.formData.themeId)
// 应该看到：theme_game_1_xxxxx

// 4. 查看发布的最终数据
console.log(uploadData)
// 应该看到：
// {
//   ownerType: "GAME",
//   ownerId: 1,
//   gameCode: "SNAKE_VUE3"
// }
```

---

## 🐛 注意事项

### 1. 降级数据的 gameId

```typescript
// ⭐ 硬编码的降级数据也要使用正确的 gameId
gameList.value = [
  { label: '贪吃蛇', value: 1, dbId: 1, code: 'snake-vue3' },
  { label: '植物大战僵尸', value: 2, dbId: 2, code: 'pvz' },
  { label: '飞行射击', value: 3, dbId: 3, code: 'shooter' }
]
```

---

### 2. 主题 ID 格式变化

**修改前**：`theme_snake_vue3_1711094400`  
**修改后**：`theme_game_1_1711094400`

**影响**：
- ✅ 主题 ID 更短，更简洁
- ✅ 直接体现数据库主键
- ⚠️ 可能需要更新相关的解析逻辑

---

### 3. 后端兼容性

确保后端能够正确处理：
```java
// ⭐ 优先使用 ownerId（数据库主键）
if (dto.getOwnerId() != null) {
    game = gameRepository.findById(dto.getOwnerId());
} else if (dto.getGameCode() != null) {
    // 降级方案
    game = gameRepository.findByGameCode(dto.getGameCode());
}
```

---

## 📚 相关文档

- [GTRS 编辑器动态加载实现](./GTRS_EDITOR_DYNAMIC_LOADING_IMPLEMENTATION.md)
- [GTRS 编辑器业务选择优化](./GTRS_EDITOR_BUSINESS_SELECT_OPTIMIZATION.md)
- [GTRS Schema 重构](./GTRS_SCHEMA_REFACTOR_OWNER_FIELDS.md)

---

## ✅ 总结

### 核心改动

| 项目 | 修改前 | 修改后 |
|------|--------|--------|
| **value 类型** | string (game_snake_v3) | number (1) |
| **数据来源** | gameCode | gameId（数据库主键） |
| **主题 ID** | theme_snake_vue3_xxx | theme_game_1_xxx |
| **显示内容** | 名称 + gameCode | 名称 + gameId |

### 优势

1. ✅ **性能提升**：无需额外查询，直接使用主键
2. ✅ **数据一致性**：与数据库保持一致
3. ✅ **简化逻辑**：减少转换层
4. ✅ **更短的 ID**：主题 ID 更简洁

### 技术要点

- ⭐ `value` 和 `dbId` 都使用数据库主键 gameId
- ⭐ `code` 仅用于显示，不参与业务逻辑
- ⭐ 主题 ID 基于 ownerId（gameId）生成
- ⭐ 发布时直接使用 ownerId，无需转换

---

**修正时间**：2026-03-22  
**修正目标**：使用数据库主键 gameId 作为业务选择的唯一标识
