<template>
  <div class="preview-panel">
    <el-card shadow="hover" class="preview-card">
      <template #header>
        <span class="card-title">👁️ 实时预览</span>
      </template>

      <el-tabs v-model="activeTab" type="border-card">
        <!-- 组件预览 -->
        <el-tab-pane label="组件预览" name="component">
          <ComponentPreview :theme-data="themeData" />
        </el-tab-pane>

        <!-- 游戏场景预览 -->
        <el-tab-pane label="游戏场景预览" name="scene">
          <GameScenePreview :theme-data="themeData" />
        </el-tab-pane>

        <!-- 对比预览 -->
        <el-tab-pane label="对比预览" name="compare">
          <ComparePreview :theme-data="themeData" />
        </el-tab-pane>

        <!-- 移动端预览 -->
        <el-tab-pane label="移动端预览" name="mobile">
          <MobilePreview :theme-data="themeData" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ComponentPreview from './previews/ComponentPreview.vue'
import GameScenePreview from './previews/GameScenePreview.vue'
import ComparePreview from './previews/ComparePreview.vue'
import MobilePreview from './previews/MobilePreview.vue'
import type { GTRSTheme } from '@/utils/gtrs-validator'

interface Props {
  themeData: GTRSTheme
}

defineProps<Props>()

const activeTab = ref('component')
</script>

<style scoped lang="scss">
.preview-panel {
  max-width: 1200px;
  margin: 0 auto;
}

.preview-card {
  .card-title {
    font-weight: bold;
    font-size: 16px;
  }
}
</style>
