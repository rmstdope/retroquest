import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useGameStore } from './useGameStore'

/** How long after the last input over the picture the marks and names leave. */
export const NAMES_HIDE_AFTER_MS = 4000

/**
 * Whether the marks and names of what is in the room's picture are showing,
 * and where the pointer is over the picture (for the one name that follows
 * it). They come in with `bump` (an input that counts, decided by the layout)
 * and leave by themselves 4 seconds after the last one. Walking to another
 * room, a load or a new act starts afresh: a clean painting. Nothing here is
 * saved.
 */
export const useAreaNamesStore = defineStore('areaNames', () => {
  const game = useGameStore()

  /** Whether the marks and names are showing in this room. */
  const showing = ref(false)
  /** The pointer over the picture, in the screen's pixels (client coordinates); null when it is not over it. */
  const pointer = ref<{ x: number; y: number } | null>(null)
  let timer: ReturnType<typeof setTimeout> | null = null

  /** Forget the wait for the marks to leave. */
  function clearTimer(): void {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  /** An input that counts: show them (or keep them up) and start the wait again. */
  function bump(): void {
    showing.value = true
    clearTimer()
    timer = setTimeout(turnOff, NAMES_HIDE_AFTER_MS)
  }

  /** Take them away now. */
  function turnOff(): void {
    clearTimer()
    showing.value = false
  }

  // Each room arrives as a clean painting.
  watch(
    () => [game.gameNumber, game.loadNumber, game.roomName] as const,
    () => {
      turnOff()
      pointer.value = null
    },
  )

  return { showing, pointer, bump, turnOff }
})
