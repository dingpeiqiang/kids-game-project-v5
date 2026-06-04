# 🧪 RPG Shooter 完整测试方案

## 📋 测试文件清单

### 已创建的测试文件
1. ✅ `rpgShooter.test.ts` - Jest单元测试（251行）
2. ✅ `TESTING_GUIDE.md` - 详细测试指南（447行）
3. ✅ `rpg-shooter-test.html` - 交互式测试页面（326行）
4. ✅ `test.bat` - Windows测试脚本
5. ✅ `test.sh` - Linux/Mac测试脚本
6. ✅ `TEST_SUMMARY.md` - 本文件

---

## 🚀 快速测试（3种方式）

### 方式1: 使用测试脚本（最简单）⭐

**Windows用户**:
```bash
test.bat
```

**Linux/Mac用户**:
```bash
chmod +x test.sh
./test.sh
```

脚本会自动完成：依赖检查 → 安装 → 编译检查 → 单元测试 → 生成报告

---

### 方式2: 命令行测试

```bash
# 1. 运行单元测试
npm test

# 2. 查看覆盖率
npm run test:coverage

# 3. TypeScript检查
npx tsc --noEmit

# 4. 启动游戏
npm run dev
```

---

### 方式3: 浏览器手动测试

1. 启动: `npm run dev`
2. 访问: http://localhost:5173/rpg-shooter-test.html
3. 点击测试项标记完成
4. 查看实时进度

---

## 📝 测试内容

### 自动化测试 (rpgShooter.test.ts)

#### ✅ 配置模块 (3个测试)
- GAME_CONFIG常量值
- LEVEL_STATS等级数量
- ENEMY_TYPES敌人数量

#### ✅ 状态管理 (3个测试)
- 初始状态正确性
- 数组初始化
- 星空背景生成

#### ✅ 玩家系统 (5个测试)
- 属性初始化
- 升级功能
- HP恢复
- 粒子特效
- 屏幕效果

#### ✅ 子弹系统 (3个测试)
- 射击创建子弹
- 冷却时间
- 追踪子弹

#### ✅ 敌人系统 (3个测试)
- 敌人生成
- 游戏状态检查
- 敌人属性验证

#### ✅ 碰撞检测 (4个测试)
- 矩形碰撞
- 圆形碰撞
- 重叠检测
- 非重叠检测

#### ✅ 集成测试 (3个测试)
- 完整游戏流程
- 能量系统
- 连击系统

**总计**: 24个自动化测试

---

### 手动测试 (60+项)

访问 `rpg-shooter-test.html` 看到8个测试卡片：

1. **核心功能** (8项) - 游戏启动、射击、升级等
2. **弹幕系统** (6项) - Boss弹幕、躲避等
3. **敌人系统** (8项) - 6种敌人类型
4. **道具系统** (10项) - 掉落、6种道具
5. **连击系统** (6项) - 连击、倍率、特效
6. **能量系统** (6项) - 积累、光环、收集
7. **视觉效果** (8项) - 粒子、拖尾、震动
8. **UI界面** (8项) - HUD、血条、经验条

---

## ✅ 测试通过标准

### 必须通过
- [x] TypeScript编译无错误
- [x] 游戏能正常启动
- [x] 基本玩法可玩
- [x] 无崩溃错误

### 应该通过
- [ ] 单元测试通过率 > 90%
- [ ] 手动测试完成 > 80%
- [ ] FPS稳定60+
- [ ] 无明显Bug

### 最好通过
- [ ] 所有测试100%完成
- [ ] 代码覆盖率 > 80%
- [ ] 性能优化达标
- [ ] 跨浏览器兼容

---

## 🐛 常见问题

### Q1: npm test 报错
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm test
```

### Q2: TypeScript编译错误
```bash
npx tsc --noEmit --pretty
# 根据错误提示修复
```

### Q3: 游戏无法启动
```bash
rm -rf node_modules/.vite
npm run dev
```

### Q4: 测试页面空白
- 确认服务器已启动
- 检查控制台错误
- 硬刷新 (Ctrl+F5)

---

## 📊 性能测试

### FPS监测
```javascript
// 浏览器控制台
let frames = 0, lastTime = performance.now();
function countFPS() {
  frames++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    console.log('FPS:', frames);
    frames = 0;
    lastTime = now;
  }
  requestAnimationFrame(countFPS);
}
countFPS();
```

**目标**: 稳定60 FPS

### 内存监测
```javascript
console.log('Used:', performance.memory.usedJSHeapSize / 1024 / 1024, 'MB');
```

**目标**: 内存稳定，无持续增长

---

## 💡 调试技巧

```typescript
// 打印完整状态
console.table(state);

// 检查特定值
console.log('HP:', state.playerHP);
console.log('Enemies:', state.enemies.length);

// 断点调试
debugger; // 代码中插入，浏览器会暂停
```

---

## 📞 获取帮助

### 文档
- TESTING_GUIDE.md - 详细指南
- MODULE_README.md - API文档
- QUICKSTART.md - 快速开始

### 调试
- 浏览器开发者工具
- Console日志
- Performance面板

---

## 🎯 下一步

1. ✅ 运行 `test.bat` 或 `test.sh`
2. ✅ 查看测试结果
3. ✅ 修复发现的问题
4. ✅ 启动游戏手动测试
5. ✅ 完成测试清单
6. ✅ 享受游戏！

---

**测试愉快！** 🎮✨
