import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import {
  useSettingsStore,
  SETTINGS_STORAGE_KEY,
  LEGACY_MUTED_KEY,
  LEGACY_SFX_MUTED_KEY,
  DEFAULT_SETTINGS,
} from './useSettingsStore'

/** In-memory localStorage stand-in for the node test environment. */
function installLocalStorage(initial: Record<string, string> = {}) {
  const store: Record<string, string> = { ...initial }
  const mock = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(store)) delete store[key]
    }),
  }
  vi.stubGlobal('localStorage', mock)
  return { store, mock }
}

function saved(store: Record<string, string>) {
  return JSON.parse(store[SETTINGS_STORAGE_KEY])
}

describe('useSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts with the defaults when nothing is stored', () => {
    installLocalStorage()
    const settings = useSettingsStore()

    expect(settings.$state).toEqual(DEFAULT_SETTINGS)
    expect(DEFAULT_SETTINGS).toEqual({
      theme: 'device',
      textSize: 'medium',
      musicOn: true,
      musicVolume: 100,
      effectsOn: true,
      effectsVolume: 100,
      narrationOn: true,
      narrationVolume: 100,
      startMode: 'actions',
      reduceMotion: 'device',
    })
  })

  it('keeps an existing mute choice from the old music setting', () => {
    installLocalStorage({ [LEGACY_MUTED_KEY]: 'true' })

    expect(useSettingsStore().musicOn).toBe(false)
  })

  it('keeps an existing sound-effects mute choice', () => {
    installLocalStorage({ [LEGACY_SFX_MUTED_KEY]: 'true' })

    expect(useSettingsStore().effectsOn).toBe(false)
  })

  it('loads valid stored settings', () => {
    installLocalStorage({
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        theme: 'light',
        textSize: 'large',
        musicOn: false,
        musicVolume: 25,
        effectsOn: false,
        effectsVolume: 0,
        startMode: 'type',
        reduceMotion: 'on',
      }),
    })
    const settings = useSettingsStore()

    expect(settings.theme).toBe('light')
    expect(settings.textSize).toBe('large')
    expect(settings.musicOn).toBe(false)
    expect(settings.musicVolume).toBe(25)
    expect(settings.effectsOn).toBe(false)
    expect(settings.effectsVolume).toBe(0)
    expect(settings.startMode).toBe('type')
    expect(settings.reduceMotion).toBe('on')
  })

  it('replaces each invalid stored value with its default', () => {
    installLocalStorage({
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        theme: 'neon',
        textSize: 'huge',
        musicOn: 'yes',
        musicVolume: 140,
        effectsVolume: -5,
        startMode: 'voice',
        reduceMotion: true,
      }),
    })
    const settings = useSettingsStore()

    expect(settings.theme).toBe('device')
    expect(settings.textSize).toBe('medium')
    expect(settings.musicOn).toBe(true)
    expect(settings.musicVolume).toBe(100)
    expect(settings.effectsVolume).toBe(0)
    expect(settings.startMode).toBe('actions')
    expect(settings.reduceMotion).toBe('device')
  })

  it('falls back to defaults when the stored JSON is corrupt', () => {
    installLocalStorage({ [SETTINGS_STORAGE_KEY]: '{not json' })

    expect(useSettingsStore().$state).toEqual(DEFAULT_SETTINGS)
  })

  it('saves every change', async () => {
    const { store } = installLocalStorage()
    const settings = useSettingsStore()

    settings.theme = 'dark'
    settings.musicVolume = 35
    await nextTick()

    expect(saved(store)).toMatchObject({ theme: 'dark', musicVolume: 35 })
  })

  it('works with defaults when storage is unavailable', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    })
    const settings = useSettingsStore()

    expect(settings.$state).toEqual(DEFAULT_SETTINGS)
    settings.theme = 'light'
    await nextTick()
    expect(settings.theme).toBe('light')
  })

  it('resets to the defaults', async () => {
    const { store } = installLocalStorage()
    const settings = useSettingsStore()
    settings.textSize = 'small'
    await nextTick()

    settings.resetToDefaults()
    await nextTick()

    expect(settings.$state).toEqual(DEFAULT_SETTINGS)
    expect(saved(store)).toEqual(DEFAULT_SETTINGS)
  })

  it('stores the narration switch and volume, and falls back on bad values', () => {
    const { store } = installLocalStorage({
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        narrationOn: false,
        narrationVolume: 140,
      }),
    })
    const settings = useSettingsStore()
    expect(settings.narrationOn).toBe(false)
    expect(settings.narrationVolume).toBe(100)

    settings.narrationVolume = 35
    return nextTick().then(() => {
      expect(saved(store).narrationVolume).toBe(35)
      settings.resetToDefaults()
      expect(settings.narrationOn).toBe(true)
      expect(settings.narrationVolume).toBe(100)
    })
  })
})
