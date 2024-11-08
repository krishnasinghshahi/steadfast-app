// Vue Router
import { createRouter, createWebHistory } from 'vue-router'

// Firebase Authentication
import { getAuth, onAuthStateChanged } from 'firebase/auth'

// App Views
import TradeView from '@/pages/app/TradeView.vue'
import ManageBrokers from '@/pages/app/ManageBrokersView.vue'
import AddBroker from '@/pages/app/AddBrokerView.vue'
import AppSettingsView from '@/pages/app/AppSettingsView.vue'
import ParallelCopyTradeView from '@/pages/app/ParallelCopyTradeView.vue'

// Landing Pages
import HomeView from '@/pages/landing/HomeView.vue'
import PricingView from '@/pages/landing/PricingView.vue'
import LoginView from '@/pages/landing/LoginView.vue'
import SignUpView from '@/pages/landing/SignUpView.vue'
import AboutView from '@/pages/landing/AboutView.vue'
import ContactView from '@/pages/landing/ContactView.vue'
import FaqView from '@/pages/landing/FaqView.vue'

// Account Management
import DashboardView from '@/pages/account/DashboardView.vue'

// Broker Integration
import Flattrade_Redirect from '@/pages/BrokerRedirect/Flattrade_Redirect.vue'

const isLocalhost = () => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

const requireAuth = (to, from, next) => {
  if (isLocalhost()) {
    next()
    return
  }

  const auth = getAuth()
  onAuthStateChanged(auth, (user) => {
    if (user) {
      next()
    } else {
      next('/login')
    }
  })
}

const redirectIfLoggedIn = (to, from, next) => {
  if (isLocalhost()) {
    next()
    return
  }

  const auth = getAuth()
  onAuthStateChanged(auth, (user) => {
    if (user) {
      next('/manage-brokers')
    } else {
      next()
    }
  })
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactView
    },
    {
      path: '/faq',
      name: 'faq',
      component: FaqView
    },
    {
      path: '/pricing',
      name: 'pricing',
      component: PricingView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      beforeEnter: redirectIfLoggedIn
    },
    {
      path: '/manage-brokers',
      name: 'manage-brokers',
      component: ManageBrokers,
      beforeEnter: requireAuth
    },
    {
      path: '/steadfast',
      name: 'trade-view',
      component: TradeView,
      beforeEnter: requireAuth
    },
    {
      path: '/add-broker',
      name: 'add-broker',
      component: AddBroker,
      beforeEnter: requireAuth
    },
    {
      path: '/flattrade/redirect',
      component: Flattrade_Redirect
    },
    {
      path: '/app-settings',
      name: 'AppSettingsView',
      component: AppSettingsView,
      beforeEnter: requireAuth
    },
    {
      path: '/parallel-copy-trade',
      name: 'ParallelCopyTradeView',
      component: ParallelCopyTradeView,
      beforeEnter: requireAuth
    },
    {
      path: '/signup',
      name: 'SignUp',
      component: SignUpView,
      beforeEnter: redirectIfLoggedIn
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    // Always scroll to top
    return { top: 0 }
  },
  beforeEach(to, from, next) {
    if (isLocalhost()) {
      next()
      return
    }

    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const currentUser = getAuth().currentUser

    if (requiresAuth && !currentUser) {
      next('/login')
    } else {
      next()
    }
  }
})

export default router
