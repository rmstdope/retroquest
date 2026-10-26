import { watch, type WatchStopHandle } from 'vue'
import { PANEL_GROUPS, useGameStore, type Turn } from '@/stores/useGameStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { firstQuestUnit } from '@/lantern/narrationUnits'
import { parseTurn } from '@/lantern/parseTurn'
import { blockVoice } from '@/lantern/narrationScript'

/**
 * Lets the side panels wait for a narrated turn.
 *
 * The game store holds the panels of a narrated command at their old state
 * (`useGameStore.releasePanels`); this decides when each group is released as
 * the narration reaches it: the place (room card, Here, map, header room and
 * act, and what the command box and target chips offer) when the turn's arrival is revealed, the quest count when its last
 * quest card is, and Bag and Spells when the turn is over. The room's music
 * moves with the new scene: at the answer's last spoken block when the turn
 * arrives somewhere (the dream's "You wake…"), else at the arrival itself;
 * never later than the place. A turn that ends
 * by a skip or a cut-in releases whatever is left without lighting it up.
 */
export function usePanelHold(): {
  track(turn: Turn): void
  settle(turn: Turn): void
  catchUp(): boolean
} {
  const game = useGameStore()
  const narration = useNarrationStore()
  let stop: WatchStopHandle | null = null

  /** Release every panel of `turn` at once, without a flash (nothing narrates it). */
  function settle(turn: Turn): void {
    stop?.()
    stop = null
    game.releasePanels(turn.id, [...PANEL_GROUPS], false)
  }

  /** Follow the narration of `turn`, releasing its panels as the voice reaches them. */
  function track(turn: Turn): void {
    stop?.()
    const blocks = parseTurn(turn.text)
    const arrival = turn.arrival ? blocks.length : -1
    const lastSpoken = blocks.reduce(
      (last, block, i) => (blockVoice(block) ? i : last),
      -1,
    )
    const scene = arrival >= 0 && lastSpoken >= 0 ? lastSpoken : arrival
    const quests = turn.quests?.length
      ? firstQuestUnit(turn) + turn.quests.length - 1
      : -1
    // The watch ends with its turn: every end of narration (a skip, a cut-in, the
    // layout unmounting) stops the turn, which stops this. Synchronous, so a press that skips the turn sees the new place at once.
    stop = watch(
      () => ({
        live: narration.narrates(turn.id),
        place: arrival >= 0 && narration.revealed(turn.id, arrival),
        scene: scene >= 0 && narration.revealed(turn.id, scene),
        quests: quests >= 0 && narration.revealed(turn.id, quests),
      }),
      (now) => {
        if (!now.live) {
          game.releasePanels(
            turn.id,
            [...PANEL_GROUPS],
            !narration.endedBySkip(turn.id),
          )
          stop?.()
          stop = null
          return
        }
        if (now.scene) game.releaseMusic(turn.id)
        if (now.place) game.releasePanels(turn.id, ['place'], true)
        if (now.quests) game.releasePanels(turn.id, ['quests'], true)
      },
      { immediate: true, flush: 'sync' },
    )
  }

  /** The player acted on a held panel: show the rest of the turn now. True if something was held. */
  function catchUp(): boolean {
    if (!game.panelsHeld) return false
    narration.skipAll()
    return true
  }

  return { track, settle, catchUp }
}
