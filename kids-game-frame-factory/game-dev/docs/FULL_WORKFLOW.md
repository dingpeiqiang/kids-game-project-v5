# 🚀 游戏创建完整流程指南

## ⚠️ 关键流程顺序

**必须严格遵守以下顺序**，否则会导致各种错误：

```
生成资源 → 注册游戏 → 启动测试
   ↓           ↓          ↓
 步骤 1      步骤 2      步骤 3
```

## 📋 完整流程（6 个阶段）

### 阶段 1：准备与复制

```bash
# 1.1 完成设计先行阶段 0（GDD 评审通过）
# 1.2 复制参考游戏
cd kids-game-house/games
cp -r ../snake plane-shooter
cd plane-shooter

# 1.3 备份初始状态（推荐）
git add .
git commit -m "Initial copy from snake"
```

### 阶段 2：重命名（最关键）

```bash
# 2.1 运行自动化工具
node ../../.lingma/skills/game-dev/tools/rename-game-helper.js snake plane-shooter

# 2.2 手动修改 package.json
{
  "name": "@kids-game/plane-shooter",
  "displayName": "飞机大战"
}

# 2.3 验证重命名结果
grep -r "snake\|Snake" src/ \
  --exclude-dir=core \
  --exclude-dir=rendering
```

✅ **检查点**：无输出或仅有少量需要手动清理的残留

### 阶段 3：配置与实现

```bash
# 3.1 修改 GTRS.json
{
  "specMeta": {
    "gameId": "plane-shooter",  // 改为你的游戏 ID
    "gameName": "飞机大战"       // 改为你的游戏名
  },
  "themeInfo": {
    "themeName": "plane-shooter-theme"
  }
}

# 3.2 修改 difficulty.json
# 根据你的游戏需求调整难度参数

# 3.3 实现游戏逻辑
# - 编辑 phaser/game.ts（游戏规则）
# - 编辑 logic/、control/、ui/ 目录（业务逻辑）
```

✅ **检查点**：配置文件已更新，游戏逻辑已实现

### 阶段 4：生成资源 ⭐（第一步）

```bash
# 4.1 运行资源生成脚本
node generate-resources.mjs

# 4.2 验证生成的资源
ls dist/
# 应该看到：
# - images/     (图片资源)
# - audio/      (音频资源)
# - themes/     (主题资源)
# - GTRS.json   (资源配置)

# 4.3 检查资源是否正确
cat dist/GTRS.json | head -20
```

⚠️ **重要**：
- 必须先执行这一步！
- 如果报错，检查 GTRS.json 格式是否正确
- 确保 `dist/` 目录生成了所有必需的资源

✅ **检查点**：`dist/` 目录包含完整的资源文件

### 阶段 5：注册游戏 ⭐（第二步）

```bash
# 5.1 修改 register-game.sql
# 更新以下内容：
# - game_id: 'plane-shooter'
# - game_name: '飞机大战'
# - theme_name: 'plane-shooter-theme'
# - resource_path: '/games/plane-shooter/dist/'

# 5.2 执行 SQL 注册
mysql -u root -p kids_game < register-game.sql

# 5.3 验证注册结果
mysql -u root -p kids_game -e "
  SELECT * FROM t_game WHERE game_name = '飞机大战';
  SELECT * FROM t_theme_info WHERE theme_name = 'plane-shooter-theme';
"
```

✅ **检查点**：数据库查询返回了正确的记录

⚠️ **常见错误**：
- ❌ 忘记先生成资源就注册 → GTRS 路径错误
- ❌ SQL 脚本未更新 → 注册信息错误
- ❌ 数据库连接失败 → 检查 MySQL 服务

### 阶段 6：启动测试 ⭐（第三步）

```bash
# 6.1 安装依赖（如果需要）
npm install

# 6.2 启动开发服务器
npm run dev

# 6.3 访问游戏 URL
# http://localhost:5173/games/plane-shooter/

# 6.4 功能测试清单
# - [ ] 页面能正常加载
# - [ ] 控制台无错误（F12 查看）
# - [ ] 游戏可以正常开始
# - [ ] 分数系统正常
# - [ ] 道具效果正常
# - [ ] 难度选择正常
```

✅ **检查点**：游戏能正常运行，无控制台错误

## 🔍 故障排查

### 问题 1：前端找不到游戏配置

**错误信息**：
```
Game config not found for: plane-shooter
```

**原因**：未注册游戏或注册信息错误

