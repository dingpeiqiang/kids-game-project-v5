# 儿童友好 UI 组件设计

## KidFriendlyModal 组件

## 设计理念

### 核心设计原则

**健康**
- 不使用过于鲜艳刺眼的颜色
- 柔和的渐变配色，保护儿童视力
- 圆润的边角，避免尖锐感

**快乐**
- 轻盈的弹跳动画
- 可爱的云朵和星星装饰
- 愉悦的交互反馈

**柔和**
- 超大圆角（48px）
- 温暖的粉色系主调
- 流畅的过渡动画

## 设计亮点

### 1. 柔和配色方案

```
主色调：
- 粉色系：#FFB6C1, #FF69B4, #FFF0F5
- 蓝色系：#87CEEB, #ADD8E6, #F0F8FF
- 绿色系：#98FB98, #90EE90
- 黄色系：#FFE4B5, #FFD700

彩虹边框渐变：
45deg线性渐变，包含粉、橙、黄、绿、蓝、紫
```

### 2. 装饰元素

**云朵装饰**
- 三个浮动的云朵（顶部和底部）
- 轻柔的浮动动画（4秒循环）
- 淡雅的透明度（0.6-0.9）

**星星装饰**
- 四颗闪烁的星星（四角分布）
- 旋转闪烁动画（3秒循环）

### 3. 动画系统

**弹窗入场动画**
- 弹跳缩放：从0.3倍放大到1.05倍再回到1倍
- 下落效果：从上方-100px下落
- 时长：0.6秒
- 缓动函数：`cubic-bezier(0.68, -0.55, 0.265, 1.55)`

## 组件类型

提供7种预设类型：

| 类型 | 图标 | 边框颜色 | 适用场景 |
|------|------|---------|---------|
| default | 💡 | 彩虹渐变 | 默认提示 |
| success | 🎉 | 绿色渐变 | 成功反馈 |
| warning | ⚠️ | 橙黄渐变 | 警告提醒 |
| danger | 😱 | 粉红渐变 | 危险操作 |
| info | ℹ️ | 天蓝渐变 | 信息提示 |
| question | ❓ | 彩虹渐变 | 询问确认 |
| celebrate | 🎊 | 紫色渐变 | 庆祝奖励 |

## 使用方法

### 基础用法

```vue
<template>
  <KidFriendlyModal
    v-model="showModal"
    title="温馨提示"
    content="这是一个可爱的弹窗"
    type="success"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>

<script setup>
import { ref } from 'vue'
import { KidFriendlyModal } from '@/components/ui'

const showModal = ref(false)

function handleConfirm() {
  showModal.value = false
}
</script>
```

### 不同尺寸

```vue
<!-- 小尺寸 (max-width: 380px) -->
<KidFriendlyModal v-model="show" size="sm" />

<!-- 中等尺寸 (默认) -->
<KidFriendlyModal v-model="show" size="md" />

<!-- 大尺寸 (max-width: 720px) -->
<KidFriendlyModal v-model="show" size="lg" />
```

### 不同类型

```vue
<!-- 成功提示 -->
<KidFriendlyModal
  v-model="show"
  type="success"
  title="太棒了！"
  content="你成功完成了任务！"
/>

<!-- 警告提示 -->
<KidFriendlyModal
  v-model="show"
  type="warning"
  title="注意啦！"
  content="体力值快用完了"
/>
```

## API 文档

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| v-model | Boolean | false | 控制弹窗显示 |
| title | String | - | 弹窗标题 |
| content | String | - | 弹窗内容 |
| icon | String | - | 自定义图标emoji |
| type | String | 'default' | 弹窗类型 |
| size | String | 'md' | 弹窗尺寸：sm/md/lg/xl |
| closable | Boolean | true | 是否显示关闭按钮 |
| showButtons | Boolean | true | 是否显示按钮 |
| showCancel | Boolean | true | 是否显示取消按钮 |
| showConfirm | Boolean | true | 是否显示确认按钮 |
| cancelText | String | '取消' | 取消按钮文字 |
| confirmText | String | '确定' | 确认按钮文字 |
| confirmType | String | 'primary' | 确认按钮类型 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| update:modelValue | (value: boolean) | 弹窗显示状态变化 |
| confirm | - | 点击确认按钮 |
| cancel | - | 点击取消按钮 |
| close | - | 点击关闭按钮 |

### Slots

| 插槽 | 说明 |
|------|------|
| default | 弹窗主体内容 |

## 最佳实践

### 1. 选择合适的类型

```vue
<!-- 好的做法：根据场景选择类型 -->
<KidFriendlyModal type="success" title="恭喜" content="任务完成" />
<KidFriendlyModal type="warning" title="提醒" content="体力不足" />
```

### 2. 控制按钮显示

```vue
<!-- 纯提示信息，不需要取消按钮 -->
<KidFriendlyModal
  type="info"
  title="提示"
  content="这是一条信息"
  :show-cancel="false"
/>
```

### 3. 响应式适配

组件已内置响应式设计：
- **桌面端（>768px）**：完整显示装饰和动画
- **平板端（480-768px）**：简化装饰
- **移动端（<480px）**：隐藏装饰元素

## 自定义主题

```scss
:root {
  --modal-rainbow-1: #FFB6C1;
  --modal-rainbow-2: #FFE4B5;
  --modal-rainbow-3: #98FB98;
  --modal-bg-light: rgba(255, 255, 255, 0.98);
  --modal-primary: #FF69B4;
}
```

---

**版本**: v1.0.0
**最后更新**: 2026-03-20
