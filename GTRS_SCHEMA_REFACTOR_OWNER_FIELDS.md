# GTRS 规范重构 - gameId 拆分为 ownerType + ownerId

## 📋 重构背景

原有的 `themeInfo.gameId` 字段存在以下问题：

1. **职责不明确**：既包含游戏标识，又隐含了所有者类型
2. **扩展性差**：无法支持应用主题（APPLICATION）等其他所有者类型
3. **数据冗余**：gameId 格式为 `game_xxx_yyy`，包含了类型信息但不够规范

### 重构目标

将 `themeInfo.gameId` 拆分为：
- `themeInfo.ownerType`: 所有者类型（'GAME' | 'APPLICATION'）
- `themeInfo.ownerId`: 数据库主键（Integer）

---

## ✅ 修改内容

### 1. Schema 定义（`gtrs-schema.json`）

#### 修改前
```json
"themeInfo": {
  "required": ["themeId", "gameId", "themeName", "isDefault"],
  "properties": {
    "gameId": {
      "type": "string",
      "description": "归属游戏 ID"
    }
  }
}
```

#### 修改后
```json
"themeInfo": {
  "required": ["themeId", "ownerType", "ownerId", "themeName", "isDefault"],
  "properties": {
    "ownerType": {
      "type": "string",
      "enum": ["GAME", "APPLICATION"],
      "description": "所有者类型：GAME（游戏）或 APPLICATION（应用）"
    },
    "ownerId": {
      "type": "integer",
      "minimum": 1,
      "description": "所有者 ID（数据库主键）"
    },
    "gameId": {
      "type": "string",
      "description": "兼容字段：游戏 ID（已废弃，使用 ownerType + ownerId 替代）"
    }
  }
}
```

**关键点**：
- ✅ `ownerType` 和 `ownerId` 成为必填字段
- ✅ `gameId` 保留作为兼容字段（向后兼容旧数据）
- ✅ `ownerId` 类型为 integer，直接对应数据库主键

---

### 2. TypeScript 类型定义（`gtrs-theme.ts`）

#### 修改前
```typescript
export interface ThemeInfo {
  themeId: string
  gameId: string
  themeName: string
  isDefault: boolean
  author?: string
  description?: string
}
```

#### 修改后
```typescript
export interface ThemeInfo {
  themeId: string
  ownerType: 'GAME' | 'APPLICATION'  // 所有者类型
  ownerId: number                     // 数据库主键
  themeName: string
  isDefault: boolean
  author?: string
  description?: string
  gameId?: string  // ⭐ 兼容字段，用于生成 gameCode（从 ownerId 转换）
}
```

---

### 3. 验证工具（`gtrs-validator.ts`）

同步更新接口定义：
```typescript
export interface GTRSTheme {
  specMeta: { ... }
  themeInfo: {
    themeId: string
    ownerType: 'GAME' | 'APPLICATION'
    ownerId: number
    themeName: string
    isDefault: boolean
    author?: string
    description?: string
  }
  globalStyle: { ... }
  resources: { ... }
}
```

---

### 4. 默认模板（`gtrs-template.json`）

#### 修改前
```json
"themeInfo": {
  "themeId": "game_default_theme",
  "gameId": "game_001",
  "themeName": "默认主题",
  "isDefault": true
}
```

#### 修改后
```json
"themeInfo": {
  "themeId": "game_default_theme",
  "ownerType": "GAME",
  "ownerId": 1,
  "themeName": "默认主题",
  "isDefault": true
}
```

---

### 5. 基本信息面板（`BasicInfoPanel.vue`）

#### 表单结构变化

**修改前**：
```vue
<el-form-item label="适用游戏" prop="gameId">
  <el-select v-model="formData.gameId">
    <el-option :value="game.value" /> <!-- game_xxx_yyy -->
  </el-select>
</el-form-item>
```

