# GTRS 编辑器适用业务枚举项调试日志

## 📋 添加的日志说明

### 1. Computed 属性日志

```typescript
const currentBusinessList = computed(() => {
  const type = formData.value.ownerType
  const list = type === 'GAME' ? gameList.value : appList.value
  
  // ⭐ 每次访问 computed 时都会打印
  console.log('[BasicInfoPanel] currentBusinessList - 类型:', type, 
              '列表项数:', list.length, 
              '列表内容:', list)
  
  return list
})
```

**作用**：
- ✅ 追踪 computed 何时被访问
- ✅ 查看当前使用的业务类型（GAME/APPLICATION）
- ✅ 查看列表项数和完整内容
- ✅ 验证数据响应式更新

---

### 2. 游戏列表加载成功日志

```typescript
console.log('[BasicInfoPanel] ✅ 游戏列表加载完成:', gameList.value.length, '项')
console.log('[BasicInfoPanel] 游戏枚举项详情:', JSON.stringify(gameList.value, null, 2))
```

**输出示例**：
```
[BasicInfoPanel] ✅ 游戏列表加载完成：3 项
[BasicInfoPanel] 游戏枚举项详情: [
  {
    "label": "贪吃蛇大冒险",
    "value": 1,
    "dbId": 1,
    "code": "snake-vue3",
    "originalData": {...}
  },
  {
    "label": "植物大战僵尸",
    "value": 2,
    "dbId": 2,
    "code": "pvz",
    "originalData": {...}
  },
  {
    "label": "飞行射击",
    "value": 3,
    "dbId": 3,
    "code": "shooter",
    "originalData": {...}
  }
]
```

---

### 3. 应用列表加载成功日志

```typescript
console.log('[BasicInfoPanel] ✅ 应用列表加载完成:', appList.value.length, '项')
console.log('[BasicInfoPanel] 应用枚举项详情:', JSON.stringify(appList.value, null, 2))
```

**输出示例**：
```
[BasicInfoPanel] ✅ 应用列表加载完成：1 项
[BasicInfoPanel] 应用枚举项详情: [
  {
    "label": "示例应用",
    "value": 100,
    "dbId": 100,
    "code": "example-app"
  }
]
```

---

### 4. 降级数据日志

```typescript
// 游戏列表加载失败时
console.log('[BasicInfoPanel] ⚠️ 使用降级游戏列表:', gameList.value)

// 应用列表加载失败时
console.log('[BasicInfoPanel] ⚠️ 应用列表为空:', appList.value)
```

**作用**：
- ✅ 标识使用了备用数据
- ✅ 便于排查后端接口问题

---

## 🔍 完整的日志流程

### 场景 1：组件初始化 + 编辑模式

```
1. 组件挂载，开始预加载业务列表...
   [BasicInfoPanel] 组件挂载，开始预加载业务列表...

2. 并行加载游戏和应用列表
   [BasicInfoPanel] 后端返回的游戏列表：[...]
   
3. 游戏列表加载完成
   [BasicInfoPanel] ✅ 游戏列表加载完成：3 项
   [BasicInfoPanel] 游戏枚举项详情：[...详细 JSON...]
   
4. 应用列表加载完成
   [BasicInfoPanel] ✅ 应用列表加载完成：1 项
   [BasicInfoPanel] 应用枚举项详情：[...详细 JSON...]
   
5. 所有业务列表预加载完成
   [BasicInfoPanel] 所有业务列表预加载完成
   
6. 应用 themeInfo（编辑模式）
   [BasicInfoPanel] watch 监听到 themeInfo 变化
   [BasicInfoPanel] 开始应用 themeInfo: { ownerType: 'GAME', ownerId: 1, ... }
   
7. 访问 currentBusinessList（模板渲染时）
   [BasicInfoPanel] currentBusinessList - 类型：GAME 
                    列表项数：3 
                    列表内容：[{label:"贪吃蛇大冒险", value:1, ...}, ...]
   
8. 赋值完成
   [BasicInfoPanel] themeInfo 应用完成，formData: { ownerType: 'GAME', ownerId: 1, ... }
```

---

### 场景 2：用户切换业务类型

```
1. 用户从 GAME 切换到 APPLICATION
   （无日志，formData.ownerType 变化）
   
2. 模板重新渲染，访问 currentBusinessList
   [BasicInfoPanel] currentBusinessList - 类型：APPLICATION 
                    列表项数：1 
                    列表内容：[{label:"示例应用", value:100, ...}]
   
3. 下拉框显示应用选项
```

---

