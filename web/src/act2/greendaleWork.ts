import type { GameState } from '@/engine'
import {
  QUEST_ANCIENT_LIBRARY,
  QUEST_HEALERS_APPRENTICE,
  QUEST_SUPPLIES_FOR_THE_JOURNEY,
} from './Act2StoryFlags'

/**
 * Greendale's work before the forest: the quests the Forest Transition's way
 * east waits on, and the check the room, the hermit and the camp share so the
 * gate and the lines about it never disagree.
 */

/** The quests Greendale holds the player to before the forest opens. */
export const GREENDALE_QUESTS = [
  "The Knight's Test",
  QUEST_SUPPLIES_FOR_THE_JOURNEY,
  'Echoes of the Past',
  QUEST_HEALERS_APPRENTICE,
  QUEST_ANCIENT_LIBRARY,
]

/** Whether every quest Greendale holds the player to before the forest is done. */
export function greendaleWorkDone(gameState: GameState): boolean {
  return GREENDALE_QUESTS.every((questName) =>
    gameState.isQuestCompleted(questName),
  )
}
