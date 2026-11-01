import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { Turn } from '@/stores/useGameStore'
import { turnTells } from '@/lantern/turnTells'

/** What the narration paper offers the layout. */
export interface NarrationPaper {
  /** The paper is slid down to its tab. */
  hidden: Ref<boolean>
  /** The turns the paper holds: the current one only. */
  shownTurns: ComputedRef<Turn[]>
  /** There is a paper (or its tab): the current turn has something to tell. */
  visible: ComputedRef<boolean>
  hide(): void
  show(): void
  toggle(): void
}

/**
 * State of the narration paper on the laptop stage. Nothing is saved: a new
 * turn, or a change of `resetKey` (a new game, a load, a new act), opens the
 * paper on the current turn again.
 */
export function useNarrationPaper(
  turns: () => Turn[],
  resetKey: () => string,
): NarrationPaper {
  const hidden = ref(false)
  const last = computed(() => turns().at(-1))
  const visible = computed(() => !!last.value && turnTells(last.value))
  const shownTurns = computed(() => (last.value ? [last.value] : []))

  watch([() => last.value?.id, resetKey], () => {
    hidden.value = false
  })

  return {
    hidden,
    shownTurns,
    visible,
    hide: () => {
      hidden.value = true
    },
    show: () => {
      hidden.value = false
    },
    toggle: () => {
      hidden.value = !hidden.value
    },
  }
}
