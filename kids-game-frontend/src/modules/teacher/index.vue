<template>
  <div class="teacher-layout">
    <header class="teacher-header">
      <div class="header-left">
        <span class="logo-icon">🎓</span>
        <div class="header-info">
          <h1 class="page-title">教师工作台</h1>
          <p class="teacher-name">{{ teacherName }}</p>
        </div>
      </div>
      <div class="header-right">
        <el-button @click="handleLogout">退出登录</el-button>
      </div>
    </header>

    <main class="teacher-main">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="班级管理" name="class">
          <ClassManagement v-if="activeTab === 'class'" />
        </el-tab-pane>
        <el-tab-pane label="练习任务" name="assignment">
          <AssignmentManagement v-if="activeTab === 'assignment'" />
        </el-tab-pane>
        <el-tab-pane label="班级学情" name="report">
          <ClassReport v-if="activeTab === 'report'" />
        </el-tab-pane>
      </el-tabs>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/core/store/user.store';
import ClassManagement from './components/ClassManagement.vue';
import AssignmentManagement from './components/AssignmentManagement.vue';
import ClassReport from './components/ClassReport.vue';

const router = useRouter();
const userStore = useUserStore();

const activeTab = ref('class');

const teacherName = computed(() => {
  return (
    userStore.parentUser?.nickname ||
    userStore.adminUser?.nickname ||
    userStore.currentUser?.nickname ||
    '教师'
  );
});

function handleLogout() {
  if (userStore.parentUser) {
    userStore.logoutParent();
  } else if (userStore.adminUser) {
    userStore.logoutAdmin();
  } else {
    userStore.logoutKid();
  }
  router.push('/login');
}
</script>

<style scoped>
.teacher-layout {
  min-height: 100vh;
  background: #f5f7fa;
}
.teacher-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo-icon {
  font-size: 2rem;
}
.page-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}
.teacher-name {
  margin: 2px 0 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
}
.teacher-main {
  padding: 16px;
}
</style>
