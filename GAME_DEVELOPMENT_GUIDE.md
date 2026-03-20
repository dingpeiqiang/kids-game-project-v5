# 游戏开发对接文档

## 📖 概述

本文档说明如何将第三方游戏接入儿童游戏平台。平台采用**完全解耦**的架构，游戏独立部署，通过 **iframe** 加载，使用 **postMessage** 与平台通信。

## 🎯 接入流程

```
1. 开发游戏 → 2. 独立部署 → 3. 平台注册 → 4. 测试对接 → 5. 上线运营
```

---

## 📦 游戏部署

### 1. 游戏独立部署

游戏可以是任何技术栈（Vue3、React、Phaser、Unity WebGL等），只需满足以下要求：

- 单页面应用（SPA）
- 通过 URL 参数接收初始化数据
- 使用 postMessage 与父窗口通信
- 响应式设计，适配不同屏幕

### 2. 部署示例

假设游戏部署到 `https://games.example.com/snake`：

```
https://games.example.com/snake/
├── index.html
├── game.js
├── game.css
└── assets/
    ├── snake.png
    └── food.png
```

---

## 🤝 平台对接协议

### 1. 接收平台参数（URL Query）

游戏启动时，平台会通过 URL 参数传递初始化数据：

```typescript
interface PlatformParams {
  session_id: string;      // 会话令牌（必填）
  user_id: string;         // 用户ID（必填）
  user_name: string;       // 用户名（必填）
  game_mode: string;       // 游戏模式（可选）
  game_config?: string;     // 游戏配置JSON（可选）
}
```

**示例 URL**：
```
https://games.example.com/snake?session_id=abc123&user_id=1&user_name=小明&game_mode=single&game_config={"difficulty":"medium","gridSize":20}
```

**解析参数示例**：

```javascript
const params = new URLSearchParams(window.location.search);

const sessionId = params.get('session_id');
const userId = params.get('user_id');
const userName = params.get('user_name');
const gameMode = params.get('game_mode');
const gameConfig = params.get('game_config');

if (gameConfig) {
  const config = JSON.parse(gameConfig);
  console.log('游戏配置:', config);
}
```

---

### 2. 发送游戏状态（postMessage）

游戏需要定期向平台发送游戏状态，以便平台更新UI：

```typescript
interface GameStatusData {
  score: number;           // 当前分数
  duration: number;        // 游戏时长（秒）
  lives?: number;          // 剩余生命（可选）
  level?: number;          // 当前关卡（可选）
  [key: string]: any;     // 其他自定义字段
}
```

**发送状态示例**：

```javascript
// 定义发送状态函数
function sendGameStatus(score, duration, lives) {
  window.parent.postMessage({
    type: 'GAME_STATUS',
    data: {
      score: score,
      duration: duration,
      lives: lives,
    }
  }, '*');
}

// 定期发送（例如每秒）
setInterval(() => {
  sendGameStatus(game.score, game.duration, game.lives);
}, 1000);

// 或在游戏状态变化时发送
game.onScoreChanged = (score) => {
  sendGameStatus(score, game.duration, game.lives);
};
```

---

### 3. 发送游戏结束（postMessage）

游戏结束时，需要向平台发送最终结果：

```typescript
interface GameOverData {
  final_score: number;      // 最终分数（必填）
  duration: number;         // 游戏时长（秒）（必填）
  lives?: number;           // 剩余生命（可选）
  level?: number;           // 最终关卡（可选）
  is_win?: boolean;         // 是否胜利（可选）
  details?: {               // 详细数据（可选）
    [key: string]: any;
  };
}
```

**发送结束示例**：

```javascript
function sendGameOver(result) {
  window.parent.postMessage({
    type: 'GAME_OVER',
    data: {
      final_score: result.score,
      duration: result.duration,
      lives: result.lives,
      level: result.level,
      is_win: result.isWin,
      details: {
        apples: result.apples,     // 吃到食物数量
        max_length: result.maxLength, // 最长长度
        // 其他自定义数据...
      }
    }
  }, '*');
}

// 游戏结束时调用
game.onGameOver = (result) => {
  sendGameOver(result);
};
```

---

