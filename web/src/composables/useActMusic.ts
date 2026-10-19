import { onScopeDispose, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/useGameStore'
import { useMusic } from './useMusic'

const GESTURES = ['keydown', 'click', 'touchstart'] as const

/**
 * The current act's background music, looping. Browsers block autoplay until
 * the player interacts, so it also starts on the first key press, click or
 * touch. When the calling component's scope ends, the music stops and the
 * listeners are removed.
 */
export function useActMusic(): ReturnType<typeof useMusic> {
  const { musicFile, musicInfo } = storeToRefs(useGameStore())
  const audio = new Audio()
  audio.loop = true
  const music = useMusic(audio)

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
