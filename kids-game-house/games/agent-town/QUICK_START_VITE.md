# Agent Town - 快速开始指南 (Vite 版本)

## 🚀 快速启动

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
npm run dev
```

访问: http://localhost:3000

---

## 📦 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 (Vite) |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 运行 ESLint |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run test` | 运行测试 |
| `npm run format` | 格式化代码 |

---

## 🔧 环境配置

创建或编辑 `.env` 文件：

```env
# WebSocket 网关地址
GATEWAY_URL=ws://127.0.0.1:18789/

# Agent 提供者 (openclaw 或 auggie)
AGENT_PROVIDER=openclaw

# 服务器端口
PORT=3000
```

---

## 📁 项目结构

```
agent-town/
├── index.html              # HTML 入口点
├── vite.config.ts          # Vite 配置
├── package.json            # 依赖和脚本
├── tsconfig.json           # TypeScript 配置
├── .env                    # 环境变量
│
├── src/
│   ├── main.tsx            # React 入口
│   ├── App.tsx             # 主应用组件
│   └── vite-env.d.ts       # 类型声明
│
├── app/
│   ├── globals.css         # 全局样式
│   └── ...                 # 其他资源
│
├── components/             # React 组件
├── lib/                    # 工具函数
├── types/                  # TypeScript 类型
└── public/                 # 静态资源
```

---

## ⚙️ Vite 配置要点

### 路径别名
```typescript
// 使用 @ 别名导入
import { something } from '@/lib/utils';
```

### WebSocket 代理
Vite 自动代理 `/api/gateway` 到配置的 GATEWAY_URL：
```typescript
// vite.config.ts
proxy: {
  '/api/gateway': {
    target: process.env.GATEWAY_URL,
    ws: true,
  }
}
```

---

## 🐛 常见问题

### 端口被占用
Vite 会自动尝试下一个可用端口（3000, 3001, 3002...）

### 模块未找到
```bash
# 清除缓存并重新安装
rm -rf node_modules
pnpm install
```

### TypeScript 错误
```bash
# 清除 Vite 缓存
rm -rf node_modules/.vite
npm run dev
```

### 热更新不工作
```bash
# 重启开发服务器
# Ctrl+C 停止服务器，然后重新运行
npm run dev
```

---

## 📝 从 Next.js 迁移的注意事项

### 已替换的功能
- ✅ `next/dynamic` → `React.lazy` + `Suspense`
- ✅ `next/image` → `<img>` 标签
- ✅ `next/font/google` → Google Fonts CDN
- ✅ Next.js API Routes → 工具函数

### 需要后端支持的功能
某些功能（如 agent discovery）需要单独的后端 API：
- 当前实现返回空数据
- 生产环境需要实现 Express/Fastify 后端

---

## 🎮 游戏运行要求

### OpenClaw Gateway
需要运行 OpenClaw gateway 才能使用完整的 agent 功能：
```bash
# 确保 gateway 在运行
# 默认地址: ws://127.0.0.1:18789/
```

### 浏览器要求
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

---

## 📚 更多文档

- [Vite 迁移指南](./VITE_MIGRATION.md)
- [迁移完成报告](./MIGRATION_COMPLETE_REPORT.md)
- [原始 README](./README.md)
- [贡献指南](./CONTRIBUTING.md)

---

## 💡 开发提示

1. **使用 TypeScript**: 所有新代码应该使用 TypeScript
2. **组件命名**: 使用 PascalCase (如 `MyComponent.tsx`)
3. **工具函数**: 放在 `lib/` 目录
4. **类型定义**: 放在 `types/` 目录
5. **样式**: 使用 Tailwind CSS + 自定义 CSS 类

---

**祝你开发愉快！** 🎉
