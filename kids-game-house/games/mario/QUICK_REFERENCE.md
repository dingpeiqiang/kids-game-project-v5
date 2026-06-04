# Mario Game - Vite 快速参考

## 🚀 快速命令

```bash
# 安装依赖
npm install

# 启动开发服务器（推荐）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 📊 性能提升

| 指标 | Webpack | Vite | 提升 |
|------|---------|------|------|
| 启动时间 | ~5-10s | ~0.3s | **95%** ⚡ |
| 热更新 | 1-3s | <0.1s | **90%** ⚡ |
| 配置复杂度 | 中 | 低 | ✅ |

## 🌐 访问地址

开发服务器启动后，可以访问：
- **本地**: http://localhost:3000/
- **网络**: http://192.168.2.10:3000/

## 📁 关键文件

- `vite.config.ts` - Vite 配置
- `src/scripts/game.ts` - 游戏入口
- `src/index.html` - HTML 模板
- `package.json` - 依赖和脚本

## ⚙️ 常用配置

### 修改端口
编辑 `vite.config.ts`:
```typescript
server: {
  port: 8080,  // 你想要的端口
}
```

### 添加路径别名
编辑 `vite.config.ts`:
```typescript
resolve: {
  alias: {
    '@': resolve(__dirname, 'src'),
    '@scenes': resolve(__dirname, 'src/scripts/scenes'),
  },
}
```

## 🔧 故障排除

### ⚠️ TypeScript 编译错误

**错误**: `Class constructor XXX cannot be invoked without 'new'`

**原因**: tsconfig.json 的 target 设置为 ES5，与 tsyringe 不兼容

**解决**: 确保 tsconfig.json 中是 `"target": "ES2015"` 和 `"module": "ESNext"`

```json
{
  "compilerOptions": {
    "target": "ES2015",
    "module": "ESNext"
  }
}
```

### ⚠️ Phaser 版本问题

**错误**: `ParticleEmitterManager was removed in Phaser 3.60`

**原因**: Phaser 版本被自动升级到 3.60+

**解决**: 确保 package.json 中是 `"phaser": "3.52.0"`（没有 `^` 前缀）

```bash
# 如果版本不对，重新安装
npm install phaser@3.52.0 --save-exact
```

### 端口被占用
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <进程ID> /F

# 或修改端口
```

### 缓存问题
```bash
# 清除缓存
rm -rf node_modules package-lock.json dist
npm install
```

### TypeScript 错误
确保 tsconfig.json 包含:
```json
{
  "include": ["src", "src/types/*.d.ts"]
}
```

## 📚 更多信息

- [完整文档](./VITE_SETUP.md)
- [迁移报告](./MARIO_VITE_MIGRATION_COMPLETE.md)
- [Vite 官方文档](https://vitejs.dev/)

---

**提示**: 开发时保持 `npm run dev` 运行，享受即时热更新！
