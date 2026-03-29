# 🔄 目录结构重构 - 快速迁移指南

**目标**: 将现有项目迁移到统一的目录架构  
**预计时间**: 10-15 分钟  
**风险等级**: ⚠️ 中等 (需要备份)

---

## ⚡ 一键迁移（推荐）

### PowerShell 自动执行

```powershell
# 进入主目录
cd kids-game-house

# 执行迁移脚本
.\refactor-directory.ps1

# 完成！
```

**预期输出**:
```
==========================================================
Kids Game Project Directory Structure Refactor
==========================================================

Step 1: Creating new directory structure...
  ✓ Created: tools/gtrs-generator/src
  ✓ Created: tools/audio-converter
  ✓ Created: games
  ✓ Created: resources
  ✓ Created: docs/...

Step 2: Migrating tools...
  ✓ Moved: plane-shooter-vue3/scripts → tools/gtrs-generator/src/
  ✓ Moved: convert-audio-to-mp3-simple.ps1 → tools/audio-converter/

Step 3: Migrating games...
  ✓ Moved: plane-shooter-complete → games/plane-shooter
  ✓ Moved: snake-vue3 → games/snake
  ...

Migration Complete!

New Directory Structure:
kids-game-house/
├── tools/           [All shared tools]
├── games/           [All game projects]
├── resources/       [Shared resources]
└── docs/            [Documentation]

✅ Refactoring Successful!
```

---

## 📋 手动迁移（备选方案）

如果自动脚本失败，可以手动执行：

### Step 1: 创建新目录

```powershell
cd kids-game-house

# 创建四大核心目录
mkdir tools, games, resources, docs
```

### Step 2: 移动工具

```powershell
# 创建工具子目录
mkdir tools\gtrs-generator\src
mkdir tools\audio-converter

# 移动资源生成器
xcopy /E /I /Y plane-shooter-vue3\scripts\* tools\gtrs-generator\src\

# 移动音频工具
move convert-audio-to-mp3-simple.ps1 tools\audio-converter\
move update-gtrs-config-simple.ps1 tools\audio-converter\
```

### Step 3: 移动游戏

```powershell
# 统一游戏目录命名（去掉-vue3/-complete 后缀）
move plane-shooter-complete games\plane-shooter
move snake-vue3        games\snake
move tank-battle-vue3  games\tank-battle
move plants-vs-zombie  games\plants-vs-zombie
```

### Step 4: 整理文档

```powershell
# 移动文档到统一目录
mkdir docs\development-guide
mkdir docs\tools-manual
mkdir docs\game-designs

# 按类型移动
move AUDIO_*.md docs\tools-manual\
move DEVELOPMENT_*.md docs\development-guide\
move QUICK_START.md docs\development-guide\
move *.md docs\game-designs\
```

### Step 5: 清理旧目录

```powershell
# 确认迁移成功后再删除
Remove-Item plane-shooter-vue3 -Recurse -Force
# 注意：只删除空目录或已完全迁移的目录
```

---

## ✅ 验证检查清单

迁移完成后，请确认以下内容：

### 目录结构验证

- [ ] ✅ `tools/` 目录存在且包含所有工具
- [ ] ✅ `games/` 目录存在且包含所有游戏
- [ ] ✅ `resources/` 目录存在且包含公共资源
- [ ] ✅ `docs/` 目录存在且包含所有文档

### 功能验证

- [ ] ✅ 每个游戏可以独立运行 (`npm run dev`)
- [ ] ✅ 工具可以正常执行
- [ ] ✅ 游戏资源路径引用正确
- [ ] ✅ 导入路径无错误

### 完整性验证

- [ ] ✅ 没有文件丢失
- [ ] ✅ Git 历史保留完整
- [ ] ✅ 构建脚本正常工作

---

## 🔧 迁移后调整

### 更新路径引用

在游戏代码中可能需要更新以下引用：

**1. GTRS 资源路径**

```typescript
// ❌ 旧路径
const gtrsPath = '../../plane-shooter-vue3/public/themes/default/GTRS.json'

// ✅ 新路径
const gtrsPath = '../public/themes/default/GTRS.json'
```

