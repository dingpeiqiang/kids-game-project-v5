import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from '@shell/router';
import { installMobileShellGuards } from './utils/mobileEnv';
import '@/styles/main.css';
import { useThemeStore } from '@/core/store';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { setToastFn } from '@/utils/error-handler';
import { toast } from '@/composables/useToast';

installMobileShellGuards();

if (import.meta.env.PROD) {
  console.info('[app] WebView origin:', location.origin, 'href:', location.href);
}

function mount() {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(router);
  app.use(ElementPlus);
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }
  const themeStore = useThemeStore();
  themeStore.init();
  setToastFn(toast.show);
  app.mount('#app');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}