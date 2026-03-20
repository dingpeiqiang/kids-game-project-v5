# 独立游戏部署测试指南

本文档提供独立游戏部署的完整测试流程。

## 📋 测试前准备

### 1. 环境要求

- Node.js >= 18.0.0
- npm 或 pnpm
- Web 浏览器（推荐 Chrome）

### 2. 确认文件结构

```
kids-game-house/
├── chromosome/
│   ├── package.json ✓
│   ├── vite.config.ts ✓
│   ├── tsconfig.json ✓
│   ├── index.html ✓
│   └── src/
│       ├── main.ts ✓
│       ├── App.vue ✓
│       ├── game/ ✓
│       └── utils/
│           └── PlatformBridge.ts ✓
├── plane-shooter/ ✓
├── snake-vue3/ ✓
└── README.md ✓
```

## 🧪 测试步骤

### 测试 1: 依赖安装

**步骤：**
```bash
cd kids-game-house
install-dependencies.bat
```

**预期结果：**
- 游戏依赖都成功安装
- 没有 npm install 错误
- 最终显示 "所有游戏依赖安装完成!"

### 测试 2: 单个游戏启动

**测试贪吃蛇：**
```bash
cd snake-vue3
npm run dev
```

**预期结果：**
- 控制台显示 "Local: http://localhost:3003"
- 访问 http://localhost:3003
- 游戏页面正常加载

### 测试 3: 批量启动

**步骤：**
```bash
start-all-games.bat
```

**预期结果：**
- 打开三个新的命令行窗口
- 每个窗口显示对应游戏的 Vite 服务器
- 三个游戏分别在不同端口启动（3001, 3002, 3003）
- 可以同时访问三个游戏

### 测试 4: 平台通信测试

**测试超级染色体的平台通信：**

1. 访问游戏并添加测试参数：
```
http://localhost:3001?session_id=test123&user_id=001&user_name=测试玩家
```

2. 打开浏览器控制台（F12）

3. 检查日志：
```
[PlatformBridge] Initialized with session: test123 {userId: '001', userName: '测试玩家'}
[PlatformBridge] Sent to platform: {type: 'GAME_LOADED', sessionId: 'test123'}
```

**预期结果：**
- 游戏正常加载
- 控制台显示初始化信息
- GAME_LOADED 消息已发送

**测试游戏结束消息：**

1. 完成游戏
2. 检查控制台是否发送 GAME_OVER 消息

**预期结果：**
- 控制台显示 GAME_OVER 消息
- 包含 score, duration, status 等信息

### 测试 5: iframe 嵌入测试

**步骤：**
1. 创建测试页面 `test-iframe.html`：

```html
<!DOCTYPE html>
<html>
<head>
  <title>游戏嵌入测试</title>
  <style>
    body { margin: 0; padding: 20px; font-family: Arial; }
    .game-frame {
      width: 100%;
      height: 600px;
      border: 2px solid #333;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>超级染色体嵌入测试</h1>
  <iframe
    class="game-frame"
    src="http://localhost:3001?session_id=test123&user_id=001&user_name=测试玩家"
    frameborder="0"
    allowfullscreen>
  </iframe>

  <h1>飞机大战嵌入测试</h1>
  <iframe
    class="game-frame"
    src="http://localhost:3002?session_id=test123&user_id=001&user_name=测试玩家"
    frameborder="0"
    allowfullscreen>
  </iframe>

  <h1>贪吃蛇嵌入测试</h1>
  <iframe
    class="game-frame"
    src="http://localhost:3003?session_id=test123&user_id=001&user_name=测试玩家"
    frameborder="0"
    allowfullscreen>
  </iframe>

  <script>
    // 监听来自游戏的消息
    window.addEventListener('message', (event) => {
      console.log('收到游戏消息:', event.data);
    });
  </script>
</body>
</html>
```

2. 在浏览器中打开 `test-iframe.html`

**预期结果：**
- 三个游戏都在 iframe 中正常加载
- 游戏可以正常玩
- 控制台显示游戏发送的消息

