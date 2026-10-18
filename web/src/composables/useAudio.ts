import { computed } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

const SFX_BASE_PATH = '/python-src/retroquest/audio/soundeffects/'

const NEW_QUEST_FILE = 'Voicy_New Quest.mp3'
const QUEST_COMPLETE_FILE = 'Voicy_Quest Completed.mp3'

/** Minimal interface for an audio element that can play a sound. */
export interface AudioElement {
  play(): Promise<void>
  /** 0–1 */
  volume: number
}

/** Factory type that creates an AudioElement for a given URL. */
export type AudioFactory = (src: string) => AudioElement

const defaultAudioFactory: AudioFactory = (src) => new Audio(src)

/**
 * Composable for quest sound-effect playback. On/off and volume come from the
 * player's settings.
 */
export function useAudio(audioFactory: AudioFactory = defaultAudioFactory) {
  const settings = useSettingsStore()
  const soundMuted = computed(() => !settings.effectsOn)

  function playSound(filename: string): void {
    if (soundMuted.value) return
    const audio = audioFactory(SFX_BASE_PATH + encodeURIComponent(filename))
    audio.volume = settings.effectsVolume / 100
    audio.play().catch(() => {})
  }

  /** Play the new-quest / quest-updated sound effect. */
  function playNewQuest(): void {
    playSound(NEW_QUEST_FILE)
  }

  /** Play the quest-completed sound effect. */
  function playQuestComplete(): void {
    playSound(QUEST_COMPLETE_FILE)
  }

  /** Toggle sound effects on or off (saved with the player's settings). */
  function toggleMute(): void {
    settings.effectsOn = !settings.effectsOn
  }

  return {
    soundMuted,
    playNewQuest,
    playQuestComplete,
    toggleMute,
  }
}
