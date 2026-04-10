# Tank 1990 - 快速启动指南

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

浏览器将自动打开 http://localhost:3000

---

## 📋 可用命令

| 命令 | 说明 | 用途 |
|------|------|------|
| `npm run dev` | 启动开发服务器 | 日常开发使用 |
| `npm run build` | 生产环境构建 | 部署前使用 |
| `npm run preview` | 预览构建结果 | 测试生产构建 |
| `npm run type-check` | TypeScript 类型检查 | 代码质量检查 |
| `npm run clean` | 清理构建产物 | 重新构建前使用 |

---

## 🎮 游戏控制

| 按键 | 功能 |
|------|------|
| ↑ ↓ ← → / WASD | 移动坦克 |
| Space | 发射子弹 |
| ESC | 暂停/继续 |
| R (暂停时) | 重新开始关卡 |
| M (暂停时) | 返回主菜单 |

---

## 🏗️ 项目结构

```
tank_1990_game/
├── public/              # 静态资源目录
│   └── assets/          # 游戏资源（可选）
├── src/
│   ├── game/            # 游戏核心逻辑
│   │   ├── scenes/      # Phaser 场景
│   │   ├── entities/    # 游戏实体
│   │   ├── ai/          # AI 逻辑
│   │   └── levels/      # 关卡数据
│   ├── ui/              # React UI 组件
│   ├── types/           # TypeScript 类型定义
│   ├── App.tsx          # 应用根组件
│   └── main.tsx         # 入口文件
├── index.html           # HTML 模板
├── vite.config.ts       # Vite 配置
├── tsconfig.json        # TypeScript 配置
└── package.json         # 项目配置
```

---

## 🔧 常见问题

### Q: 端口 3000 被占用怎么办？
A: 修改 `vite.config.ts` 中的 `server.port` 配置

### Q: 如何添加真实的游戏资源？
A: 
1. 将 PNG 文件放入 `public/assets/` 目录
2. 在 `src/game/scenes/PreloadScene.ts` 中加载资源
3. 更新实体类使用新纹理

### Q: 热更新不工作？
A: 
1. 检查防火墙设置
2. 确保没有忽略 `.tsx` 和 `.ts` 文件
3. 重启开发服务器

### Q: 构建失败？
A: 
1. 运行 `npm run type-check` 检查类型错误
2. 运行 `npm run clean` 清理后重新构建
3. 删除 `node_modules` 并重新安装

---

## 📊 性能指标

- **冷启动时间**: ~431ms ⚡
- **热更新时间**: <100ms 🚀
- **生产构建大小**: ~1.6MB (gzip: ~381KB)
- **构建时间**: ~10s

---

## 🌐 访问地址

开发服务器启动后会显示多个访问地址：

- **Local**: http://localhost:3000 (本地访问)
- **Network**: http://[IP]:3000 (局域网访问)

可以在手机或其他设备上通过局域网 IP 访问测试。

---

## 📝 开发提示

### 调试技巧
1. 使用浏览器开发者工具的 Console 面板
2. 在代码中使用 `console.log()`（生产环境会自动移除）
3. 使用 `debugger` 语句设置断点

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则（如果配置）
- 组件使用函数式写法
- 使用 React Hooks 管理状态

### 性能优化
- 避免在 render 中进行耗时操作
- 使用 React.memo 优化组件重渲染
- Phaser 对象使用对象池模式
- 及时销毁不再使用的资源

---

## 🎯 下一步

1. **熟悉代码**: 阅读 `README.md` 了解架构
2. **运行游戏**: `npm run dev` 体验完整游戏
3. **修改测试**: 尝试修改一些参数看看效果
4. **添加功能**: 参考现有代码添加新功能

---

## 📞 需要帮助？

- 查看 `README.md` 了解详细架构
- 查看 `VITE_OPTIMIZATION_REPORT.md` 了解优化细节
- 检查浏览器控制台错误信息
- 查看终端输出的警告和错误

---

**祝开发愉快！** 🎮✨
