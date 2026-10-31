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

/** The credit shown for a take made in Content Studio. */
const CHOSEN_TAKE_CREDIT =
  'Original music for RetroQuest, made with Audio Studio'

const GESTURES = ['keydown', 'click', 'touchstart'] as const
/** The media keys the game takes from the browser, and ignores. */
const MEDIA_KEYS: readonly MediaSessionAction[] = ['play', 'pause', 'stop']

/**
 * The current act's background music, looping. Browsers block autoplay until
 * the player interacts, so it also starts on a key press, click or touch; and
 * since a headset taken out can still pause it, every later input brings it
 * back. A headset's or media key's pause and play are taken from the browser
 * and ignored, so neither the music nor the narration reacts to them. It dips
 * while a turn, chapter page or pop-up is narrated, so the voices stand out.
 *
 * A take chosen in Content Studio plays in place of the act's file: the room's
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

  function resume(): void {
    music.ensureMusicStarted()
  }
  for (const gesture of GESTURES) {
    window.addEventListener(gesture, resume, { passive: true })
  }
  setMediaKeyHandlers(() => {})
  onScopeDispose(() => {
    for (const gesture of GESTURES) window.removeEventListener(gesture, resume)
    setMediaKeyHandlers(null)
    music.loadTrack('', '')
  })

  return music
}

/**
 * Sets the page's handler for a headset's or media key's pause and play; a
 * page with its own handler gets those keys instead of the browser pausing
 * its audio. `null` gives them back to the browser.
 */
function setMediaKeyHandlers(handler: (() => void) | null): void {
  if (typeof navigator === 'undefined' || !navigator.mediaSession) return
  for (const action of MEDIA_KEYS) {
    try {
      navigator.mediaSession.setActionHandler(action, handler)
    } catch {
      // A browser that does not support this action keeps its own.
    }
  }
}
