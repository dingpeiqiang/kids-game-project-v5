# ✅ 路由循环跳转问题修复

## 🐛 问题描述

### 错误信息
```
Uncaught RangeError: Maximum call stack size exceeded
    at Object.parse (vue-router.js:1283:26)
    at Object.resolve (vue-router.js:1480:26)
    at pushWithRedirect (vue-router.js:1968:32)
```

### 根本原因
**路由配置中两个不同的路径使用了相同的 name**，导致 vue-router 解析时出现循环引用。

---

## ❌ 错误的配置

```typescript
const router = createRouter({
  routes: [
    {
      path: '/',        // ❌ 路径 1
      name: 'loading',  // ❌ name: loading
      component: LoadingView,
    },
    {
      path: '/loading',  // ❌ 路径 2
      name: 'loading',   // ❌ name: loading（重复！）
      component: LoadingView,
    },
    // ... 其他路由
  ]
})
```

### 问题分析

1. **Vue Router 的 name 必须唯一**
   - `name` 是路由的唯一标识符
   - 不能有两个路由使用相同的 `name`
   - 否则会导致 `router.resolve()` 和 `router.push()` 无法正确解析

2. **为什么会栈溢出？**
   ```
   访问 '/' → 匹配到 name:'loading' 
   → 可能重定向到 '/loading' 
   → 又匹配到 name:'loading'
   → 无限循环...
   ```

3. **触发场景**
   - 在代码中使用 `router.push({ name: 'loading' })`
   - Vue Router 内部解析路由时
   - 都会因为 name 冲突而导致循环

---

## ✅ 正确的配置

```typescript
const router = createRouter({
  routes: [
    {
      path: '/',           // ✅ 首页入口
      name: 'home',        // ✅ 使用唯一的 name
      component: LoadingView,
    },
    {
      path: '/loading',    // ✅ Loading 页面
      name: 'loading',     // ✅ 不同的 name
      component: LoadingView,
    },
    {
      path: '/start',
      name: 'start',       // ✅ 每个 name 都唯一
      component: StartView,
    },
    // ... 其他路由
  ]
})
```

---

## 🔧 已修复的内容

### 1. 修复模板框架的路由配置
**文件**: `templates/game-template/src/router/index.ts`

**修改**:
```diff
{
  path: '/',
- name: 'loading',
+ name: 'home',  // ✅ 使用不同的 name
  component: LoadingView,
}
```

---

## 📋 路由命名规范

### 推荐做法

| 路径 | 推荐 name | 说明 |
|------|----------|------|
| `/` | `home` | 首页入口 |
| `/loading` | `loading` | 加载页面 |
| `/start` | `start` | 游戏开始页面 |
| `/difficulty` | `difficulty` | 难度选择页面 |
| `/game` | `game` | 游戏主页面 |
| `/gameover` | `gameover` | 游戏结束页面 |

### 命名规则
- ✅ **唯一性**: 每个路由的 `name` 必须唯一
- ✅ **语义化**: 使用有意义的英文单词
- ✅ **一致性**: 与路径保持一定的对应关系
- ✅ **简洁性**: 不要太长，便于记忆和使用

---

## 🎯 如何避免类似问题

### 1. 检查路由 name 唯一性

在添加新路由时，确保：
```typescript
// ❌ 错误示例
{ path: '/a', name: 'same-name' }
{ path: '/b', name: 'same-name' }  // ❌ name 重复

// ✅ 正确示例
{ path: '/a', name: 'page-a' }
{ path: '/b', name: 'page-b' }
```

### 2. 使用路由名称常量

```typescript
// constants/route-names.ts
export const ROUTE_NAMES = {
  HOME: 'home',
  LOADING: 'loading',
  START: 'start',
  DIFFICULTY: 'difficulty',
  GAME: 'game',
  GAMEOVER: 'gameover',
} as const

// router/index.ts
import { ROUTE_NAMES } from '@/constants/route-names'

{
  path: '/',
  name: ROUTE_NAMES.HOME,  // ✅ 使用常量，避免拼写错误
  component: LoadingView,
}
```

### 3. 添加 TypeScript 类型检查

```typescript
// types/route.ts
export type RouteName = 
  | 'home'
  | 'loading'
  | 'start'
  | 'difficulty'
  | 'game'
  | 'gameover'

// 使用时
router.push({ name: 'home' as RouteName })  // ✅ 类型安全
```

---

## 🚀 测试验证

### 测试步骤

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **访问首页**
   ```
   http://localhost:5173/
   ```

3. **检查控制台**
   - ✅ 应该看到 "🔀 路由切换：→ /"
   - ✅ 不应该有 "Maximum call stack size exceeded" 错误
   - ✅ LoadingView 正常显示

4. **测试路由跳转**
   ```typescript
   // 在浏览器控制台执行
   router.push({ name: 'home' })      // ✅ 应该正常工作
   router.push({ name: 'loading' })   // ✅ 应该正常工作
   router.push({ name: 'start' })     // ✅ 应该正常工作
   ```

---

## 📊 影响范围

### 需要更新的项目

所有从模板复制的游戏项目都需要检查：

1. **plane-shooter** ✅ 已修复
2. **snake** ⏳ 待检查
3. **其他游戏** ⏳ 待检查

### 检查清单

对于每个游戏项目，检查：
- [ ] `src/router/index.ts` 中的路由 name 是否唯一
- [ ] 是否有重复的 `name: 'loading'`
- [ ] 路由跳转是否正常工作
- [ ] 控制台是否有栈溢出错误

---

## 💡 最佳实践总结

### 1. 路由配置原则
- ✅ 每个路由必须有唯一的 `name`
- ✅ `path` 和 `name` 一一对应
- ✅ 避免使用相同 `name` 指向不同 `path`
- ✅ 使用有意义的命名

### 2. 调试技巧
- 🔍 在路由守卫中添加日志
  ```typescript
  router.beforeEach((to, from, next) => {
    console.log('路由变化:', from.name, '→', to.name)
    next()
  })
  ```

- 🔍 使用 Vue DevTools 查看路由状态
- 🔍 检查路由表的 name 唯一性

### 3. 代码审查要点
- 📝 新增路由时必须检查 name 唯一性
- 📝 修改现有路由时要测试所有跳转
- 📝 定期清理未使用的路由

---

## 🎯 结论

### 问题根源
**模板框架的路由配置错误** - 两个不同的路径使用了相同的 name

### 修复方案
将根路径 `/` 的 name 从 `'loading'` 改为 `'home'`

### 预防措施
1. 建立路由命名规范
2. 使用常量管理路由名称
3. 添加 TypeScript 类型检查
4. 定期代码审查

---

**修复时间**: 2026-03-29  
**影响**: 所有基于模板的游戏项目  
**状态**: ✅ 已修复并验证
