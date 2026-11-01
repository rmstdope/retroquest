import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { Turn } from '@/stores/useGameStore'
import { startsFresh, turnHasCard, turnTells } from '@/lantern/turnTells'

/** The most cards the laptop stage keeps; older ones are gone. */
export const MAX_CARDS = 8

/** What the narration paper offers the layout. */
export interface NarrationPaper {
  /** The paper is slid down to its tab. */
  hidden: Ref<boolean>
  /** The turns the paper holds: the current one only, or on the laptop the cards since the last room change. */
  shownTurns: ComputedRef<Turn[]>
  /** There is a paper (or its tab): the current turn has something to tell. */
  visible: ComputedRef<boolean>
  hide(): void
  show(): void
  toggle(): void
}

/**
 * State of the narration paper. Nothing is saved: a new turn, or a change of
 * `resetKey` (a new game, a load, a new act), opens the paper on the current
 * turn again. On the laptop (`wide`) the paper is the column of narration
 * cards: one for every turn that leaves one since the last room change (see
 * `startsFresh`), at most `MAX_CARDS`, derived from the turns themselves.
 */
export function useNarrationPaper(
  turns: () => Turn[],
  resetKey: () => string,
  wide: () => boolean = () => false,
): NarrationPaper {
  const hidden = ref(false)
  const last = computed(() => turns().at(-1))
  const cards = computed(() => {
    const all = turns()
    let fresh = all.length - 1
    while (fresh > 0 && !startsFresh(all[fresh])) fresh--
    return all.slice(Math.max(fresh, 0)).filter(turnHasCard).slice(-MAX_CARDS)
  })
  const visible = computed(() =>
    wide() ? cards.value.length > 0 : !!last.value && turnTells(last.value),
  )
  const shownTurns = computed(() =>
    wide() ? cards.value : last.value ? [last.value] : [],
  )

  // A new turn with a card (or something to tell) opens the paper again; one
  // with neither leaves it as it is. A new game, a load or a new act always do.
  watch(
    () => last.value?.id,
    () => {
      if (!wide() || (last.value && turnHasCard(last.value)))
        hidden.value = false
    },
  )
  watch(resetKey, () => {
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
