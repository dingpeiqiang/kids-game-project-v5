# 📋 游戏开发 Plan 模式 - 快速参考卡片

**版本**: v1.0.0  
**日期**: 2026-03-27  
**用途**: AI 和开发者快速查阅的速查表

---

## 🎯 三阶段核心流程

```
第一阶段（设计） → 第二阶段（资源） → 第三阶段（代码）
   2-3 天              3-5 天              5-10 天
   ↓                    ↓                   ↓
GAME_DESIGN.md      public/themes/      games/${GAME_ID}/
GTRS_CONFIG.json    config.json         src/
register.sql        images/             TEST_REPORT.md
                    audio/              AI 验证报告
```

⚠️ **禁止跨阶段操作！**

---

## 📊 阶段对比表

| 维度 | 第一阶段 | 第二阶段 | 第三阶段 |
|------|---------|---------|---------|
| **核心任务** | 设计 + 定义 | 生成 + 配置 | 实现 + 测试 |
| **主要产出** | 文档 + JSON | 资源文件 | 代码 + 报告 |
| **AI 辅助度** | 80% | 60% | 40% |
| **人工审核点** | GTRS 规范 | 资源质量 | 功能完整性 |
| **验收方式** | 文档评审 | 自动化校验 | AI 验证 |

---

## ✅ 第一阶段检查清单（设计）

### 必须完成项（5 项）

- [ ] **游戏概念文档**（≥500 字）
- [ ] **游戏规则详细说明**
- [ ] **技术架构设计方案**
- [ ] **GTRS 配置 JSON**（通过 Schema 校验）
- [ ] **注册 SQL 脚本**

### 交付物

```
docs/
├── GAME_DESIGN.md
├── GTRS_CONFIG.json
└── register-${GAME_CODE}.sql
```

### AI 指令模板

```
请帮我设计一个儿童游戏：
1. 类型：[ACTION/PUZZLE/STRATEGY]
2. 目标年龄：[年级]
3. 教育目标：[能力训练]
4. 参考游戏：[可选]

请输出完整的游戏概念设计。
```

---

## ✅ 第二阶段检查清单（资源）

### 必须完成项（5 项）

- [ ] **所有图片资源**（PNG-24 格式）
- [ ] **所有音频资源**（MP3 格式，强制）
- [ ] **config.json 配置**
- [ ] **通过 Schema 校验**
- [ ] **通过完整性检查**

### 目录结构

```
public/themes/${theme_id}/
├── images/
│   ├── scene/      # 场景资源
│   ├── sprite/     # 精灵动画
│   ├── effect/     # 特效
│   └── icon/       # 图标
├── audio/
│   ├── bgm/        # 背景音乐（MP3）
│   └── sfx/        # 音效（MP3）
└── config.json     # GTRS 配置
```

### 校验命令

```bash
# Schema 校验
node scripts/validate-gtrs-schema.js themes/${THEME_ID}/config.json

# 资源完整性
node scripts/check-resources-existence.js themes/${THEME_ID}/

# 音频格式（必须 MP3）
node scripts/check-audio-format.js themes/${THEME_ID}/

# 命名规范
node scripts/check-resource-naming.js themes/${THEME_ID}/
```

---

## ✅ 第三阶段检查清单（代码）

### 必须完成项（6 项）

- [ ] **游戏核心功能实现**
- [ ] **GTRS 主题集成**
- [ ] **UI 组件完整**
- [ ] **音频系统正常**
- [ ] **通过自动化测试**
- [ ] **AI 验证评分≥80**

### 目录结构

```
games/${GAME_ID}/
├── src/
│   ├── scenes/         # Phaser 场景
│   ├── components/     # Vue 组件
│   ├── types/          # TypeScript 类型
│   └── utils/          # 工具函数
├── package.json
└── README.md
```

### 测试命令

```bash
# 单元测试
npm run test:unit

# E2E 测试
npm run test:e2e

# 性能测试
npm run test:performance

# AI 质量验证
./ai-validation-workflow.sh ${GAME_ID}
```

---

## 🔧 常用 AI 指令

### 第一阶段

```
# 游戏设计
请基于以下需求设计游戏：[需求描述]

# GTRS 配置
请生成符合 GTRS v1.0.0 的配置 JSON：[技术架构]

# SQL 脚本
请编写游戏注册 SQL：[游戏信息]
```

---

### 第二阶段

```
# 图片生成
请生成以下游戏资源图片：[资源列表]
要求：PNG-24，透明背景，符合 GTRS 命名

# 音频转换
请将以下 WAV 转换为 MP3：[文件列表]
要求：BGM 128kbps, SFX 64kbps
```

---

### 第三阶段

```
# 代码框架
请基于游戏框架实现以下功能：[功能列表]
要求：TypeScript，继承 GameEngine

# 测试用例
请为以下功能编写测试用例：[功能描述]
```

---

## 📊 关键指标要求

### 性能指标（P1 级）

| 指标 | 要求 | 测量方法 |
|------|------|---------|
| 首屏加载 | < 3 秒 | Lighthouse |
| 资源加载 | < 5 秒 | Network 面板 |
| FPS | ≥ 60 | Performance |
| 内存占用 | < 256MB | Memory 面板 |

---

### 资源规范（P0 级）

