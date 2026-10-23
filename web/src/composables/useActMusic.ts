import { onScopeDispose, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/useGameStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useMusic } from './useMusic'

const GESTURES = ['keydown', 'click', 'touchstart'] as const

/**
 * The current act's background music, looping. Browsers block autoplay until
 * the player interacts, so it also starts on the first key press, click or
 * touch. It dips while a turn, chapter page or pop-up is narrated, so the
 * voices stand out. When the calling component's scope ends, the music stops and the
 * listeners are removed.
 */
export function useActMusic(): ReturnType<typeof useMusic> {
  const { musicFile, musicInfo } = storeToRefs(useGameStore())
  const audio = new Audio()
  audio.loop = true
  const { isNarrating } = storeToRefs(useNarrationStore())
  const music = useMusic(audio, isNarrating)

  watch(
    [musicFile, musicInfo],
    ([file, info]) => {
      music.loadTrack(file, info)
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
