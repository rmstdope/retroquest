// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SettingsDialog from './SettingsDialog.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useGameStore } from '@/stores/useGameStore'

describe('SettingsDialog', () => {
  let wrapper: VueWrapper | undefined

  function deviceReducesMotion(reduce: boolean) {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('reduced-motion') ? reduce : false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    deviceReducesMotion(false)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.unstubAllGlobals()
  })

  function mountSettings() {
    wrapper = mount(SettingsDialog, { attachTo: document.body })
    return wrapper
  }

  /** A choice in a segmented group: toggle buttons, as in the composer. */
  function choice(w: VueWrapper, group: string, label: string) {
    return w
      .get(`[role="group"][aria-label="${group}"]`)
      .findAll('button')
      .find((b) => (b.attributes('aria-label') ?? b.text()) === label)!
  }

  it('is the settings dialog with its groups', () => {
    const w = mountSettings()

    expect(w.get('[role="dialog"] h2').text()).toBe('Settings')
    expect(w.findAll('h3').map((h) => h.text())).toEqual([
      'Appearance',
      'Sound',
      'Playing',
    ])
  })

  it('picks the theme', async () => {
    const w = mountSettings()

    await choice(w, 'Theme', 'Dark').trigger('click')

    expect(useSettingsStore().theme).toBe('dark')
    expect(choice(w, 'Theme', 'Dark').attributes('aria-pressed')).toBe('true')
    expect(choice(w, 'Theme', 'Device').attributes('aria-pressed')).toBe(
      'false',
    )
  })

  it('picks the text size', async () => {
    const w = mountSettings()

    await choice(w, 'Text size', 'Large text').trigger('click')

    expect(useSettingsStore().textSize).toBe('large')
    expect(
      choice(w, 'Text size', 'Large text').attributes('aria-pressed'),
    ).toBe('true')
  })

  it('turns music off and on and sets its volume', async () => {
    const w = mountSettings()
    const settings = useSettingsStore()
    const music = w.get('[role="switch"][aria-label="Music"]')
    expect(music.attributes('aria-checked')).toBe('true')

    await w.get('input[aria-label="Music volume"]').setValue('40')
    expect(settings.musicVolume).toBe(40)

    await music.trigger('click')
    expect(settings.musicOn).toBe(false)
    expect(w.find('input[aria-label="Music volume"]').exists()).toBe(false)
  })

  it('turns sound effects off and sets their volume', async () => {
    const w = mountSettings()
    const settings = useSettingsStore()

    await w.get('input[aria-label="Sound effects volume"]').setValue('25')
    await w.get('[role="switch"][aria-label="Sound effects"]').trigger('click')

    expect(settings.effectsVolume).toBe(25)
    expect(settings.effectsOn).toBe(false)
  })

  it('names the music that is playing', () => {
    useGameStore().musicInfo =
      'Market by Conquest\nSource: https://freetouse.com/music'

    expect(mountSettings().get('.lq-now-playing').text()).toContain(
      'Market by Conquest',
    )
  })

  it('picks how the actions start', async () => {
    const w = mountSettings()

    await choice(w, 'Start with', 'Type').trigger('click')

    expect(useSettingsStore().startMode).toBe('type')
    expect(choice(w, 'Start with', 'Type').attributes('aria-pressed')).toBe(
      'true',
    )
  })

  it('follows the device for reduce motion until changed', async () => {
    deviceReducesMotion(true)
    const w = mountSettings()
    const motion = w.get('[role="switch"][aria-label="Reduce motion"]')
    expect(motion.attributes('aria-checked')).toBe('true')
    expect(w.text()).toContain('Follows your device')

    await motion.trigger('click')

    expect(useSettingsStore().reduceMotion).toBe('off')
    expect(motion.attributes('aria-checked')).toBe('false')
    expect(w.text()).not.toContain('Follows your device')
  })
})