### 4. 发送游戏错误（postMessage）

游戏发生错误时，可以通知平台：

```typescript
interface GameErrorData {
  error_code: string;      // 错误码
  error_message: string;   // 错误信息
}
```

**发送错误示例**：

```javascript
function sendError(errorCode, errorMessage) {
  window.parent.postMessage({
    type: 'GAME_ERROR',
    data: {
      error_code: errorCode,
      error_message: errorMessage
    }
  }, '*');
}
```

---

### 5. 接收平台指令（postMessage）

平台可以向游戏发送控制指令：

```typescript
// 暂停游戏
interface PauseGameEvent {
  type: 'PAUSE_GAME';
  data: { paused: boolean; };
}

// 继续游戏
interface ResumeGameEvent {
  type: 'RESUME_GAME';
  data: {};
}

// 强制结束
interface ForceEndGameEvent {
  type: 'FORCE_END_GAME';
  data: { reason: string; };
}
```

**监听平台指令示例**：

```javascript
// 监听平台消息
window.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'PAUSE_GAME':
      if (data.paused) {
        game.pause();
      }
      break;

    case 'RESUME_GAME':
      game.resume();
      break;

    case 'FORCE_END_GAME':
      game.end(data.reason);
      break;

    default:
      console.log('未知消息类型:', type);
  }
});

// 游戏暂停处理
game.onPause = () => {
  console.log('游戏已暂停');
  // 可以显示暂停UI
};

// 游戏继续处理
game.onResume = () => {
  console.log('游戏已继续');
  // 隐藏暂停UI
};

// 游戏结束处理
game.onEnd = (reason) => {
  console.log('游戏结束:', reason);
  sendGameOver(game.getFinalResult());
};
```

---

## 🎮 完整示例代码

