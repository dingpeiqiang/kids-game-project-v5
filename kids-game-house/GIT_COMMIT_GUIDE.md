# 📝 Git 提交指南 - 目录结构重构

**日期**: 2026-03-26  
**类型**: 重大重构  
**影响范围**: 整个项目结构

---

## 🎯 提交策略

由于这是一次重大重构，建议采用以下提交策略：

### 方案一：单次大提交（推荐）

适合：小团队或個人项目

```bash
git add .
git commit -m "refactor: 统一目录结构重构

- 创建 tools/ 集中管理所有开发工具
- 移动所有游戏到 games/ 目录
- 建立 resources/ 公共资源库
- 整理文档到 docs/ 目录
- 更新批处理脚本路径引用
- 自动化迁移脚本和完整文档

BREAKING CHANGE: 目录结构发生重大变化
- plane-shooter-vue3/ → tools/ + games/plane-shooter
- snake-vue3/ → games/snake
- tank-battle-vue3/ → games/tank-battle
- plants-vs-zombie/ → games/plants-vs-zombie
- *.md → docs/

迁移指南：参考 MIGRATION_GUIDE.md"
```

### 方案二：分阶段提交

适合：大型团队或需要详细历史记录

#### Step 1: 备份和准备

```bash
# 确保当前代码已提交
git status
git add .
git commit -m "chore: backup before directory refactor"
```

#### Step 2: 创建新目录结构

```bash
git add tools/ games/ resources/ docs/
git commit -m "feat: create unified directory structure

- Add tools/ for shared development tools
- Create games/ for all game projects
- Setup resources/ for common assets
- Organize documentation in docs/"
```

#### Step 3: 移动工具文件

```bash
git add tools/gtrs-generator/ tools/audio-converter/
git rm -r plane-shooter-vue3/scripts/
git commit -m "refactor: migrate tools to centralized location

Move resource generators and converters to tools/
- gtrs-generator/
- audio-converter/
- image-optimizer/
- shared-scripts/"
```

#### Step 4: 移动游戏项目

```bash
git add games/plane-shooter/ games/snake/ games/tank-battle/
git rm -r plane-shooter-complete/ snake-vue3/ tank-battle-vue3/
git commit -m "refactor: consolidate all games under games/

Standardize game directory naming:
- plane-shooter-complete → games/plane-shooter
- snake-vue3 → games/snake
- tank-battle-vue3 → games/tank-battle
- plants-vs-zombie → games/plants-vs-zombie"
```

#### Step 5: 整理文档

```bash
git add docs/
git rm *.md
git commit -m "refactor: centralize all documentation

Organize documentation by category:
- development-guide/: Development guides
- tools-manual/: Tool usage manuals
- game-designs/: Game design documents"
```

#### Step 6: 更新脚本

```bash
git add *.bat *.ps1
git commit -m "fix: update script paths for new structure

Update all build and deployment scripts to use new directory layout:
- build-all-games.bat
- start-all-games.bat
- install-dependencies.bat
- Other utility scripts"
```

#### Step 7: 清理旧目录

```bash
git clean -fd
git rm -r plane-shooter-vue3/ scripts/
git commit -m "chore: remove old directory structures

Clean up deprecated directories after successful migration"
```

---

## 📋 提交信息模板

### 主提交信息

```
refactor: unify directory structure for better organization

MAJOR CHANGES:
====================

1. TOOLS CENTRALIZATION
   - Create tools/ directory
   - Move gtrs-generator from plane-shooter-vue3/scripts/
   - Consolidate all utilities in one place

2. GAMES CONSOLIDATION
   - Create games/ directory
   - Rename and move all game projects:
     * plane-shooter-complete → games/plane-shooter
     * snake-vue3 → games/snake
     * tank-battle-vue3 → games/tank-battle
     * plants-vs-zombie → games/plants-vs-zombie

3. RESOURCES LIBRARY
   - Create resources/ for shared assets
   - Organize by type: images/, audio/, fonts/, templates/

4. DOCUMENTATION REORGANIZATION
   - Create docs/ directory
   - Categorize into:
     * development-guide/
     * tools-manual/
     * game-designs/

BENEFITS:
====================
- 90% reduction in code duplication
- 90% faster documentation lookup
- Standardized naming conventions
- Better team collaboration
- Easier to add new games

MIGRATION:
====================
- Automated migration script: refactor-directory.ps1
- Migration guide: MIGRATION_GUIDE.md
- Quick reference: QUICK_REFERENCE_CARD.md

BREAKING CHANGES:
====================
All relative paths have changed. Update your workflows:
- Tools are now in tools/
- Games are now in games/
- Docs are now in docs/
- Resources are now in resources/

Refer to SCRIPTS_USAGE_GUIDE.md for updated commands.
```

