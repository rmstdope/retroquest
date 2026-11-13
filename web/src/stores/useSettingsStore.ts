import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { LANTERN_TEXT_SCALE, type LanternTextSize } from '@/lantern/tokens'
import { appStorage } from '@/storage/appStorage'

/**
 * Player settings for the Lantern UI, saved in the browser's storage (`appStorage`).
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
  /** 0–100 */
  musicVolume: number
  /** 0–100 */
  effectsVolume: number
  /** 0–100 */
  narrationVolume: number
  startMode: StartMode
  reduceMotion: ReduceMotionSetting
  /** Whether the marks and names of what is in a room's picture stay on in every room. */
  alwaysShowNames: boolean
}

export const SETTINGS_STORAGE_KEY = 'retroquest_settings'

/** Mute flag written by useMusic before settings existed. */
export const LEGACY_MUTED_KEY = 'retroquest_music_muted'

/** Mute flag written by useAudio (sound effects) before settings existed. */
export const LEGACY_SFX_MUTED_KEY = 'retroquest_sfx_muted'

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  theme: 'device',
  textSize: 'medium',
  // Full volume until the Settings dialog (step 22) lets players adjust it,
  // so current players hear no change.
  musicVolume: 100,
  effectsVolume: 100,
  narrationVolume: 100,
  startMode: 'actions',
  reduceMotion: 'device',
  alwaysShowNames: false,
}

const THEMES: readonly ThemeSetting[] = ['device', 'light', 'dark']
const START_MODES: readonly StartMode[] = ['actions', 'type']
const REDUCE_MOTION: readonly ReduceMotionSetting[] = ['device', 'on', 'off']

function readStorage(key: string): string | null {
  try {
    return appStorage.getItem(key)
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

/**
 * Sound has no on/off switch any more, only a volume. A sound an older
 * version had switched off comes back at volume 0, so its silence is kept.
 */
function silencedIf(wasSwitchedOff: boolean, level: number): number {
  return wasSwitchedOff ? 0 : level
}

/**
 * Whether an old mute key says so. It counts only until the settings carry
 * their own value for that sound; the key itself is never removed.
 */
function legacyMuted(key: string): boolean {
  return readStorage(key) === 'true'
}

/** Read saved settings, validating each field against its default. */
function loadSettings(): Settings {
  const defaults: Settings = { ...DEFAULT_SETTINGS }
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
    musicVolume: silencedIf(
      stored.musicOn === false ||
        (legacyMuted(LEGACY_MUTED_KEY) &&
          stored.musicOn === undefined &&
          stored.musicVolume === undefined),
      volume(stored.musicVolume, defaults.musicVolume),
    ),
    effectsVolume: silencedIf(
      stored.effectsOn === false ||
        (legacyMuted(LEGACY_SFX_MUTED_KEY) &&
          stored.effectsOn === undefined &&
          stored.effectsVolume === undefined),
      volume(stored.effectsVolume, defaults.effectsVolume),
    ),
    narrationVolume: silencedIf(
      stored.narrationOn === false,
      volume(stored.narrationVolume, defaults.narrationVolume),
    ),
    startMode: oneOf(stored.startMode, START_MODES, defaults.startMode),
    reduceMotion: oneOf(
      stored.reduceMotion,
      REDUCE_MOTION,
      defaults.reduceMotion,
    ),
    alwaysShowNames: bool(stored.alwaysShowNames, defaults.alwaysShowNames),
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const initial = loadSettings()
  const theme = ref(initial.theme)
  const textSize = ref(initial.textSize)
  const musicVolume = ref(initial.musicVolume)
  const effectsVolume = ref(initial.effectsVolume)
  const narrationVolume = ref(initial.narrationVolume)
  const startMode = ref(initial.startMode)
  const reduceMotion = ref(initial.reduceMotion)
  const alwaysShowNames = ref(initial.alwaysShowNames)

  function snapshot(): Settings {
    return {
      theme: theme.value,
      textSize: textSize.value,
      musicVolume: musicVolume.value,
      effectsVolume: effectsVolume.value,
      narrationVolume: narrationVolume.value,
      startMode: startMode.value,
      reduceMotion: reduceMotion.value,
      alwaysShowNames: alwaysShowNames.value,
    }
  }

  watch(snapshot, (value) => {
    try {
      appStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value))
    } catch {
      // Storage unavailable: settings still apply for this visit.
    }
  })

  function resetToDefaults(): void {
    theme.value = DEFAULT_SETTINGS.theme
    textSize.value = DEFAULT_SETTINGS.textSize
    musicVolume.value = DEFAULT_SETTINGS.musicVolume
    effectsVolume.value = DEFAULT_SETTINGS.effectsVolume
    narrationVolume.value = DEFAULT_SETTINGS.narrationVolume
    startMode.value = DEFAULT_SETTINGS.startMode
    reduceMotion.value = DEFAULT_SETTINGS.reduceMotion
    alwaysShowNames.value = DEFAULT_SETTINGS.alwaysShowNames
  }

  return {
    theme,
    textSize,
    musicVolume,
    effectsVolume,
    narrationVolume,
    startMode,
    reduceMotion,
    alwaysShowNames,
    resetToDefaults,
  }
})
