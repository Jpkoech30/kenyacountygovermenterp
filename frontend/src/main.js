import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

/**
 * Application entry point.
 * Initializes Vue 3 app with Pinia state management and Vue Router.
 */
const app = createApp(App)

// State management
const pinia = createPinia()
app.use(pinia)

// Router
app.use(router)

// Mount the application
app.mount('#app')
