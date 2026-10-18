import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/main.css'
// Lantern tokens and fonts; inert until <html data-ui="lantern"> (new UI, ?ui=lantern)
import './lantern/lantern.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
