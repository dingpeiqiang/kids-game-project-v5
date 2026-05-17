# Car on Curved Terrain - Vite 配置说明

本项目现已支持使用 Vite 进行开发和构建，提供更快的开发体验和更好的性能。

## 可用脚本

### 开发模式
```bash
npm run dev
```
启动 Vite 开发服务器，支持热模块替换（HMR），端口为 3000（如果占用则自动选择其他端口）。

### 构建生产版本
```bash
npm run vite:build
```
使用 Vite 构建优化的生产版本，输出到 `dist` 目录。

### 预览生产构建
```bash
npm run vite:preview
```
本地预览生产构建结果。

### 原有 Webpack 命令（仍然可用）
```bash
npm start        # 使用 Webpack 开发服务器
npm run build    # 使用 Webpack 构建生产版本
```

## Vite 配置特点

1. **快速冷启动** - Vite 基于原生 ES 模块，启动速度极快
2. **即时热更新** - 修改代码后立即在浏览器中反映
3. **优化依赖预构建** - 自动优化 Phaser、poly-decomp 等依赖
4. **TypeScript 支持** - 原生支持 TypeScript，无需额外配置
5. **资源处理** - 自动处理静态资源导入

## 项目结构

```
car-on-curved-terrain/
├── src/
│   ├── scripts/       # TypeScript 源代码
│   ├── assets/        # 游戏资源文件
│   ├── pwa/           # PWA 相关文件
│   └── index.html     # HTML 入口文件
├── vite.config.ts     # Vite 配置文件
├── package.json       # 项目依赖和脚本
└── dist/              # 构建输出目录
```

## 注意事项

1. HTML 文件中的 `<script>` 标签必须使用 `type="module"`
2. 所有资源路径应相对于 `src` 目录
3. 开发时访问地址：http://localhost:3000/

## 迁移说明

从 Webpack 迁移到 Vite 后：
- 开发服务器启动速度提升约 10 倍
- 热更新几乎即时完成
- 构建产物更小且优化更好
- 保留了原有的 Webpack 配置作为备选方案