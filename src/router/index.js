import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ApiConfig from '../views/ApiConfig.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/api-config',
      name: 'apiConfig',
      component: ApiConfig
    }
  ]
})

export default router