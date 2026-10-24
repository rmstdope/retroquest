import { nextTick, ref, watch, type Ref } from 'vue'
import { useGameStore, type PanelGroup } from '@/stores/useGameStore'

/**
 * Whether a panel's border lights amber: set when one of its `groups` has just
 * switched as the narration reached it (never for a skip or catch-up), cleared
 * by `endFlash` when the animation ends. The light itself is the `lq-flash`
 * class (lantern.css), which reduced motion turns into nothing.
 */
export function usePanelFlash(groups: PanelGroup[]): {
  flashing: Ref<boolean>
  endFlash: () => void
} {
  const game = useGameStore()
  const flashing = ref(false)
  watch(
    () => groups.map((group) => game.panelFlash[group]).join(','),
    async () => {
      // Each switch restarts the light.
      flashing.value = false
      await nextTick()
      flashing.value = true
    },
  )
  return {
    flashing,
    endFlash: (): void => {
      flashing.value = false
    },
  }
}
