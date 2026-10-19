import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/main.css'
// Lantern tokens and fonts; they apply once <html data-ui="lantern"> is set
import './lantern/lantern.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
