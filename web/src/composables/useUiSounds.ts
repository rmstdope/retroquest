import { useSettingsStore } from '@/stores/useSettingsStore'
import { TITLE_CHOOSE_EFFECT, TITLE_MOVE_EFFECT } from '@/lantern/effectLists'
import type { AudioFactory } from './useAudio'
import { GENERATED_EFFECTS_PATH, loadChosenEffects } from './chosenEffects'
import type { ChosenManifest } from './chosenMusic'

/**
 * Composable for the interface's own sound effects (the ring move and choose
 * sounds of the title page and the menus): the takes chosen in Content
 * Studio's Sound effects workspace, played at the player's effects volume. An effect with no chosen
 * take is silent, and so is every effect while the player's Menu clicks
 * setting is off.
 */
export function useUiSounds(
  audioFactory: AudioFactory = (src) => new Audio(src),
  loadEffects: () => Promise<ChosenManifest> = loadChosenEffects,
): { playMove(): void; playChoose(): void } {
  const settings = useSettingsStore()
  let takes: ChosenManifest = {}
  void loadEffects()
    .then((manifest) => {
      takes = manifest
    })
    .catch(() => {})

  /** Play the take chosen for `id`, if any. */
  function play(id: string): void {
    if (!settings.menuClicks || !Object.hasOwn(takes, id)) return
    const audio = audioFactory(GENERATED_EFFECTS_PATH + takes[id].file)
    audio.volume = settings.effectsVolume / 100
    audio.muted = settings.effectsVolume === 0
    audio.play().catch(() => {})
  }

  return {
    /** The soft ting of the title page's ring moving to another choice. */
    playMove: (): void => play(TITLE_MOVE_EFFECT),
    /** The brass latch of a choice being made. */
    playChoose: (): void => play(TITLE_CHOOSE_EFFECT),
  }
}
