<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">⭐</span>
          <span class="logo-text" v-show="!sidebarCollapsed">星光游学</span>
        </div>
        <button class="sidebar-toggle" @click="toggleSidebar">
          <span class="toggle-icon" :class="{ rotated: sidebarCollapsed }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </span>
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in menuItems"
          :key="item.id"
          :to="item.path"
          class="nav-item"
          active-class="active"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text" v-show="!sidebarCollapsed">{{ item.name }}</span>
          <span class="nav-badge" v-if="item.badge" v-show="!sidebarCollapsed">{{ item.badge }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button class="sidebar-btn" @click="goHome" title="返回首页">
          <span class="btn-icon">🏠</span>
          <span class="btn-text" v-show="!sidebarCollapsed">返回首页</span>
        </button>
        <button class="sidebar-btn danger" @click="handleLogout" title="退出登录">
          <span class="btn-icon">🚪</span>
          <span class="btn-text" v-show="!sidebarCollapsed">退出登录</span>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-wrapper">
      <!-- 顶部栏 -->
      <header class="top-bar">
        <div class="top-bar-left">
          <h1 class="page-title">{{ currentPageTitle }}</h1>
        </div>
        <div class="top-bar-right">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="搜索..." class="search-input">
          </div>
          <button class="notification-btn" @click="showNotifications = true">
            <span class="notification-icon">🔔</span>
            <span class="notification-badge" v-if="notificationCount > 0">{{ notificationCount }}</span>
          </button>
          <div class="user-dropdown">
            <div class="user-avatar" @click="showUserMenu = !showUserMenu">
              <span>👨‍💼</span>
            </div>
            <div class="user-menu" v-if="showUserMenu">
              <div class="menu-item">
                <span>👤</span>
                <span>个人资料</span>
              </div>
              <div class="menu-item">
                <span>⚙️</span>
                <span>系统设置</span>
              </div>
              <div class="menu-divider"></div>
              <div class="menu-item danger" @click="handleLogout">
                <span>🚪</span>
                <span>退出登录</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- 内容区 -->
      <main class="main-content">
        <router-view />
      </main>
    </div>

    <!-- 退出确认对话框 -->
    <KidUnifiedModalV2
      v-model:show="showLogoutConfirm"
      title="退出登录"
      type="question"
      icon="🚪"
      :closable="true"
      @confirm="confirmLogout"
    />

    <!-- 通知面板 -->
    <transition name="slide">
      <div v-if="showNotifications" class="notification-panel">
        <div class="panel-header">
          <h3>通知中心</h3>
          <button class="close-btn" @click="showNotifications = false">✕</button>
        </div>
        <div class="panel-content">
          <div class="notification-item unread">
            <div class="notification-icon">🎉</div>
            <div class="notification-content">
              <h4>新游戏上线</h4>
              <p>算术大冒险游戏已上线，等待审核</p>
              <span class="notification-time">2小时前</span>
            </div>
          </div>
          <div class="notification-item unread">
            <div class="notification-icon">📊</div>
            <div class="notification-content">
              <h4>周报生成完成</h4>
              <p>本周数据周报已生成，点击查看</p>
              <span class="notification-time">5小时前</span>
            </div>
          </div>
          <div class="notification-item">
            <div class="notification-icon">⚠️</div>
            <div class="notification-content">
              <h4>系统警告</h4>
              <p>服务器负载较高，请注意监控</p>
              <span class="notification-time">昨天</span>
            </div>
          </div>
        </div>
        <div class="panel-footer">
          <button class="btn-link">全部标为已读</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/core/store/user.store';
import { adminMenuItems } from './utils/admin-menu.config';
import { modal } from '@/composables/useUnifiedModalV2';
import KidUnifiedModalV2 from '@/components/ui/KidUnifiedModalV2.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const menuItems = adminMenuItems.map((item, index) => ({
  ...item,
  badge: index === 0 ? '5' : index === 1 ? '12' : undefined,
}));

const sidebarCollapsed = ref(false);
const showLogoutConfirm = ref(false);
const showNotifications = ref(false);
const showUserMenu = ref(false);
const notificationCount = ref(17);

const currentPageTitle = computed(() => {
  const menuItem = menuItems.find(item => item.path === route.path);
  return menuItem ? menuItem.name : '运营后台';
});

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

function goHome() {
  router.push('/');
}

function handleLogout() {
  showLogoutConfirm.value = true;
}

function confirmLogout() {
  userStore.logoutAdmin();
  router.push('/login');
}

onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.user-dropdown')) {
      showUserMenu.value = false;
    }
  });
});
</script>

<style scoped>
/* ========== 布局容器 ========== */
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #FFB6E6 0%, #A6E3E9 50%, #FFE66D 100%);
  position: relative;
  overflow-x: hidden;
}

