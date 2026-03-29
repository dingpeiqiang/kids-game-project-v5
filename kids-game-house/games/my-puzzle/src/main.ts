/**
 * 游戏主入口
 * 
 * 初始化 Vue 应用和游戏环境
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'

// 创建应用
const app = createApp(App)

// 创建 Pinia 状态管理
const pinia = createPinia()
app.use(pinia)

// 使用 Element Plus
app.use(ElementPlus)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 挂载应用
app.mount('#app')