**解决**：
```bash
# 1. 检查数据库是否已注册
mysql -u root -p kids_game -e "SELECT * FROM t_game WHERE game_name = '飞机大战';"

# 2. 如果未注册，重新执行注册
mysql -u root -p kids_game < register-game.sql

# 3. 重启开发服务器
npm run dev
```

### 问题 2：GTRS 资源加载失败

**错误信息**：
```
Failed to load GTRS resource: /games/plane-shooter/dist/GTRS.json
```

**原因**：未生成资源或路径错误

**解决**：
```bash
# 1. 检查 dist/ 目录是否存在
ls dist/

# 2. 重新生成资源
node generate-resources.mjs

# 3. 检查 GTRS.json 中的 path 配置
cat src/config/GTRS.json | grep path

# 4. 重启开发服务器
npm run dev
```

### 问题 3：404 Not Found

**错误信息**：访问游戏 URL 时 404

**原因**：路由配置错误或未注册游戏

**解决**：
```bash
# 1. 检查前端路由配置
# 编辑 kids-game-frontend/src/router/index.ts
# 确认有这一行：
# { path: '/plane-shooter', component: () => import('@/views/PlaneShooterGameView.vue') }

# 2. 检查数据库注册
mysql -u root -p kids_game -e "SELECT game_id, game_url FROM t_game;"

# 3. 确认 URL 匹配
# t_game 表中的 game_url 应该与访问的 URL 一致
```

### 问题 4：黑屏或白屏

**现象**：页面加载后黑屏/白屏，控制台无错误

**原因**：Phaser 初始化失败或资源加载失败

**解决**：
```bash
# 1. 检查浏览器控制台（F12）
# 查看详细错误信息

# 2. 检查资源是否完整
ls dist/images/
ls dist/audio/

# 3. 检查 GTRS.json 格式
cat dist/GTRS.json | jq .

# 4. 清除缓存并重启
rm -rf node_modules/.vite
npm run dev
```

## 📊 流程总结图

```
┌─────────────────┐
│  阶段 1: 准备    │
│  复制参考游戏    │
└────────┬────────┘
         ↓
┌─────────────────┐
│  阶段 2: 重命名  │ ← 最关键步骤
│  避免代码污染    │
└────────┬────────┘
         ↓
┌─────────────────┐
│  阶段 3: 配置    │
│  实现游戏逻辑    │
└────────┬────────┘
         ↓
┌─────────────────┐
│  阶段 4: 生成    │ ← ⭐ 第一步
│  node generate  │
└────────┬────────┘
         ↓
┌─────────────────┐
│  阶段 5: 注册    │ ← ⭐ 第二步
│  mysql < sql    │
└────────┬────────┘
         ↓
┌─────────────────┐
│  阶段 6: 测试    │ ← ⭐ 第三步
│  npm run dev    │
└─────────────────┘
```

## ✅ 最终检查清单

在提交代码前，确保所有项目都已完成：

- [ ] ✅ 设计文档已通过评审（阶段 0）
- [ ] ✅ 游戏已彻底重命名（无 Snake/snake 残留）
- [ ] ✅ package.json 已更新
- [ ] ✅ GTRS.json 配置正确
- [ ] ✅ 游戏逻辑已实现
- [ ] ✅ 资源已生成（`dist/` 目录完整）
- [ ] ✅ 游戏已注册到数据库
- [ ] ✅ 前端路由已更新
- [ ] ✅ 开发服务器能正常启动
- [ ] ✅ 游戏功能测试通过
- [ ] ✅ 控制台无错误

## 💡 最佳实践

1. **严格按照顺序执行**
   - 生成资源 → 注册 → 测试
   - 不要跳步或颠倒顺序

2. **每步都验证**
   - 执行完每个阶段都要检查
   - 发现问题立即解决

3. **使用版本控制**
   ```bash
   # 每个阶段完成后提交
   git add .
   git commit -m "Step X: completed XXX"
   ```

4. **记录问题**
   - 遇到的问题记录下来
   - 分享给团队避免重复踩坑

## 📚 相关文档

- **[SKILL.md](../SKILL.md)** - 游戏开发主文档
- **[QUICK_REFERENCE.md](../QUICK_REFERENCE.md)** - 快速参考卡
- **[RENAME_CHECKLIST.md](./RENAME_CHECKLIST.md)** - 重命名检查清单
- **[tools/README.md](../tools/README.md)** - 工具使用说明

---

**记住**：正确的流程顺序是成功的关键！务必遵守 **生成资源 → 注册 → 测试** 的顺序！🚀
