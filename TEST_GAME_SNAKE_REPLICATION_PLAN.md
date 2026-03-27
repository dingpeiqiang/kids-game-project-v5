# test-game 完全复刻贪吃蛇计划

## 📋 任务清单

### 目标
让 test-game **完美复刻**贪吃蛇游戏的所有 UI 页面和交互流程

---

## ✅ 已完成

### 1. StartView（游戏首页）
- ✅ 容器布局：`w-full h-full flex flex-col items-center justify-center px-4 fade-in relative`
- ✅ 动态样式计算：containerStyle, titleStyle, emojiStyle 等
- ✅ 分数卡片：毛玻璃效果 + 精确间距
- ✅ 按钮参数：fontSize: 23.4, padding: 41.6/20.8
- ✅ 响应式支持：使用 useResponsiveUI

**文件位置**：`games/test-game/src/views/StartView.vue`

### 2. GameOverView（游戏结束）
- ✅ 容器布局：`w-full h-full flex flex-col items-center justify-center px-4 fade-in overflow-y-auto`
- ✅ 动态样式计算：与贪吃蛇一致
- ✅ 分数展示：毛玻璃卡片
- ✅ 新纪录提示：金色边框 + 脉冲动画
- ✅ 按钮组：三个按钮垂直排列

**文件位置**：`games/test-game/src/views/GameOverView.vue`

---

## ⏳ 待完成

### 3. DifficultyView（难度选择）- 新增
**参考原型**：`kids-game-house/games/snake/src/views/DifficultyView.vue`

#### 功能需求
- [ ] 显示难度选择器
- [ ] 返回按钮
- [ ] 开始按钮
- [ ] 主题 ID 传递

#### 样式规范
```typescript
const containerStyle = computed(() => ({
  paddingTop: '2%',
  paddingBottom: '2%',
  height: '96%'
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(83.64),  // 40 * 2.09088
  marginBottom: ui.getGap(50.18)     // 24 * 2.09088
}))

const buttonContainerStyle = computed(() => ({
  gap: ui.getGap(25.09),             // 12 * 2.09088
  marginTop: ui.getGap(50.18)        // 24 * 2.09088
}))

// 按钮参数
fontSize: 25.92
paddingLeft: 34.56
paddingRight: 34.56
paddingTop: 17.28
paddingBottom: 17.28
```

#### 实现步骤
1. [ ] 创建 `games/test-game/src/views/DifficultyView.vue`
2. [ ] 复制贪吃蛇的 DifficultyView 代码
3. [ ] 修改游戏名称和逻辑
4. [ ] 添加路由配置

---

### 4. LoadingView（资源加载）- 需确认

**检查项**：
- [ ] test-game 是否需要 LoadingView？
- [ ] 如果有 GTRS 资源检测，需要 LoadingView
- [ ] 如果只是简单游戏，可能不需要

**决策**：如果 test-game 需要像贪吃蛇一样的资源检测流程，则需要创建 LoadingView

---

## 🎯 实施顺序

### Phase 1: 创建 DifficultyView（今天）
1. 复制贪吃蛇的 DifficultyView
2. 适配 test-game 的游戏逻辑
3. 更新路由配置
4. 测试难度选择流程

### Phase 2: 确认 LoadingView 需求
1. 检查 test-game 是否有 GTRS 资源检测
2. 如果需要，创建 LoadingView
3. 集成资源检测流程

### Phase 3: 优化细节
1. 检查所有页面的动画效果
2. 验证响应式布局
3. 对比贪吃蛇，确保一致性

### Phase 4: 测试验证
1. 完整流程测试
2. 视觉对比测试
3. 响应式测试

---

## 📝 文件清单

### 需要创建/修改的文件
```
games/test-game/src/
├── views/
│   ├── StartView.vue          ✅ 已存在
│   ├── GameOverView.vue       ✅ 已存在
│   ├── DifficultyView.vue     ⏳ 待创建
│   └── LoadingView.vue        ❓ 待确认
├── router/
│   └── index.ts               ⏳ 需要添加路由
└── App.vue                    ✅ 已更新居中样式
```

---

## 🔍 验收标准

### 视觉一致性
- [ ] 所有页面完美居中
- [ ] 字体大小与贪吃蛇一致
- [ ] 间距比例与贪吃蛇一致
- [ ] 动画效果流畅

### 功能完整性
- [ ] 首页可以正常进入
- [ ] 可以选择难度
- [ ] 游戏结束后显示结算界面
- [ ] 可以再来一局或返回首页

### 响应式支持
- [ ] 桌面端显示正常
- [ ] 平板端显示正常
- [ ] 移动端显示正常

---

## 🚀 下一步行动

**立即执行**：创建 DifficultyView

**命令**：
```bash
cd games/test-game
# 查看当前路由配置
cat src/router/index.ts
```

**预期结果**：
- 新增难度选择页面
- 完整的游戏流程：首页 → 难度选择 → 游戏 → 结束

---

**备注**：test-game 作为框架的测试项目，应该完整复刻贪吃蛇的所有 UI 页面，确保框架组件的可用性。
