# 游戏结算系统功能说明

## 功能概述

实现了太空射击游戏（spaceShooter）结束时的完整结算系统，包括：
- ✅ 计算并显示玩家最终得分
- ✅ 显示详细的游戏统计数据
- ✅ 提交成绩到后端并获取排名
- ✅ 在结果弹窗中展示排名信息

---

## 实现细节

### 1. 游戏统计数据收集（spaceShooter.ts）

在游戏结束时（`doEnd`函数），收集以下统计数据：

```typescript
const gameStats = {
  score: engine.getScore(),      // 最终得分
  maxCombo: this.maxCombo,        // 最大连击数
  totalKills: this.totalKills,    // 总击杀数
  gameTime: Math.floor(this.elapsed), // 游戏时长（秒）
  won: this.gameWon,              // 是否通关
  level: this.getPowerupLevel()   // 达到的等级
}
```

通过 `gameEngine.setGameStats(gameStats)` 传递给 App。

---

### 2. GameEngine 扩展（gameEngine.ts）

添加了游戏统计数据的存储和获取方法：

```typescript
private _gameStats: any = null  // 游戏统计数据

setGameStats(stats: any) {
  this._gameStats = stats
}

getGameStats() {
  return this._gameStats
}
```

---

### 3. 结果显示增强（App.ts）

#### 3.1 showResult 函数修改

在结果弹窗中显示游戏统计数据：

```typescript
const gameStats = gameEngine.getGameStats()

// 显示游戏统计数据（如果有）
const statsEl = document.getElementById('resultStats')
if (statsEl && gameStats) {
  statsEl.style.display = 'block'
  let statsHtml = ''
  if (gameStats.maxCombo > 0) {
    statsHtml += `<div class="stat-item">🔥 最大连击: <b>${gameStats.maxCombo}</b></div>`
  }
  if (gameStats.totalKills > 0) {
    statsHtml += `<div class="stat-item">💀 总击杀: <b>${gameStats.totalKills}</b></div>`
  }
  if (gameStats.gameTime > 0) {
    const minutes = Math.floor(gameStats.gameTime / 60)
    const seconds = gameStats.gameTime % 60
    statsHtml += `<div class="stat-item">⏱️ 游戏时长: <b>${minutes}:${seconds.toString().padStart(2, '0')}</b></div>`
  }
  if (gameStats.level > 0) {
    statsHtml += `<div class="stat-item">📊 等级: <b>${gameStats.level}</b></div>`
  }
  if (gameStats.won) {
    statsHtml += `<div class="stat-item" style="color:#FFD700">🎉 通关成功!</div>`
  }
  statsEl.innerHTML = statsHtml
}
```

#### 3.2 syncScoreAsync 函数修改

将游戏统计数据传递给后端：

```typescript
const gameStats = gameEngine.getGameStats()
const result = await userService.recordGameResult(gameId, score, gameStats)
```

---

### 4. UserService 扩展（userService.ts）

修改了 `recordGameResult` 和 `syncScoreToBackend` 函数签名，支持传递游戏统计数据：

```typescript
async recordGameResult(gameId: string, score: number, gameStats?: any): Promise<{ synced: boolean; rank?: number }>

private async syncScoreToBackend(gameId: string, score: number, gameStats?: any): Promise<{ synced: boolean; rank?: number }>
```

**注意**：当前实现中，gameStats 参数已准备好传递给后端API，但后端的 `submitScore` API 尚未支持接收额外的统计数据。如需完整支持，需要修改后端接口。

---

### 5. HTML 结构（App.ts）

在结果弹窗中添加了统计数据容器：

```html
<!-- 游戏统计数据 -->
<div class="result-stats" id="resultStats" style="display:none; margin:12px 0; padding:12px; background:linear-gradient(135deg,#f8f9fa,#e9ecef); border-radius:12px;"></div>
```

---

### 6. CSS 样式（main.css）

添加了统计数据显示的动画和样式：

```css
.result-stats {
  margin: 12px 0;
  padding: 12px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  animation: statsFadeIn 0.4s ease;
}

@keyframes statsFadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-stats .stat-item {
  font-size: 13px;
  color: #555;
  padding: 4px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-stats .stat-item b {
  color: #333;
  font-weight: 700;
}
```

---

## 数据流程

```
游戏结束 (spaceShooter.doEnd)
    ↓
收集统计数据 (score, maxCombo, totalKills, gameTime, won, level)
    ↓
存储到 GameEngine (gameEngine.setGameStats)
    ↓
调用 onEnd 回调
    ↓
App.showResult 显示结果弹窗
    ↓
从 GameEngine 获取统计数据 (gameEngine.getGameStats)
    ↓
渲染统计数据显示区域 (#resultStats)
    ↓
异步同步分数到后端 (App.syncScoreAsync)
    ↓
UserService.recordGameResult(gameId, score, gameStats)
    ↓
调用后端 API (leaderboardService.submitScore)
    ↓
后端返回排名信息
    ↓
更新结果弹窗中的排名显示 (#resultRank)
```

