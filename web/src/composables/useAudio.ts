import { ref } from 'vue'

const STORAGE_KEY = 'retroquest_sfx_muted'
const SFX_BASE_PATH = '/python-src/retroquest/audio/soundeffects/'

const NEW_QUEST_FILE = 'Voicy_New Quest.mp3'
const QUEST_COMPLETE_FILE = 'Voicy_Quest Completed.mp3'

/** Minimal interface for an audio element that can play a sound. */
export interface AudioElement {
  play(): Promise<void>
}

/** Factory type that creates an AudioElement for a given URL. */
export type AudioFactory = (src: string) => AudioElement

const defaultAudioFactory: AudioFactory = (src) => new Audio(src)

/**
 * Composable for quest sound-effect playback with mute toggle and localStorage persistence.
 */
export function useAudio(audioFactory: AudioFactory = defaultAudioFactory) {
  const soundMuted = ref(localStorage.getItem(STORAGE_KEY) === 'true')

  function playSound(filename: string): void {
    if (soundMuted.value) return
    const audio = audioFactory(SFX_BASE_PATH + encodeURIComponent(filename))
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

  /** Toggle the sound-effects mute state and persist it to localStorage. */
  function toggleMute(): void {
    soundMuted.value = !soundMuted.value
    localStorage.setItem(STORAGE_KEY, String(soundMuted.value))
  }

  return {
    soundMuted,
    playNewQuest,
    playQuestComplete,
    toggleMute,
  }
}
