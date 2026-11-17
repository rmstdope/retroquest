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

/** The picture a save was made looking at: the room's painting, its other picture and the patches drawn over it. */
export interface SavePicture {
  /** The act's name as pictures are filed under it (`Act1`). */
  actName: string
  roomKey: string
  /** The room's other picture the story had changed to; '' for its plain one. */
  variant: string
  /** The ids of the patches that applied to the story when it was saved. */
  patchIds: string[]
}

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
  /** The picture of the room as the player left it; unset for saves made before it was kept. */
  picture?: SavePicture
  /** True for a save made by an older version of the game, which can no longer be loaded. */
  outdated?: boolean
}

/** Direction → destination room name. */
export interface RoomExits {
  [direction: string]: string
}
