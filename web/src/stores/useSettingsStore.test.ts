import { setAppStorage } from '@/storage/appStorage'
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
  setAppStorage(mock)
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
      musicVolume: 100,
      effectsVolume: 100,
      narrationVolume: 100,
      startMode: 'actions',
      reduceMotion: 'device',
      alwaysShowNames: false,
    })
  })

  it('turns the volume to 0 for a mute choice from the old music setting', () => {
    installLocalStorage({ [LEGACY_MUTED_KEY]: 'true' })

    expect(useSettingsStore().musicVolume).toBe(0)
  })

  it('turns the volume to 0 for an old sound-effects mute choice', () => {
    installLocalStorage({ [LEGACY_SFX_MUTED_KEY]: 'true' })

    expect(useSettingsStore().effectsVolume).toBe(0)
  })

  it('loads a sound saved as switched off at volume 0, and a sound saved as on at its volume', () => {
    const { store } = installLocalStorage({
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        musicOn: false,
        musicVolume: 60,
        effectsOn: true,
        effectsVolume: 40,
        narrationOn: false,
        narrationVolume: 70,
      }),
    })
    const settings = useSettingsStore()

    expect(settings.musicVolume).toBe(0)
    expect(settings.effectsVolume).toBe(40)
    expect(settings.narrationVolume).toBe(0)
    expect(settings.$state).toEqual({
      ...DEFAULT_SETTINGS,
      musicVolume: 0,
      effectsVolume: 40,
      narrationVolume: 0,
    })
    return nextTick().then(() => {
      settings.theme = 'dark'
      return nextTick().then(() => {
        expect(saved(store)).not.toHaveProperty('musicOn')
        expect(saved(store)).not.toHaveProperty('narrationOn')
      })
    })
  })

  it('lets the saved settings win over the old mute key, and ignores the key once volumes are saved', () => {
    installLocalStorage({
      [LEGACY_MUTED_KEY]: 'true',
      [LEGACY_SFX_MUTED_KEY]: 'true',
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        musicOn: true,
        musicVolume: 40,
        effectsVolume: 50,
      }),
    })
    const settings = useSettingsStore()

    expect(settings.musicVolume).toBe(40)
    expect(settings.effectsVolume).toBe(50)
  })

  it('loads valid stored settings', () => {
    installLocalStorage({
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        theme: 'light',
        textSize: 'large',
        musicVolume: 25,
        effectsVolume: 0,
        startMode: 'type',
        reduceMotion: 'on',
        alwaysShowNames: true,
      }),
    })
    const settings = useSettingsStore()

    expect(settings.theme).toBe('light')
    expect(settings.textSize).toBe('large')
    expect(settings.musicVolume).toBe(25)
    expect(settings.effectsVolume).toBe(0)
    expect(settings.startMode).toBe('type')
    expect(settings.reduceMotion).toBe('on')
    expect(settings.alwaysShowNames).toBe(true)
  })

  it('replaces each invalid stored value with its default', () => {
    installLocalStorage({
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        theme: 'neon',
        textSize: 'huge',
        musicVolume: 140,
        effectsVolume: -5,
        startMode: 'voice',
        reduceMotion: true,
        alwaysShowNames: 'yes',
      }),
    })
    const settings = useSettingsStore()

    expect(settings.theme).toBe('device')
    expect(settings.textSize).toBe('medium')
    expect(settings.musicVolume).toBe(100)
    expect(settings.effectsVolume).toBe(0)
    expect(settings.startMode).toBe('actions')
    expect(settings.reduceMotion).toBe('device')
    expect(settings.alwaysShowNames).toBe(false)
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
    setAppStorage({
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    })
    const settings = useSettingsStore()

    expect(settings.$state).toEqual(DEFAULT_SETTINGS)
    settings.theme = 'light'
    await nextTick()
    expect(settings.theme).toBe('light')
  })

  it('keeps every text size, the two smallest included, and falls back on an unknown one', () => {
    for (const size of ['smallest', 'extraSmall', 'small', 'medium', 'large']) {
      installLocalStorage({
        [SETTINGS_STORAGE_KEY]: JSON.stringify({ textSize: size }),
      })
      setActivePinia(createPinia())
      expect(useSettingsStore().textSize).toBe(size)
    }
    installLocalStorage({
      [SETTINGS_STORAGE_KEY]: JSON.stringify({ textSize: 'tiny' }),
    })
    setActivePinia(createPinia())
    expect(useSettingsStore().textSize).toBe('medium')
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

  it('stores the narration volume, and falls back on bad values', () => {
    const { store } = installLocalStorage({
      [SETTINGS_STORAGE_KEY]: JSON.stringify({ narrationVolume: 140 }),
    })
    const settings = useSettingsStore()
    expect(settings.narrationVolume).toBe(100)

    settings.narrationVolume = 35
    return nextTick().then(() => {
      expect(saved(store).narrationVolume).toBe(35)
      settings.resetToDefaults()
      expect(settings.narrationVolume).toBe(100)
    })
  })
})
