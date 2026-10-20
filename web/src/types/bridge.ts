/** Types the bridge hands the UI (the engine's read-model types, re-exported). */
export type {
  ActStats,
  CompletionTree,
  MusicInfo,
  NamedItem,
  QuestProgress,
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
}

/** Direction → destination room name. */
export interface RoomExits {
  [direction: string]: string
}
