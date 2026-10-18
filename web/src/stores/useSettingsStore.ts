import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { LANTERN_TEXT_SCALE, type LanternTextSize } from '@/lantern/tokens'

/**
 * Player settings for the Lantern UI, saved in localStorage.
 *
 * Every field is validated on load; an invalid or missing value falls back to
 * its default, and unavailable storage (e.g. private mode) just means the
 * defaults are used for this visit.
 */

export type ThemeSetting = 'device' | 'light' | 'dark'
export type StartMode = 'actions' | 'type'
export type ReduceMotionSetting = 'device' | 'on' | 'off'

export interface Settings {
  theme: ThemeSetting
  textSize: LanternTextSize
  musicOn: boolean
  /** 0–100 */
  musicVolume: number
  effectsOn: boolean
  /** 0–100 */
  effectsVolume: number
  startMode: StartMode
  reduceMotion: ReduceMotionSetting
}

export const SETTINGS_STORAGE_KEY = 'retroquest_settings'

/** Mute flag written by useMusic before settings existed. */
export const LEGACY_MUTED_KEY = 'retroquest_music_muted'

/** Mute flag written by useAudio (sound effects) before settings existed. */
export const LEGACY_SFX_MUTED_KEY = 'retroquest_sfx_muted'

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  theme: 'device',
  textSize: 'medium',
  musicOn: true,
  musicVolume: 60,
  effectsOn: true,
  effectsVolume: 80,
  startMode: 'actions',
  reduceMotion: 'device',
}

const THEMES: readonly ThemeSetting[] = ['device', 'light', 'dark']
const START_MODES: readonly StartMode[] = ['actions', 'type']
const REDUCE_MOTION: readonly ReduceMotionSetting[] = ['device', 'on', 'off']

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function oneOf<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function volume(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(100, Math.max(0, Math.round(value)))
}

/** Read saved settings, validating each field against its default. */
function loadSettings(): Settings {
  const defaults: Settings = {
    ...DEFAULT_SETTINGS,
    musicOn: readStorage(LEGACY_MUTED_KEY) !== 'true',
    effectsOn: readStorage(LEGACY_SFX_MUTED_KEY) !== 'true',
  }
  let stored: Record<string, unknown> = {}
  try {
    const parsed: unknown = JSON.parse(
      readStorage(SETTINGS_STORAGE_KEY) ?? '{}',
    )
    if (parsed && typeof parsed === 'object') {
      stored = parsed as Record<string, unknown>
    }
  } catch {
    // Corrupt JSON: keep the defaults.
  }
  const sizes = Object.keys(LANTERN_TEXT_SCALE) as LanternTextSize[]
  return {
    theme: oneOf(stored.theme, THEMES, defaults.theme),
    textSize: oneOf(stored.textSize, sizes, defaults.textSize),
    musicOn: bool(stored.musicOn, defaults.musicOn),
    musicVolume: volume(stored.musicVolume, defaults.musicVolume),
    effectsOn: bool(stored.effectsOn, defaults.effectsOn),
    effectsVolume: volume(stored.effectsVolume, defaults.effectsVolume),
    startMode: oneOf(stored.startMode, START_MODES, defaults.startMode),
    reduceMotion: oneOf(
      stored.reduceMotion,
      REDUCE_MOTION,
      defaults.reduceMotion,
    ),
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const initial = loadSettings()
  const theme = ref(initial.theme)
  const textSize = ref(initial.textSize)
  const musicOn = ref(initial.musicOn)
  const musicVolume = ref(initial.musicVolume)
  const effectsOn = ref(initial.effectsOn)
  const effectsVolume = ref(initial.effectsVolume)
  const startMode = ref(initial.startMode)
  const reduceMotion = ref(initial.reduceMotion)

  function snapshot(): Settings {
    return {
      theme: theme.value,
      textSize: textSize.value,
      musicOn: musicOn.value,
      musicVolume: musicVolume.value,
      effectsOn: effectsOn.value,
      effectsVolume: effectsVolume.value,
      startMode: startMode.value,
      reduceMotion: reduceMotion.value,
    }
  }

  watch(snapshot, (value) => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value))
    } catch {
      // Storage unavailable: settings still apply for this visit.
    }
  })

  function resetToDefaults(): void {
    theme.value = DEFAULT_SETTINGS.theme
    textSize.value = DEFAULT_SETTINGS.textSize
    musicOn.value = DEFAULT_SETTINGS.musicOn
    musicVolume.value = DEFAULT_SETTINGS.musicVolume
    effectsOn.value = DEFAULT_SETTINGS.effectsOn
    effectsVolume.value = DEFAULT_SETTINGS.effectsVolume
    startMode.value = DEFAULT_SETTINGS.startMode
    reduceMotion.value = DEFAULT_SETTINGS.reduceMotion
  }

  return {
    theme,
    textSize,
    musicOn,
    musicVolume,
    effectsOn,
    effectsVolume,
    startMode,
    reduceMotion,
    resetToDefaults,
  }
})
