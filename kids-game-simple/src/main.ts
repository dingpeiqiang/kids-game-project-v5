import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '@/App.vue';
import router from '@simple/router';
import '@/styles/main.css';
import { useThemeStore } from '@/core/store';
import { setupAuthInterceptors } from '@/core/network/auth-interceptor';
import { setToastFn } from '@/utils/error-handler';
import { toast } from '@/composables/useToast';
import { Config } from '@/core/config';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

const themeStore = useThemeStore();
themeStore.init();

setToastFn(toast.show);
setupAuthInterceptors();

try {
  Config.init();
} catch (e) {
  console.error('[Simple] Config init failed', e);
}

app.mount('#app');