<template>
  <div style="padding: 20px;">
    <h1>🎮 游戏资源管理（测试版）</h1>
    
    <div style="background: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 8px;">
      <h3>当前状态：</h3>
      <p><strong>URL:</strong> {{ currentUrl }}</p>
      <p><strong>Game ID:</strong> {{ gameId }}</p>
      <p><strong>Theme ID:</strong> {{ themeId }}</p>
      <p><strong>组件已加载:</strong> ✅</p>
    </div>
    
    <div style="background: #fff3e0; padding: 15px; margin: 20px 0; border-radius: 8px;">
      <h3>下一步：</h3>
      <p>这是一个测试页面，用于确认路由和组件加载是否正常。</p>
      <p>如果看到这个页面，说明：</p>
      <ul>
        <li>✅ 路由配置正确</li>
        <li>✅ 组件可以加载</li>
        <li>✅ URL 参数可以获取</li>
      </ul>
    </div>
    
    <button @click="goBack" style="padding: 10px 20px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
      ← 返回
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const currentUrl = ref(window.location.href);
const gameId = ref(route.query.gameId || '(未设置)');
const themeId = ref(route.query.themeId || '(未设置)');

onMounted(() => {
  console.log('[TestResourceManager] 组件已挂载');
  console.log('[TestResourceManager] URL 参数:', route.query);
});

function goBack() {
  router.back();
}
</script>