**修改后**：
```vue
<!-- 所有者类型（隐藏字段，固定为 GAME） -->
<input type="hidden" v-model="formData.ownerType" value="GAME" />

<!-- 游戏选择（ownerId） -->
<el-form-item label="适用游戏" prop="ownerId">
  <el-select v-model="formData.ownerId">
    <el-option :value="game.dbGameId" /> <!-- 数据库主键 -->
  </el-select>
</el-form-item>
```

#### 表单数据结构

**修改前**：
```typescript
const formData = ref({
  themeId: '',
  gameId: '',  // "game_snake_v3"
  themeName: '',
  isDefault: false
})
```

**修改后**：
```typescript
const formData = ref({
  themeId: '',
  ownerType: 'GAME',           // 固定为 GAME
  ownerId: undefined as number, // 数据库主键
  themeName: '',
  isDefault: false
})
```

#### 游戏选择处理

**修改前**：
```typescript
const handleGameChange = (gameId: string) => {  // "game_snake_v3"
  const gameName = gameId.replace('game_', '').replace('_v1', '').replace('_v3', '')
  formData.value.themeId = `theme_${gameName}_${Date.now()}`
  
  const selected = gameList.value.find(g => g.value === gameId)
  selectedDbGameId.value = selected ? selected.dbGameId : null
}
```

**修改后**：
```typescript
const handleGameChange = (selectedDbGameId: number) => {
  // 根据选中的数据库 gameId 查找游戏信息
  const selected = gameList.value.find(g => g.dbGameId === selectedDbGameId)
  if (selected) {
    // 从 gameCode 生成主题 ID
    const gameCode = selected.value.replace('game_', '')
    formData.value.themeId = `theme_${gameCode}_${Date.now()}`
  }
}
```

---

### 6. 发布逻辑（`GTRSThemeCreatorV2.vue`）

#### 修改前
```typescript
const publishTheme = async () => {
  const ownerId = routeGameId || null
  
  const rawGameId = themeData.value.themeInfo.gameId  // "game_snake_v3"
  const gameCode = rawGameId.replace(/^game_/, '').toUpperCase().replace(/-/g, '_')
  
  const uploadData = {
    ownerType: 'GAME',
    gameCode: gameCode,
    ownerId: ownerId
  }
}
```

#### 修改后
```typescript
const publishTheme = async () => {
  // ⭐ 从 themeData 中获取 ownerType 和 ownerId（GTRS 规范字段）
  const { ownerType, ownerId } = themeData.value.themeInfo
  
  // ⭐ gameCode 从 ownerId 转换（用于资源加载等）
  const rawGameId = themeData.value.themeInfo.gameId || ''  // 兼容旧数据
  const gameCode = rawGameId
    ? rawGameId.replace(/^game_/, '').toUpperCase().replace(/-/g, '_')
    : null
  
  const uploadData = {
    ownerType: ownerType,    // ⭐ 从 GTRS 数据中获取
    gameCode: gameCode,      // ⭐ 仅用于资源加载标识
    ownerId: ownerId         // ⭐ 数据库主键，用于关联游戏
  }
}
```

---

## 🎯 优势对比

| 维度 | 旧方案 (gameId) | 新方案 (ownerType + ownerId) |
|------|----------------|------------------------------|
| **数据类型** | String (`"game_snake_v3"`) | Integer (数据库主键) |
| **所有者类型** | 隐含在字符串中 | 明确字段 (`'GAME'` / `'APPLICATION'`) |
| **扩展性** | 仅支持游戏 | 支持游戏、应用等多种类型 |
| **查询效率** | 需要解析字符串 | 直接使用数字主键查询 |
| **向后兼容** | - | 保留 `gameId` 字段作为兼容 |

---

## 🔄 数据流转

### DIY 流程完整链路

