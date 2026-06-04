/**
 * 应用入口
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './styles/main.css';
import { useThemeStore } from './core/store';

// 导入 Element Plus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// 导入认证拦截器
import { setupAuthInterceptors } from './core/network/auth-interceptor';

// 导入错误处理器
import { setToastFn } from './utils/error-handler';
import { toast } from './composables/useToast';

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);

// 全局注册 Element Plus
app.use(ElementPlus);

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 初始化主题系统
const themeStore = useThemeStore();
themeStore.init();

// 初始化错误处理器（在认证拦截器之前）
setToastFn(toast.show);

// 注册认证拦截器
setupAuthInterceptors();

app.mount('#app');
