import { createApp } from 'vue'
import App from './App.vue'
import router from '@simple/router'
import { installMobileShellGuards } from './utils/mobileEnv'

installMobileShellGuards()

if (import.meta.env.PROD) {
  console.info('[shell] WebView origin:', location.origin, 'href:', location.href)
}

document.addEventListener('DOMContentLoaded', () => {
  const app = createApp(App)
  app.use(router)
  app.mount('#app')
})