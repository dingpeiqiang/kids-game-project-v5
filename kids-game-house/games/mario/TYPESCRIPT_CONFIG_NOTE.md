# TypeScript 配置说明

## ⚠️ 重要：编译目标设置

本项目的 tsconfig.json 必须使用 **ES2015** 或更高版本作为编译目标。

```json
{
  "compilerOptions": {
    "target": "ES2015",
    "module": "ESNext"
  }
}
```

## 为什么需要 ES2015+？

### 1. tsyringe 依赖注入兼容性

项目使用 `tsyringe` 进行依赖注入，它需要使用 `new` 关键字来实例化类。

**问题示例**：
```typescript
// ❌ ES5 编译后（错误）
var HitBrick = /** @class */ (function () {
    function HitBrick(target, directions, brick) {
        // ...
    }
    return HitBrick;
}());
// tsyringe 尝试调用时会报错：
// "Class constructor HitBrick cannot be invoked without 'new'"

// ✅ ES2015+ 编译后（正确）
class HitBrick {
    constructor(target, directions, brick) {
        // ...
    }
}
// tsyringe 可以正常使用 new HitBrick(...)
```

### 2. 装饰器支持

项目广泛使用 TypeScript 装饰器：

```typescript
@autoInjectable()
export class HitBrick implements Power {
  constructor(
    target: TargetObject, 
    directions: direction[], 
    @inject(Brick) private brick?: Brick
  ) {
    // ...
  }
}
```

ES2015+ 更好地支持装饰器元数据。

### 3. Vite 原生 ES 模块支持

Vite 基于原生 ES 模块，ES2015+ 编译目标与 Vite 的工作方式完美契合。

## 当前配置详解

```json
{
  "compilerOptions": {
    // 编译目标：ES2015（保持 class 语法）
    "target": "ES2015",
    
    // 模块系统：ESNext（支持动态导入）
    "module": "ESNext",
    
    // 实验性装饰器（必需）
    "experimentalDecorators": true,
    
    // 发射装饰器元数据（tsyringe 需要）
    "emitDecoratorMetadata": true,
    
    // 严格模式
    "strict": true,
    
    // ES 模块互操作
    "esModuleInterop": true,
    
    // 允许合成默认导入
    "allowSyntheticDefaultImports": true,
    
    // 模块解析策略
    "moduleResolution": "node",
    
    // 包含的库
    "lib": ["dom", "ES2015", "ESNext"],
    
    // 其他选项
    "noImplicitAny": false,
    "allowUnreachableCode": false,
    "sourceMap": true,
    "strictPropertyInitialization": false
  },
  "include": [
    "src",
    "src/types/*.d.ts"
  ]
}
```

## 常见错误及解决方案

### 错误 1: Class constructor cannot be invoked without 'new'

**症状**：
```
Uncaught TypeError: Class constructor HitBrick cannot be invoked without 'new'
    at new class_1 (tsyringe.js:809:23)
```

**原因**：tsconfig.json 中 `"target": "es5"`

**解决**：改为 `"target": "ES2015"`

### 错误 2: Cannot find module

**症状**：
```
Cannot find module 'xxx' or its corresponding type declarations
```

**原因**：缺少 `moduleResolution` 配置

**解决**：添加 `"moduleResolution": "node"`

### 错误 3: Decorator 相关错误

**症状**：
```
Experimental support for decorators is a feature that is subject to change
```

**原因**：未启用装饰器支持

**解决**：确保以下配置存在：
```json
{
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true
}
```

## 浏览器兼容性

ES2015 已被所有现代浏览器支持：

- ✅ Chrome 51+
- ✅ Firefox 52+
- ✅ Safari 10+
- ✅ Edge 15+
- ✅ Opera 38+

对于旧版浏览器，Vite 会在生产构建时通过 Rollup 插件进行转译。

## 性能影响

### 开发环境
- ✅ 更快的编译速度（无需降级到 ES5）
- ✅ 更小的 source map
- ✅ 更好的调试体验

### 生产环境
- ✅ Vite/Rollup 会自动优化代码
- ✅ 可以根据需要配置浏览器兼容性
- ✅ 代码体积通常比 ES5 更小

## 如果需要支持旧版浏览器

如果必须支持 IE11 等旧版浏览器，可以在 Vite 配置中添加：

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2015', // 或更低版本
  },
})
```

但请注意：
- ⚠️ tsyringe 可能需要 polyfill
- ⚠️ 某些现代 API 需要手动 polyfill
- ⚠️ 建议考虑放弃对 IE11 的支持

## 验证配置

```bash
# 检查 TypeScript 配置
npx tsc --showConfig

# 应该看到：
# {
#   "compilerOptions": {
#     "target": "es2015",
#     "module": "esnext",
#     ...
#   }
# }
```

## 参考资料

- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)
- [tsyringe 文档](https://github.com/microsoft/tsyringe)
- [Vite TypeScript 支持](https://vitejs.dev/guide/features.html#typescript)
- [ES2015 特性](https://262.ecma-international.org/6.0/)

---

**最后更新**: 2026-04-05  
**当前配置**: ES2015 + ESNext  
**状态**: ✅ 稳定运行