---

## 显示效果

### 结果弹窗布局

```
┌─────────────────────────┐
│     🎉 (图标)           │
│   恭喜通关! (标题)       │
│   1250 +125💰 (得分)    │
│   历史最高: 1000         │
├─────────────────────────┤
│ 🔥 最大连击: 15          │
│ 💀 总击杀: 42            │
│ ⏱️ 游戏时长: 3:25        │
│ 📊 等级: 8               │
│ 🎉 通关成功!             │
├─────────────────────────┤
│     🥇                  │
│  当前排名 1 位           │
├─────────────────────────┤
│ ⚡暴击 x3  🔥连击 x15   │
├─────────────────────────┤
│ [返回大厅] [再来一局]    │
└─────────────────────────┘
```

---

## 后端 API 集成

### 当前状态

✅ **已完成**：
- 前端数据结构准备完成
- 调用 `leaderboardService.submitScore(gameId, score, accessToken)`
- 接收并显示后端返回的排名信息

⚠️ **待完善**（可选）：
- 后端 `submitScore` API 目前只接收 `gameId` 和 `score`
- 如需记录详细统计数据（maxCombo、totalKills等），需要：
  1. 修改后端 `SubmitScoreRequest` DTO，添加 `details` 字段
  2. 修改 `LeaderboardController.submitScore` 方法
  3. 将额外数据存储到 `leaderboard_data.extra_data` (JSON字段)

### 后端 API 端点

```
POST /api/leaderboard/submit
Request:
{
  "gameId": 123,
  "score": 1250,
  "accessToken": "eyJhbGc..."
}

Response:
{
  "code": 200,
  "msg": "success",
  "data": {
    "success": true,
    "rank": 5,
    "bestScore": 1250,
    "msg": "分数已更新"
  }
}
```

---

## 测试建议

### 手动测试步骤

1. **启动游戏**
   ```bash
   cd kids-game-house/games/simple-game
   npm run dev
   ```

2. **登录账号**
   - 确保已登录（游客模式不会同步排名）

3. **进行游戏**
   - 玩太空射击游戏（spaceShooter）
   - 尽量获得高分、连击和击杀

4. **查看结果**
   - 游戏结束后检查结果弹窗
   - 验证以下内容是否正确显示：
     - ✅ 最终得分
     - ✅ 历史最高分对比
     - ✅ 游戏统计数据（连击、击杀、时长、等级）
     - ✅ 排名信息（如果有后端连接）

5. **检查控制台日志**
   ```
   [App] syncScoreAsync - 检查登录状态
   [App] 调用 userService.recordGameResult...
   [UserService] recordGameResult 被调用
   [UserService] 开始同步分数到后端
   [UserService] 调用 submitScore API...
   [UserService] submitScore 返回结果
   [UserService] 分数同步成功，排名: 5
   ```

---

## 兼容性说明

- ✅ 其他游戏不受影响（gameStats 为 null 时不显示统计区域）
- ✅ 游客模式正常工作（仅本地保存，不同步排名）
- ✅ 后端不可用时静默失败（不影响游戏体验）

---

## 未来扩展

### 1. 支持更多游戏类型

可以在其他游戏中添加类似的统计数据收集：

```typescript
// 例如：消除类游戏
const gameStats = {
  score: engine.getScore(),
  maxCombo: this.maxCombo,
  totalEliminates: this.totalEliminates,
  specialCombos: this.specialCombos,
  gameTime: Math.floor(this.elapsed)
}
```

### 2. 后端详细统计存储

修改后端 API 以接收和存储详细统计数据：

```java
// SubmitScoreRequest.java
public class SubmitScoreRequest {
    private Long gameId;
    private Integer score;
    private String accessToken;
    private Map<String, Object> details;  // 新增：详细统计数据
}
```

### 3. 排行榜增强

- 显示多个维度的排名（最高连击、最快通关等）
- 添加好友排行榜
- 添加成就系统关联

---

## 相关文件清单

| 文件路径 | 修改内容 |
|---------|---------|
| `spaceShooter.ts` | 添加 doEnd 中的统计数据收集 |
| `gameEngine.ts` | 添加 setGameStats/getGameStats 方法 |
| `App.ts` | 修改 showResult 和 syncScoreAsync，添加 HTML 结构 |
| `userService.ts` | 修改 recordGameResult 和 syncScoreToBackend 签名 |
| `main.css` | 添加 result-stats 样式 |

---

## 总结

✅ **核心功能已完成**：
- 游戏结束时自动计算并显示最终得分
- 显示详细的游戏统计数据（连击、击杀、时长、等级）
- 异步提交成绩到后端并获取排名
- 在结果弹窗中实时更新排名显示

✅ **用户体验优化**：
- 先显示结果弹窗，再异步同步分数（避免网络阻塞）
- 精美的动画效果和渐变背景
- 清晰的统计信息展示
- 后端不可用时静默失败，不影响游戏体验

🎮 **现在玩家可以清楚地看到自己的最终得分和排名！**
