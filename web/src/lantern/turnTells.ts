import type { Turn } from '@/stores/useGameStore'

/**
 * Whether a turn has anything for the narration paper to tell: an answer (an
 * error reply too), an item or spell chip, a quest card or a room arrival.
 * This is the one place that decides it; a turn that tells nothing shows no
 * paper and no tab.
 */
export function turnTells(turn: Turn): boolean {
  return (
    turn.text.trim() !== '' ||
    !!turn.arrival ||
    turn.gained.length > 0 ||
    turn.lost.length > 0 ||
    (turn.quests?.length ?? 0) > 0
  )
}