```
1. 用户点击"✨ DIY"按钮
   ↓
2. handleDIYTheme(theme) 跳转：
   query: { 
     themeId: "123", 
     gameId: "1"  // 数据库主键
   }
   ↓
3. GTRSThemeCreatorV2 读取参数：
   routeGameId = 1
   ↓
4. BasicInfoPanel 初始化表单：
   formData.ownerType = 'GAME'
   formData.ownerId = 1  // 直接使用数据库主键
   ↓
5. 用户编辑主题
   ↓
6. 发布时：
   uploadData: {
     ownerType: 'GAME',
     ownerId: 1,          // 数据库主键
     gameCode: 'SNAKE_VUE3'  // 仅用于资源加载
   }
   ↓
7. 后端接收：
   - 优先使用 ownerId 查询游戏（精确匹配）
   - 使用 gameCode 验证资源路径（辅助校验）
```

---

## 🔍 验证方法

### 浏览器控制台检查

打开 GTRS 编辑器页面，在控制台执行：

```javascript
// 查看当前主题数据
this.themeData.value.themeInfo

// 应该看到：
{
  themeId: "theme_snake_1234567890",
  ownerType: "GAME",
  ownerId: 1,
  themeName: "清新绿主题",
  isDefault: false,
  gameId: "game_snake_v3"  // 兼容字段
}
```

### 发布日志检查

发布主题时，控制台会输出：

```javascript
发布主题：{
  name: "清新绿主题",
  authorName: "张三",
  ownerType: "GAME",       // ⭐ 从 GTRS 数据中获取
  ownerId: 1,              // ⭐ 数据库主键
  gameCode: "SNAKE_VUE3",  // ⭐ 资源加载标识
  themeInfo: {
    ownerType: "GAME",
    ownerId: 1
  }
}
```

---

## 📁 修改文件清单

### 前端文件
1. ✅ `kids-game-frontend/src/schemas/gtrs-schema.json`
2. ✅ `kids-game-frontend/src/types/gtrs-theme.ts`
3. ✅ `kids-game-frontend/src/utils/gtrs-validator.ts`
4. ✅ `kids-game-frontend/src/configs/gtrs-template.json`
5. ✅ `kids-game-frontend/src/modules/creator-center/panels/BasicInfoPanel.vue`
6. ✅ `kids-game-frontend/src/modules/creator-center/GTRSThemeCreatorV2.vue`

### 后端文件（待修改）
- `kids-game-backend/kids-game-common/src/main/java/com/kidgame/common/dto/ThemeUploadDTO.java`
- `kids-game-backend/kids-game-service/src/main/java/com/kidgame/service/ThemeService.java`
- `kids-game-backend/kids-game-dao/src/main/java/com/kidgame/dao/entity/Theme.java`

---

## ⚠️ 注意事项

### 1. 向后兼容性

- ✅ 保留了 `gameId` 字段作为兼容
- ✅ 旧的 GTRS JSON 仍然可以正常使用
- ✅ 新的编辑器会生成新格式的 JSON

### 2. 迁移策略

对于已有的主题数据：
1. **无需立即迁移**：通过 `gameId` 兼容字段可以继续工作
2. **渐进式迁移**：下次编辑保存时自动生成新格式
3. **批量迁移脚本**：后续可提供 SQL 脚本批量更新数据库

### 3. 后端适配

后端需要按照以下优先级处理：
```java
if (dto.getOwnerId() != null) {
    // 优先：直接通过数据库主键查询
    game = gameRepository.findById(dto.getOwnerId());
} else if (dto.getGameCode() != null) {
    // 降级：通过 gameCode 查询（兼容旧数据）
    game = gameRepository.findByGameCode(dto.getGameCode());
}
```

---

## ✅ 总结

### 核心改进
- ✅ **明确字段职责**：`ownerType` 表示类型，`ownerId` 表示主键
- ✅ **提升扩展性**：支持游戏、应用等多种所有者类型
- ✅ **优化查询性能**：直接使用数字主键，避免字符串解析
- ✅ **保持向后兼容**：保留 `gameId` 字段兼容旧数据

### 设计原则
**如果已有明确的数据库主键，就不需要通过字符串编码来传递信息。**

---

**完成时间**：2026-03-22  
**重构目标**：将 gameId 拆分为 ownerType + ownerId，提升数据模型的清晰度和扩展性
