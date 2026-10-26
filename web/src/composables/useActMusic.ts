import { onScopeDispose, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/useGameStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useMusic } from './useMusic'
import {
  chooseTrack,
  GENERATED_MUSIC_DIR,
  loadChosenManifest,
  trackIdsAt,
  type ChosenManifest,
} from './chosenMusic'

/** The credit shown for a take made in Audio Studio. */
const CHOSEN_TAKE_CREDIT =
  'Original music for RetroQuest, made with Audio Studio'

const GESTURES = ['keydown', 'click', 'touchstart'] as const

/**
 * The current act's background music, looping. Browsers block autoplay until
 * the player interacts, so it also starts on the first key press, click or
 * touch. It dips while a turn, chapter page or pop-up is narrated, so the
 * voices stand out.
 *
 * A take chosen in Audio Studio plays in place of the act's file: the room's
 * own take in that room, else the act loop's take across the act (see
 * `chosenMusic.ts`). The track waits for the list of takes to load, so it never
 * starts on the file and then swaps.
 *
 * When the calling component's scope ends, the music stops and the
 * listeners are removed.
 */
export function useActMusic(): ReturnType<typeof useMusic> {
  const { musicFile, musicInfo, musicActName, musicRoomKey } =
    storeToRefs(useGameStore())
  const chosen = ref<ChosenManifest | null>(null)
  void loadChosenManifest().then((manifest) => {
    chosen.value = manifest
  })
  const audio = new Audio()
  audio.loop = true
  const { isNarrating } = storeToRefs(useNarrationStore())
  const music = useMusic(audio, isNarrating)

  watch(
    [musicFile, musicInfo, musicActName, musicRoomKey, chosen],
    () => {
      if (chosen.value === null) return
      const take = chooseTrack(
        chosen.value,
        trackIdsAt(
          { actName: musicActName.value, roomKey: musicRoomKey.value },
          musicFile.value,
        ),
      )
      if (take)
        music.loadTrack(GENERATED_MUSIC_DIR + take.file, CHOSEN_TAKE_CREDIT)
      else music.loadTrack(musicFile.value, musicInfo.value)
    },
    { immediate: true },
  )

  function unlock(): void {
    music.ensureMusicStarted()
    removeListeners()
  }
  function removeListeners(): void {
    for (const gesture of GESTURES) window.removeEventListener(gesture, unlock)
  }
  for (const gesture of GESTURES) {
    window.addEventListener(gesture, unlock, { passive: true })
  }
  onScopeDispose(() => {
    removeListeners()
    if (!audio.paused) audio.pause()
  })

  return music
}