### 测试 6: 游戏构建测试

**步骤：**
```bash
build-all-games.bat
```

**预期结果：**
- 三个游戏都成功构建
- 每个游戏目录下生成 `dist` 文件夹
- `dist` 文件夹包含 HTML, CSS, JS 等文件

**验证构建产物：**
```bash
cd chromosome/dist
# 应该看到 index.html 和 assets 文件夹
```

### 测试 7: 响应式测试

**测试步骤：**
1. 打开浏览器开发者工具
2. 切换到移动设备视图
3. 测试不同设备尺寸：
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - Desktop (1920x1080)

**预期结果：**
- 游戏在所有设备上都正常显示
- 游戏能够自适应屏幕大小
- 触摸操作正常工作

### 测试 8: 错误处理测试

**测试 1: 缺少 session_id**
```
http://localhost:3001
```

**预期结果：**
- 游戏仍然可以加载
- sessionId 为空字符串

**测试 2: 错误的 game_config**
```
http://localhost:3001?game_config=invalid_json
```

**预期结果：**
- 游戏不会崩溃
- 控制台显示警告信息

**测试 3: 特殊字符处理**
```
http://localhost:3001?user_name=%E6%B5%8B%E8%AF%95%E7%8E%A9%E5%AE%B6
```

**预期结果：**
- 用户名正确解码显示

## 📊 测试检查清单

### 基础功能
- [ ] 所有游戏依赖安装成功
- [ ] 单个游戏可以独立启动
- [ ] 所有游戏可以同时启动
- [ ] 游戏端口不冲突
- [ ] 游戏在浏览器中正常加载

### 平台通信
- [ ] URL 参数正确解析
- [ ] GAME_LOADED 消息正确发送
- [ ] GAME_OVER 消息正确发送
- [ ] GAME_ERROR 消息正确发送
- [ ] 平台消息可以正确接收

### 集成测试
- [ ] 游戏可以在 iframe 中嵌入
- [ ] 跨域通信正常工作
- [ ] 游戏退出时正确清理

### 构建测试
- [ ] 所有游戏可以成功构建
- [ ] 构建产物完整
- [ ] 构建后的游戏可以正常运行

### 兼容性测试
- [ ] Chrome 浏览器正常
- [ ] Firefox 浏览器正常
- [ ] Safari 浏览器正常
- [ ] 移动设备正常
- [ ] 不同屏幕尺寸正常

### 性能测试
- [ ] 游戏加载时间 < 3 秒
- [ ] 游戏运行流畅（60 FPS）
- [ ] 内存占用正常
- [ ] 无明显内存泄漏

## 🐛 常见问题和解决方案

### 问题 1: 端口被占用

**错误信息：**
```
Port 3001 is already in use
```

**解决方案：**
```bash
# 查找占用端口的进程
netstat -ano | findstr :3001

# 结束进程
taskkill /PID <进程ID> /F
```

### 问题 2: 依赖安装失败

**错误信息：**
```
npm ERR! code ENOENT
```

**解决方案：**
```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules
rmdir /s /q node_modules

# 重新安装
npm install
```

### 问题 3: 构建失败

**错误信息：**
```
TS2345: Argument of type 'string' is not assignable...
```

**解决方案：**
- 检查 TypeScript 配置
- 确保所有类型定义正确
- 运行 `npm run type-check` 查看详细错误

### 问题 4: iframe 无法加载游戏

**错误信息：**
```
Refused to display '...' in a frame because it set 'X-Frame-Options' to 'sameorigin'
```

**解决方案：**
- 确保服务器配置允许跨域
- 检查 vite.config.ts 中的 CORS 配置
- 确保游戏 URL 正确

## ✅ 测试完成标准

所有测试通过的标准：
1. ✅ 所有基础功能测试通过
2. ✅ 平台通信测试通过
3. ✅ 集成测试通过
4. ✅ 构建测试通过
5. ✅ 兼容性测试通过
6. ✅ 性能测试通过

满足以上条件后，可以认为独立游戏部署系统已经可以投入使用。
