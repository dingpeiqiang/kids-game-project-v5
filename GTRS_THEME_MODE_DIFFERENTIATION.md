# GTRS主题编辑器 DIY 模式与编辑模式区分实现

## 📋 需求说明

### 两种模式的定义

#### 1. DIY 模式（基于已有主题创作新主题）
- **触发方式**：点击主题卡片上的 `✨ DIY` 按钮
- **路由参数**：`themeId` + `gameId`
- **核心特点**：
  - ✅ 生成**新的主题 ID**（系统自动生成）
  - ✅ 基于原主题配置作为模板
  - ❌ **不可修改适用游戏**
  - ✅ 可以修改主题 ID（因为要生成新 ID）

#### 2. 编辑模式（修改已有主题）
- **触发方式**：点击主题卡片上的 `✏️ 修改` 按钮
- **路由参数**：`themeId` + `gameId` + `mode=edit`
- **核心特点**：
  - ❌ **保持原主题 ID**（直接修改原主题）
  - ❌ **不可修改适用游戏**
  - ❌ **不可修改主题 ID**

---

## 🔧 实现方案

### 1. 路由跳转逻辑

#### DIY 模式跳转（`handleDIYTheme`）
```typescript
function handleDIYTheme(theme?: any) {
  const query: Record<string, string> = {};
  
  if (theme) {
    // DIY 模式：传递 themeId 和 gameId
    query.themeId = String(theme.themeId || theme.id);
    query.gameId = String(theme.gameId);
  }
  
  router.push({
    path: '/creator-center/gtrs-editor',
    query
  });
}
```

#### 编辑模式跳转（`handleEdit`）
```typescript
function handleEdit(theme: CloudThemeInfo) {
  const query: Record<string, string> = {};
  
  // 兼容不同版本的 CloudThemeInfo 接口
  const themeId = (theme as any).themeId || theme.id;
  if (themeId) {
    query.themeId = String(themeId);
  }
  if (theme.gameId) {
    query.gameId = String(theme.gameId);
  }
  
  // ⭐ 关键：添加 mode='edit' 标记
  query.mode = 'edit';
  
  router.push({
    path: '/creator-center/gtrs-editor',
    query
  });
}
```

---

### 2. GTRSThemeCreatorV2.vue - 主编辑器组件

#### 新增计算属性
```typescript
// 路由参数解析
const routeThemeId = route.query.themeId as string | undefined
const routeGameId = route.query.gameId ? Number(route.query.gameId) : null
const routeMode = route.query.mode as string | undefined  // 'edit' 表示编辑模式

// 是否为编辑模式（相对于 DIY 模式）
const isEditMode = computed(() => routeMode === 'edit')

// 是否有 routeThemeId，用于判断是否禁用游戏选择
const hasRouteThemeId = computed(() => !!routeThemeId)
```

#### 顶部标签显示
```vue
<el-tag v-if="isDirty" type="warning" size="small">未保存</el-tag>
<el-tag v-if="isEditMode" type="success" size="small">编辑模式</el-tag>
<el-tag v-else-if="hasRouteThemeId" type="info" size="small">DIY 模式</el-tag>
```

#### 传递给子组件的属性
```vue
<BasicInfoPanel
  v-if="currentTab === 'basic'"
  v-model="themeData"
  :is-dirty="isDirty"
  :panel-json-mode="panelJsonModes.basic"
  :disable-game-select="hasRouteThemeId"      <!-- 禁用游戏选择 -->
  :disable-theme-id="isEditMode"              <!-- 禁用主题 ID 编辑 -->
  @update:is-dirty="isDirty = $event"
  @toggle-json-mode="panelJsonModes.basic = !panelJsonModes.basic"
/>
```

---

### 3. BasicInfoPanel.vue - 基本信息面板

#### Props 定义
```typescript
interface Props {
  modelValue: GTRSTheme
  isDirty: boolean
  panelJsonMode: boolean
  disableGameSelect?: boolean   // 是否禁用游戏选择
  disableThemeId?: boolean      // 是否禁用主题 ID 编辑
}

withDefaults(defineProps<Props>(), {
  disableGameSelect: false,
  disableThemeId: false
})
```

#### 主题 ID 字段控制
```vue
<el-form-item label="主题 ID" prop="themeId">
  <el-input
    v-model="formData.themeId"
    placeholder="英文 + 数字 + 下划线"
    :disabled="!isEditMode || disableThemeId"
  />
  <div v-if="disableThemeId" class="form-tip" style="color: #f56c6c;">
    ℹ️ 当前为编辑模式，不可更改主题 ID
  </div>
  <div v-else-if="!isEditMode" class="form-tip">
    系统自动生成，一般无需修改
  </div>
</el-form-item>
```