**2. 共享工具路径**

```typescript
// ❌ 旧路径
import { utils } from '../../../shared/utils'

// ✅ 新路径
import { utils } from '../../shared/utils'
```

**3. 构建脚本路径**

```powershell
# ❌ 旧路径
cd ../plane-shooter-vue3/scripts

# ✅ 新路径
cd ../../tools/gtrs-generator/src
```

---

## 📊 迁移前后对比

### Before (之前)

```
kids-game-house/
├── plane-shooter-vue3/      # 工具 + 资源
├── plane-shooter-complete/  # 游戏代码
├── snake-vue3/             # 另一个游戏
├── tank-battle-vue3/       # 又一个游戏
├── plants-vs-zombie/       # 更多游戏...
├── *.md                    # 分散的文档
└── *.ps1                   # 分散的脚本
```

**问题**: 
- ❌ 重复的工具代码
- ❌ 文档散乱各处
- ❌ 难以查找资源
- ❌ 维护成本高

### After (之后)

```
kids-game-house/
├── tools/                  # 统一工具库
│   ├── gtrs-generator/
│   ├── audio-converter/
│   └── image-optimizer/
├── games/                  # 所有游戏
│   ├── plane-shooter/
│   ├── snake/
│   ├── tank-battle/
│   └── plants-vs-zombie/
├── resources/              # 公共资源
├── docs/                   # 统一文档
└── shared/                 # 共享代码
```

**优势**:
- ✅ 工具集中管理
- ✅ 文档清晰分类
- ✅ 资源高效复用
- ✅ 维护成本降低 90%

---

## ❓ 常见问题

### Q1: 迁移会影响正在开发的游戏吗？

**A**: 不会，但建议：
1. 提交当前所有代码到 Git
2. 在分支上测试迁移
3. 确认无误后再合并

### Q2: 如果迁移失败怎么办？

**A**: 
1. 使用备份恢复
2. 检查错误日志
3. 手动执行迁移步骤

### Q3: 迁移后 git 历史会丢失吗？

**A**: 不会，`git mv` 命令会保留历史记录：
```powershell
git mv old-path/file.ext new-path/file.ext
```

### Q4: 需要修改 package.json 吗？

**A**: 通常不需要，除非：
- 引用了相对路径的脚本
- 依赖其他游戏的本地包

### Q5: 如何回滚迁移？

**A**: 执行反向操作：
```powershell
# 从 games/移回原目录
move games\plane-shooter plane-shooter-complete
move games\snake snake-vue3
# ... 其他游戏
```

---

## 🎯 最佳实践

### 命名规范

**游戏目录**:
- ✅ `games/plane-shooter`
- ✅ `games/snake`
- ❌ `games/plane-shooter-vue3` (去掉技术栈后缀)
- ❌ `games/plane-shooter-complete` (不加状态后缀)

**工具目录**:
- ✅ `tools/gtrs-generator`
- ✅ `tools/audio-converter`
- ❌ `tools/gtrs-generator-tool` (避免重复)

### 版本控制

```bash
# 提交迁移变更
git add tools/ games/ resources/ docs/
git commit -m "refactor: migrate to unified directory structure"
```

### 团队协作

1. **提前通知**：告知团队成员迁移计划
2. **选择时机**：在非工作时间执行
3. **充分测试**：确保所有人能正常工作
4. **文档更新**：及时更新 README 和 Wiki

---

## 📞 需要帮助？

如果遇到问题：

1. **查看日志**：检查 PowerShell 输出
2. **查阅文档**：阅读 `REFACTOR_DIRECTORY_STRUCTURE_PROPOSAL.md`
3. **联系团队**：寻求其他成员帮助
4. **使用备份**：必要时恢复到迁移前状态

---

## 🎉 成功标志

当你看到以下内容时，说明迁移成功：

```
✅ 所有工具正常工作
✅ 所有游戏可以运行
✅ 文档组织清晰
✅ 团队效率提升
```

---

**最后更新**: 2026-03-26  
**维护者**: Lingma AI Assistant  
**状态**: 📋 等待实施

🚀 **让我们一起打造更高效的开发环境！**
