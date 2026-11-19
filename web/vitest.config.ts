import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      setupFiles: ['src/testing/domSetup.ts'],
      include: ['src/**/*.test.ts', '*.config.test.ts'],
    },
  }),
)
