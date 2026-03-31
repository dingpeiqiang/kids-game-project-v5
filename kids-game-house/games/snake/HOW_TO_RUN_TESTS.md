# 🚀 如何运行测试 - 快速指南

**版本**: v1.3.0  
**最后更新**: 2026-04-05

---

## ⚡ 30 秒快速开始

### 步骤 1: 安装依赖（如果还没安装）

```bash
cd kids-game-house/games/snake
npm install
```

等待安装完成...

---

### 步骤 2: 运行测试

```bash
# 方法 1: 开发模式（推荐，会自动监听文件变化）
npm test

# 方法 2: 只运行一次
npm run test:run

# 方法 3: 生成覆盖率报告
npm run test:coverage
```

---

## 📊 预期输出

```
 RUN  v1.0.0 /path/to/project

 ✓ tests/ui-integration.test.ts (14)
   ✓ UI Component Integration Tests (14)
     ✓ LevelProgressBar (5)
       ✓ should render with initial props
       ✓ should update progress bar width when progress changes
       ✓ should emit complete event when progress reaches 100
       ✓ should hide when visible prop is false
       ✓ should have correct CSS classes for animation
     ✓ ObjectiveList (7)
       ✓ should render objectives list
       ✓ should display objective icons
       ✓ should show progress for incomplete objectives
       ✓ should apply completed class to finished objectives
       ✓ should calculate progress percentage correctly
       ✓ should handle empty objectives list
       ✓ should update when objectives change
     ✓ Component Integration (2)
       ✓ should work together without conflicts
       ✓ should handle rapid prop updates

 Test Files  1 passed (1)
      Tests  14 passed (14)
   Start at  09:00:00
   Duration  1.23s
```

---

## ✅ 成功标准

- ✅ 所有测试通过（14/14）
- ✅ 无 TypeScript 错误
- ✅ 无 ESLint 警告
- ✅ 测试覆盖率 > 80%

---

## 🐛 常见问题

### Q1: "Cannot find module 'vitest'"

**解决方案**:
```bash
npm install
```

---

### Q2: "Cannot find module '@vue/test-utils'"

**解决方案**:
```bash
npm install @vue/test-utils@^2.4.0
```

---

### Q3: 测试失败怎么办？

**步骤**:
1. 仔细阅读错误信息
2. 查看是哪个测试用例失败
3. 检查相关代码
4. 修复后重新运行测试

**示例错误**:
```
❯ tests/ui-integration.test.ts (14 tests | 1 failed)
  ❯ tests/ui-integration.test.ts > ObjectiveList > should display objective icons
    → expected '🍎' to be '⭐' // Object.is equality
```

**解决**: 检查图标映射逻辑

---

## 🎯 有用的命令

```bash
# 运行特定测试文件
npm test -- tests/ui-integration.test.ts

# 运行匹配的测试（只测 LevelProgressBar）
npm test -- -t "LevelProgressBar"

# 查看详细输出
npm test -- --reporter=verbose

# 生成 HTML 报告
npm test -- --reporter=html

# 打开 UI 界面（可视化）
npm run test:ui
```

---

## 📚 详细文档

- 📖 [TESTING_GUIDE.md](./TESTING_GUIDE.md) - 完整测试指南
- 📖 [README_UI_TESTS.md](./tests/README_UI_TESTS.md) - UI 测试详解
- 📖 [FAQ.md](../../FAQ.md) - 常见问题解答

---

## 💡 提示

1. **首次运行时**: 建议安装所有依赖
2. **开发时**: 使用 `npm test` 开发模式
3. **提交前**: 使用 `npm run test:run` 确保所有测试通过
4. **性能分析**: 使用 `npm run test:coverage` 查看覆盖率

---

**祝测试顺利！** 🎉
