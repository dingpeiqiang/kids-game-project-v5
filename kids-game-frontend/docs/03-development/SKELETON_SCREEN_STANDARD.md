# 骨架屏（Skeleton Screen）使用规范

**版本**: v1.0  
**生效日期**: 2026-03-23  
**适用范围**: 所有前端页面开发

---

## 📋 目录

1. [概述](#概述)
2. [使用场景](#使用场景)
3. [组件类型](#组件类型)
4. [实现规范](#实现规范)
5. [代码示例](#代码示例)
6. [最佳实践](#最佳实践)
7. [性能要求](#性能要求)
8. [验收标准](#验收标准)

---

## 概述

### **定义**
骨架屏（Skeleton Screen）是一种在数据加载期间显示的**页面结构占位图**，用于提升用户体验和感知加载速度。

### **设计原则**
- ✅ **提前展示布局** - 用户可预见内容结构
- ✅ **减少感知等待** - 比传统 Loading 感觉更快
- ✅ **保持视觉一致** - 与真实内容布局一致
- ✅ **渐进式加载** - 平滑过渡到真实内容

---

## 使用场景

### **✅ 必须使用的场景**

#### **1. 列表数据加载**
```vue
<!-- 用户列表、关系列表、配置列表等 -->
<TableSkeleton :rows="10" />
```

**适用场景**:
- 用户管理列表
- 监护关系列表
- 管控配置列表
- 游戏列表
- 主题列表

#### **2. 卡片内容加载**
```vue
<!-- 统计卡片、信息卡片等 -->
<CardSkeleton :count="4" />
```

**适用场景**:
- 统计报表卡片
- 用户信息卡片
- 游戏封面卡片
- 主题预览卡片

#### **3. 详情页加载**
```vue
<!-- 用户详情、游戏详情等 -->
<Skeleton type="text" />
```

**适用场景**:
- 用户详情对话框
- 游戏详情页面
- 配置详情页面

---

### **❌ 不建议使用的场景**

#### **1. 简单操作（< 0.5 秒）**
```vue
<!-- ❌ 不推荐：按钮点击后立即完成的操作 -->
<el-button :loading="loading">提交</el-button>

<!-- ✅ 推荐：使用按钮自带 loading -->
```

#### **2. 全屏加载**
```vue
<!-- ❌ 不推荐：整个应用初始化 -->
<Skeleton />

<!-- ✅ 推荐：使用品牌 Logo + Loading -->
<div class="app-loading">
  <img src="/logo.png" />
  <p>正在加载...</p>
</div>
```

#### **3. 表单提交**
```vue
<!-- ❌ 不推荐：表单区域显示骨架屏 -->
<Skeleton />

<!-- ✅ 推荐：禁用按钮 + Loading 状态 -->
<el-button :loading="submitting" type="primary">
  提交
</el-button>
```

---

## 组件类型

### **1. TableSkeleton - 表格骨架屏**

#### **使用场景**
- 用户列表
- 关系列表
- 配置列表
- 任何表格数据

#### **API 参数**
```typescript
interface TableSkeletonProps {
  rows?: number        // 行数，默认 5
  columns?: number     // 列数，默认 3
  height?: string      // 每行高度，默认 '40px'
  animated?: boolean   // 是否动画，默认 true
}
```

#### **使用示例**
```vue
<template>
  <div>
    <!-- 加载中 -->
    <TableSkeleton 
      v-if="loading && userList.length === 0"
      :rows="10"
      :columns="5"
    />
    
    <!-- 加载完成 -->
    <el-table v-else :data="userList">
      <!-- 表格内容 -->
    </el-table>
    
    <!-- 空状态 -->
    <EmptyState 
      v-if="!loading && userList.length === 0"
      description="暂无用户数据"
    />
  </div>
</template>

<script setup>
import { TableSkeleton } from '@/utils/skeleton'
import EmptyState from '@/components/EmptyState.vue'

const loading = ref(true)
const userList = ref([])
</script>
```

---

### **2. CardSkeleton - 卡片骨架屏**

#### **使用场景**
- 统计卡片
- 信息卡片
- 商品卡片
- 任何卡片布局

#### **API 参数**
```typescript
interface CardSkeletonProps {
  count?: number       // 卡片数量，默认 4
  height?: string      // 卡片高度，默认 '180px'
  showImage?: boolean  // 是否显示图片占位，默认 true
  animated?: boolean   // 是否动画，默认 true
}
```

#### **使用示例**
```vue
<template>
  <el-row :gutter="20">
    <!-- 加载中 -->
    <el-col 
      v-for="i in 4" 
      :key="i" 
      :span="6"
    >
      <CardSkeleton 
        v-if="loading"
        height="200px"
        :show-image="true"
      />
      
      <!-- 加载完成 -->
      <StatCard v-else :data="stats[i]" />
    </el-col>
  </el-row>
</template>

<script setup>
import { CardSkeleton } from '@/utils/skeleton'

const loading = ref(true)
const stats = ref([])
</script>
```

---

### **3. TextSkeleton - 文本骨架屏**

#### **使用场景**
- 文章标题
- 段落文本
- 描述信息
- 任何文本内容

#### **API 参数**
```typescript
interface TextSkeletonProps {
  lines?: number       // 行数，默认 3
  width?: string[]     // 每行宽度百分比，默认 ['100%', '100%', '60%']
  animated?: boolean   // 是否动画，默认 true
}
```

#### **使用示例**
```vue
<template>
  <div class="article-detail">
    <!-- 加载中 -->
    <TextSkeleton 
      v-if="loading"
      :lines="5"
      :width="['80%', '100%', '100%', '80%', '60%']"
    />
    
    <!-- 加载完成 -->
    <article v-else>
      <h1>{{ article.title }}</h1>
      <p>{{ article.content }}</p>
    </article>
  </div>
</template>
```

---

### **4. ImageSkeleton - 图片骨架屏**

#### **使用场景**
- 头像加载
- 封面图片
- 商品图片
- 任何图片资源

#### **API 参数**
```typescript
interface ImageSkeletonProps {
  width?: string       // 宽度，默认 '200px'
  height?: string      // 高度，默认 '200px'
  shape?: 'circle' | 'square' | 'round' // 形状，默认 'square'
  animated?: boolean   // 是否动画，默认 true
}
```

#### **使用示例**
```vue
<template>
  <div class="user-profile">
    <!-- 头像加载中 -->
    <ImageSkeleton 
      v-if="!avatarLoaded"
      width="100px"
      height="100px"
      shape="circle"
    />
    
    <!-- 头像加载完成 -->
    <el-avatar 
      v-else 
      :src="user.avatar"
      :size="100"
      shape="circle"
    />
  </div>
</template>
```

---

## 实现规范

### **1. 组件导入规范**

```typescript
// ✅ 推荐：统一从 skeleton.ts 导入
import { 
  TableSkeleton, 
  CardSkeleton, 
  TextSkeleton,
  ImageSkeleton 
} from '@/utils/skeleton'

// ❌ 不推荐：分散导入或重复定义
```

### **2. 条件渲染规范**

```vue
<!-- ✅ 推荐：清晰的三段式结构 -->
<template>
  <div>
    <!-- 加载中 -->
    <TableSkeleton v-if="loading && data.length === 0" />
    
    <!-- 有数据 -->
    <el-table v-else-if="data.length > 0" :data="data">
      <!-- 表格列 -->
    </el-table>
    
    <!-- 空状态 -->
    <EmptyState v-else description="暂无数据" />
  </div>
</template>

<!-- ❌ 不推荐：逻辑混乱 -->
<template>
  <div>
    <TableSkeleton v-if="loading" />
    <el-table v-if="data.length > 0" :data="data" />
    <EmptyState v-if="data.length === 0" />
  </div>
</template>
```

### **3. 样式命名规范**

```scss
// ✅ 推荐：使用 BEM 命名
.skeleton-table {
  &__row {
    margin-bottom: 10px;
  }
  
  &__cell {
    height: 40px;
  }
}

// ❌ 不推荐：随意命名
.skeleton {
  .row {
  }
  .cell {
  }
}
```

---

## 代码示例

### **完整页面示例：UserManagement.vue**

```vue
<template>
  <div class="user-management">
    <!-- 搜索区保持不变 -->
    <el-card class="search-card">
      <!-- 搜索表单 -->
    </el-card>

    <!-- 列表区域 -->
    <el-card class="table-card">
      <!-- 加载中：显示骨架屏 -->
      <TableSkeleton 
        v-if="loading && userList.length === 0"
        :rows="10"
        :columns="6"
      />
      
      <!-- 有数据：显示表格 -->
      <el-table 
        v-else-if="userList.length > 0"
        v-loading="loading"
        :data="userList"
        border
        stripe
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="userId" label="用户 ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column label="头像" width="100">
          <template #default="{ row }">
            <el-avatar 
              v-if="row.avatar" 
              :src="row.avatar" 
              :size="40"
              shape="circle"
            />
            <el-avatar v-else :size="40" shape="circle">
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空状态：显示空状态组件 -->
      <EmptyState
        v-else
        description="暂无用户数据"
        height="400px"
        show-refresh
        @refresh="fetchUserList"
      />
      
      <!-- 分页保持不变 -->
      <el-pagination
        v-model:current-page="pagination.page"
        :total="pagination.total"
        layout="total, prev, pager, next"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { TableSkeleton } from '@/utils/skeleton'
import EmptyState from '@/components/EmptyState.vue'
import { getUserList } from '@/api/user'

const loading = ref(false)
const userList = ref([])
const pagination = ref({ page: 1, total: 0 })

const fetchUserList = async () => {
  loading.value = true
  try {
    const res = await getUserList({ 
      page: pagination.value.page, 
      size: 10 
    })
    userList.value = res.list || []
    pagination.value.total = res.total || 0
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUserList()
})
</script>

<style scoped lang="scss">
.user-management {
  padding: 20px;
}
</style>
```

---

## 最佳实践

### **1. 加载状态管理**

```typescript
// ✅ 推荐：统一的状态管理
const state = reactive({
  loading: false,
  data: [],
  error: null
})

const fetchData = async () => {
  state.loading = true
  state.error = null
  
  try {
    const res = await api.getData()
    state.data = res.data
  } catch (err) {
    state.error = err.message
  } finally {
    state.loading = false
  }
}

// ❌ 不推荐：分散的状态
let loading = false
let data = []
let error = null
```

### **2. 错误处理**

```typescript
// ✅ 推荐：完整的错误处理
const fetchData = async () => {
  loading.value = true
  
  try {
    const res = await api.getData()
    data.value = res.data
  } catch (error) {
    // 记录错误日志
    console.error('[API Error]:', error)
    
    // 显示错误消息
    errorHandler.handleHttpError(error)
    
    // 保持空数组，避免渲染错误
    data.value = []
  } finally {
    loading.value = false
  }
}

// ❌ 不推荐：忽略错误处理
const fetchData = async () => {
  const res = await api.getData() // 可能抛出异常
  data.value = res.data
  loading.value = false
}
```

### **3. 性能优化**

```vue
<!-- ✅ 推荐：使用 key 避免重复渲染 -->
<TableSkeleton 
  v-if="loading"
  :key="'skeleton-' + loading"
/>

<!-- ❌ 不推荐：可能导致不必要的重渲染 -->
<TableSkeleton v-if="loading" />
```

---

## 性能要求

### **1. 渲染性能**

- ✅ 骨架屏渲染时间 < 100ms
- ✅ 骨架屏 DOM 节点数 < 真实内容的 50%
- ✅ 动画帧率 ≥ 60fps

### **2. 内存占用**

- ✅ 单个骨架屏组件内存 < 1MB
- ✅ 无内存泄漏
- ✅ 及时清理事件监听

### **3. 网络性能**

- ✅ 骨架屏代码体积 < 5KB (gzip)
- ✅ 按需加载，不阻塞首屏
- ✅ 支持 Tree Shaking

---

## 验收标准

### **功能验收**

- [ ] 骨架屏在 loading=true 时正确显示
- [ ] 骨架屏在 loading=false 时正确隐藏
- [ ] 真实数据加载完成后平滑过渡
- [ ] 空状态正确显示

### **视觉验收**

- [ ] 骨架屏布局与真实内容一致
- [ ] 动画流畅，无卡顿
- [ ] 颜色符合设计规范
- [ ] 响应式适配正常

### **性能验收**

- [ ] 骨架屏渲染时间 < 100ms
- [ ] 无明显内存占用
- [ ] 不影响页面其他交互
- [ ] 移动端性能正常

### **兼容性验收**

- [ ] Chrome 90+ 正常
- [ ] Firefox 90+ 正常
- [ ] Safari 14+ 正常
- [ ] Edge 90+ 正常
- [ ] 移动端浏览器正常

---

## 附录

### **A. 相关文件**

- [`src/utils/skeleton.ts`](d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-frontend\src\utils\skeleton.ts) - 骨架屏工具类
- [`src/components/EmptyState.vue`](d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-frontend\src\components\EmptyState.vue) - 空状态组件
- [`src/utils/errorHandler.ts`](d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-frontend\src\utils\errorHandler.ts) - 错误处理器

### **B. 参考资源**

- [Element Plus Skeleton 组件](https://element-plus.org/zh-CN/component/skeleton.html)
- [Vue 3 Render 函数](https://cn.vuejs.org/guide/extras/render-function.html)
- [骨架屏设计指南 - Google Material Design](https://material.io/design/communication/launch-screen.html)

### **C. 更新日志**

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-03-23 | 初始版本，定义骨架屏使用规范 | AI Assistant |

---

**本规范自发布之日起执行，所有新项目必须遵循，现有项目逐步迁移。**

**技术负责人**: [待填写]  
**审核人**: [待填写]  
**批准人**: [待填写]
