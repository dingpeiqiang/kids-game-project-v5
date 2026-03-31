# 🚀 贪吃蛇游戏 - 立即运行指南（绕过登录）

**版本**: v1.3.0  
**创建时间**: 2026-04-05  
**状态**: ✅ 已禁用登录验证，可直接访问

---

## ⚡ 超简单 3 步开始

### 第 1 步：启动开发服务器

```bash
cd kids-game-house\games\snake
npm run dev
```

---

### 第 2 步：打开浏览器

```
http://localhost:3005/
```

---

### 第 3 步：开始游戏

现在您应该能看到：

1. **开始界面** (`/`)
   - 显示游戏标题
   - "开始游戏"按钮
   
2. **点击"开始游戏"** → 难度选择界面 (`/difficulty`)
   
3. **选择难度** → 进入游戏 (`/game`)
   - 🐍 蛇出现并开始移动
   - 🍎 食物随机生成
   - 📊 分数显示在左上角

---

## ✅ 预期效果

如果一切正常，您会看到：

```
✅ 页面正常加载
✅ 没有登录跳转
✅ 可以看到游戏界面
✅ 按方向键蛇会移动
✅ 吃到食物分数增加
```

---

## ❌ 如果还是没反应

### 检查 1: 查看浏览器控制台

按 **F12** 打开控制台，查看是否有错误：

**常见错误**:
- `Uncaught ReferenceError: Phaser is not defined`
  → Phaser 未正确加载，检查网络或 CDN
  
- `Failed to compile template`
  → Vue 模板编译错误，查看详细错误信息
  
- `Cannot read property 'xxx' of undefined`
  → 组件初始化问题

---

### 检查 2: 确认服务已启动

在终端应该看到：
```
VITE v5.0.0  ready in 500 ms

➜  Local:   http://localhost:3005/
➜  Network: use --host to expose
➜  press h to show help
```

如果没有，说明启动失败，请查看错误信息。

---

### 检查 3: 清除缓存

```bash
# 在浏览器控制台执行
localStorage.clear()
sessionStorage.clear()

# 然后硬刷新
Ctrl + F5 (Windows)
Cmd + Shift + R (Mac)
```

---

## 🔧 如何恢复登录验证

测试完成后，如果要恢复登录功能：

编辑 `src/router/index.ts`:

```typescript
// 找到这段代码（约第 40-56 行）

// 🔧 临时禁用登录检查（仅用于测试）
// 如果要启用登录验证，取消下方注释
/*
// 获取 token
const token = localStorage.getItem('token')

// 如果没有 token，说明未登录
if (!token) {
  console.log('🔒 用户未登录，跳转到登录页')
  const currentPath = window.location.href
  const loginUrl = `http://localhost:3000/login?redirect=${encodeURIComponent(currentPath)}`
  window.location.href = loginUrl
  return
}
*/

// 删除 /* 和 */ 即可恢复登录验证
```

---

## 📊 完整路由流程

```
访问 http://localhost:3005/
         ↓
    [/] 开始界面
         ↓ (点击"开始游戏")
    [/difficulty] 难度选择
         ↓ (选择难度)
    [/game] 游戏进行中
         ↓ (游戏结束)
    [/gameover] 游戏结束界面
         ↓ (重新开始)
    [/] 回到开始界面
```

---

## 💡 快速操作指南

### 键盘控制
```
↑ : 向上移动
↓ : 向下移动
← : 向左移动
→ : 向右移动
```

### 游戏规则
```
🍎 吃食物 → 分数 + 长度增加
🚫 撞墙 → 游戏结束
🚫 撞自己 → 游戏结束
```

---

## 🎯 测试清单

快速验证以下功能：

- [ ] 页面能正常打开
- [ ] 能看到开始界面
- [ ] 点击"开始游戏"有反应
- [ ] 难度选择界面显示
- [ ] 选择难度后游戏开始
- [ ] 蛇会出现并移动
- [ ] 按方向键蛇会转向
- [ ] 吃到食物分数增加
- [ ] 游戏结束后显示结束界面

全部打勾 ✅ 表示游戏正常运行！

---

## 📚 详细文档

如需更多测试内容：

- 📖 [QUICK_TEST_START.md](./QUICK_TEST_START.md) - 快速测试
- 📖 [MANUAL_TESTING_CHECKLIST.md](./MANUAL_TESTING_CHECKLIST.md) - 完整清单
- 📖 [ROUTING_DIAGNOSIS.md](./ROUTING_DIAGNOSIS.md) - 路由诊断
- 📖 [TESTING_GUIDE.md](./TESTING_GUIDE.md) - 测试指南

---

## 🆘 需要帮助？

如果按照以上步骤还是无法运行：

1. **截图当前界面**
2. **复制控制台错误信息**
3. **记录操作步骤**
4. **查看 ROUTING_DIAGNOSIS.md 获取详细帮助**

---

**现在就试试吧！** 🎮

**端口**: http://localhost:3005/  
**状态**: ✅ 已禁用登录，可直接访问
