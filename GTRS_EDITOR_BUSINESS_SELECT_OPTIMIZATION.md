# GTRS 编辑器优化 - 适用业务拆分为业务类型 + 业务编码

## 📋 优化背景

原有的"适用游戏"字段虽然已经改为 `ownerType + ownerId`，但在用户界面中仍然不够直观，用户无法清晰地看到：
- **业务类型**：GAME（游戏）还是 APPLICATION（应用）
- **具体业务编码**：哪个游戏或应用的编码是什么

## ✅ 优化方案

### 1. 界面结构调整

将原来的单个"适用游戏"选择框拆分为两个独立字段：

#### 修改前
```
┌─────────────────┐
│ 适用游戏        │
│ [请选择游戏 ▼] │  ← 直接选择游戏
└─────────────────┘
```

#### 修改后
```
┌──────────────────────┐
│ 适用业务类型         │
│ [请选择业务类型 ▼]   │  ← GAME / APPLICATION
└──────────────────────┘

┌─────────────────────────────────┐
│ 适用业务                        │
│ [请选择游戏 ▼]                  │  ← 根据类型动态加载
│ ┌─────────────────────────────┐ │
│ │ 贪吃蛇大冒险    snake-vue3 │ │  ← 显示名称和编码
│ │ 植物大战僵尸    pvz        │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 🔧 实现细节

### 1. 数据结构定义

```typescript
// 统一业务项类型
type BusinessItem = { 
  label: string      // 显示名称（如"贪吃蛇大冒险"）
  value: string      // 前端标识（如"game_snake_v3"）
  dbId: number       // 数据库主键（如 1）
  code: string       // 业务编码（如"snake-vue3"）
}

// 游戏列表和应用列表
const gameList = ref<BusinessItem[]>([])
const appList = ref<BusinessItem[]>([])

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

### 2. 表单结构

```vue
<!-- 适用业务类型 -->
<el-form-item label="适用业务类型" prop="ownerType">
  <el-select 
    v-model="formData.ownerType" 
    placeholder="请选择业务类型" 
    :disabled="disableGameSelect"
    @change="handleOwnerTypeChange"
  >
    <el-option label="游戏" value="GAME" />
    <el-option label="应用" value="APPLICATION" />
  </el-select>
  <div class="form-tip">选择主题所属的业务类型</div>
</el-form-item>

<!-- 适用业务（根据类型动态加载） -->
<el-form-item label="适用业务" prop="ownerId">
  <el-select 
    v-model="formData.ownerId" 
    :placeholder="`请选择${formData.ownerType === 'GAME' ? '游戏' : '应用'}`" 
    :disabled="disableGameSelect"
    @change="handleBusinessChange"
    filterable
  >
    <el-option
      v-for="item in currentBusinessList"
      :key="item.dbId"
      :label="item.label"
      :value="item.dbId"
    >
      <span style="float: left">{{ item.label }}</span>
      <span style="float: right; color: #8492a6; font-size: 13px">{{ item.code }}</span>
    </el-option>
  </el-select>
  <div v-if="disableGameSelect" class="form-tip" style="color: #f56c6c;">
    ℹ️ {{ disableThemeId ? '当前为编辑模式' : '当前为 DIY 模式' }},不可更改适用业务
  </div>
  <div v-else class="form-tip">
    选择具体的{{ formData.ownerType === 'GAME' ? '游戏' : '应用' }}，将决定主题的资源加载路径
  </div>
</el-form-item>
```

---

### 3. 事件处理

#### 业务类型变化处理

```typescript
const handleOwnerTypeChange = (newOwnerType: 'GAME' | 'APPLICATION') => {
  if (props.disableGameSelect) {
    const modeText = props.disableThemeId ? '编辑' : 'DIY'
    ElMessage.warning(`当前为${modeText}模式，不可更改业务类型`)
    return
  }
  
  console.log('切换业务类型:', newOwnerType)
  // 重置 ownerId（清空已选择的业务）
  formData.value.ownerId = undefined as unknown as number
}
```

**逻辑说明**：
- 当用户切换业务类型时（从 GAME 切换到 APPLICATION），会自动清空已选择的业务
- 避免用户误操作导致数据不一致

---

#### 业务选择处理

```typescript
const handleBusinessChange = (selectedDbId: number) => {
  if (props.disableGameSelect) {
    const modeText = props.disableThemeId ? '编辑' : 'DIY'
    ElMessage.warning(`当前为${modeText}模式，不可更改适用业务`)
    return
  }
  
  // 根据选中的数据库 ID 查找业务信息
  const selected = currentBusinessList.value.find(g => g.dbId === selectedDbId)
  if (selected) {
    // 从 businessCode 生成主题 ID
    const businessCode = selected.code.replace(/-/g, '_')
    formData.value.themeId = `theme_${businessCode}_${Date.now()}`
  }
  isEditMode.value = false

  console.log('选择业务:', selectedDbId, '→ 数据库 ID:', selectedDbId)
}
```

**逻辑说明**：
- 使用统一的 `code` 字段生成主题 ID
- 支持游戏和应用两种类型的业务

---

### 4. 数据加载

