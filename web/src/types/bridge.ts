/** Types the bridge hands the UI (the engine's read-model types, re-exported). */
export type {
  ActStats,
  CompletionTree,
  MapExit,
  MapPlace,
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
  /** 1–8, 0 for the quick save, or -1 for a save made under a name. */
  slot: number
  /** The name a named save was made under (`save <name>`); unset for the quick save and the slots. */
  name?: string
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