### HTML + JavaScript 示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>贪吃蛇游戏</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: #000;
      font-family: Arial, sans-serif;
    }
    
    #game-container {
      position: relative;
    }
    
    canvas {
      border: 2px solid #42b983;
      background: #1a1a1a;
      display: block;
    }
    
    .game-info {
      color: #fff;
      text-align: center;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <div class="game-info">
      <span id="score">分数: 0</span> | 
      <span id="duration">时长: 0s</span> |
      <span id="lives">生命: 3</span>
    </div>
    <canvas id="gameCanvas"></canvas>
  </div>

  <script>
    // ==================== 配置和状态 ====================
    
    // 解析平台参数
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const userId = params.get('user_id');
    const userName = params.get('user_name');
    const gameConfigStr = params.get('game_config');
    
    // 游戏配置
    let gameConfig = {
      difficulty: 'medium',
      gridSize: 20,
      initialSpeed: 150,
    };
    
    if (gameConfigStr) {
      try {
        gameConfig = { ...gameConfig, ...JSON.parse(gameConfigStr) };
      } catch (e) {
        console.error('解析游戏配置失败:', e);
      }
    }
    
    // 游戏状态
    const gameState = {
      score: 0,
      duration: 0,
      lives: 3,
      isPaused: false,
      isGameOver: false,
      apples: 0,
      maxLength: 3,
      startTime: Date.now(),
    };
    
    // ==================== 工具函数 ====================
    
    /**
     * 发送游戏状态到平台
     */
    function sendGameStatus() {
      window.parent.postMessage({
        type: 'GAME_STATUS',
        data: {
          score: gameState.score,
          duration: gameState.duration,
          lives: gameState.lives,
        }
      }, '*');
    }
    
    /**
     * 发送游戏结束到平台
     */
    function sendGameOver() {
      window.parent.postMessage({
        type: 'GAME_OVER',
        data: {
          final_score: gameState.score,
          duration: gameState.duration,
          lives: gameState.lives,
          details: {
            apples: gameState.apples,
            max_length: gameState.maxLength,
          }
        }
      }, '*');
    }
    
    /**
     * 发送游戏错误
     */
    function sendError(errorCode, errorMessage) {
      window.parent.postMessage({
        type: 'GAME_ERROR',
        data: {
          error_code: errorCode,
          error_message: errorMessage
        }
      }, '*');
    }
    
    /**
     * 更新UI
     */
    function updateUI() {
      document.getElementById('score').textContent = `分数: ${gameState.score}`;
      document.getElementById('duration').textContent = `时长: ${gameState.duration}s`;
      document.getElementById('lives').textContent = `生命: ${gameState.lives}`;
    }
    
    // ==================== 游戏逻辑 ====================
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const gridSize = gameConfig.gridSize;
    const canvasWidth = 400;
    const canvasHeight = 400;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // 蛇
    let snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    
    let direction = { x: 1, y: 0 };
    let food = { x: 15, y: 15 };
    let gameLoop;
    let statusInterval;
    
    /**
     * 生成食物
     */
    function spawnFood() {
      const maxX = canvasWidth / gridSize - 1;
      const maxY = canvasHeight / gridSize - 1;
      food = {
        x: Math.floor(Math.random() * maxX),
        y: Math.floor(Math.random() * maxY),
      };
    }
    
    /**
     * 绘制游戏
     */
    function draw() {
      // 清空画布
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // 绘制食物
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
      
      // 绘制蛇
      snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#00ff00' : '#42b983';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
      });
    }
    
    /**
     * 更新游戏状态
     */
    function update() {
      if (gameState.isPaused || gameState.isGameOver) {
        return;
      }
      
      // 移动蛇
      const head = { ...snake[0] };
      head.x += direction.x;
      head.y += direction.y;
      
      // 边界检测
      if (head.x < 0 || head.x >= canvasWidth / gridSize ||
          head.y < 0 || head.y >= canvasHeight / gridSize) {
        loseLife();
        return;
      }
      
      // 自身碰撞检测
      for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
          loseLife();
          return;
        }
      }
      
      snake.unshift(head);
      
      // 吃食物
      if (head.x === food.x && head.y === food.y) {
        gameState.score += 10;
        gameState.apples++;
        spawnFood();
        updateUI();
        sendGameStatus();
      } else {
        snake.pop();
      }
      
      // 更新最长长度
      if (snake.length > gameState.maxLength) {
        gameState.maxLength = snake.length;
      }
    }
    
    /**
     * 失去生命
     */
    function loseLife() {
      gameState.lives--;
      updateUI();
      
      if (gameState.lives <= 0) {
        gameOver();
      } else {
        // 重置蛇的位置
        snake = [
          { x: 10, y: 10 },
          { x: 9, y: 10 },
          { x: 8, y: 10 },
        ];
        direction = { x: 1, y: 0 };
        spawnFood();
      }
    }
    
    /**
     * 游戏结束
     */
    function gameOver() {
      gameState.isGameOver = true;
      clearInterval(gameLoop);
      clearInterval(statusInterval);
      
      sendGameOver();
      
      // 显示游戏结束信息
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = '#fff';
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('游戏结束', canvasWidth / 2, canvasHeight / 2);
    }
    
    /**
     * 暂停游戏
     */
    function pauseGame() {
      gameState.isPaused = true;
      console.log('游戏暂停');
    }
    
    /**
     * 继续游戏
     */
    function resumeGame() {
      gameState.isPaused = false;
      console.log('游戏继续');
    }
    
    /**
     * 强制结束
     */
    function forceEndGame(reason) {
      console.log('强制结束:', reason);
      gameState.isGameOver = true;
      clearInterval(gameLoop);
      clearInterval(statusInterval);
      sendGameOver();
    }
    
    // ==================== 游戏循环 ====================
    
    function startGame() {
      spawnFood();
      
      // 游戏循环（60fps）
      gameLoop = setInterval(() => {
        update();
        draw();
      }, 1000 / 60);
      
      // 状态更新（每秒）
      statusInterval = setInterval(() => {
        if (!gameState.isPaused && !gameState.isGameOver) {
          gameState.duration = Math.floor((Date.now() - gameState.startTime) / 1000);
          updateUI();
          sendGameStatus();
        }
      }, 1000);
    }
    
    // ==================== 键盘控制 ====================
    
    document.addEventListener('keydown', (e) => {
      if (gameState.isPaused || gameState.isGameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction.y !== 1) direction = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction.y !== -1) direction = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction.x !== 1) direction = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction.x !== -1) direction = { x: 1, y: 0 };
          break;
      }
    });
    
    // ==================== 监听平台指令 ====================
    
    window.addEventListener('message', (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'PAUSE_GAME':
          pauseGame();
          break;
          
        case 'RESUME_GAME':
          resumeGame();
          break;
          
        case 'FORCE_END_GAME':
          forceEndGame(data.reason);
          break;
      }
    });
    
    // ==================== 启动游戏 ====================
    
    console.log('游戏初始化:', {
      sessionId,
      userId,
      userName,
      gameConfig
    });
    
    startGame();
  </script>
