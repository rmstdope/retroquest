import { onScopeDispose, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/useGameStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { MUSIC_FADE_IN_MS, useMusic, type AmbienceSource } from './useMusic'
import { prepareAmbience } from './ambience'
import { ambientClipsFor, loadChosenEffects } from './chosenEffects'
import {
  chooseTrack,
  GENERATED_MUSIC_DIR,
  loadChosenManifest,
  trackIdsAt,
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
 * A take chosen in Content Studio plays in place of the act's file: the room's
 * own take in that room, else the act loop's take across the act (see
 * `chosenMusic.ts`). The track waits for the list of takes to load, so it never
 * starts on the file and then swaps.
 *
 * The first track, when it loads under the game's title page, fades in over
 * `MUSIC_FADE_IN_MS`.
 *
 * A room's chosen take plays the room's chosen sound effects with it (see
 * `effectLists.ts`), through one effects bus at the player's effects volume:
 * they start with the take, fade with it and stop with it.
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
  const ambienceFor: AmbienceSource = async (file, context) => {
    const clips = chosen.value
      ? ambientClipsFor(file, chosen.value, await chosenEffects)
      : []
    if (clips.length === 0) return null
    if (!effectsBus) {
      effectsBus = context.createGain()
      effectsBus.gain.value = effectsLevel()
      effectsBus.connect(context.destination)
    }
    return prepareAmbience(context, clips, effectsBus)
  }
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
      const take = chooseTrack(
        chosen.value,
        trackIdsAt(
          { actName: musicActName.value, roomKey: musicRoomKey.value },
          musicFile.value,
        ),
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
      if (take)
        music.loadTrack(
          GENERATED_MUSIC_DIR + take.file,
          CHOSEN_TAKE_CREDIT,
          fadeInMs,
          through,
        )
      else music.loadTrack(musicFile.value, musicInfo.value, fadeInMs, through)
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
