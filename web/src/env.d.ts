/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

/** The game's version (package version and commit), set at build time by `vite.config.ts`. */
declare const __APP_VERSION__: string
