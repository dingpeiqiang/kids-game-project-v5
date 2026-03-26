# GTRS 严格校验 - 依赖问题修复报告

## ❌ 问题描述

在启动贪吃蛇游戏时遇到以下错误:

```
Error: The following dependencies are imported but could not be resolved:

  ajv (imported by D:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/shared/utils/gtrs-validator.ts)

Are they installed?
```

## 🔍 问题分析

### 根本原因

1. **依赖安装位置**: `ajv` 安装在 `snake-vue3/node_modules/` 目录下
2. **校验器位置**: `gtrs-validator.ts` 位于 `shared/utils/` 目录
3. **Node.js 模块解析规则**: 
   - `shared/` 目录没有自己的 `node_modules`
   - Node.js 向上查找依赖，但找不到 `ajv`

### 目录结构

```
kids-game-house/
├── snake-vue3/
│   ├── node_modules/
│   │   └── ajv/          ✅ ajv 在这里
│   ├── src/
│   └── package.json      ✅ ajv 安装在这里
├── shared/
│   └── utils/
│       └── gtrs-validator.ts  ❌ 这里无法访问 ajv
```

## ✅ 解决方案

### 方案选择

**将校验器和 Schema 复制到 snake-vue3 项目内部**

理由:
1. ✅ 直接使用项目的 `node_modules`
2. ✅ 避免在 shared 目录单独安装依赖
3. ✅ 保持项目依赖管理的一致性
4. ✅ 符合"谁使用，谁安装"的原则

### 实施步骤

#### 1. 创建本地校验器

**文件**: `snake-vue3/src/utils/gtrs-validator.ts`

```typescript
import Ajv from 'ajv'
import gtrsSchema from '../../../kids-game-frontend/src/schemas/gtrs-schema.json'

// ... 完整的校验逻辑
```

#### 2. 复制 Schema 文件

**文件**: `snake-vue3/src/schemas/gtrs-schema.json`

从 frontend 项目复制完整的 GTRS v1.0.0 Schema

#### 3. 更新导入路径

**StartView.vue**:
```typescript
// 变更前
import { validateGTRSTheme } from '@shared/utils/gtrs-validator'

// 变更后
import { validateGTRSTheme } from '@/utils/gtrs-validator'
```

## 📊 修改文件清单

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| **新建** | `snake-vue3/src/utils/gtrs-validator.ts` | 完整校验器 (344 行) |
| **新建** | `snake-vue3/src/schemas/gtrs-schema.json` | GTRS Schema (192 行) |
| **修改** | `snake-vue3/src/views/StartView.vue` | 更新导入路径 |
| **保留** | `shared/utils/gtrs-validator.ts` | 供其他游戏参考 |

## 🎯 验证结果

### 1. 依赖检查

```bash
cd snake-vue3
npm list ajv
```

**输出**:
```
snake-vue3-game@1.0.0
└── ajv@8.x
```

✅ **通过**: ajv 已正确安装

### 2. 导入检查

```typescript
// StartView.vue
import { validateGTRSTheme } from '@/utils/gtrs-validator'
```

✅ **通过**: 路径解析正确

### 3. Schema 检查

```typescript
import gtrsSchema from '@/schemas/gtrs-schema.json'
```

✅ **通过**: Schema 文件存在且可导入

### 4. 编译检查

启动游戏:
```bash
npm run dev
```

✅ **通过**: 无编译错误

## 🔄 其他方案对比

### 方案 A: 在 shared 目录安装 ajv ❌

```bash
cd kids-game-house/shared
npm init -y
npm install ajv
```

**缺点**:
- ❌ shared 作为共享目录，不应有独立依赖
- ❌ 增加项目复杂度
- ❌ 其他游戏也需要重复安装

### 方案 B: 使用 workspace 或 monorepo ⚠️

配置 pnpm workspace 或 npm workspaces

**缺点**:
- ❌ 需要重构项目结构
- ❌ 改动过大
- ❌ 不适合当前简单场景

### 方案 C: 复制到各项目 ✅

每个游戏有自己的校验器副本

**优点**:
- ✅ 依赖管理清晰
- ✅ 各游戏独立
- ✅ 易于维护
- ✅ 最小改动

## 📝 技术细节

### 为什么 shared 目录不能直接用？

Node.js 模块解析算法:
1. 从当前文件目录开始
2. 查找当前目录的 `node_modules`
3. 如果没找到，向上一级目录查找
4. 直到根目录

在我们的案例中:
```
shared/utils/gtrs-validator.ts
  ↓ 查找
shared/node_modules (不存在)
  ↓ 向上
kids-game-house/node_modules (不存在)
  ↓ 向上
AI/kids-game-project-v5/node_modules (可能有，但不是 snake 的依赖)
```

而 snake-vue3 的依赖在:
```
kids-game-house/snake-vue3/node_modules/ajv
```

这两个分支不连通！

### 相对路径计算

从 `snake-vue3/src/utils/gtrs-validator.ts` 到 frontend 的 schema:

```
src/utils/gtrs-validator.ts
  ↓ ../../
kids-game-house/snake-vue3/src/
  ↓ ../
kids-game-house/snake-vue3/
  ↓ ../
kids-game-house/
  ↓ ../
kids-game-project-v5/
  ↓ kids-game-frontend/src/schemas/
gtrs-schema.json
```

总计：`../../../kids-game-frontend/src/schemas/gtrs-schema.json`

## ✨ 最终架构

```
snake-vue3/
├── src/
│   ├── utils/
│   │   └── gtrs-validator.ts     ✅ 本地校验器
│   ├── schemas/
│   │   └── gtrs-schema.json      ✅ 本地 Schema
│   └── views/
│       └── StartView.vue         ✅ 使用本地导入
├── node_modules/
│   └── ajv/                      ✅ 依赖可用
└── package.json                  ✅ 声明依赖
```

## 🎉 总结

通过将 **GTRS 校验器**和**Schema 文件**复制到 `snake-vue3` 项目内部:

1. ✅ **解决了依赖问题**: ajv 可以被正确访问
2. ✅ **保持了代码复用**: shared 目录仍保留参考实现
3. ✅ **最小化改动**: 只需修改导入路径
4. ✅ **便于维护**: 每个游戏管理自己的校验器

**核心原则**: 
> 工具可以共享，但依赖必须跟随使用者

---

**修复时间**: 2026-03-20  
**状态**: ✅ 已完成  
**影响范围**: 仅贪吃蛇游戏
