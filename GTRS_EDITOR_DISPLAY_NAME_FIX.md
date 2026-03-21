# GTRS 编辑器 - 适用业务显示名称修复

## 📋 问题描述

用户反馈："适用业务被赋值时，没有显示对应的游戏名称。现在显示的是 gameId 不合理"

**核心问题**：
- ❌ DIY/编辑模式下，`formData.ownerId` 被赋值后，下拉框显示数字（如 "1"）而不是游戏名称
- ❌ 原因是 el-select 无法在选项列表中找到对应的值
- ✅ **需要确保选项列表已加载，并且能正确匹配到对应的游戏名称**

---

## ✅ 修复方案

### 1. 优化选项显示结构

#### 修改前
```vue
<el-option ...>
  <span style="float: left">{{ item.label }}</span>
  <span style="float: right; color: #8492a6;">
    {{ item.code || 'ID: ' + item.dbId }}
  </span>
</el-option>
```

**问题**：使用 `float` 布局在某些情况下可能渲染不正确

---

#### 修改后
```vue
<el-option ...>
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <span>{{ item.label }}</span>
    <span style="color: #8492a6; font-size: 13px;">
      {{ item.code ? item.code : 'ID: ' + item.dbId }}
    </span>
  </div>
</el-option>
```

**优势**：
- ✅ 使用 flex 布局，更可靠
- ✅ 左侧显示游戏名称，右侧显示游戏编码
- ✅ 如果没有 code，降级显示 "ID: xxx"

---

### 2. 确保列表已加载

#### 问题场景

```
1. 用户进入编辑模式
   ↓
2. props.modelValue.themeInfo 包含数据
   { ownerId: 1, ownerType: 'GAME', ... }
   ↓
3. watch 触发，更新 formData
   formData.ownerId = 1
   ↓
4. el-select 尝试显示
   ❌ 但 gameList 还未加载
   ❌ 无法找到 gameId=1 的选项
   ❌ 只能显示数字 "1"
```

---

#### 修复逻辑

```typescript
watch(
  () => props.modelValue.themeInfo,
  (newValue) => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(formData.value)) {
      // ⭐ 先更新 formData
      formData.value = { ...newValue }
      
      // ⭐ 如果有 ownerId，确保加载了对应的业务类型列表
      if (newValue.ownerId && newValue.ownerType) {
        // 确保列表已加载
        if (newValue.ownerType === 'GAME' && gameList.value.length === 0) {
          loadGameList()  // ← 加载游戏列表
        } else if (newValue.ownerType === 'APPLICATION' && appList.value.length === 0) {
          loadAppList()   // ← 加载应用列表
        }
      }
    }
  },
  { deep: true, immediate: true }
)
```

---

## 🎯 完整流程

### DIY/编辑模式数据流

```
1. 页面初始化
   ↓
2. 路由参数解析
   ?themeId=xxx&gameId=1&mode=edit
   ↓
3. 父组件加载主题数据
   const themeData = await themeApi.getDetail(themeId)
   // { ownerId: 1, ownerType: 'GAME', themeName: 'xxx' }
   ↓
4. 传递给 BasicInfoPanel
   <BasicInfoPanel :model-value="themeData" />
   ↓
5. watch 监听到变化
   ├─ 更新 formData.ownerId = 1
   ├─ 检查 gameList 是否为空
   └─ 调用 loadGameList()
   ↓
6. 游戏列表加载完成
   gameList = [
     { label: "贪吃蛇", value: 1, code: "snake-vue3" },
     { label: "植物大战僵尸", value: 2, code: "pvz" }
   ]
   ↓
7. el-select 重新渲染
   ✅ 找到 value=1 的选项
   ✅ 显示 label: "贪吃蛇"
```

---

## 📊 对比效果

### 修复前

```
适用业务：[ 1 ▼ ]  ← 只显示数字
           ↑
        显示的是 ownerId 的值
```

**问题**：
- ❌ 用户不知道 "1" 代表什么
- ❌ 不够直观
- ❌ 体验很差

---

### 修复后

```
适用业务：[ 贪吃蛇大冒险 ▼ ]  ← 显示游戏名称
           右侧灰色小字：snake-vue3
```

**优势**：
- ✅ 清晰显示游戏名称
- ✅ 同时显示游戏编码
- ✅ 用户体验友好

---

