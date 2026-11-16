// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SettingsDialog from './SettingsDialog.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

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
    globalThis.localStorage?.clear()
    setActivePinia(createPinia())
    deviceReducesMotion(false)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.unstubAllGlobals()
  })

  function mountSettings(musicInfo = '') {
    wrapper = mount(SettingsDialog, {
      attachTo: document.body,
      props: { musicInfo },
    })
    return wrapper
  }

  /** A choice in a segmented group: toggle buttons, as in the composer. */
  function choice(w: VueWrapper, group: string, label: string) {
    return w
      .get(`[role="group"][aria-label="${group}"]`)
      .findAll('button')
      .find((b) => (b.attributes('aria-label') ?? b.text()) === label)!
  }

  describe('Full screen', () => {
    let request: ReturnType<typeof vi.fn>
    let exit: ReturnType<typeof vi.fn>

    beforeEach(() => {
      request = vi.fn(() => Promise.resolve())
      exit = vi.fn(() => Promise.resolve())
      document.documentElement.requestFullscreen =
        request as unknown as typeof document.documentElement.requestFullscreen
      document.exitFullscreen =
        exit as unknown as typeof document.exitFullscreen
    })
    afterEach(() => {
      Reflect.deleteProperty(document, 'fullscreenEnabled')
      Reflect.deleteProperty(document, 'fullscreenElement')
    })

    function supported(yes: boolean, keyboard = true): void {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: yes,
        configurable: true,
      })
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
          matches: query.includes('hover: hover') ? keyboard : false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      )
    }
    const row = (w: VueWrapper) =>
      w.find('button[role="switch"][aria-label="Full screen"]')

    it('is a switch at the end of Appearance, off while the page is not full screen', () => {
      supported(true)
      const w = mountSettings()
      const appearance = w.get('section[aria-labelledby="lq-set-look"]')
      const labels = appearance
        .findAll('.lq-row-label')
        .map((label) => label.text())
      expect(labels).toEqual(['Theme', 'Text size', 'Full screen'])
      expect(row(w).attributes('aria-checked')).toBe('false')
    })

    it('says which key switches it, with a keyboard only', () => {
      supported(true, true)
      expect(mountSettings().text()).toContain('Press F to switch it on or off')
      wrapper?.unmount()
      supported(true, false)
      expect(mountSettings().text()).not.toContain('Press F')
    })

    it('switches full screen on, and off when it is on', async () => {
      supported(true)
      const w = mountSettings()
      await row(w).trigger('click')
      expect(request).toHaveBeenCalledOnce()
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.documentElement,
        configurable: true,
      })
      document.dispatchEvent(new Event('fullscreenchange'))
      await w.vm.$nextTick()
      expect(row(w).attributes('aria-checked')).toBe('true')
      await row(w).trigger('click')
      expect(exit).toHaveBeenCalledOnce()
    })

    it('turns off when the browser leaves full screen by its own means', async () => {
      supported(true)
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.documentElement,
        configurable: true,
      })
      const w = mountSettings()
      expect(row(w).attributes('aria-checked')).toBe('true')
      Reflect.deleteProperty(document, 'fullscreenElement')
      document.dispatchEvent(new Event('fullscreenchange'))
      await w.vm.$nextTick()
      expect(row(w).attributes('aria-checked')).toBe('false')
    })

    it('is not shown at all where full screen cannot work', () => {
      supported(false)
      const w = mountSettings()
      expect(row(w).exists()).toBe(false)
      expect(w.text()).not.toContain('Full screen')
    })
  })

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

  it('offers five text sizes, smallest first, and picks the extra small one', async () => {
    const w = mountSettings()
    const names = w
      .get('[role="group"][aria-label="Text size"]')
      .findAll('button')
      .map((b) => b.attributes('aria-label'))
    expect(names).toEqual([
      'Smallest text',
      'Extra small text',
      'Small text',
      'Medium text',
      'Large text',
    ])

    await choice(w, 'Text size', 'Extra small text').trigger('click')

    expect(useSettingsStore().textSize).toBe('extraSmall')
  })

  it('has no on/off switch for any sound, only a volume slider for each', () => {
    const w = mountSettings()

    for (const name of ['Music', 'Sound effects', 'Narration']) {
      expect(w.find(`[role="switch"][aria-label="${name}"]`).exists()).toBe(
        false,
      )
      expect(w.find(`input[aria-label="${name} volume"]`).exists()).toBe(true)
    }
    expect(w.text()).toContain('The story and every character read aloud')
  })

  it('sets the volume of music, sound effects and narration, down to 0', async () => {
    const w = mountSettings()
    const settings = useSettingsStore()

    await w.get('input[aria-label="Music volume"]').setValue('40')
    await w.get('input[aria-label="Sound effects volume"]').setValue('25')
    await w.get('input[aria-label="Narration volume"]').setValue('0')

    expect(settings.musicVolume).toBe(40)
    expect(settings.effectsVolume).toBe(25)
    expect(settings.narrationVolume).toBe(0)
    expect(w.find('input[aria-label="Narration volume"]').exists()).toBe(true)
    expect(w.findAll('.lq-volume-num').map((n) => n.text())).toEqual([
      '40',
      '25',
      '0',
    ])
  })

  it('names the music that is playing', () => {
    const credit = 'Market by Conquest\nSource: https://freetouse.com/music'

    expect(mountSettings(credit).get('.lq-now-playing').text()).toContain(
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

  it('says moving pictures stop with Reduce motion, and when it follows the device', async () => {
    const w = mountSettings()
    expect(w.text()).toContain(
      'No shake, slide-in or moving pictures. Follows your device',
    )
    useSettingsStore().reduceMotion = 'on'
    await w.vm.$nextTick()
    expect(w.text()).toContain('No shake, slide-in or moving pictures')
    expect(w.text()).not.toContain('Follows your device')
    expect(w.text()).not.toContain('No shake or slide-in')
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

  it('has a switch for keeping the names of what is here on in every room', async () => {
    const w = mountSettings()
    const names = w.get(
      '[role="switch"][aria-label="Always show what\'s here"]',
    )
    expect(names.attributes('aria-checked')).toBe('false')
    expect(w.text()).toContain(
      'Marks and names stay on the picture in every room.',
    )
    await names.trigger('click')
    expect(useSettingsStore().alwaysShowNames).toBe(true)
    expect(names.attributes('aria-checked')).toBe('true')
  })
})
