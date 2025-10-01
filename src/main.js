import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles.css'
import './assets/base.css'    // ← add this!
import '@fortawesome/fontawesome-free/css/all.css'

createApp(App)
    .use(router)
    .mount('#app')