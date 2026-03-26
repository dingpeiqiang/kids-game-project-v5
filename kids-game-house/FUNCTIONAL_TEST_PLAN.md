# 🧪 功能测试计划

**日期**: 2026-03-26  
**阶段**: 结构迁移完成，等待功能验证  
**优先级**: 🔴 高

---

## 📋 测试目标

验证目录结构重构后，所有游戏和工具可以正常运行。

---

## 🎯 测试范围

### 1. 游戏运行测试 ⏳

#### plane-shooter (飞机大战)
- [ ] ⏳ **依赖安装**: `npm install`
- [ ] ⏳ **开发模式**: `npm run dev` → http://localhost:8081
- [ ] ⏳ **生产构建**: `npm run build`
- [ ] ⏳ **资源加载**: GTRS.json, 音频，图片
- [ ] ⏳ **游戏流程**: 开始界面 → 游戏进行 → 结束界面

#### snake (贪吃蛇)
- [ ] ⏳ **依赖安装**: `npm install`
- [ ] ⏳ **开发模式**: `npm run dev` → http://localhost:3003
- [ ] ⏳ **生产构建**: `npm run build`
- [ ] ⏳ **基本功能**: 游戏循环正常

#### tank-battle (坦克大战)
- [ ] ⏳ **依赖安装**: `npm install`
- [ ] ⏳ **开发模式**: `npm run dev` → http://localhost:3004
- [ ] ⏳ **生产构建**: `npm run build`

#### plants-vs-zombie (植物大战僵尸)
- [ ] ⏳ **依赖安装**: `npm install`
- [ ] ⏳ **开发模式**: `npm run dev` → http://localhost:3005
- [ ] ⏳ **生产构建**: `npm run build`

---

### 2. 工具功能测试 ⏳

#### GTRS 生成器
```bash
cd tools/gtrs-generator/src
node generate-resources.mjs --game=test-game
```

- [ ] ⏳ **脚本执行**: 无错误
- [ ] ⏳ **资源生成**: 正确生成图片、音频配置
- [ ] ⏳ **GTRS.json**: 格式正确

#### 音频转换器
```bash
cd tools/audio-converter
.\convert-to-mp3-simple.ps1 -InputDir test-audio
```

- [ ] ⏳ **FFmpeg 调用**: 正常
- [ ] ⏳ **格式转换**: WAV → MP3
- [ ] ⏳ **GTRS 更新**: 自动更新引用

---

### 3. 批处理脚本测试 ⏳

#### build-all-games.bat
- [ ] ⏳ **执行成功**: 无错误
- [ ] ⏳ **构建产物**: 4 个游戏的 dist 目录都生成
- [ ] ⏳ **耗时**: 记录构建时间

#### start-all-games.bat
- [ ] ⏳ **窗口打开**: 4 个独立窗口
- [ ] ⏳ **服务器启动**: 所有游戏正常启动
- [ ] ⏳ **端口分配**: 8081, 3003, 3004, 3005

#### stop-all-games.bat
- [ ] ⏳ **进程停止**: 所有游戏正常关闭
- [ ] ⏳ **无残留**: 端口释放

#### install-dependencies.bat
- [ ] ⏳ **依赖安装**: 所有游戏 node_modules 生成
- [ ] ⏳ **耗时**: 记录安装时间

---

## 📊 当前状态

### 依赖安装状态

| 游戏 | node_modules | 状态 | 操作 |
|------|-------------|------|------|
| **plane-shooter** | ✅ 存在 | ✓ Ready | 可以测试 |
| **snake** | ❌ 缺失 | ⏳ Pending | 需要 npm install |
| **tank-battle** | ❌ 缺失 | ⏳ Pending | 需要 npm install |
| **plants-vs-zombie** | ❌ 缺失 | ⏳ Pending | 需要 npm install |

### 构建状态

| 游戏 | dist 目录 | 状态 | 操作 |
|------|----------|------|------|
| **plane-shooter** | ❌ 缺失 | ⏳ Pending | 需要 npm run build |
| **snake** | ❌ 缺失 | ⏳ Pending | 需要 npm run build |
| **tank-battle** | ❌ 缺失 | ⏳ Pending | 需要 npm run build |
| **plants-vs-zombie** | ❌ 缺失 | ⏳ Pending | 需要 npm run build |

---

## 🚀 测试步骤

### 阶段一：单机测试（今天）

#### Step 1: 安装依赖
```bash
cd kids-game-house

# 方法 1: 使用批处理脚本
.\install-dependencies.bat

# 方法 2: 手动安装
foreach ($game in @("plane-shooter", "snake", "tank-battle", "plants-vs-zombie")) {
    cd games/$game
    npm install
    cd ../..
}
```

**预计耗时**: 10-15 分钟

#### Step 2: 测试单个游戏
```bash
# 测试 plane-shooter
cd games/plane-shooter
npm run dev

# 浏览器访问 http://localhost:8081
# 验证游戏可以正常运行
```

