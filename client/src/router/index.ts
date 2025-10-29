import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import HomeView from '../components/pages/Home.vue'
import LoginView from '../components/pages/Login.vue'
import Boards from '../components/pages/Boards.vue'
import TasksView from '../components/pages/Tasks.vue'
import ProfileView from '../components/pages/Profile.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
  
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/boards',
      name: 'boards',
      component: Boards,
      meta: { requiresAuth: true }
    },
    {
      path: '/board/:id',
      name: 'board',
      component: TasksView,
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const { isAuthenticated } = useAuth()
  
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/login')
  } else {
    next()
  }
})

export default router
