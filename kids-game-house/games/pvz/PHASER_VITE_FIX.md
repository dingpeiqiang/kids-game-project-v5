# Phaser 2 + Vite 兼容性修复说明

## 问题描述

在 Vite 环境中使用 Phaser 2.x 时遇到以下错误：

```
Uncaught ReferenceError: PIXI is not defined
```

这是因为 Phaser 2 依赖于全局的 `PIXI` 对象，但在 Vite 的 ES 模块环境中无法正确访问。

## 解决方案

### 1. 使用传统 Script 标签加载 Phaser

在 `index.html` 中通过 `<script>` 标签直接加载 Phaser，而不是通过 npm import：

```html
<script src="/lib/phaser.js"></script>
<script type="module" src="/src/main.js"></script>
```

这样做的好处：
- Phaser 2 会在全局作用域中正确初始化
- PIXI 和其他依赖会被正确设置为全局变量
- 避免模块化环境中的兼容性问题

### 2. 配置 Vite Public 目录

创建 `public/` 目录并移动静态资源：

```
public/
├── assets/          # 游戏资源（图片、音频）
│   ├── audio/
│   ├── sprites.png
│   └── sprites.json
└── lib/             # 第三方库
    └── phaser.js
```

Vite 配置 (`vite.config.js`)：
```javascript
export default defineConfig({
  publicDir: 'public', // 指定 public 目录
  define: {
    'global': 'globalThis' // 为 Phaser 提供 global 变量
  }
})
```

### 3. 移除 Phaser 的 ES Module Import

在 `src/main.js` 中：

**修改前：**
```javascript
import Phaser from 'phaser'
```

**修改后：**
```javascript
// Phaser 已通过 script 标签全局加载，无需 import
```

### 4. 资源路径调整

所有资源路径使用绝对路径（相对于 public 目录）：

```javascript
// boot.js
this.game.load.atlasJSONHash('sprites', '/assets/sprites.png', '/assets/sprites.json')
this.game.load.image('grass', '/assets/newgrass7x12_small.png')
this.game.load.audio('peaShoot', ['/assets/audio/effects/pea_shoot.mp3', ...])
```

## 为什么这样修复？

### Phaser 2 的架构特点

1. **全局依赖**：Phaser 2 基于 Phaser CE (Community Edition)，设计时假设 PIXI 等库在全局作用域
2. **非模块化**：Phaser 2 不是为 ES Modules 设计的
3. **浏览器全局变量**：依赖 `window.PIXI`、`window.p2` 等全局对象

### Vite 的模块化环境

1. **ES Modules**：Vite 原生支持 ES Modules，每个模块有独立作用域
2. **依赖预构建**：Vite 会尝试将 CommonJS 包转换为 ESM
3. **沙箱环境**：模块内的全局变量不会泄露到 window

### 冲突点

当 Vite 尝试将 Phaser 2 作为 ES Module 处理时：
- Phaser 内部引用的 `PIXI` 找不到（因为它在模块作用域外）
- Phaser 期望的全局变量不存在
- 导致运行时错误

## 替代方案

### 方案 A：升级到 Phaser 3（推荐用于新项目）

Phaser 3 完全支持模块化：

```javascript
import Phaser from 'phaser'

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: MyScene
}

const game = new Phaser.Game(config)
```

**优点：**
- 完全支持 ES Modules
- 更好的 TypeScript 支持
- 更现代的 API
- 活跃的维护

**缺点：**
- 需要重写游戏代码
- API 与 Phaser 2 不兼容

### 方案 B：使用 Webpack + expose-loader

如果使用 Webpack，可以使用 `expose-loader` 将 PIXI 暴露到全局：

```javascript
{
  test: require.resolve('phaser'),
  loader: 'expose-loader',
  options: {
    exposes: ['Phaser']
  }
}
```

### 方案 C：当前方案（Script 标签）

**优点：**
- 最小改动
- 保持原有代码不变
- 快速解决问题

**缺点：**
- 混合使用模块化和全局脚本
- 不利于 tree-shaking
- 版本管理不如 npm 方便

## 最佳实践建议

对于现有 Phaser 2 项目迁移到 Vite：

1. ✅ 使用 Script 标签加载 Phaser
2. ✅ 将静态资源放入 public 目录
3. ✅ 游戏逻辑代码使用 ES Modules
4. ✅ 配置 `define: { 'global': 'globalThis' }`

对于新项目：

1. ✅ 直接使用 Phaser 3
2. ✅ 完全使用 ES Modules
3. ✅ 利用 Vite 的所有特性

## 验证修复

启动开发服务器后，检查浏览器控制台：

✅ **成功标志：**
- 没有 "PIXI is not defined" 错误
- 游戏正常加载和运行
- 资源文件成功加载（200 状态码）

❌ **失败标志：**
- 控制台出现 ReferenceError
- 资源加载失败（404 状态码）
- 游戏画面空白

## 相关文件

- [index.html](file:///d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/pvz/index.html) - HTML 入口
- [vite.config.js](file:///d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/pvz/vite.config.js) - Vite 配置
- [src/main.js](file:///d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/pvz/src/main.js) - 游戏主入口
- [src/states/boot.js](file:///d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/pvz/src/states/boot.js) - 资源加载配置

## 参考资源

- [Phaser 2 GitHub](https://github.com/photonstorm/phaser-ce)
- [Phaser 3 官方文档](https://phaser.io/phaser3)
- [Vite Public Directory](https://vitejs.dev/guide/assets.html#the-public-directory)
- [Vite Define Plugin](https://vitejs.dev/config/shared-options.html#define)