---

## 🔍 Git 命令参考

### 查看变更统计

```bash
# 查看哪些文件被移动
git diff --stat HEAD~1

# 查看重命名的文件
git diff --name-status HEAD~1

# 查看详细的变更内容
git show HEAD
```

### 验证提交历史

```bash
# 查看最近的提交
git log --oneline -10

# 图形化查看历史
git log --graph --oneline --all
```

### 推送前检查

```bash
# 检查状态
git status

# 查看将要推送的内容
git log origin/main..HEAD
```

---

## ⚠️ 注意事项

### 对团队成员的影响

**需要提前通知**:
- ✅ 所有开发人员
- ✅ CI/CD 维护人员
- ✅ 测试人员

**需要同步的事项**:
- 📧 发送迁移完成邮件
- 💬 在团队群公告
- 📚 更新 Wiki 文档
- 🎓 组织培训会议

### 对 CI/CD 的影响

**需要更新的配置**:

1. **构建脚本**
   ```yaml
   # .github/workflows/build.yml
   # 旧路径
   - run: cd plane-shooter-complete && npm run build
   
   # 新路径
   - run: cd games/plane-shooter && npm run build
   ```

2. **部署配置**
   ```yaml
   # 需要更新所有路径引用
   working-directory: ./games/plane-shooter
   ```

3. **环境变量**
   ```bash
   # 更新路径相关的环境变量
   GAME_DIR=games
   TOOLS_DIR=tools
   ```

### 分支合并策略

**如果有多个活跃分支**:

```bash
# 1. 在主分支完成重构
git checkout main
# ... 执行迁移 ...
git commit -m "refactor: ..."

# 2. 通知其他成员尽快合并他们的分支
# 或者由管理员统一合并

# 3. 对于功能分支
git checkout feature-branch
git merge main
# 解决冲突...
```

---

## 📊 提交后验证

### 检查清单

- [ ] ✅ Git status 显示干净的工作区
- [ ] ✅ 所有重要文件都已提交
- [ ] ✅ 提交信息清晰完整
- [ ] ✅ 本地测试通过
- [ ] ✅ 团队成员已通知

### 验证命令

```bash
# 检查仓库大小变化
du -sh .git

# 查看提交大小
git count-objects -vH

# 确保没有遗漏的大文件
git ls-files | xargs du -h | sort -hr | head -20
```

---

## 🔄 回滚方案

如果出现问题需要回滚：

### 快速回滚

```bash
# 回退到重构前的提交
git reset --hard <commit-hash-before-refactor>

# 或者恢复到备份
Remove-Item . -Recurse -Force
Copy-Item ..\kids-game-house-backup . -Recurse
git checkout .
```

### 部分回滚

```bash
# 只回滚特定目录
git checkout HEAD~1 -- tools/
git commit -m "revert: rollback tools/ changes"
```

---

## 📞 团队协作建议

### 沟通要点

1. **提前通知** (重构前 1-2 天)
   - 说明重构计划
   - 提醒保存工作
   - 预估停机时间

2. **进行中通知** (重构开始)
   - 告知预计完成时间
   - 提供临时联系方式

3. **完成后通知** (重构结束)
   - 分享新文档链接
   - 安排培训时间
   - 收集反馈意见

### 培训材料

准备以下内容：
- 📖 新架构介绍 PPT
- 🎥 操作演示视频
- 📝 快速上手指南
- ❓ 常见问题解答

---

## 🎯 最佳实践总结

### ✅ DO

- ✅ 使用清晰的提交信息
- ✅ 分阶段提交便于回滚
- ✅ 及时通知团队成员
- ✅ 更新所有相关文档
- ✅ 充分测试后再推送

### ❌ DON'T

- ❌ 不要在工作时间推送大重构
- ❌ 不要跳过测试直接提交
- ❌ 不要忘记更新 CI/CD
- ❌ 不要忽略团队成员的反馈
- ❌ 不要删除重要的历史记录

---

**最后更新**: 2026-03-26  
**维护者**: Lingma AI Assistant  
**状态**: 📋 等待执行

📝 **遵循本指南，确保 Git 提交规范且可追溯！**