## 🔍 技术细节

### Element Plus Select 组件原理

```vue
<el-select v-model="formData.ownerId">
  <el-option 
    :label="item.label"   <!-- 显示的文本 -->
    :value="item.value"   <!-- 绑定的值 -->
  />
</el-select>
```

**工作机制**：
1. el-select 查找 `currentBusinessList` 中 `value === formData.ownerId` 的项
2. 如果找到，显示该项的 `label`
3. 如果找不到，直接显示 `formData.ownerId` 的值（数字）

---

### 为什么会出现问题？

**时序问题**：
```
时间轴：
t0: formData.ownerId = 1 (被赋值)
t1: el-select 尝试显示 → 显示 "1"（列表为空）
t2: loadGameList() 完成
t3: 列表更新，但 el-select 已经渲染过了
```

**修复方法**：
```typescript
// ⭐ 在更新 formData 之前，先确保列表已加载
if (newValue.ownerId && newValue.ownerType) {
  if (newValue.ownerType === 'GAME' && gameList.value.length === 0) {
    loadGameList()  // 先加载列表
  }
}
formData.value = { ...newValue }  // 再更新表单
```

---

## ✅ 验证清单

### 测试场景 1：DIY 模式

```javascript
// URL: ?themeId=xxx&gameId=1
// 预期结果：
// 1. 适用业务显示 "贪吃蛇大冒险"
// 2. 右侧灰色显示 "snake-vue3"
// 3. 选择器被禁用
```

---

### 测试场景 2：编辑模式

```javascript
// URL: ?themeId=xxx&gameId=1&mode=edit
// 预期结果：
// 1. 适用业务显示 "贪吃蛇大冒险"
// 2. 右侧灰色显示 "snake-vue3"
// 3. 选择器被禁用
```

---

### 测试场景 3：新建模式

```javascript
// URL: 无参数
// 预期结果：
// 1. 适用业务显示 "请选择游戏"
// 2. 可以选择游戏
// 3. 选择后显示游戏名称
```

---

## 🐛 注意事项

### 1. 确保列表加载时机

```typescript
// ❌ 错误：列表未加载就赋值
formData.value = { ...newValue }
loadGameList()  // 太晚了

// ✅ 正确：先加载列表再赋值
if (condition) {
  await loadGameList()
}
formData.value = { ...newValue }
```

---

### 2. Flex 布局样式

```vue
<div style="display: flex; justify-content: space-between; align-items: center;">
  <span>{{ item.label }}</span>
  <span style="color: #8492a6; font-size: 13px;">
    {{ item.code || 'ID: ' + item.dbId }}
  </span>
</div>
```

**关键点**：
- ✅ `justify-content: space-between` → 两端对齐
- ✅ `align-items: center` → 垂直居中
- ✅ 右侧使用灰色小字

---

## 📚 相关文档

- [GTRS 编辑器动态加载实现](./GTRS_EDITOR_DYNAMIC_LOADING_IMPLEMENTATION.md)
- [GTRS 编辑器业务选择优化](./GTRS_EDITOR_BUSINESS_SELECT_OPTIMIZATION.md)
- [GTRS 编辑器 gameId 修正](./GTRS_EDITOR_GAMEID_FIX.md)
- [GTRS 编辑器编译错误修复](./GTRS_EDITOR_COMPILE_ERROR_FIX.md)

---

## ✅ 总结

### 核心改动

| 文件 | 改动内容 |
|------|----------|
| **BasicInfoPanel.vue** | ✅ 优化选项布局（flex）<br>✅ 添加列表加载监听<br>✅ 确保 DIY/编辑模式显示名称 |

### 修复的问题

1. ✅ DIY/编辑模式下显示数字 → 显示游戏名称
2. ✅ 选项列表未加载 → 主动触发加载
3. ✅ float 布局问题 → 使用 flex 布局

### 用户体验提升

| 维度 | 修复前 | 修复后 |
|------|--------|--------|
| **显示内容** | 数字 "1" | "贪吃蛇大冒险" |
| **辅助信息** | 无 | 右侧显示 "snake-vue3" |
| **布局** | float | flex（更可靠） |
| **加载时机** | 被动 | 主动检测并加载 |

---

**修复时间**：2026-03-22  
**修复目标**：确保 DIY 和编辑模式下，适用业务下拉框正确显示游戏名称
