# Ragin' Mages - Vite 快速参考

## 🚀 快速命令

```bash
# 安装依赖
npm install

# 启动开发服务器 (http://localhost:3006)
npm start

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 📁 项目结构

```
ragin-mages/game/
├── public/              # 静态资源（直接复制到构建目录）
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   └── ...
├── src/                 # 源代码
│   ├── index.html       # HTML 入口
│   ├── js/
│   │   ├── Game.js      # 游戏主入口
│   │   ├── scenes/      # 游戏场景
│   │   ├── objects/     # 游戏对象
│   │   └── util/        # 工具类
│   ├── css/
│   │   └── main.css     # 样式文件
│   └── assets/          # 游戏资源
├── build/               # 构建输出（git ignore）
├── node_modules/        # 依赖（git ignore）
├── vite.config.js       # Vite 配置
├── package.json         # 项目配置
└── README.md            # 项目说明
```

## 🔧 常用配置

### 修改开发端口
编辑 `vite.config.js`:
```javascript
server: {
  port: 3006,  // 修改为你想要的端口
}
```

### 添加路径别名
编辑 `vite.config.js`:
```javascript
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src'),
    'scenes': path.resolve(__dirname, 'src/js/scenes'),
    // 添加更多别名...
  }
}
```

### 配置 API 代理
编辑 `vite.config.js`:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3030',
      changeOrigin: true
    }
  }
}
```

## 📝 导入示例

```javascript
// 导入 CSS
import '../css/main.css';

// 使用路径别名导入场景
import BootScene from 'scenes/BootScene';
import GameScene from 'scenes/GameScene';

// 导入 Socket.IO
import io from 'socket.io-client';

// 导入 Phaser（自动使用预构建版本）
import Phaser from 'phaser';
```

## 🎯 关键文件

| 文件 | 说明 |
|------|------|
| `vite.config.js` | Vite 配置文件 |
| `src/index.html` | HTML 入口文件 |
| `src/js/Game.js` | 游戏主入口 |
| `package.json` | 依赖和脚本配置 |
| `public/` | 静态资源目录 |

## ⚡ 性能优势

- **冷启动**: < 1 秒（vs Gulp 的 10+ 秒）
- **热更新**: 毫秒级（只更新变化的模块）
- **构建速度**: 快 5-10 倍

## 🐛 故障排除

### 端口被占用
```bash
# 方法1: 修改 vite.config.js 中的端口
# 方法2: 杀死占用端口的进程
netstat -ano | findstr :3006
taskkill /PID <PID> /F
```

### 依赖问题
```bash
# 清除缓存并重新安装
rm -rf node_modules package-lock.json
npm install
```

### 构建错误
```bash
# 清理构建目录
rm -rf build
npm run build
```

## 📚 相关文档

- [VITE_MIGRATION.md](./VITE_MIGRATION.md) - 详细迁移指南
- [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md) - 迁移完成报告
- [Vite 官方文档](https://vitejs.dev/)

## 💡 提示

1. **开发时**: 使用 `npm start`，享受即时热更新
2. **部署前**: 使用 `npm run build` 生成优化后的产物
3. **调试**: 浏览器开发者工具中可以看到源码映射
4. **环境变量**: 创建 `.env` 文件，使用 `import.meta.env.VITE_*` 访问

---

**开发服务器**: http://localhost:3006  
**构建工具**: Vite 4.x  
**游戏引擎**: Phaser 3.3.0
