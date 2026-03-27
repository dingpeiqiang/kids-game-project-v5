import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { provideUIScale } from '@kids-game/framework'
import { useResponsiveUI } from './utils/uiResponsive'
import './assets/styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// ⭐ 注册 UI 缩放函数到框架组件（provide/inject 桥接）
const ui = useResponsiveUI()
provideUIScale(app, {
  getFontSize:     ui.getFontSize.bind(ui),
  getPadding:      ui.getPadding.bind(ui),
  getGap:          ui.getGap.bind(ui),
  getWidth:        ui.getWidth.bind(ui),
  getHeight:       ui.getHeight.bind(ui),
  getBorderRadius: ui.getBorderRadius.bind(ui),
  uiScale:         ui.uiScale
})

app.mount('#app')
