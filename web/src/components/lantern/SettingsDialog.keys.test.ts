// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SettingsDialog from './SettingsDialog.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

const sounds = vi.hoisted(() => ({ move: vi.fn(), choose: vi.fn() }))
vi.mock('@/composables/useUiSounds', () => ({
  useUiSounds: () => ({ playMove: sounds.move, playChoose: sounds.choose }),
}))

describe('SettingsDialog from the keyboard', () => {
  let wrapper: VueWrapper | undefined

  function setup(fullscreen: boolean): void {
    Object.defineProperty(document, 'fullscreenEnabled', {
      value: fullscreen,
      configurable: true,
    })
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
  }

  beforeEach(() => {
    globalThis.localStorage?.clear()
    setActivePinia(createPinia())
    sounds.move.mockClear()
    sounds.choose.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    Reflect.deleteProperty(document, 'fullscreenEnabled')
    vi.unstubAllGlobals()
  })

  async function open(fullscreen = false): Promise<VueWrapper> {
    setup(fullscreen)
    wrapper = mount(SettingsDialog, { attachTo: document.body })
    await flushPromises()
    return wrapper
  }

  function press(key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    })
    document.activeElement?.dispatchEvent(event)
    return event
  }

  const ringed = (): string | undefined =>
    (document.activeElement as HTMLElement | null)?.dataset.stop

  it('starts the ring on Theme', async () => {
    await open()
    expect(ringed()).toBe('theme')
  })

  it('goes round 8 stops (9 with full screen), skipping the headings', async () => {
    await open()
    const seen = [ringed()]
    for (let i = 0; i < 7; i++) {
      press('ArrowDown')
      seen.push(ringed())
    }
    expect(seen).toEqual([
      'theme',
      'textSize',
      'musicVolume',
      'effectsVolume',
      'narrationVolume',
      'startMode',
      'reduceMotion',
      'alwaysShowNames',
    ])
    press('ArrowDown')
    expect(ringed()).toBe('theme')
    press('ArrowUp')
    expect(ringed()).toBe('alwaysShowNames')
    expect(sounds.move).toHaveBeenCalledTimes(9)
  })

  it('has a Full screen stop between Text size and Music volume where it works', async () => {
    await open(true)
    press('ArrowDown')
    press('ArrowDown')
    expect(ringed()).toBe('fullscreen')
    press('ArrowDown')
    expect(ringed()).toBe('musicVolume')
  })

  it('← → pick the next and previous choice, stopping at the ends', async () => {
    await open()
    const settings = useSettingsStore()
    expect(settings.theme).toBe('device')
    press('ArrowLeft')
    expect(settings.theme).toBe('device')
    expect(sounds.move).not.toHaveBeenCalled()
    press('ArrowRight')
    expect(settings.theme).toBe('light')
    press('ArrowRight')
    press('ArrowRight')
    expect(settings.theme).toBe('dark')
    expect(sounds.move).toHaveBeenCalledTimes(2)
    press('ArrowDown')
    const before = settings.textSize
    press('ArrowRight')
    expect(settings.textSize).not.toBe(before)
  })

  it('Start with changes on its row', async () => {
    await open()
    const settings = useSettingsStore()
    for (let i = 0; i < 5; i++) press('ArrowDown')
    expect(ringed()).toBe('startMode')
    press('ArrowRight')
    expect(settings.startMode).toBe('type')
    press('ArrowRight')
    expect(sounds.move).toHaveBeenCalledTimes(6)
  })

  it('a volume moves by 5 and stops at 0 and 100, and rings at the new loudness', async () => {
    await open()
    const settings = useSettingsStore()
    press('ArrowDown')
    press('ArrowDown')
    press('ArrowDown')
    expect(ringed()).toBe('effectsVolume')
    settings.effectsVolume = 98
    const at: number[] = []
    sounds.move.mockImplementation(() => at.push(settings.effectsVolume))
    press('ArrowRight')
    expect(settings.effectsVolume).toBe(100)
    press('ArrowRight')
    expect(sounds.move).toHaveBeenCalledTimes(4)
    expect(at.at(-1)).toBe(100)
    settings.effectsVolume = 3
    press('ArrowLeft')
    expect(settings.effectsVolume).toBe(0)
    const calls = sounds.move.mock.calls.length
    press('ArrowLeft')
    expect(sounds.move.mock.calls.length).toBe(calls)
  })

  it('Enter, Space and the sideways arrows flip a switch, with the latch', async () => {
    await open()
    const settings = useSettingsStore()
    press('ArrowUp')
    expect(ringed()).toBe('alwaysShowNames')
    const was = settings.alwaysShowNames
    press('Enter')
    expect(settings.alwaysShowNames).toBe(!was)
    press(' ')
    expect(settings.alwaysShowNames).toBe(was)
    press('ArrowRight')
    expect(settings.alwaysShowNames).toBe(!was)
    expect(sounds.choose).toHaveBeenCalledTimes(3)
    expect(sounds.move).toHaveBeenCalledTimes(1)
  })

  it('Enter does nothing on a choice or a volume row', async () => {
    await open()
    const settings = useSettingsStore()
    const event = press('Enter')
    expect(event.defaultPrevented).toBe(true)
    expect(settings.theme).toBe('device')
    expect(sounds.choose).not.toHaveBeenCalled()
  })

  it('a click on a choice or a switch latches', async () => {
    const w = await open()
    await w.findAll('.lq-seg-btn')[1].trigger('click')
    expect(useSettingsStore().theme).toBe('light')
    expect(sounds.choose).toHaveBeenCalledOnce()
  })

  it('a pointer entering a row takes the ring', async () => {
    const w = await open()
    await w
      .get('[data-stop="reduceMotion"]')
      .trigger('mouseenter', { movementX: 4 })
    expect(ringed()).toBe('reduceMotion')
  })

  it('carries the key line for Settings', async () => {
    const w = await open()
    expect(w.getComponent({ name: 'KeyLine' }).props('hints')).toEqual([
      { keys: ['↑', '↓'], word: 'move' },
      { keys: ['←', '→'], word: 'change' },
      { keys: ['Esc'], word: 'back' },
    ])
  })
})
