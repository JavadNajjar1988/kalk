// IMPORTANT: Polyfills must be imported FIRST
import './polyfills.js'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import 'typeface-roboto'
import './index.css'
import App from './App.vue'
import Project from './components/Project.vue'
import ProjectList from './components/ProjectList.vue'
import SimpleMap from './components/SimpleMap.vue'
import SimpleSymbolMap from './components/SimpleSymbolMap.vue'
import Login from './components/collaboration/Login.vue'
import Logout from './components/collaboration/Logout.vue'

const routes = [
  { path: '/', component: ProjectList },
  { path: '/project/:id', component: Project },
  { path: '/simple', component: SimpleMap },
  { path: '/symbol-map', component: SimpleSymbolMap },
  { path: '/login', component: Login },
  { path: '/logout', component: Logout }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)

// Initialize services before mounting
import { useServicesStore } from './stores/services.js'
const servicesStore = useServicesStore()
servicesStore.initialize().then(() => {
  app.mount('#app')
  console.log('✅ App mounted with services')
}).catch(error => {
  console.error('❌ Failed to initialize app:', error)
})

