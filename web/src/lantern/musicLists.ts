/**
 * The lists of music Audio Studio's Music workspace reads from the game: each
 * act's loop (`tts/act<N>/music.json`) and the quest stingers
 * (`tts/stingers.json`). They describe the tracks the game plays today, so new
 * music can be made for them; the game keeps playing its own files.
 * The tts scripts `extract-act.ts` and `extract-shared.ts` write them.
 */
import { NEW_QUEST_FILE, QUEST_COMPLETE_FILE } from '@/composables/questSounds'

/** Where the game's music files live (`/audio/music/` in `useMusic`), as paths inside the project root. */
const MUSIC_DIR = 'web/public/audio/music/'
/** Where the game's sound effects live (`/audio/soundeffects/` in `useAudio`), as paths inside the project root. */
const SOUND_EFFECTS_DIR = 'web/public/audio/soundeffects/'

/** One track in Audio Studio's format: a loop of an act, or a stinger. */
export interface MusicTrack {
  /** Slug naming the track's file in the studio's clips folder; unique across the game. */
  id: string
  /** Shown in the studio: the track's name in the file name. */
  title: string
  /** Where the game plays it. */
  plays: string
  /** The game's starting brief for new music, always instrumental. */
  brief: string
  /** Length in seconds (a stinger is at most 10). */
  seconds: number
  /** The music file the game plays for it now: a path inside the project root, which the studio only plays. */
  file?: string
  /** Tempo, where known; omitted when not measured. */
  bpm?: number
  /** Musical key such as "D major", where known; omitted when not measured. */
  key?: string
}

/** What describes a loop beyond its file name: where it plays, how it sounds and how long it is. */
type LoopBrief = Pick<MusicTrack, 'plays' | 'brief' | 'seconds'>

/** The loops by the music file the act plays today. */
const LOOP_BRIEFS: Record<string, LoopBrief> = {
  'Conquest - Market (freetouse.com).mp3': {
    plays: 'Act I, throughout',
    brief:
      'lively medieval market, plucked strings and light percussion, ' +
      'bustling and cheerful, instrumental, no vocals',
    seconds: 126,
  },
  'Walen - Medieval Village (freetouse.com).mp3': {
    plays: 'Act II, throughout',
    brief:
      'gentle medieval village, lute and recorder, warm and unhurried, ' +
      'instrumental, no vocals',
    seconds: 132,
  },
  'Orchestronika - Feel The Storm (freetouse.com).mp3': {
    plays: 'Act III, throughout',
    brief:
      'dramatic orchestral, rolling strings and drums, ' +
      'stormy and tense, instrumental, no vocals',
    seconds: 98,
  },
  'Conquest - The Silver Grail (freetouse.com).mp3': {
    plays: 'Act IV, throughout',
    brief:
      'epic and solemn orchestral, brass and strings, ' +
      'heroic and resolute, instrumental, no vocals',
    seconds: 90,
  },
}

/** The title in a freetouse.com file name: "Conquest - Market (freetouse.com).mp3" is "Market". */
const FILE_TITLE = /^.+? - (.+) \(freetouse\.com\)\.mp3$/

/** A title as a slug: "The Silver Grail" is "the-silver-grail". */
function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * The loop an act plays today, named after its file: none for an act without
 * music (`''`), and an error for a music file that has no title or brief here,
 * so a refresh never says "no loops" about an act that has music.
 */
export function actLoops(act: { musicFile: string }): MusicTrack[] {
  if (act.musicFile === '') return []
  const title = FILE_TITLE.exec(act.musicFile)?.[1]
  const brief = LOOP_BRIEFS[act.musicFile]
  if (!title || !brief)
    throw new Error(`No loop brief for music file "${act.musicFile}"`)
  return [
    { id: slug(title), title, file: `${MUSIC_DIR}${act.musicFile}`, ...brief },
  ]
}

/** The stingers: the sounds for a new quest and a completed quest, by the files the game plays. */
export function questStingers(): MusicTrack[] {
  const length = 5
  return [
    {
      id: 'new-quest',
      title: NEW_QUEST_FILE.replace(/^Voicy_|\.mp3$/g, ''),
      file: `${SOUND_EFFECTS_DIR}${NEW_QUEST_FILE}`,
      plays: 'When a new quest begins',
      brief:
        'short bright fanfare announcing a new quest, instrumental, no vocals',
      seconds: length,
    },
    {
      id: 'quest-complete',
      title: QUEST_COMPLETE_FILE.replace(/^Voicy_|\.mp3$/g, ''),
      file: `${SOUND_EFFECTS_DIR}${QUEST_COMPLETE_FILE}`,
      plays: 'When a quest is completed',
      brief:
        'short triumphant fanfare for a quest completed, instrumental, no vocals',
      seconds: length,
    },
  ]
}
