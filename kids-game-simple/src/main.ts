import { createApp } from 'vue'
import App from './App.vue'
import { installMobileShellGuards } from './utils/mobileEnv'

installMobileShellGuards()

document.addEventListener('DOMContentLoaded', () => {
  const app = createApp(App)
  app.mount('#app')
})
