<template>
  <div class="component-preview">
    <div class="preview-header">
      <h3>组件预览</h3>
      <el-button type="primary" size="small" @click="refreshPreview">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <div class="preview-content">
      <el-tabs v-model="activeTab" type="card">
        <!-- 按钮组件 -->
        <el-tab-pane label="按钮" name="buttons">
          <div class="preview-section">
            <h4>主要按钮</h4>
            <div class="button-group">
              <el-button type="primary">主要按钮</el-button>
              <el-button type="success">成功按钮</el-button>
              <el-button type="warning">警告按钮</el-button>
              <el-button type="danger">危险按钮</el-button>
              <el-button type="info">信息按钮</el-button>
            </div>
          </div>

          <div class="preview-section">
            <h4>不同尺寸</h4>
            <div class="button-group">
              <el-button size="large">大型按钮</el-button>
              <el-button>默认按钮</el-button>
              <el-button size="small">小型按钮</el-button>
            </div>
          </div>

          <div class="preview-section">
            <h4>圆角按钮</h4>
            <div class="button-group">
              <el-button round>圆角按钮</el-button>
              <el-button type="primary" round>主要圆角</el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- 表单组件 -->
        <el-tab-pane label="表单" name="forms">
          <div class="preview-section">
            <h4>输入框</h4>
            <el-input v-model="inputValue" placeholder="请输入内容" style="width: 300px;" />
          </div>

          <div class="preview-section">
            <h4>选择器</h4>
            <el-select v-model="selectValue" placeholder="请选择" style="width: 300px;">
              <el-option label="选项1" value="1" />
              <el-option label="选项2" value="2" />
              <el-option label="选项3" value="3" />
            </el-select>
          </div>

          <div class="preview-section">
            <h4>开关</h4>
            <el-switch v-model="switchValue" />
            <el-switch v-model="switchValue" active-text="开启" inactive-text="关闭" />
          </div>

          <div class="preview-section">
            <h4>颜色选择器</h4>
            <el-color-picker v-model="colorValue" />
          </div>
        </el-tab-pane>

        <!-- 卡片组件 -->
        <el-tab-pane label="卡片" name="cards">
          <div class="preview-section">
            <h4>基础卡片</h4>
            <el-card class="theme-card">
              <template #header>
                <div class="card-header">
                  <span>卡片标题</span>
                  <el-button link>操作按钮</el-button>
                </div>
              </template>
              <p>这是卡片内容区域，用于展示文本、图片或其他组件。</p>
              <el-button type="primary">确定</el-button>
              <el-button>取消</el-button>
            </el-card>
          </div>

          <div class="preview-section">
            <h4>带图卡片</h4>
            <el-card class="theme-card" style="max-width: 300px;">
              <img src="https://via.placeholder.com/300x150" style="width: 100%; display: block;" />
              <div style="padding: 14px;">
                <span>卡片标题</span>
                <div style="font-size: 12px; color: #999; margin-top: 8px;">
                  卡片描述文本
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 标签组件 -->
        <el-tab-pane label="标签" name="tags">
          <div class="preview-section">
            <h4>基础标签</h4>
            <el-tag>标签一</el-tag>
            <el-tag type="success">标签二</el-tag>
            <el-tag type="info">标签三</el-tag>
            <el-tag type="warning">标签四</el-tag>
            <el-tag type="danger">标签五</el-tag>
          </div>

          <div class="preview-section">
            <h4>不同尺寸</h4>
            <el-tag size="large">大型标签</el-tag>
            <el-tag>默认标签</el-tag>
            <el-tag size="small">小型标签</el-tag>
          </div>

          <div class="preview-section">
            <h4>可移除标签</h4>
            <el-tag closable @close="handleTagClose">可移除标签</el-tag>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const activeTab = ref('buttons')
const inputValue = ref('')
const selectValue = ref('')
const switchValue = ref(true)
const colorValue = ref('#409EFF')

const refreshPreview = () => {
  ElMessage.success('预览已刷新')
}

const handleTagClose = () => {
  ElMessage.info('标签已移除')
}
</script>

<style scoped lang="scss">
.component-preview {
  padding: 20px;
  height: 100%;
  background: #f5f7fa;
  overflow-y: auto;

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .preview-content {
    .preview-section {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 4px;

      h4 {
        margin: 0 0 15px 0;
        font-size: 14px;
        color: #606266;
      }

      .button-group {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }

    .theme-card {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
