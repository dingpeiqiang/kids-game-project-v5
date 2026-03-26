# ⚡ 坦克大战 - 5 分钟快速开始

## 🎯 目标

在 5 分钟内让坦克大战游戏运行起来!

## 📋 前提条件

确保已安装:
- ✅ Node.js >= 18.0.0
- ✅ npm >= 9.0.0
- ✅ FFmpeg (可选，用于生成 MP3)

## 🚀 步骤

### 第 1 步：安装依赖 (2 分钟)

```bash
# 进入游戏目录
cd kids-game-house/tank-battle-vue3

# 安装主项目依赖
npm install

# 安装脚本依赖
cd scripts
npm install
cd ..
```

### 第 2 步：生成资源 (2 分钟)

```bash
# 方法 1: 使用批处理 (Windows)
generate-resources.bat

# 方法 2: 手动执行
node scripts/generate-resources.mjs
```

**如果没有 FFmpeg**:
- 音频将保留 WAV 格式
- 不影响游戏运行
- 可以跳过此步直接使用占位符

### 第 3 步：启动游戏 (1 分钟)

```bash
# 启动开发服务器
npm run dev
```

浏览器访问：**http://localhost:3002**

## 🎮 测试游戏

1. **看到菜单界面** ✓
   - "坦克大战" 标题
   - "开始游戏" 按钮
   
2. **点击开始游戏** ✓
   - 游戏场景加载
   - 玩家坦克出现 (绿色)
   
3. **控制坦克移动** ✓
   - WASD 或方向键
   - 坦克应该能移动
   
4. **开火测试** ✓
   - 按 J 或空格键
   - 发射子弹

## ❓ 常见问题

### Q: 提示找不到模块？
```
Error: Cannot find module 'vue'
```

**A**: 没有安装依赖
```bash
npm install
```

### Q: 资源生成失败？
```
FFmpeg not found
```

**A**: FFmpeg 未安装，但不影响游戏
- 选项 1: 安装 FFmpeg
- 选项 2: 使用 WAV 格式也可以
- 选项 3: 手动放置占位符文件

### Q: 端口被占用？
```
Port 3002 is already in use
```

**A**: 修改 `vite.config.ts` 中的端口号

### Q: 黑屏/白屏？
```
空白页面，什么都没有
```

**A**: 
1. 打开浏览器控制台 (F12)
2. 查看错误信息
3. 检查资源路径是否正确

## 🎯 下一步

游戏运行后，可以:

1. **完善游戏功能**
   - 参考 `DEVELOPMENT_GUIDE.md`
   - 实现完整的关卡
   - 优化敌人 AI

2. **注册到平台**
   ```bash
   # 执行 SQL 脚本
   mysql -u root -p < register-game.sql
   ```

3. **生产构建**
   ```bash
   npm run build
   ```

## 📁 项目结构速览

```
tank-battle-vue3/
├── public/themes/default/    # 资源文件 (自动生成的)
│   ├── audio/                # 音频
│   └── images/               # 图片
├── scripts/                   # 工具脚本
├── src/
│   ├── config/GTRS.json      # 资源配置
│   ├── scenes/               # Phaser 场景
│   ├── stores/               # 状态管理
│   └── views/                # Vue 组件
└── package.json              # 依赖配置
```

## 🔗 有用的链接

- **完整文档**: `README.md`
- **开发指南**: `DEVELOPMENT_GUIDE.md`
- **游戏设计**: `game-design.md`
- **资源清单**: `resource-list.md`

## 💡 提示

- 首次运行建议先看一遍所有文档
- 遇到问题先查 `DEVELOPMENT_GUIDE.md`
- 代码都在 `src/` 目录下
- 资源生成是可选的，可以先用占位符

---

**就这么简单!** 🎉

如果还有问题，欢迎查阅详细文档或联系技术支持。

**版本**: v1.0.0  
**更新时间**: 2026-03-26
