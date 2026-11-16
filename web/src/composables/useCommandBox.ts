import { onUnmounted, ref, watch, type Ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'

/**
 * Whether the typing box is up, for keyboard play. F1 brings it up and F1
 * again hides it; the key is taken, so the browser's own help never opens.
 * Where there is no box (`canType` false: a phone plays by pointing only) F1
 * is left alone and the box is put away if the screen becomes a phone. The
 * box starts hidden whenever a game begins (a restart); loading a save during
 * play leaves it as it was.
 */
export function useCommandBox(canType: Ref<boolean>): {
  open: Ref<boolean>
  hide: () => void
} {
  const game = useGameStore()
  const open = ref(false)

  function onKey(event: KeyboardEvent): void {
    if (event.key !== 'F1' || !canType.value) return
    event.preventDefault()
    event.stopPropagation()
    if (!event.repeat) open.value = !open.value
  }
  window.addEventListener('keydown', onKey, true)
  onUnmounted(() => window.removeEventListener('keydown', onKey, true))

  watch(canType, (can) => {
    if (!can) open.value = false
  })
  watch(
    () => game.gameNumber,
    () => (open.value = false),
  )

  /** Put the box away. */
  function hide(): void {
    open.value = false
  }
  return { open, hide }
}