/* 背景装饰 */
.admin-layout::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 20% 80%, rgba(255, 107, 157, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(78, 205, 196, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(255, 230, 109, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* ========== 侧边栏 ========== */
.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #FF6B9D 0%, #4ECDC4 100%);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: 4px 0 20px rgba(255, 107, 157, 0.2);
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  overflow: hidden;
}

.logo-icon {
  font-size: 2rem;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.logo-text {
  font-size: 1.3rem;
  font-weight: 800;
  color: white;
  white-space: nowrap;
  background: linear-gradient(135deg, #ffd700, #ffec8b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-toggle {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  color: white;
  flex-shrink: 0;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
}

.toggle-icon {
  transition: transform 0.3s;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.sidebar-nav {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.3s;
  margin-bottom: 0.5rem;
  position: relative;
  overflow: hidden;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateX(5px);
}

.nav-item.active {
  background: white;
  color: #FF6B9D;
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.nav-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.nav-text {
  flex: 1;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-badge {
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
}

.sidebar-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(5px);
}

.sidebar-btn.danger:hover {
  background: rgba(239, 68, 68, 0.3);
}

.btn-icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.btn-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========== 主内容区 ========== */
.main-wrapper {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.sidebar.collapsed + .main-wrapper {
  margin-left: 80px;
}

/* ========== 顶部栏 ========== */
.top-bar {
  background: white;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.top-bar-left {
  flex: 1;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #FF6B9D 0%, #4ECDC4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f5f7fa;
  border-radius: 20px;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.search-box:focus-within {
  background: white;
  border-color: #FF6B9D;
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.1);
}

.search-icon {
  font-size: 1rem;
  color: #999;
}

.search-input {
  border: none;
  background: transparent;
  outline: none;
  width: 200px;
  font-size: 0.95rem;
}

.search-input::placeholder {
  color: #999;
}

.notification-btn {
  position: relative;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: #f5f7fa;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-btn:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

.notification-icon {
  font-size: 1.3rem;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  animation: bounce 0.5s ease-in-out infinite alternate;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-3px); }
}

.user-dropdown {
  position: relative;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #FF6B9D, #4ECDC4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.user-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  overflow: hidden;
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}

.menu-item:hover {
  background: #f5f7fa;
}

.menu-item.danger {
  color: #ef4444;
}

.menu-item.danger:hover {
  background: #fee2e2;
}

.menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 0.5rem 0;
}

/* ========== 内容区 ========== */
.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* ========== 通知面板 ========== */
.notification-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 1500;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #e5e7eb;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.notification-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
}

.notification-item:hover {
  background: #f5f7fa;
}

.notification-item.unread {
  background: rgba(255, 107, 157, 0.08);
  border-left: 3px solid #FF6B9D;
}

.notification-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.notification-content h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.notification-content p {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #666;
  line-height: 1.4;
}

.notification-time {
  font-size: 0.75rem;
  color: #999;
}

.panel-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.btn-link {
  background: none;
  border: none;
  color: #FF6B9D;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-link:hover {
  color: #4ECDC4;
  text-decoration: underline;
}

/* ========== 动画 ========== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* ========== 响应式设计 ========== */
@media (max-width: 1024px) {
  .sidebar {
    width: 220px;
  }

  .sidebar.collapsed {
    width: 70px;
  }

  .main-wrapper {
    margin-left: 220px;
  }

  .sidebar.collapsed + .main-wrapper {
    margin-left: 70px;
  }

  .logo-text {
    font-size: 1.1rem;
  }

  .search-input {
    width: 150px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 70px;
  }

  .sidebar.collapsed {
    width: 70px;
  }

  .main-wrapper {
    margin-left: 70px;
  }

  .sidebar-header {
    padding: 1rem;
    justify-content: center;
  }

  .logo {
    justify-content: center;
  }

  .logo-text {
    display: none;
  }

  .sidebar-toggle {
    display: none;
  }

  .top-bar {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.2rem;
  }

  .search-box {
    display: none;
  }

  .notification-panel {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 60px;
  }

  .main-wrapper {
    margin-left: 60px;
  }

  .sidebar-header {
    padding: 0.75rem;
  }

  .sidebar-nav {
    padding: 0.75rem;
  }

  .nav-item {
    padding: 0.75rem;
    justify-content: center;
  }

  .nav-text,
  .nav-badge {
    display: none;
  }

  .top-bar {
    padding: 0.75rem;
  }

  .page-title {
    font-size: 1rem;
  }

  .user-dropdown {
    display: none;
  }

  .main-content {
    padding: 1rem;
  }
}
</style>
