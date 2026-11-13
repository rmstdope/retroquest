import { useSettingsStore } from '@/stores/useSettingsStore'
import {
  loadChosenManifest,
  GENERATED_MUSIC_DIR,
  type ChosenManifest,
  type ChosenTake,
} from './chosenMusic'
import {
  NEW_QUEST_FILE,
  QUEST_COMPLETE_FILE,
  SPELL_LEARNED_ID,
} from './questSounds'

const SFX_BASE_PATH = '/audio/soundeffects/'
const GENERATED_MUSIC_PATH = `/audio/music/${GENERATED_MUSIC_DIR}`

/** Minimal interface for an audio element that can play a sound. */
export interface AudioElement {
  play(): Promise<void>
  /** 0–1 */
  volume: number
  /** Muted at volume 0, since a phone ignores `volume`. */
  muted?: boolean
}

/** Factory type that creates an AudioElement for a given URL. */
export type AudioFactory = (src: string) => AudioElement

const defaultAudioFactory: AudioFactory = (src) => new Audio(src)

/**
 * Composable for quest and spell sound-effect playback. On/off and volume come
 * from the player's settings. The spell sound is the Spell Learned take chosen in
 * Content Studio, found in the generated music manifest (`loadManifest`); with no
 * take it is silent.
 */
export function useAudio(
  audioFactory: AudioFactory = defaultAudioFactory,
  loadManifest: () => Promise<ChosenManifest> = loadChosenManifest,
) {
  const settings = useSettingsStore()

  let spellTake: ChosenTake | null = null
  void loadManifest()
    .then((manifest) => {
      spellTake = Object.hasOwn(manifest, SPELL_LEARNED_ID)
        ? manifest[SPELL_LEARNED_ID]
        : null
    })
    .catch(() => {})

  function playUrl(url: string): void {
    const audio = audioFactory(url)
    audio.volume = settings.effectsVolume / 100
    audio.muted = settings.effectsVolume === 0
    audio.play().catch(() => {})
  }

  function playSound(filename: string): void {
    playUrl(SFX_BASE_PATH + encodeURIComponent(filename))
  }

  /** Play the new-quest / quest-updated sound effect. */
  function playNewQuest(): void {
    playSound(NEW_QUEST_FILE)
  }

  /** Play the quest-completed sound effect. */
  function playQuestComplete(): void {
    playSound(QUEST_COMPLETE_FILE)
  }

  /** Play the learned-spell stinger chosen in the studio (silent when none was chosen). */
  function playNewSpell(): void {
    if (spellTake)
      playUrl(GENERATED_MUSIC_PATH + encodeURIComponent(spellTake.file))
  }

  return {
    playNewQuest,
    playQuestComplete,
    playNewSpell,
  }
}