#### 游戏选择器控制
```vue
<el-form-item label="适用游戏" prop="gameId">
  <el-select 
    v-model="formData.gameId" 
    placeholder="请选择游戏" 
    :disabled="disableGameSelect"
    @change="handleGameChange"
  >
    <el-option ... />
  </el-select>
  <div v-if="disableGameSelect" class="form-tip" style="color: #f56c6c;">
    ℹ️ {{ disableThemeId ? '当前为编辑模式' : '当前为 DIY 模式' }},不可更改适用游戏
  </div>
</el-form-item>
```

#### 游戏选择变化处理
```typescript
const handleGameChange = (gameId: string) => {
  if (props.disableGameSelect) {
    const modeText = props.disableThemeId ? '编辑' : 'DIY'
    ElMessage.warning(`当前为${modeText}模式，不可更改适用游戏`)
    return
  }
  
  // 正常逻辑：生成新主题 ID
  const gameName = gameId.replace('game_', '').replace('_v1', '').replace('_v3', '')
  formData.value.themeId = `theme_${gameName}_${Date.now()}`
  isEditMode.value = false
  
  // 记录数据库 gameId
  const selected = gameList.value.find(g => g.value === gameId)
  selectedDbGameId.value = selected ? selected.dbGameId : null
}
```

---

## 🎯 功能对比表

| 特性 | DIY 模式 | 编辑模式 |
|------|---------|---------|
| **触发按钮** | ✨ DIY | ✏️ 修改 |
| **路由参数** | `themeId` + `gameId` | `themeId` + `gameId` + `mode=edit` |
| **顶部标签** | DIY 模式（蓝色） | 编辑模式（绿色） |
| **主题 ID** | ✅ 可编辑（生成新 ID） | ❌ 禁用（保持原 ID） |
| **适用游戏** | ❌ 禁用 | ❌ 禁用 |
| **用途** | 基于已有主题创作新主题 | 直接修改已有主题 |

---

## 📝 关键实现细节

### 1. 字段禁用逻辑
- **游戏选择器**：只要有 `themeId` 参数就禁用（两种模式都禁用）
- **主题 ID**：仅在编辑模式（`mode=edit`）时禁用

### 2. 提示信息区分
- DIY 模式禁用游戏选择 → "当前为 DIY 模式，不可更改适用游戏"
- 编辑模式禁用游戏选择 → "当前为编辑模式，不可更改适用游戏"

### 3. 兼容性处理
```typescript
// 兼容不同版本的 CloudThemeInfo 接口
const themeId = (theme as any).themeId || theme.id;
```

---

## ✅ 测试场景

### DIY 模式测试
1. 进入创作者中心 → 我的主题
2. 点击任意主题的 `✨ DIY` 按钮
3. 验证：
   - ✅ 顶部显示 "DIY 模式" 标签
   - ✅ 主题 ID 可编辑（自动生成新 ID）
   - ✅ 游戏选择器禁用，提示 "当前为 DIY 模式"
   - ✅ 其他字段可正常编辑

### 编辑模式测试
1. 进入创作者中心 → 我的主题
2. 点击任意主题的 `✏️ 修改` 按钮
3. 验证：
   - ✅ 顶部显示 "编辑模式" 标签
   - ✅ 主题 ID 禁用
   - ✅ 游戏选择器禁用，提示 "当前为编辑模式"
   - ✅ 其他字段可正常编辑

---

## 🚀 后续优化建议

1. **权限控制**：编辑模式下，只有主题作者才能修改
2. **版本管理**：编辑模式可以考虑创建新版本而非直接覆盖
3. **审核流程**：编辑后的主题是否需要重新审核
4. **撤销机制**：提供恢复到之前版本的功能

---

## 📁 修改文件清单

1. `kids-game-frontend/src/modules/creator-center/index.vue`
   - 修改 `handleEdit` 函数，添加路由跳转逻辑

2. `kids-game-frontend/src/modules/creator-center/GTRSThemeCreatorV2.vue`
   - 新增 `isEditMode` 和 `hasRouteThemeId` 计算属性
   - 添加顶部模式标签显示
   - 传递 `disable-game-select` 和 `disable-theme-id` 属性

3. `kids-game-frontend/src/modules/creator-center/panels/BasicInfoPanel.vue`
   - 新增 `disableGameSelect` 和 `disableThemeId` Props
   - 修改主题 ID 和游戏选择器的禁用逻辑
   - 添加模式区分提示信息

---

**完成时间**：2026-03-22  
**实现目标**：明确区分 DIY 模式和编辑模式，正确控制字段编辑权限