| 资源类型 | 格式 | 大小限制 | 命名规范 |
|---------|------|---------|---------|
| **Scene BG** | PNG | < 2MB | scene_bg_*.png |
| **Sprite** | PNG | < 512KB | sprite_*.png |
| **Effect** | PNG | < 256KB | effect_*.png |
| **Icon** | PNG | < 64KB | icon_*.png |
| **BGM** | MP3 | < 10MB | bgm_*.mp3 |
| **SFX** | MP3 | < 1MB | sfx_*.mp3 |

⚠️ **音频必须 MP3 格式！**

---

## 🎯 AI 验证优先级

### P0 级别（必须 100% 通过）

- ✅ 功能完整性（26 项）
- ✅ 音频 MP3 格式（8 项）
- ✅ GTRS Schema 校验（12 项）

**失败处理**: ❌ 立即拒绝

---

### P1 级别（≥70% 通过率）

- ✅ 性能测试（15 项）
- ✅ 安全测试（12 项）

**失败处理**: ⚠️ 警告，可协商

---

### P2 级别（≥50% 通过率）

- ✅ 浏览器兼容（5 种）
- ✅ 设备兼容（5 种）

**失败处理**: 💡 记录改进

---

### P3 级别（仅供参考）

- ✅ 用户体验（4 维度评分）

**失败处理**: 📊 建议优化

---

## 🛠️ 工具箱

### 设计阶段

- 📝 Markdown 编辑器
- 🎨 思维导图工具
- 📊 Mermaid 流程图

---

### 资源阶段

- 🎨 Aseprite（像素艺术）
- 🖼️ Photoshop（专业设计）
- 🎵 Audacity（音频编辑）
- 🔄 FFmpeg（格式转换）
- 📦 TexturePacker（精灵图打包）

---

### 代码阶段

- 💻 VSCode（代码编辑）
- 🧪 Vitest（单元测试）
- 🤖 Playwright（E2E 测试）
- 📊 Lighthouse（性能测试）
- 🔍 Puppeteer（安全测试）

---

## 📋 模板文件位置

### 官方模板

```
kids-game-house/
├── GAME_DEVELOPMENT_PLAN_TEMPLATE.md  # 完整模板
├── GAME_REGISTRATION_GUIDE.md         # 注册指南
├── GTRS_RESOURCE_SPECIFICATION.md     # GTRS 规范
└── AI_GAME_VALIDATION_GUIDE.md        # AI 验证指南
```

---

### 示例项目

```
games/
├── snake/        # 贪吃蛇（参考）
├── plane-shooter/# 飞机大战（参考）
└── template/     # 通用模板
```

---

## ⚡ 快速启动脚本

### 创建新游戏

```bash
#!/bin/bash
# create-new-game.sh

GAME_ID=$1
GAME_NAME=$2

echo "🎮 创建游戏：$GAME_NAME"

# 1. 设计阶段
mkdir -p docs
# AI 生成设计文档...

# 2. 资源阶段
mkdir -p public/themes/${GAME_ID}/{images,audio}
# 生成资源...

# 3. 代码阶段
cp -r games/template games/${GAME_ID}
# 适配代码...

echo "✅ 完成！"
```

---

### 批量转换音频

```bash
#!/bin/bash
# convert-audio.sh

for wav in themes/*/audio/**/*.wav; do
    mp3="${wav%.wav}.mp3"
    ffmpeg -i "$wav" -b:a 128k "$mp3" -y
    echo "转换：$wav → $mp3"
done
```

---

### 自动化校验

```bash
#!/bin/bash
# validate-all.sh

THEME_ID=$1

echo "🔍 Schema 校验..."
node scripts/validate-gtrs-schema.js themes/${THEME_ID}/config.json

echo "📦 资源检查..."
node scripts/check-resources-existence.js themes/${THEME_ID}/

echo "🎵 音频格式..."
node scripts/check-audio-format.js themes/${THEME_ID}/

echo "✅ 校验完成！"
```

---

## 📞 常见问题速查

### Q: 三个阶段可以并行吗？

**A**: ❌ **不可以！** 必须严格按顺序执行。

---

### Q: AI 能替代人工吗？

**A**: AI 辅助 80% 工作，但关键节点需要人工审核：
- 第一阶段：GTRS 规范审核
- 第二阶段：资源质量审核
- 第三阶段：功能完整性审核

---

### Q: 如何验证游戏质量？

**A**: 运行 AI 验证工作流：
```bash
./ai-validation-workflow.sh ${GAME_ID}
```
综合评分 ≥ 80 分为合格。

---

### Q: 音频格式要求？

**A**: ⚠️ **强制 MP3 格式！**
- BGM: 128kbps, 44.1kHz, 立体声
- SFX: 64kbps, 44.1kHz, 单/立体声
- 禁止 WAV/OGG/WEBM

---

## 🎯 成功要素

### ✅ 第一阶段成功标志

- 设计文档清晰完整
- GTRS 配置通过校验
- SQL 脚本可执行成功

---

### ✅ 第二阶段成功标志

- 所有资源按规范生成
- 100% 通过自动化校验
- 目录结构完全正确

---

### ✅ 第三阶段成功标志

- 游戏功能完整实现
- AI 验证评分 ≥ 80
- 所有测试通过

---

## 📊 时间分配建议

```
总周期：10-18 天

第一阶段：2-3 天 (20%)
第二阶段：3-5 天 (30%)
第三阶段：5-10 天 (50%)
```

⚠️ **不要在第一阶段追求完美**，快速迭代更重要！

---

**版本**: v1.0.0  
**最后更新**: 2026-03-27  
**维护者**: Sitech AI Team  
**状态**: ✅ 可立即使用，快速查阅！
