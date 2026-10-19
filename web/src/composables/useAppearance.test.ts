// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick, effectScope } from 'vue'
import { useAppearance } from './useAppearance'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { LANTERN_PALETTES } from '@/lantern/tokens'

describe('useAppearance', () => {
  let root: HTMLElement

  beforeEach(() => {
    setActivePinia(createPinia())
    root = document.createElement('html')
  })

  afterEach(() => {
    document.head.innerHTML = ''
  })

  /** Run useAppearance inside a scope, as a component's setup would. */
  function start() {
    const scope = effectScope()
    scope.run(() => useAppearance(root))
    return scope
  }

  it('leaves the theme to the device by default', () => {
    start()
    expect(root.hasAttribute('data-theme')).toBe(false)
  })

  it('sets an explicit theme and removes it again for device', async () => {
    start()
    const settings = useSettingsStore()

    settings.theme = 'light'
    await nextTick()
    expect(root.getAttribute('data-theme')).toBe('light')

    settings.theme = 'dark'
    await nextTick()
    expect(root.getAttribute('data-theme')).toBe('dark')

    settings.theme = 'device'
    await nextTick()
    expect(root.hasAttribute('data-theme')).toBe(false)
  })

  it('sets the story text scale from the text size', async () => {
    start()
    expect(root.style.getPropertyValue('--lq-text-scale')).toBe('1')

    useSettingsStore().textSize = 'large'
    await nextTick()
    expect(root.style.getPropertyValue('--lq-text-scale')).toBe('1.18')
  })

  it('marks reduce motion only when chosen explicitly', async () => {
    start()
    const settings = useSettingsStore()
    expect(root.hasAttribute('data-reduce-motion')).toBe(false)

    settings.reduceMotion = 'on'
    await nextTick()
    expect(root.getAttribute('data-reduce-motion')).toBe('on')

    settings.reduceMotion = 'off'
    await nextTick()
    expect(root.getAttribute('data-reduce-motion')).toBe('off')

    settings.reduceMotion = 'device'
    await nextTick()
    expect(root.hasAttribute('data-reduce-motion')).toBe(false)
  })

  it('stops updating once its scope is disposed', async () => {
    const scope = start()
    scope.stop()

    useSettingsStore().theme = 'light'
    await nextTick()
    expect(root.hasAttribute('data-theme')).toBe(false)
  })

  it('gives the browser chrome the theme chosen in Settings', async () => {
    document.head.innerHTML =
      '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f5f0e6">' +
      '<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#10151a">'
    const colours = () =>
      [...document.querySelectorAll('meta[name="theme-color"]')].map((m) =>
        m.getAttribute('content'),
      )
    start()
    const settings = useSettingsStore()

    settings.theme = 'dark'
    await nextTick()
    expect(colours()).toEqual([
      LANTERN_PALETTES.dark.bg,
      LANTERN_PALETTES.dark.bg,
    ])

    settings.theme = 'light'
    await nextTick()
    expect(colours()).toEqual([
      LANTERN_PALETTES.light.bg,
      LANTERN_PALETTES.light.bg,
    ])

    settings.theme = 'device'
    await nextTick()
    expect(colours()).toEqual([
      LANTERN_PALETTES.light.bg,
      LANTERN_PALETTES.dark.bg,
    ])
  })
})
