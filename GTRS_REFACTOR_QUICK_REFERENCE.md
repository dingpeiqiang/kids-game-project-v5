# GTRS 规范重构 - 快速参考

## 📋 字段映射关系

### 新旧字段对比

| 旧字段 | 新字段 | 类型 | 说明 |
|--------|--------|------|------|
| `themeInfo.gameId` | `themeInfo.ownerType` | `'GAME' \| 'APPLICATION'` | 所有者类型 |
| `themeInfo.gameId` | `themeInfo.ownerId` | `number` | 数据库主键 |
| - | `themeInfo.gameId` | `string?` | 兼容字段（可选） |

---

## 🔧 使用示例

### GTRS JSON 格式

```json
{
  "specMeta": {
    "specName": "GTRS",
    "specVersion": "1.0.0",
    "compatibleVersion": "1.0.0"
  },
  "themeInfo": {
    "themeId": "theme_snake_20260322",
    "ownerType": "GAME",
    "ownerId": 1,
    "themeName": "清新绿主题",
    "isDefault": false,
    "author": "张三",
    "description": "以绿色为主色调的清新主题",
    "gameId": "game_snake_v3"  // ⭐ 兼容字段，用于生成 gameCode
  },
  "globalStyle": { ... },
  "resources": { ... }
}
```

---

### BasicInfoPanel 表单数据

```typescript
const formData = ref({
  themeId: 'theme_snake_20260322',
  ownerType: 'GAME',           // 固定为 GAME
  ownerId: 1,                  // 数据库主键（数字）
  themeName: '清新绿主题',
  isDefault: false,
  coverImage: '',
  tags: ['cute', 'fresh'],
  description: '以绿色为主色调的清新主题',
  author: '张三',
  contact: ''
})
```

---

### 游戏列表数据结构

```typescript
const gameList = ref([
  {
    label: '贪吃蛇大冒险',      // 显示名称
    value: 'game_snake_v3',     // gameCode（用于生成主题 ID）
    dbGameId: 1                 // 数据库主键（ownerId）
  },
  {
    label: '植物大战僵尸',
    value: 'game_pvz_v1',
    dbGameId: 2
  }
])
```

---

### 发布时的数据流转

```typescript
// 1. 从表单获取数据
const { ownerType, ownerId } = themeData.value.themeInfo

// 2. 生成 gameCode（用于资源加载）
const rawGameId = themeData.value.themeInfo.gameId || ''
const gameCode = rawGameId
  ? rawGameId.replace(/^game_/, '').toUpperCase().replace(/-/g, '_')
  : null

// 3. 构建上传数据
const uploadData = {
  name: themeData.value.themeInfo.themeName,
  authorName: currentAuthorName,
  price: 0,
  description: '',
  thumbnail: '',
  config: themeData.value,       // 完整的 GTRS 数据
  ownerType: ownerType,          // 'GAME'
  gameCode: gameCode,            // 'SNAKE_VUE3'
  ownerId: ownerId,              // 1 (数据库主键)
  status: 'pending'
}
```

---

## 🎯 关键变化点

### 1. 表单绑定字段

**修改前**：
```vue
<el-select v-model="formData.gameId">
  <el-option :value="game.value" /> <!-- "game_snake_v3" -->
</el-select>
```

**修改后**：
```vue
<input type="hidden" v-model="formData.ownerType" value="GAME" />
<el-select v-model="formData.ownerId">
  <el-option :value="game.dbGameId" /> <!-- 1 -->
</el-select>
```

---

### 2. 游戏选择事件

**修改前**：
```typescript
const handleGameChange = (gameId: string) => {  // "game_snake_v3"
  const gameName = gameId.replace('game_', '')
  formData.value.themeId = `theme_${gameName}_${Date.now()}`
}
```

**修改后**：
```typescript
const handleGameChange = (selectedDbGameId: number) => {  // 1
  const selected = gameList.value.find(g => g.dbGameId === selectedDbGameId)
  if (selected) {
    const gameCode = selected.value.replace('game_', '')
    formData.value.themeId = `theme_${gameCode}_${Date.now()}`
  }
}
```

---

### 3. 验证规则

**修改前**：
```typescript
const rules = {
  gameId: [
    { required: true, message: '请选择适用游戏', trigger: 'change' }
  ]
}
```

**修改后**：
```typescript
const rules = {
  ownerType: [
    { required: true, message: '请选择所有者类型', trigger: 'change' }
  ],
  ownerId: [
    { required: true, message: '请选择适用游戏', trigger: 'change' }
  ]
}
```

---

## 🔍 调试检查清单

### ✅ 浏览器控制台

```javascript
// 检查当前主题数据
console.log(this.themeData.value.themeInfo)

// 应该看到：
{
  themeId: "theme_snake_xxx",
  ownerType: "GAME",
  ownerId: 1,
  themeName: "xxx",
  gameId: "game_snake_v3"  // 兼容字段
}
```

---

### ✅ 发布日志

```javascript
console.log('发布主题:', {
  ownerType: "GAME",        // 从 GTRS 数据中获取
  ownerId: 1,               // 数据库主键
  gameCode: "SNAKE_VUE3",   // 资源加载标识
  themeInfo: {
    ownerType: "GAME",
    ownerId: 1
  }
})
```

---

## ⚠️ 常见问题

### Q1: 为什么要保留 gameId 字段？

**A**: 为了向后兼容。旧的 GTRS JSON 数据仍然可以使用，新的编辑器会生成新格式。

---

### Q2: ownerId 和 gameCode 有什么区别？

**A**:
- `ownerId`: 数据库主键，用于查询关联游戏（业务逻辑）
- `gameCode`: 资源加载标识，用于文件系统路径（资源加载）

---

### Q3: 如何从旧格式迁移到新格式？

**A**: 
```javascript
// 旧格式
{ gameId: "game_snake_v3" }

// 新格式
{ 
  ownerType: "GAME",
  ownerId: 1,  // 需要从后端查询获取
  gameId: "game_snake_v3"  // 保留作为兼容
}
```

---

## 📚 相关文档

- [完整重构说明](./GTRS_SCHEMA_REFACTOR_OWNER_FIELDS.md)
- [gameId 与 gameCode 职责分离](./GAMEID_USAGE_OPTIMIZATION.md)
- [GTRS 编辑器模式判断逻辑](./GTRS_THEME_MODE_DIFFERENTIATION.md)

---

**更新时间**：2026-03-22  
**维护者**：Kids Game Platform Team