**每个游戏耗时**: 5-10 分钟

#### Step 3: 测试批处理脚本
```bash
# 启动所有游戏
.\start-all-games.bat

# 等待所有服务器启动
# 逐个访问验证

# 停止所有游戏
.\stop-all-games.bat
```

**预计耗时**: 5 分钟

#### Step 4: 测试生产构建
```bash
# 构建所有游戏
.\build-all-games.bat

# 检查各游戏的 dist 目录
```

**预计耗时**: 10-15 分钟

---

### 阶段二：工具测试（明天）

#### Step 1: GTRS 生成器测试
```bash
cd tools/gtrs-generator/src

# 创建测试游戏目录
mkdir ../../games/test-game

# 生成测试资源
node generate-resources.mjs --game=test-game

# 检查结果
ls ../../games/test-game/public/themes/default/
```

**预计耗时**: 10 分钟

#### Step 2: 音频转换器测试
```bash
cd tools/audio-converter

# 创建测试音频目录
mkdir test-input
# 放入一些 WAV 文件

# 执行转换
.\convert-audio-to-mp3-simple.ps1 -InputDir test-input

# 检查结果
ls test-input/*.mp3
```

**预计耗时**: 5 分钟

---

### 阶段三：集成测试（后天）

#### Step 1: 完整流程测试
- 创建新游戏
- 生成资源
- 安装依赖
- 开发测试
- 生产构建
- 部署验证

#### Step 2: 性能测试
- 构建时间
- 加载速度
- 运行流畅度

#### Step 3: 兼容性测试
- Chrome
- Edge
- Firefox

---

## ⚠️ 已知问题

### 问题 1: 部分游戏缺少依赖

**现象**: snake, tank-battle, plants-vs-zombie 的 node_modules 不存在

**原因**: 迁移时只移动了文件，没有保留 node_modules

**解决方案**: 
```bash
cd games/snake && npm install
cd games/tank-battle && npm install
cd games/plants-vs-zombie && npm install
```

**影响**: ⚠️ 中 - 需要重新安装依赖，但项目代码完整

---

### 问题 2: 路径引用可能需要调整

**现象**: 某些 import 路径可能还是旧的相对路径

**检查方法**:
```bash
# 在浏览器开发者工具查看 Console
# 是否有模块加载错误
```

**解决方案**: 
- 发现错误时手动修正路径
- 使用 IDE 的全局搜索替换

**影响**: ⚠️ 低 - 如有问题容易修复

---

## 📈 进度跟踪

### 总体进度

```
结构迁移：    100% ████████████████████ ✅
文档创建：    100% ████████████████████ ✅
依赖安装：     25% ████░░░░░░░░░░░░░░░░ ⏳
功能测试：      0% ░░░░░░░░░░░░░░░░░░░░ ⏳
工具验证：      0% ░░░░░░░░░░░░░░░░░░░░ ⏳
```

### 今日目标

- [ ] ⏳ 安装所有游戏依赖
- [ ] ⏳ 测试 plane-shooter 运行
- [ ] ⏳ 测试 start-all-games.bat
- [ ] ⏳ 记录遇到的问题和解决方案

---

## 🎯 成功标准

### 必须满足 ✅

- [ ] ✅ 所有 4 个游戏可以正常运行
- [ ] ✅ 所有批处理脚本可以正常执行
- [ ] ✅ GTRS 生成器可以正常工作
- [ ] ✅ 音频转换器可以正常工作
- [ ] ✅ 无严重 Bug（阻塞性问题）

### 期望满足 🎯

- [ ] 🎯 游戏加载速度无明显下降
- [ ] 🎯 构建时间与之前相当
- [ ] 🎯 团队可以快速上手新流程
- [ ] 🎯 文档清晰易懂

---

## 📞 问题反馈

### 发现问题？

如果您在测试过程中遇到问题：

1. **记录详细信息**
   - 操作步骤
   - 预期结果
   - 实际结果
   - 错误信息截图

2. **提交反馈**
   - 团队群组讨论
   - 或者创建 Issue
   - 或者直接修复并提交 PR

3. **寻求帮助**
   - 查看相关文档
   - 询问团队成员
   - 联系项目负责人

---

## 📝 测试日志模板

```markdown
### 测试项：[例如：plane-shooter 启动]
**时间**: 2026-03-26 10:30
**测试人**: [姓名]
**环境**: Windows 11, Node.js v18, Chrome

**步骤**:
1. cd games/plane-shooter
2. npm run dev
3. 访问 http://localhost:8081

**结果**: ✅ 通过 / ❌ 失败

**详情**:
- 启动耗时：~5 秒
- 无控制台错误
- 游戏流程完整

**备注**: 一切正常
```

---

**最后更新**: 2026-03-26  
**维护者**: Lingma AI Assistant  
**状态**: 🔄 准备开始测试

🎯 **按照本计划逐步执行功能验证！**
