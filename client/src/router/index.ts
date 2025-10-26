import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import BoardsListView from '../views/BoardsListView.vue'
import BoardView from '../views/BoardView.vue'
import ProfileView from '../views/ProfileView.vue'

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
      component: BoardsListView,
      meta: { requiresAuth: true }
    },
    {
      path: '/board/:id',
      name: 'board',
      component: BoardView,
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