### 场景 3：用户选择具体业务

```
1. 用户点击下拉框
   （无日志）
   
2. 选择 gameId = 2
   [BasicInfoPanel] 选择业务：2 → gameId: 2
   
3. 自动生成主题 ID
   （无日志，除非在 handleBusinessChange 中添加）
```

---

## 📊 关键验证点

### ✅ 验证列表已加载

查找以下日志证明列表加载成功：
```
[BasicInfoPanel] ✅ 游戏列表加载完成：X 项
[BasicInfoPanel] 游戏枚举项详情：[...]
```

---

### ✅ 验证 computed 被访问

查找以下日志证明模板正确渲染：
```
[BasicInfoPanel] currentBusinessList - 类型：GAME/APPLICATION 
                 列表项数：X 
                 列表内容：[...]
```

---

### ✅ 验证数据正确性

检查枚举项详情中的每个对象：
- ✅ `label`：显示名称是否正确
- ✅ `value`：数据库主键是否正确
- ✅ `code`：业务编码是否正确
- ✅ `dbId`：是否与 value 一致

---

## 🛠️ 调试技巧

### 技巧 1：快速查看枚举项

在浏览器控制台筛选日志：
```
过滤条件：[BasicInfoPanel] 游戏枚举项详情
```

可以看到格式化的完整 JSON 数据。

---

### 技巧 2：跟踪数据变化

观察 `currentBusinessList` 的多次输出：
- 第一次：初始化时的列表
- 第二次：切换类型后的列表
- 第三次：数据更新后的列表

---

### 技巧 3：排查空列表

如果看到：
```
[BasicInfoPanel] currentBusinessList - 类型：GAME 列表项数：0
```

说明列表未正确加载，需要检查：
1. 后端接口是否返回数据
2. `loadGameList()` 是否被调用
3. `loadedOwnerType.value` 是否正确设置

---

## ⚠️ 常见问题排查

### 问题 1：下拉框显示为空

**检查日志顺序**：
```
❌ 错误顺序：
[BasicInfoPanel] currentBusinessList - 列表项数：0  ← 先访问
[BasicInfoPanel] ✅ 游戏列表加载完成：3 项          ← 后加载

✅ 正确顺序：
[BasicInfoPanel] ✅ 游戏列表加载完成：3 项          ← 先加载
[BasicInfoPanel] currentBusinessList - 列表项数：3  ← 后访问
```

---

### 问题 2：枚举项数据格式错误

**检查枚举项详情日志**：
```javascript
[BasicInfoPanel] 游戏枚举项详情: [
  {
    "label": "...",      // ← 是否有值
    "value": 1,          // ← 是否是数字
    "dbId": 1,           // ← 是否与 value 一致
    "code": "..."        // ← 是否有值
  }
]
```

---

### 问题 3：使用了降级数据

**查找警告日志**：
```
[BasicInfoPanel] ⚠️ 使用降级游戏列表：[...]
```

说明后端接口失败，正在使用硬编码的默认数据。

---

## 📝 日志级别说明

| 前缀 | 级别 | 说明 |
|------|------|------|
| `[BasicInfoPanel]` | INFO | 普通信息 |
| `[BasicInfoPanel] ✅` | SUCCESS | 成功操作 |
| `[BasicInfoPanel] ⚠️` | WARNING | 警告信息（降级数据） |
| `[BasicInfoPanel] ❌` | ERROR | 错误信息 |

---

## 🎯 下一步优化建议

### 建议 1：添加更详细的变更日志

```typescript
watch(
  () => formData.value.ownerId,
  (newVal, oldVal) => {
    console.log('[BasicInfoPanel] ownerId 变化:', oldVal, '→', newVal)
  }
)
```

---

### 建议 2：添加性能监控

```typescript
const loadGameList = async () => {
  const startTime = Date.now()
  // ... 加载逻辑
  const duration = Date.now() - startTime
  console.log('[BasicInfoPanel] 游戏列表加载耗时:', duration, 'ms')
}
```

---

### 建议 3：添加错误堆栈

```typescript
catch (e) {
  console.error('[BasicInfoPanel] 加载游戏列表失败:', e)
  console.error('[BasicInfoPanel] 错误堆栈:', e.stack)
  // ...
}
```

---

**修改日期**：2026-03-22  
**修改文件**：`BasicInfoPanel.vue`  
**修改内容**：添加适用业务枚举项的详细调试日志  
**日志位置**：
- `currentBusinessList` computed 属性
- `loadGameList()` 函数
- `loadAppList()` 函数
