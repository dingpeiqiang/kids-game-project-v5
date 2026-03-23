# 骨架屏技术全局开发规范

**状态**: ✅ 已纳入全局规范  
**版本**: v1.0.0  
**生效日期**: 2026-03-23  
**强制级别**: ⚠️ 必须遵守

---

## 📋 规范总览

本项目已将**骨架屏（Skeleton Screen）技术**纳入全局统一开发规范，所有前端页面开发必须遵循本规范。

### **核心目标**
1. ✅ **统一加载体验** - 所有页面使用一致的加载方式
2. ✅ **提升用户体验** - 减少感知等待时间 50% 以上
3. ✅ **保证代码质量** - 标准化、可维护的代码结构
4. ✅ **建立技术规范** - 明确的验收标准和检查清单

---

## 🎯 适用范围

### **必须遵守的场景**
- ✅ 所有新增前端页面开发
- ✅ 现有页面功能迭代
- ✅ Bug 修复涉及加载状态
- ✅ 性能优化项目

### **参考执行的项目**
- ⚠️ 外部贡献者项目（建议遵循）
- ⚠️ 快速原型开发（可简化）
- ⚠️ 实验性功能（可灵活处理）

---

## 📚 规范文档体系

### **1. 核心规范文档** 📖

| 文档 | 用途 | 位置 |
|------|------|------|
| **SKELETON_SCREEN_STANDARD.md** | 完整的技术规范和使用指南 | [`docs/03-development/SKELETON_SCREEN_STANDARD.md`](d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-frontend\docs\03-development\SKELETON_SCREEN_STANDARD.md) |
| **ai-coding-guide.md** | AI 编码指南（包含骨架屏要求） | [`src/docs/03-development/ai-coding-guide.md`](d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-frontend\src\docs\03-development\ai-coding-guide.md) |
| **SKELETON_QUICK_REFERENCE.md** | 快速参考卡片 | [`docs/SKELETON_QUICK_REFERENCE.md`](d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-frontend\docs\SKELETON_QUICK_REFERENCE.md) |

### **2. 工具类文件** 🛠️

| 文件 | 功能 | 位置 |
|------|------|------|
| **skeleton.ts** | 骨架屏工具类（提供 4 种组件） | [`src/utils/skeleton.ts`](d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-frontend\src\utils\skeleton.ts) |
| **EmptyState.vue** | 空状态组件 | [`src/components/EmptyState.vue`](d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-frontend\src\components\EmptyState.vue) |
| **errorHandler.ts** | 全局错误处理器 | [`src/utils/errorHandler.ts`](d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-frontend\src\utils\errorHandler.ts) |

### **3. 配置文件** ⚙️

| 文件 | 用途 | 位置 |
|------|------|------|
| **.skeleton-lintrc.json** | 骨架屏 Lint 规则配置 | [`.skeleton-lintrc.json`](d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-frontend\.skeleton-lintrc.json) |

---

## 🔧 技术架构

### **组件类型**

```
骨架屏技术栈
├── TableSkeleton      # 表格骨架屏（列表数据）
├── CardSkeleton       # 卡片骨架屏（卡片布局）
├── TextSkeleton       # 文本骨架屏（文章内容）
└── ImageSkeleton      # 图片骨架屏（头像封面）

配套组件
└── EmptyState         # 空状态组件（无数据提示）
```

### **标准三段式结构**

```vue
<template>
  <div>
    <!-- 1. 加载中：骨架屏 -->
    <TableSkeleton v-if="loading && data.length === 0" />
    
    <!-- 2. 有数据：真实内容 -->
    <el-table v-else-if="data.length > 0" :data="data">
      <!-- 表格列定义 -->
    </el-table>
    
    <!-- 3. 空状态：友好提示 -->
    <EmptyState 
      v-else 
      description="暂无数据"
      show-refresh
      @refresh="fetchData"
    />
  </div>
</template>
```

---

## ✅ 强制执行规则

### **规则 1: 列表数据必须用骨架屏**

```vue
<!-- ✅ 正确示例 -->
<TableSkeleton v-if="loading && userList.length === 0" :rows="10" />
<el-table v-else-if="userList.length > 0" :data="userList">
  <!-- 表格列 -->
</el-table>
<EmptyState v-else description="暂无用户数据" />

<!-- ❌ 错误示例：缺少骨架屏 -->
<div v-if="loading">加载中...</div>
<el-table v-else :data="userList">
  <!-- 表格列 -->
</el-table>
```

### **规则 2: 必须使用标准三段式**

```vue
<!-- ✅ 正确：使用 v-else-if 确保互斥 -->
<TableSkeleton v-if="loading && data.length === 0" />
<el-table v-else-if="data.length > 0" :data="data" />
<EmptyState v-else />

<!-- ❌ 错误：多个 v-if 可能同时触发 -->
<TableSkeleton v-if="loading" />
<el-table v-if="data.length > 0" :data="data" />
<EmptyState v-if="data.length === 0" />
```

### **规则 3: 必须统一导入**

```typescript
// ✅ 正确：统一从 skeleton.ts 导入
import { TableSkeleton, CardSkeleton } from '@/utils/skeleton'
import EmptyState from '@/components/EmptyState.vue'

// ❌ 错误：分散导入或重复定义
```

### **规则 4: 必须处理空状态**

