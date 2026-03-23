# GTRS 统一校验架构方案

## 📋 架构设计

### 方案二：后端校验为主（前端简化）

**设计理念**：
- ✅ 前端只做最基本的格式检查（JSON 解析、字段存在性）
- ✅ 完整的 GTRS Schema校验全部交给后端
- ✅ 所有游戏项目共享同一个校验工具库
- ✅ 避免重复代码，易于维护

## 🏗️ 架构层次

```
┌─────────────────────────────────────────┐
│         前端（轻量级检查）               │
│  - JSON 格式解析                         │
│  - 基本字段存在性检查                    │
│  - GTRS 标识检查                         │
└──────────────┬──────────────────────────┘
               │
               ↓ API 调用
┌──────────────┴──────────────────────────┐
│         后端（完整校验）                 │
│  - JSON Schema验证                       │
│  - 资源 URL 格式检查                     │
│  - 版本兼容性检查                        │
│  - 业务规则验证                          │
└─────────────────────────────────────────┘
```

## 📁 文件结构

### 共享工具库
```
kids-game-house/
  └── shared/
      └── utils/
          └── gtrs-validator.ts  ⭐ 统一校验工具
```

### 删除冗余文件
- ❌ `kids-game-frontend/src/utils/gtrs-validator.ts` (已删除)
- ❌ `kids-game-house/snake-vue3/src/utils/gtrs-validator.ts` (已删除)
- ✅ `kids-game-house/shared/utils/gtrs-validator.ts` (唯一共享库)

## 🔧 使用方法

### 1. 前端引用共享库

```typescript
// 在所有游戏项目中，统一引用共享库
import { validateGTRSTheme, quickValidate, isGTRSFormat } from '@/utils/gtrs-validator'

// 基本格式检查（前端）
const basicCheck = validateGTRSTheme(themeJson)
if (!basicCheck.valid) {
  console.error('基本格式检查失败:', basicCheck.message)
  return
}

// 完整的校验请调用后端 API
const fullValidation = await themeApi.validateGTRSTheme(themeJson)
```

### 2. 后端校验 API

**接口地址**: `POST /api/theme/validate-gtrs`

**请求参数**:
```json
{
  "themeJson": "{...}"  // 主题 JSON 字符串
}
```

**返回结果**:
```json
{
  "code": 200,
  "data": {
    "valid": true,
    "message": "校验通过"
  }
}
```

**失败示例**:
```json
{
  "code": 200,
  "data": {
    "valid": false,
    "message": "缺少必需的顶级字段：specMeta、globalStyle、resources"
  }
}
```

## 🎯 校验流程

### 前端校验（快速）
```typescript
// kids-game-house/shared/utils/gtrs-validator.ts

export function validateGTRSTheme(themeJson: string): ValidationResult {
  try {
    const theme = JSON.parse(themeJson)
    
    // 1. 检查基础结构
    if (!theme.specMeta || !theme.globalStyle || !theme.resources) {
      return {
        valid: false,
        message: '缺少必需的顶级字段：specMeta、globalStyle、resources'
      }
    }
    
    // 2. 检查规范名称
    if (theme.specMeta.specName !== 'GTRS') {
      return {
        valid: false,
        message: '规范名称必须为：GTRS'
      }
    }
    
    // 3. 基本格式通过，建议调用后端 API 进行完整校验
    return {
      valid: true,
      message: '基本格式检查通过，建议调用后端 API 进行完整校验'
    }
  } catch (error) {
    return {
      valid: false,
      message: `JSON 解析失败：${error.message}`
    }
  }
}
```

### 后端校验（完整）
```java
// ThemeController.java
@PostMapping("/validate-gtrs")
public Result<Map<String, Object>> validateGTRSTheme(
    @RequestBody Map<String, String> params) {
    
    String themeJson = params.get("themeJson");
    
    // 调用后端校验服务（使用 networknt/json-schema-validator）
    var validationResult = gtrsSchemaService.validateTheme(themeJson);
    
    Map<String, Object> result = new HashMap<>();
    result.put("valid", validationResult.isValid());
    result.put("message", validationResult.getMessage());
    
    return Result.success(result);
}
```

## ✅ 优势

1. **统一维护**：只有一个校验工具库，避免多份代码不一致
2. **职责清晰**：前端负责快速检查，后端负责完整校验
3. **性能优化**：前端实时预览用快速检查，上传时用后端校验
4. **易于扩展**：校验规则变更只需修改共享库和后端服务

## 📝 迁移指南

### 从旧的多文件迁移到统一架构

1. **删除旧的校验文件**
   ```bash
   # 删除各项目的独立校验文件
   rm kids-game-frontend/src/utils/gtrs-validator.ts
   rm kids-game-house/snake-vue3/src/utils/gtrs-validator.ts
   ```

2. **更新引用**
   ```typescript
   // 旧引用
   import { validateGTRSTheme } from '@/utils/gtrs-validator'
   
   // 新引用（自动使用共享库）
   import { validateGTRSTheme } from '@/utils/gtrs-validator'
   // 路径指向 kids-game-house/shared/utils/gtrs-validator.ts
   ```

3. **调用后端完整校验**
   ```typescript
   // 前端只做大致检查
   const basicResult = validateGTRSTheme(themeJson)
   
   // 完整的校验交给后端
   const fullResult = await themeApi.validateGTRSTheme(themeJson)
   ```

## 🚀 最佳实践

1. **开发阶段**：使用前端快速检查，实时反馈
2. **保存/上传阶段**：调用后端完整校验，确保数据正确
3. **加载阶段**：前端基本检查 + 后端下载时已校验通过

## 📊 对比

| 特性 | 方案一（npm 包） | 方案二（后端校验）✅ |
|------|----------------|-------------------|
| 维护成本 | 中（需要发布 npm 包） | 低（共享库统一管理） |
| 校验能力 | 强（前端完整校验） | 强（后端完整校验） |
| 实时性 | 高（本地校验） | 中（需要网络请求） |
| 依赖复杂度 | 高（需要额外依赖） | 低（无需额外依赖） |
| 推荐场景 | 离线环境 | 在线应用（本项目） |

## 📅 更新日期

2026-03-23
