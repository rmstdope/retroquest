import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
// Lantern tokens, fonts, base styles and the inline game tags
import './lantern/lantern.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