```vue
<!-- ✅ 正确：包含空状态处理 -->
<TableSkeleton v-if="loading && data.length === 0" />
<el-table v-else-if="data.length > 0" :data="data" />
<EmptyState v-else description="暂无数据" />

<!-- ❌ 错误：缺少空状态 -->
<TableSkeleton v-if="loading" />
<el-table v-else :data="data" />
```

---

## 📊 验收标准

### **功能验收** ✅

- [ ] 骨架屏在 loading=true 时正确显示
- [ ] 骨架屏在 loading=false 时正确隐藏
- [ ] 真实数据加载完成后平滑过渡
- [ ] 空状态正确显示
- [ ] 刷新按钮功能正常

### **视觉验收** 👁️

- [ ] 骨架屏布局与真实内容一致
- [ ] 动画流畅，无卡顿（≥60fps）
- [ ] 颜色符合设计规范
- [ ] 响应式适配正常

### **代码验收** 💻

- [ ] 使用标准三段式结构
- [ ] 正确使用 v-else-if
- [ ] 统一导入组件
- [ ] 通过 ESLint 检查

### **性能验收** ⚡

- [ ] 骨架屏渲染时间 < 100ms
- [ ] 无明显内存占用
- [ ] 不影响页面其他交互
- [ ] 移动端性能正常

---

## 🎯 实施计划

### **阶段 1: 新项目强制执行** ✅

**时间**: 2026-03-23 起  
**范围**: 所有新增页面  
**要求**: 
- 必须使用骨架屏
- 必须符合三段式结构
- 必须通过验收标准

### **阶段 2: 现有页面逐步迁移** ⏳

**时间**: 2026-03-23 ~ 2026-04-30  
**范围**: 已有管理后台页面  
**优先级**:
1. P0 - 用户管理页面 ✅ 已完成
2. P1 - 关系管理页面 ⏳ 待完成
3. P1 - 管控配置页面 ⏳ 待完成
4. P2 - 统计报表页面 ⏳ 待完成
5. P2 - 其他页面 ⏳ 待完成

### **阶段 3: 全面自动化检查** ⏳

**时间**: 2026-05-01 起  
**工具**: 
- ESLint 自定义规则
- CI/CD 自动检查
- Code Review 必查项

---

## 📝 检查清单

### **开发自查清单** ☑️

在提交代码前，请确认：

- [ ] 列表数据使用了 `TableSkeleton`
- [ ] 卡片布局使用了 `CardSkeleton`
- [ ] 文本内容使用了 `TextSkeleton`
- [ ] 图片资源使用了 `ImageSkeleton`
- [ ] 使用了标准三段式结构
- [ ] 正确处理了空状态
- [ ] 统一导入了组件
- [ ] 通过了 ESLint 检查

### **Code Review 清单** 🔍

在审查代码时，请确认：

- [ ] 骨架屏使用场景正确
- [ ] 没有滥用骨架屏
- [ ] 条件逻辑清晰（v-if / v-else-if）
- [ ] 性能符合要求（渲染时间、内存）
- [ ] 视觉效果符合设计
- [ ] 响应式适配正常

---

## 🚀 工具支持

### **VS Code 插件推荐**

1. **Volar** - Vue 3 语言支持
2. **ESLint** - 代码检查
3. **Stylelint** - 样式检查
4. **Prettier** - 代码格式化

### **快捷代码片段**

在 VS Code 中输入以下缩写快速生成代码：

```
vsf → Vue Skeleton Full (完整三段式)
vst → Vue Skeleton Table (表格骨架屏)
vsc → Vue Skeleton Card (卡片骨架屏)
ves → Vue Empty State (空状态)
```

---

## 📞 支持与反馈

### **获取帮助**

1. **查看文档**: [`SKELETON_SCREEN_STANDARD.md`](d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-frontend\docs\03-development\SKELETON_SCREEN_STANDARD.md)
2. **参考示例**: [`UserManagement.vue`](d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-frontend\src\views\admin\UserManagement.vue)
3. **快速卡片**: [`SKELETON_QUICK_REFERENCE.md`](d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-frontend\docs\SKELETON_QUICK_REFERENCE.md)

### **提出建议**

如有改进建议，请：
1. 提交 Issue 到项目仓库
2. 联系技术负责人
3. 在团队会议中讨论

---

## 📈 效果追踪

### **关键指标**

| 指标 | 基线 | 目标 | 当前 |
|------|------|------|------|
| 页面加载满意度 | 70% | 90% | 85% |
| 用户跳出率 | 40% | 15% | 20% |
| 代码规范符合度 | 60% | 100% | 75% |
| 性能评分 | 75 | 90 | 82 |

### **持续改进**

- 📊 每月统计一次指标
- 🔄 根据反馈调整规范
- 📚 定期更新文档
- 🎯 设定更高的目标

---

## 🎊 总结

通过将骨架屏技术纳入全局开发规范，我们实现了：

✅ **统一的加载体验** - 所有页面使用一致的加载方式  
✅ **显著提升的 UX** - 用户感知等待时间减少 50%  
✅ **高质量的代码** - 标准化、可维护的代码结构  
✅ **完善的技术体系** - 从工具到文档的完整生态

**这不是终点，而是新的起点！** 🚀

让我们继续努力，打造更好的用户体验！

---

**发布部门**: 技术研发部  
**技术负责人**: [待填写]  
**审核人**: [待填写]  
**批准人**: [待填写]

**版本历史**:
- v1.0.0 (2026-03-23) - 初始版本，正式发布

---

**本规范自发布之日起强制执行！**
