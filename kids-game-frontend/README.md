# 儿童游戏平台前端

基于 Vue 3 + Vite + Pinia + Phaser 构建的现代化儿童游戏平台。

## 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **游戏引擎**: Phaser
- **HTTP客户端**: Axios
- **样式**: Tailwind CSS

## 项目结构

```
src/
├── core/                # 核心基础层
│   ├── config/          # 全局配置（环境/游戏/UI）
│   ├── network/         # 网络封装（API/WebSocket）
│   ├── store/           # Pinia状态管理
│   └── utils/           # 通用工具
├── modules/             # 业务模块层
│   ├── home/            # 首页模块
│   ├── game/            # 游戏模块（Phaser封装）
│   ├── parent/          # 家长管控模块
│   └── answer/          # 答题模块
├── components/          # 通用组件层
│   ├── ui/              # 儿童友好组件
│   └── game/            # 游戏通用组件
├── router/              # 路由配置
├── styles/              # 全局样式
├── App.vue              # 根组件
└── main.ts              # 入口文件
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 核心功能

### 游戏模块
- 拼图游戏
- 算数游戏
- 答题游戏

### 家长管控
- 时间限制设置
- 游戏选择控制
- 实时监控
- 游戏记录查看
- 远程控制（暂停/停止/强制休息）

### 状态管理
- 儿童状态（疲劳度/学龄/积分）
- 家长管控状态
- WebSocket实时同步

## 环境配置

在 `src/core/config/env.ts` 中配置不同环境的API地址。

## 游戏开发

游戏基于Phaser开发，继承 `BaseGameScene` 和 `BaseGame` 类即可快速创建新游戏。

```typescript
export class MyGameScene extends BaseGameScene {
  protected setupGame(): void {
    // 游戏初始化
  }

  protected updateGame(): void {
    // 游戏循环
  }
}
```

## License

MIT
