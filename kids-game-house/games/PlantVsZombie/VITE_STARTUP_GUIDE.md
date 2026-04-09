# PlantVsZombie - Vite 启动指南

## 🚀 快速启动

### 方法一：使用 PowerShell 脚本（推荐）
```powershell
.\start-plant-vs-zombie.ps1
```

### 方法二：使用批处理文件
```batch
start-plant-vs-zombie.bat
```

### 方法三：直接使用 npm 命令
```bash
# 首次运行需要安装依赖
npm install

# 生成游戏资产
npm run assets:generate

# 编译关卡数据（可选）
npm run levels:compile

# 启动 Vite 开发服务器
npm run dev
# 或者
npm start
```

## 🔧 配置说明

- **端口**: 5176 (可在 `vite.config.ts` 中修改)
- **自动打开浏览器**: 是
- **热模块替换 (HMR)**: 启用
- **外部访问**: 已启用 (host: true)
- **路径别名**: 已配置 `@`, `@game`, `@entities`, `@systems`, `@managers`, `@config`, `@data`, `@ui`, `@utils`, `@types`

## 📁 项目结构

```
PlantVsZombie/
├── src/                 # 源代码
│   ├── game/           # 游戏核心逻辑
│   │   ├── entities/   # 实体类
│   │   ├── systems/    # 系统逻辑
│   │   ├── scenes/     # 游戏场景
│   │   ├── config/     # 配置文件
│   │   └── utils/      # 工具函数
│   ├── ui/             # UI 组件
│   ├── data/           # 数据文件
│   ├── types/          # TypeScript 类型定义
│   └── main.ts         # 入口文件
├── public/             # 静态资源
├── scripts/            # 构建脚本
├── vite.config.ts      # Vite 配置
├── tsconfig.json       # TypeScript 配置
├── package.json        # 项目配置
├── start-plant-vs-zombie.ps1  # PowerShell 启动脚本
└── start-plant-vs-zombie.bat  # 批处理启动脚本
```

## 🎮 游戏玩法

启动后访问 http://localhost:5176 即可开始游戏！

### 主要功能
- 🌻 经典植物大战僵尸玩法
- 🎨 组件化 HUD 界面
- 🌊 支持草地和泳池地形
- 🛠️ 内置关卡编辑器
- 🔊 原版音效和 BGM

## 🛠️ 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` 或 `npm start` | 启动开发服务器 |
| `npm run build` | 生产环境构建 |
| `npm run build:dev` | 开发环境构建 |
| `npm run preview` | 预览生产构建 |
| `npm run test` | 运行单元测试 |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |
| `npm run test:e2e` | 运行端到端测试 |
| `npm run lint` | 代码检查 |
| `npm run lint:fix` | 自动修复代码问题 |
| `npm run format` | 格式化代码 |
| `npm run type-check` | 类型检查 |
| `npm run assets:generate` | 生成游戏资产 |
| `npm run levels:compile` | 编译关卡数据 |

## 🔍 调试技巧

### 浏览器开发者工具
- 按 F12 打开开发者工具
- 在 Console 中可以使用 `window.__debugGame` 访问游戏实例（仅开发模式）

### 热模块替换 (HMR)
- 修改代码后会自动刷新，无需手动刷新页面
- 保持游戏状态的同时更新代码

### 性能监控
- 使用浏览器 Performance 面板监控性能
- Phaser 内置调试信息可通过配置开启

## ⚙️ 高级配置

### 修改端口
编辑 `vite.config.ts` 中的 `server.port` 值：
```typescript
server: {
  port: 5176, // 修改为你想要的端口
  ...
}
```

### 禁用自动打开浏览器
编辑 `vite.config.ts`：
```typescript
server: {
  open: false, // 改为 false
  ...
}
```

### 启用网络访问
当前配置已启用 `host: true`，可以通过局域网 IP 访问游戏。

## 📝 注意事项

1. **首次运行**：需要先安装依赖和生成资产
2. **端口占用**：如果 5176 端口被占用，Vite 会自动尝试其他端口
3. **资源加载**：确保 `public/assets` 目录存在且有正确的资源文件
4. **TypeScript 错误**：开发过程中会实时显示类型错误，但不影响运行

## 🐛 常见问题

### Q: 启动后白屏？
A: 检查浏览器控制台是否有错误，确保资产已正确生成。

### Q: 热更新不生效？
A: 尝试刷新页面或重启开发服务器。

### Q: 端口被占用？
A: Vite 会自动尝试下一个可用端口，或手动修改配置文件中的端口号。

### Q: 如何查看构建后的文件？
A: 运行 `npm run build` 后，构建文件会在 `dist` 目录中。

---

**享受游戏开发！** 🎮🌻🧟