```typescript
// 从后端加载游戏列表
const loadGameList = async () => {
  try {
    const games = await gameApi.getList()
    
    gameList.value = games.map((g: any) => {
      const label = g.gameName || g.name || g.gameCode || '未知游戏'
      return {
        label: label,
        value: `game_${(g.gameCode || '').toLowerCase().replace(/-/g, '_')}`,
        dbId: g.gameId,           // 数据库主键
        code: g.gameCode || 'unknown'  // 业务编码
      }
    })
  } catch (e) {
    console.error('加载游戏列表失败:', e)
    // 降级为硬编码列表
    gameList.value = [
      { label: '贪吃蛇', value: 'game_snake_v3', dbId: 0, code: 'snake-vue3' },
      { label: '植物大战僵尸', value: 'game_pvz_v1', dbId: 0, code: 'pvz' },
      { label: '飞行射击', value: 'game_shooter_v1', dbId: 0, code: 'shooter' }
    ]
  }
}

// 加载应用列表（预留扩展）
const loadAppList = async () => {
  // TODO: 从后端加载应用列表
  appList.value = [
    { label: '示例应用', value: 'app_example', dbId: 1, code: 'example-app' }
  ]
}
```

---

## 🎯 用户体验提升

### 1. 清晰的字段分层

| 字段 | 作用 | 选项 | 提示 |
|------|------|------|------|
| **适用业务类型** | 确定大类 | 游戏、应用 | "选择主题所属的业务类型" |
| **适用业务** | 确定具体业务 | 动态加载的游戏/应用列表 | "选择具体的 XX，将决定主题的资源加载路径" |

### 2. 实时反馈

- ✅ 下拉选项右侧显示业务编码（灰色小字）
- ✅ 根据选择的类型动态更新 placeholder
- ✅ 禁用状态下显示明确的提示信息

### 3. 可扩展性

```typescript
// 未来可以轻松添加更多业务类型
const currentBusinessList = computed(() => {
  switch (formData.value.ownerType) {
    case 'GAME':
      return gameList.value
    case 'APPLICATION':
      return appList.value
    case 'WEBSITE':  // 未来扩展
      return websiteList.value
    default:
      return []
  }
})
```

---

## 📊 数据流转示例

### 完整流程

```
1. 用户进入编辑器
   ↓
2. 加载数据：
   - gameList = [{ label: '贪吃蛇', dbId: 1, code: 'snake-vue3' }]
   - appList = [{ label: '示例应用', dbId: 100, code: 'example-app' }]
   ↓
3. 用户选择"适用业务类型" → GAME
   ↓
4. currentBusinessList 自动切换为 gameList
   ↓
5. 用户选择"适用业务" → 贪吃蛇（dbId: 1）
   ↓
6. 自动生成主题 ID：
   theme_snake_vue3_1711094400
   ↓
7. 最终表单数据：
   {
     ownerType: 'GAME',
     ownerId: 1,
     themeId: 'theme_snake_vue3_1711094400'
   }
```

---

## 🔍 界面对比

### 旧版界面

```
┌─────────────────┐
│ 适用游戏        │
│ [请选择游戏 ▼] │
└─────────────────┘
```

**问题**：
- ❌ 无法直观看到业务编码
- ❌ 无法区分是游戏还是应用
- ❌ 所有业务混在一起

---

### 新版界面

```
┌──────────────────────┐
│ 适用业务类型 *       │
│ [请选择业务类型 ▼]   │
│                      │
│ ○ 游戏               │
│ ○ 应用               │
└──────────────────────┘
ℹ️ 选择主题所属的业务类型

┌─────────────────────────────────┐
│ 适用业务 *                      │
│ [请选择游戏 ▼]                  │
│ ┌─────────────────────────────┐ │
│ │ 贪吃蛇大冒险    snake-vue3 │ │
│ │ 植物大战僵尸    pvz        │ │
│ │ 超级染色体      chromosome │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
ℹ️ 选择具体的游戏，将决定主题的资源加载路径
```

**优势**：
- ✅ 业务类型清晰明确
- ✅ 业务编码一目了然
- ✅ 分级选择，逻辑清晰

---

## ⚠️ 注意事项

### 1. 兼容性

- ✅ 保留原有的 `gameId` 兼容字段
- ✅ 向后兼容旧的 GTRS JSON 格式
- ✅ 新旧版本可以共存

### 2. 数据校验

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

### 3. 发布时的数据

```javascript
console.log('发布主题:', {
  ownerType: 'GAME',           // 从表单获取
  ownerId: 1,                  // 从表单获取
  gameCode: 'SNAKE_VUE3',      // 从 code 转换
  themeInfo: {
    ownerType: 'GAME',
    ownerId: 1
  }
})
```

---

## 📁 修改文件清单

1. ✅ `kids-game-frontend/src/modules/creator-center/panels/BasicInfoPanel.vue`
   - 新增业务类型选择器
   - 优化业务选择器（显示编码）
   - 添加 `handleOwnerTypeChange` 和 `handleBusinessChange` 方法
   - 统一数据结构为 `BusinessItem`

---

## ✅ 总结

### 核心改进
- ✅ **界面更清晰**：业务类型和业务编码分开显示
- ✅ **用户友好**：下拉选项同时显示名称和编码
- ✅ **易于扩展**：未来可以轻松添加更多业务类型
- ✅ **逻辑严谨**：先选类型，再选具体业务，层次分明

### 设计原则
**让用户清楚地知道自己在选择什么，以及选择的结果意味着什么。**

---

**完成时间**：2026-03-22  
**优化目标**：将"适用业务"拆分为"适用业务类型"和"适用业务"，提升用户体验和界面清晰度
