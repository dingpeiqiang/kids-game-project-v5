# 独立游戏部署 - 快速启动指南

## 📋 当前状态

✅ **已完成：**
- 1 个游戏已迁移到独立部署目录（贪吃蛇）
- 所有游戏配置文件已创建
- 自动化工具脚本已创建
- 平台集成配置已完成
- 文档和测试页面已创建

⏳ **待完成：**
- 安装游戏依赖（npm install）
- 启动游戏服务器
- 测试游戏运行
- 测试平台集成

## 🚀 快速启动步骤

### 方案 A：一键安装和启动（推荐）

```bash
# 1. 进入 kids-game-house 目录
cd kids-game-house

# 2. 安装所有游戏依赖
install-dependencies.bat

# 3. 启动所有游戏
start-all-games.bat
```

### 方案 B：单个游戏测试

如果只想测试某个游戏：

#### 超级染色体
```bash
cd chromosome
npm install
npm run dev
```

#### 飞机大战
```bash
cd plane-shooter
npm install
npm run dev
```

#### 贪吃蛇
```bash
cd snake-vue3
npm install
npm run dev
```

## 🧪 测试方法

### 方法 1：直接访问游戏

启动游戏后，在浏览器中访问：
- 超级染色体: http://localhost:3001?session_id=test&user_id=1&user_name=测试
- 飞机大战:   http://localhost:3002?session_id=test&user_id=1&user_name=测试
- 贪吃蛇:     http://localhost:3003?session_id=test&user_id=1&user_name=测试

### 方法 2：使用测试页面

打开 `kids-game-house/test-games.html`，这个页面会：
- 自动检查所有游戏是否可访问
- 在 iframe 中嵌入游戏
- 显示游戏通信日志
- 提供测试按钮

### 方法 3：在平台中测试

1. 启动前端平台：`cd kids-game-frontend && npm run dev`
2. 访问平台游戏列表
3. 点击游戏卡片
4. 游戏将通过 iframe 嵌入

## 🔍 验证检查清单

### 基础功能
- [ ] 所有游戏依赖安装成功
- [ ] 游戏可以独立启动
- [ ] 游戏在浏览器中正常加载
- [ ] 游戏可以正常玩

### 平台通信
- [ ] URL 参数正确解析（session_id, user_id, user_name）
- [ ] GAME_LOADED 消息已发送
- [ ] GAME_STATUS 消息正常
- [ ] GAME_OVER 消息正常
- [ ] 游戏可以嵌入 iframe

### 集成测试
- [ ] 平台可以加载游戏
- [ ] 游戏数据正确上报
- [ ] 游戏结束后返回平台

## 🐛 常见问题

### 问题 1：npm install 很慢或失败

**解决方案：**
```bash
# 使用国内镜像
npm install --registry=https://registry.npmmirror.com

# 或使用 pnpm
npm install -g pnpm
pnpm install
```

### 问题 2：端口被占用

**错误信息：** `Port 3001 is already in use`

**解决方案：**
```bash
# 方案 1：停止占用进程
netstat -ano | findstr :3001
taskkill /PID <进程ID> /F

# 方案 2：修改端口
# 编辑 vite.config.ts，修改 server.port
```

### 问题 3：游戏无法加载

**检查项：**
1. 游戏服务器是否启动？
2. 端口是否正确？
3. 浏览器控制台是否有错误？
4. 查看游戏服务器的控制台输出

### 问题 4：postMessage 通信失败

**检查项：**
1. URL 参数是否正确？
2. iframe 是否允许跨域？
3. 游戏代码中是否正确发送消息？
4. 查看浏览器控制台的消息

## 📊 下一步工作

### 短期（今天）
1. ✅ 完成游戏迁移
2. ⏳ 安装依赖并启动游戏
3. ⏳ 测试基本功能
4. ⏳ 测试平台通信

### 中期（本周）
1. 修复发现的问题
2. 优化游戏性能
3. 完善错误处理
4. 编写用户文档

### 长期（本月）
1. 添加更多游戏
2. 实现游戏排行榜
3. 添加游戏成就系统
4. 支持多人对战

## 📝 开发笔记

### 游戏目录结构
```
game-name/
├── src/
│   ├── main.ts           # 主入口
│   ├── App.vue          # Vue 根组件
│   ├── game/            # 游戏代码
│   │   ├── Game.ts      # 游戏类
│   │   └── scenes/     # 游戏场景
│   └── utils/          # 工具类
│       └── PlatformBridge.ts  # 平台通信桥
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### 平台通信协议

**平台 → 游戏（URL 参数）**
```
?session_id={token}&user_id={id}&user_name={name}
```

**游戏 → 平台（postMessage）**
```javascript
// 游戏加载完成
window.parent.postMessage({
  type: 'GAME_LOADED',
  sessionId: sessionId
}, '*')

// 游戏结束
window.parent.postMessage({
  type: 'GAME_OVER',
  sessionId: sessionId,
  data: { score: 100, duration: 60, status: 'completed' }
}, '*')
```

## 📞 获取帮助

遇到问题时，查看：
- `README.md` - 完整文档
- `TEST_GUIDE.md` - 测试指南
- `GAME_HOUSE_MIGRATION_COMPLETE.md` - 迁移总结
- 浏览器控制台 - 错误信息
- 游戏服务器控制台 - 运行日志

---

**最后更新：** 2026-03-13
**当前版本：** v1.0.0
**状态：** ✅ 迁移完成，等待测试