</body>
</html>
```

---

## 🔧 平台注册

### 1. 登录后台管理系统

使用管理员账号登录平台后台。

### 2. 添加游戏

在游戏管理页面，点击"添加游戏"，填写以下信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| 游戏代码 | 唯一标识 | `SNAKE_VUE3` |
| 游戏名称 | 显示名称 | 贪吃蛇大冒险 |
| 游戏分类 | 所属分类 | 益智 |
| 适龄阶段 | 适合年级 | 一年级 |
| 图标URL | 游戏图标 | `/images/games/snake-icon.png` |
| 游戏URL | **独立部署地址** | `https://games.example.com/snake` |
| 游戏密钥 | 签名验证（可选） | `snake_secret_123` |
| 游戏配置 | JSON配置 | `{"difficulty":"medium","gridSize":20}` |
| 状态 | 启用/禁用 | 启用 |

### 3. 测试游戏

1. 在前端平台点击游戏卡片
2. 确认游戏正常加载
3. 测试游戏流程（开始、暂停、继续、结束）
4. 检查分数、时长、生命值是否正确更新

---

## ⚠️ 注意事项

### 安全性

1. **消息来源验证**：平台会验证 postMessage 来源，游戏不需要处理
2. **会话令牌**：不要将 `session_id` 暴露给第三方
3. **CORS 配置**：确保游戏服务器允许平台域名的跨域请求

### 兼容性

1. **postMessage**：所有现代浏览器都支持
2. **URL 参数**：使用标准的 URLSearchParams API
3. **响应式**：游戏需要适配不同屏幕尺寸

### 性能

1. **状态更新频率**：建议每秒发送一次状态
2. **静态资源**：建议使用 CDN 加速
3. **代码压缩**：发布前压缩 JS/CSS 代码

---

## 🐛 故障排查

### 问题 1：游戏无法加载

**可能原因**：
- 游戏URL配置错误
- CORS 未配置
- 游戏服务器未启动

**解决方法**：
1. 检查数据库 `t_game` 表的 `game_url` 字段
2. 配置游戏服务器的 CORS
3. 确认游戏服务器正常运行

---

### 问题 2：postMessage 未生效

**可能原因**：
- 消息类型不匹配
- 游戏在 iframe 中运行

**解决方法**：
1. 检查消息类型是否为 `GAME_STATUS`、`GAME_OVER` 等
2. 确保游戏在 iframe 中运行
3. 使用浏览器开发者工具查看 postMessage 事件

---

### 问题 3：游戏结果未提交

**可能原因**：
- `session_id` 未传递
- 后端接口未正确调用

**解决方法**：
1. 检查 URL 参数是否包含 `session_id`
2. 在浏览器开发者工具查看网络请求
3. 确认后端 `/api/game/session/{sessionId}/result` 接口正常

---

## 📚 相关资源

- [完整架构设计文档](GAME_PLATFORM_DECOUPLING_DESIGN.md)
- [实施指南](IMPLEMENTATION_GUIDE.md)
- [API 接口文档](API_REFERENCE.md)（待完善）

---

## 💡 最佳实践

1. **定期发送状态**：每秒发送一次游戏状态，保证 UI 实时更新
2. **异常处理**：所有网络操作都要有异常处理
3. **用户反馈**：游戏加载、错误时要有明确的用户提示
4. **日志记录**：使用 console.log 记录关键操作，方便调试
5. **测试覆盖**：测试各种场景（正常、异常、网络问题等）

---

## 📞 技术支持

如遇到对接问题，请联系平台技术团队：
- Email: support@kids-game.com
- QQ群: 123456789
