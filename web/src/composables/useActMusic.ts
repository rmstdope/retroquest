import { onScopeDispose, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/useGameStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import {
  MUSIC_FADE_IN_MS,
  SILENCE,
  useMusic,
  type AmbienceSource,
} from './useMusic'
import { prepareAmbience, type Ambience } from './ambience'
import { loadChosenEffects, sceneClips } from './chosenEffects'
import { fetchAudioBuffer } from './musicVoice'
import { roomTrackId } from '@/lantern/musicLists'
import { sceneMixOf } from '@/lantern/sceneMix'
import { PLAIN_SOUND_STATE, sceneStateOf } from '@/lantern/sceneLists'
import {
  ACT_FILE,
  GENERATED_MUSIC_DIR,
  loadChosenManifest,
  sceneMusic,
  type ChosenManifest,
} from './chosenMusic'

/**
 * The credit shown for a take made in Content Studio: what the music is, then
 * what the studio made. The title page and Help show both lines; Settings
 * shows the first.
 */
const CHOSEN_TAKE_CREDIT =
  'Original music for RetroQuest\n' +
  'Images, narration and music made with Content Studio'

const GESTURES = ['keydown', 'click', 'touchstart'] as const
/** The media keys the game takes from the browser, and ignores. */
const MEDIA_KEYS: readonly MediaSessionAction[] = ['play', 'pause', 'stop']

/**
 * The current act's background music, looping (gaplessly on Web Audio where
 * the browser can, else on an element). Browsers block autoplay until
 * the player interacts, so it also starts on a key press, click or touch; and
 * since a headset taken out can still pause it, every later input brings it
 * back. A headset's or media key's pause and play are taken from the browser
 * and ignored, so neither the music nor the narration reacts to them. It dips
 * while a turn, chapter page or pop-up is narrated, so the voices stand out.
 *
 * Each room is a scene of Content Studio's scene mix (`sceneMix.ts`, under the
 * room's track id), which may name its music and level. Where it names none, a
 * take chosen in the studio plays in place of the act's file: the room's own
 * take in that room, else the act loop's take across the act (see
 * `chosenMusic.ts`). The track waits for the list of takes to load, so it never
 * starts on the file and then swaps.
 *
 * The first track, when it loads under the game's title page, fades in over
 * `MUSIC_FADE_IN_MS`.
 *
 * A room plays the chosen sound effects its scene's mix lists, through one
 * effects bus at the player's effects volume, with its music or with none:
 * they start with the music, fade with it and stop with it, and walking on
 * under music that carries on swaps them for the next room's. The effects
 * follow the room's sound state (`musicSoundState`, '' read as the scenes'
 * `plain`), held and released with the music's room: a whir stops as the
 * mechanism is jammed. A trigger the game fires in the room sounds, once each
 * time, the effects its mix binds to it, as the narration reaches the scene
 * (`musicSoundFirings`); it is not kept for effects not yet loaded. With the effects off, none are fetched; a clip shared
 * by the last two rooms is decoded once.
 *
 * When the calling component's scope ends, the music stops and the
 * listeners are removed.
 */
export function useActMusic(): ReturnType<typeof useMusic> {
  const {
    musicFile,
    musicInfo,
    musicActName,
    musicRoomKey,
    musicSoundState,
    musicSoundFirings,
    showTitle,
    scenePicture,
  } = storeToRefs(useGameStore())
  const chosen = ref<ChosenManifest | null>(null)
  void loadChosenManifest().then((manifest) => {
    chosen.value = manifest
  })
  const chosenEffects = loadChosenEffects()
  const settings = useSettingsStore()
  const effectsLevel = (): number =>
    settings.effectsOn ? settings.effectsVolume / 100 : 0
  /** Where every effect plays into, at the effects volume; made with the first. */
  let effectsBus: GainNode | null = null
  /** Set when the scope ends, so an ambience still being prepared makes no bus. */
  let disposed = false
  /** The ambiences not yet let go of, each with its scene: the room's and any fading out. */
  let ambiences: { scene: string; ambience: Ambience }[] = []
  /** The scene of the room the music plays in; '' outside a room. */
  const roomScene = (): string =>
    musicActName.value === '' || musicRoomKey.value === ''
      ? ''
      : roomTrackId(musicActName.value, musicRoomKey.value)
  /** The sound state each scene was last in while the music played there. */
  const lastStates: Record<string, string> = {}
  /**
   * Gives the room's sound state to its own scene's ambience; the others keep
   * the state their scene was left in, even one that arrives after it.
   */
  const followSoundState = (): void => {
    const room = roomScene()
    if (room !== '') lastStates[room] = sceneStateOf(musicSoundState.value)
    ambiences = ambiences.filter(({ ambience }) => !ambience.disposed)
    for (const { scene, ambience } of ambiences)
      ambience.setState(lastStates[scene] ?? PLAIN_SOUND_STATE)
  }
  /**
   * The decoded clips by URL, so a clip shared by rooms is decoded once. Only
   * the clips of the last two rooms are kept (a 20 s loop is megabytes).
   */
  const decoded = new Map<string, Promise<AudioBuffer | null>>()
  /** The clip URLs of the room before the latest. */
  let previousUrls: string[] = []
  /** The clip URLs of the latest room. */
  let latestUrls: string[] = []
  /** Keeps the clips of `urls` and of the room before; lets go of the rest. */
  const keepClips = (urls: string[]): void => {
    previousUrls = latestUrls
    latestUrls = urls
    for (const url of [...decoded.keys()])
      if (!urls.includes(url) && !previousUrls.includes(url))
        decoded.delete(url)
  }
  const ambienceFor: AmbienceSource = async (scene, context) => {
    // With the effects off, nothing is fetched; they come with the next room.
    if (effectsLevel() === 0) return null
    const clips =
      scene === '' ? [] : sceneClips(sceneMixOf(scene), await chosenEffects)
    keepClips(clips.map((clip) => clip.url))
    if (clips.length === 0 || disposed) return null
    if (!effectsBus) {
      effectsBus = context.createGain()
      effectsBus.gain.value = effectsLevel()
      effectsBus.connect(context.destination)
    }
    const load = (url: string): Promise<AudioBuffer | null> => {
      let buffer = decoded.get(url)
      if (!buffer) {
        buffer = fetchAudioBuffer(context, url)
        decoded.set(url, buffer)
        // A clip that could not be had is tried again in the next room.
        const pending = buffer
        void pending.then((clip) => {
          if (!clip && decoded.get(url) === pending) decoded.delete(url)
        })
      }
      return buffer
    }
    const ambience = await prepareAmbience(context, clips, effectsBus, load)
    if (ambience) {
      ambiences.push({ scene, ambience })
      followSoundState()
    }
    return ambience
  }
  watch([musicActName, musicRoomKey, musicSoundState], followSoundState, {
    immediate: true,
  })
  /** Sounds the effects bound to each trigger the game fired in the music's room. */
  watch(musicSoundFirings, (firings) => {
    for (const { roomKey, trigger } of firings) {
      if (roomKey !== musicRoomKey.value) continue
      const scene = roomTrackId(musicActName.value, roomKey)
      for (const entry of ambiences)
        if (entry.scene === scene && !entry.ambience.disposed)
          entry.ambience.fire(trigger)
    }
  })
  watch(effectsLevel, (level) => {
    if (effectsBus) effectsBus.gain.value = level
  })
  const audio = new Audio()
  audio.loop = true
  const { isNarrating } = storeToRefs(useNarrationStore())
  const music = useMusic(audio, isNarrating, ambienceFor)
  /** Whether a track has been asked for yet; only the first can be the title page's. */
  let started = false

  /** The act and room last played, to tell a walk within the act from anything else. */
  let played = { act: '', room: '' }

  watch(
    [musicFile, musicInfo, musicActName, musicRoomKey, chosen],
    () => {
      if (chosen.value === null) return
      const scene = roomScene()
      const { music: choice, level } = sceneMusic(
        { actName: musicActName.value, roomKey: musicRoomKey.value },
        musicFile.value,
        chosen.value,
        scene === '' ? undefined : sceneMixOf(scene),
      )
      // The title page's music rises over two seconds; no other starts so.
      const fadeInMs = !started && showTitle.value ? MUSIC_FADE_IN_MS : 0
      started = true
      // A walk to another room of the act on the picture stage goes through the dark.
      const through =
        scenePicture.value &&
        !motionReduced() &&
        played.act === musicActName.value &&
        played.room !== '' &&
        musicRoomKey.value !== '' &&
        played.room !== musicRoomKey.value
      played = { act: musicActName.value, room: musicRoomKey.value }
      const at = { scene, level }
      if (musicFile.value === '') music.loadTrack('', '')
      else if (choice === ACT_FILE)
        music.loadTrack(musicFile.value, musicInfo.value, fadeInMs, through, at)
      else if (choice === null)
        music.loadTrack(SILENCE, '', fadeInMs, through, at)
      else
        music.loadTrack(
          GENERATED_MUSIC_DIR + choice.file,
          CHOSEN_TAKE_CREDIT,
          fadeInMs,
          through,
          at,
        )
    },
    { immediate: true },
  )

  function resume(): void {
    music.ensureMusicStarted()
  }
  for (const gesture of GESTURES) {
    window.addEventListener(gesture, resume, { passive: true })
  }
  setMediaKeyHandlers(() => {})
  onScopeDispose(() => {
    for (const gesture of GESTURES) window.removeEventListener(gesture, resume)
    setMediaKeyHandlers(null)
    music.loadTrack('', '')
    disposed = true
    effectsBus?.disconnect()
  })

  return music
}

/** Whether the game's "less motion" setting (or the system's) is on. */
function motionReduced(): boolean {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue('--lq-motion')
      .trim() === '0'
  )
}

/**
 * Sets the page's handler for a headset's or media key's pause and play; a
 * page with its own handler gets those keys instead of the browser pausing
 * its audio. `null` gives them back to the browser.
 */
function setMediaKeyHandlers(handler: (() => void) | null): void {
  if (typeof navigator === 'undefined' || !navigator.mediaSession) return
  for (const action of MEDIA_KEYS) {
    try {
      navigator.mediaSession.setActionHandler(action, handler)
    } catch {
      // A browser that does not support this action keeps its own.
    }
  }
}
