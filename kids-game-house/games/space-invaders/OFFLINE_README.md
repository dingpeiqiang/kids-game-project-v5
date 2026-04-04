# Space Invaders - Offline Mode 🚀

完全离线的太空侵略者游戏,无需任何外部 API 密钥或在线服务。

## ✨ 特性

- ✅ **完全离线**: 无需 Ably API Key 或其他外部服务
- ✅ **零依赖**: 仅需要 Express.js
- ✅ **程序化图形**: 所有游戏资源动态生成,无需下载图片
- ✅ **多关卡系统**: 随等级提升难度递增
- ✅ **生命系统**: 3条生命,增加游戏挑战性
- ✅ **本地存储**: 自动保存玩家昵称
- ✅ **流畅动画**: 爆炸效果、敌人移动、平滑控制

## 🎮 游戏玩法

### 操作方式
- **← → 方向键**: 左右移动飞船
- **空格键**: 发射子弹
- **R 键**: 游戏结束后重新开始

### 游戏规则
1. 消灭所有外星人进入下一关
2. 避免被外星人碰到(损失生命)
3. 阻止外星人到达屏幕底部
4. 随着等级提升,敌人数量和速度会增加

### 得分系统
- 每个敌人: 10 × 当前等级 分
- 完成关卡: 自动进入下一关
- 生命耗尽: 游戏结束

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动服务器
```bash
# 开发模式(支持热重载)
npm run dev

# 生产模式
npm start
```

### 访问游戏
打开浏览器访问: http://localhost:8080

## 📦 项目结构

```
space-invaders/
├── server.js              # 简化的 Express 服务器
├── package.json           # 项目配置(仅依赖 express)
├── .env                   # 环境变量(仅需 PORT)
├── views/
│   └── offline.html      # 游戏主页面
└── public/
    ├── script-offline.js # 完整的游戏逻辑
    ├── style.css         # 样式文件
    └── invader.svg       # 网站图标
```

## 🔧 技术栈

- **后端**: Node.js + Express.js
- **前端**: Phaser 3 (游戏引擎)
- **图形**: 程序化生成(Phaser Graphics API)
- **物理**: Arcade Physics

## 🎯 优化亮点

### 1. 移除外部依赖
- ❌ 删除 Ably (实时通信)
- ❌ 删除 p2.js (复杂物理引擎)
- ❌ 删除 dotenv (环境变量)
- ❌ 删除 Worker Threads (多线程)
- ✅ 仅保留 Express.js

### 2. 程序化资源生成
所有游戏图形通过代码动态生成:
- 玩家飞船: 三角形
- 子弹: 矩形
- 敌人: 3种不同颜色的外星人
- 爆炸: 圆形渐变效果
- 背景: 随机星星

### 3. 简化服务器
从 144 行代码精简到 39 行:
- 移除所有 WebSocket/实时通信逻辑
- 移除房间管理系统
- 移除认证系统
- 仅保留静态文件服务

### 4. 增强游戏体验
- 添加生命系统(3条命)
- 添加多关卡系统
- 射击冷却时间(防止连射)
- 敌人速度和数量随等级递增
- 更流畅的动画效果

## 🌐 部署

由于是完全离线版本,可以部署到任何 Node.js 环境:

### Heroku
```bash
heroku create
git push heroku main
```

### Vercel
```bash
vercel --build-command "npm install" --output-directory "."
```

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

## 📝 许可证

MIT License

## 🙏 致谢

原始版本基于 Ably 实时多人游戏示例,现已完全重构为离线单机版本。

---

**享受游戏!** 🎮✨
