/**
 * The lists of music Content Studio's Music workspace reads from the game: each
 * act's loop (`tts/act<N>/music.json`) and the quest stingers
 * (`tts/stingers.json`). They describe the tracks the game plays today, so new
 * music can be made for them; the game keeps playing its own files.
 * The tts scripts `extract-act.ts` and `extract-shared.ts` write them.
 */
import { NEW_QUEST_FILE, QUEST_COMPLETE_FILE } from '@/composables/questSounds'
import type { Act } from '@/engine'
import { narrationText } from './narrationKey'

/** Where the game's music files live (`/audio/music/` in `useMusic`), as paths inside the project root. */
const MUSIC_DIR = 'web/public/audio/music/'
/** Where the game's sound effects live (`/audio/soundeffects/` in `useAudio`), as paths inside the project root. */
const SOUND_EFFECTS_DIR = 'web/public/audio/soundeffects/'

/** One track in Content Studio's format: a loop of an act, or a stinger. */
export interface MusicTrack {
  /** Slug naming the track's file in the studio's clips folder; unique across the game. */
  id: string
  /** Shown in the studio: "Act 1 Opening" for an act's loop, the room's name for a room's, the sound file's name for a stinger. */
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

/** Length of a room's loop in seconds, a starting point for the studio. */
const ROOM_LOOP_SECONDS = 60
/** How much of a room's description goes into its brief, cut at a sentence end. */
const BRIEF_DESCRIPTION_CHARS = 200

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
 * The loop an act plays today, titled "Act <N> Opening" after its act while
 * its id stays the slug of the file's title, which a chosen take is keyed by:
 * none for an act without music (`''`), and an error for a music file that has
 * no title or brief here, so a refresh never says "no loops" about an act that
 * has music.
 */
export function actLoops(act: {
  name: string
  musicFile: string
}): MusicTrack[] {
  if (act.musicFile === '') return []
  const fileTitle = FILE_TITLE.exec(act.musicFile)?.[1]
  const brief = LOOP_BRIEFS[act.musicFile]
  if (!fileTitle || !brief)
    throw new Error(`No loop brief for music file "${act.musicFile}"`)
  const number = /\d+$/.exec(act.name)?.[0]
  const title = number ? `Act ${number} Opening` : act.name
  return [
    {
      id: slug(fileTitle),
      title,
      file: `${MUSIC_DIR}${act.musicFile}`,
      ...brief,
    },
  ]
}

/** The id of an act's loop from the music file it plays: "Market" is "market". */
export function actLoopId(musicFile: string): string {
  const title = FILE_TITLE.exec(musicFile)?.[1]
  return title ? slug(title) : ''
}

/** The id of a room's track: act `Act1` and room key `VillageSquare` give `act1-village-square`. */
export function roomTrackId(actName: string, roomKey: string): string {
  return `${slug(actName)}-${slug(roomKey.replace(/([a-z0-9])([A-Z])/g, '$1 $2'))}`
}

/** "Act1" as "Act I" (the act's heading label), or the name itself when it has no number. */
function actLabel(actName: string): string {
  const number = Number(/\d+$/.exec(actName)?.[0])
  const numerals = ['I', 'II', 'III', 'IV']
  return numerals[number - 1] ? `Act ${numerals[number - 1]}` : actName
}

/** The opening sentences of a description that fit the brief, markup stripped. */
function descriptionOpening(description: string): string {
  const sentences = narrationText(description).match(/[^.!?]+[.!?]*/g) ?? []
  let opening = ''
  for (const sentence of sentences) {
    const next = `${opening} ${sentence.trim()}`.trim()
    if (opening && next.length > BRIEF_DESCRIPTION_CHARS) break
    opening = next
  }
  return opening.replace(/[.!?]+$/, '')
}

/**
 * One loop slot for each room of the act, briefed from the room's own name and
 * description. A room plays no file of its own: until the navigator chooses a
 * take, the game plays the act's loop there.
 */
export function roomLoops(act: Act): MusicTrack[] {
  return Object.entries(act.rooms).map(([key, room]) => ({
    id: roomTrackId(act.name, key),
    title: room.name,
    plays: `${actLabel(act.name)}, ${room.name}`,
    brief:
      `instrumental background loop for ${room.name}: ` +
      `${descriptionOpening(room.description)}, no vocals`,
    seconds: ROOM_LOOP_SECONDS,
  }))
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
