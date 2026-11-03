/** Types the bridge hands the UI (the engine's read-model types, re-exported). */
export type {
  ActStats,
  CompletionTree,
  MusicInfo,
  NamedItem,
  QuestDetails,
  QuestPayloads,
  QuestProgress,
  QuestReport,
  QuestSummary,
  ResultScreen,
  RoomWare,
} from '@/engine'

/** One entry in the 8-slot save system. */
export interface SaveSlot {
  /** 1–8, or 0 for the quick save. */
  slot: number
  act: string | null
  room: string | null
  timestamp: string | null
  /** The act's quests done/total when saved (null for older saves). */
  quests: { completed: number; total: number } | null
  /** True for a save made by an older version of the game, which can no longer be loaded. */
  outdated?: boolean
}

/** Direction → destination room name. */
export interface RoomExits {
  [direction: string]: string
}
