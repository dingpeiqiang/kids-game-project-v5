# 游戏中文化说明 / Game Chinese Localization Guide

## 📖 概述

游戏已完成基础中文化，包括：
- ✅ UI 界面标签（物品栏、角色、任务等）
- ✅ 职业名称（野蛮人、法师、牧师）
- ✅ 角色选择界面描述
- ✅ 技能教程对话
- ✅ 属性和状态文本
- ✅ **智能字体系统** - 自动检测中文并使用系统字体显示

## 🎮 已翻译内容

### 1. UI 界面
- **物品栏** (Inventory)
- **角色** (Character)
- **任务** (Quests)
- **装备** (Equipment)

### 2. 职业名称
- **野蛮人** (Barbarian)
- **法师** (Mage)
- **牧师** (Priest)

### 3. 技能名称
- **冲锋** (Rush)
- **致残** (Hobble)
- **穿刺** (Gore)
- **精准** (Precision)
- **战吼** (Shout)
- **冰霜炸弹** (Bomb)
- **寒冰箭** (Frostbolt)
- **专注** (Focus)
- **魔杖** (Wand)

### 4. 属性
- **力量** (Strength)
- **耐力** (Stamina)
- **敏捷** (Agility)
- **智力** (Intellect)
- **精神** (Spirit)
- **暴击** (Critical)
- **闪避** (Dodge)

## 🛠️ 技术实现

### 文件结构
```
src/scripts/
├── localization/
│   ├── i18n.js          # 国际化核心工具
│   └── zh-CN.js         # 中文翻译文件
└── utilities/
    └── TextHelper.js    # 智能文本渲染工具（支持中英文）
```

### 智能字体系统

游戏使用**智能文本渲染系统**，自动检测文本内容并选择合适的字体：

- **英文文本** → 使用位图字体（font.png），保持游戏风格
- **中文文本** → 使用系统字体（微软雅黑/黑体），确保正确显示
- **混合文本** → 自动切换到系统字体

```javascript
import { createText } from '../utilities/TextHelper';

// 自动检测并选择合适的字体
const text = createText(scene, x, y, 'Hello 你好', 16);
// 因为包含中文，会自动使用系统字体
```

### 使用方法

#### 1. 在代码中使用翻译
```javascript
import { t } from '../localization/i18n';

// 简单翻译
const text = t('ui.inventory');  // 返回 "物品栏"

// 带参数的翻译
const message = t('messages.levelUp', { level: 5 });
```

#### 2. 添加新的翻译
在 `zh-CN.js` 中添加新的键值对：
```javascript
export const zhCN = {
  // 你的新翻译
  myNewKey: '我的新文本',
  
  // 嵌套结构
  category: {
    item: '项目',
  }
};
```

#### 3. 切换语言（未来扩展）
```javascript
import { setLanguage } from '../localization/i18n';

// 切换到英文（需要先添加英文翻译文件）
setLanguage('en-US');
```

## 📝 待翻译内容

以下内容的翻译可以逐步完善：

### 高优先级
- [ ] 物品名称和描述
- [ ] 任务名称和描述
- [ ] NPC 对话
- [ ] 战斗日志消息

### 中优先级
- [ ] 装备属性说明
- [ ] 技能详细说明
- [ ] 成就系统文本
- [ ] 设置界面

### 低优先级
- [ ] 帮助文档
- [ ] 教程提示
- [ ] 错误消息

## 🔧 扩展多语言支持

要添加其他语言（如英文），只需：

1. 创建新的翻译文件 `en-US.js`
2. 在 `i18n.js` 中注册：
```javascript
import enUS from './en-US';

const translations = {
  'zh-CN': zhCN,
  'en-US': enUS,  // 添加英文
};
```

3. 提供语言切换功能

## 💡 最佳实践

1. **使用翻译键而非硬编码文本**
   ```javascript
   // ❌ 不好
   const text = '物品栏';
   
   // ✅ 好
   const text = t('ui.inventory');
   ```

2. **保持翻译文件结构清晰**
   - 按功能模块分组
   - 使用有意义的键名
   - 添加注释说明上下文

3. **处理动态内容**
   ```javascript
   // 使用占位符
   t('messages.greeting', { name: '玩家' })
   // 翻译文件中: "你好，{name}！"
   ```

## 🎯 下一步计划

1. **完善现有翻译**
   - 补充缺失的技能和物品翻译
   - 优化翻译质量，确保符合游戏风格

2. **添加语言切换功能**
   - 在设置界面添加语言选项
   - 保存用户的语言偏好

3. **社区贡献**
   - 允许玩家提交翻译改进
   - 建立翻译审核流程

## 📞 反馈

如果发现翻译问题或有改进建议，请：
1. 记录具体的文本位置
2. 提供当前翻译和建议翻译
3. 说明改进原因

---

**最后更新**: 2026-04-05
**版本**: v1.0.0
