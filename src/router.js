import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './views/Dashboard.vue'
import Analytics from './views/Analytics.vue'

const routes = [
    { path: '/', name: 'Dashboard', component: Dashboard },
    { path: '/analytics', name: 'Analytics', component: Analytics }
]

export default createRouter({
    history: createWebHistory(),
    routes
})