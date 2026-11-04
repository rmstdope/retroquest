import { computed, ref, watch, type Ref } from 'vue'
import { escapeHtml } from '@/utils/theme'
import { useSettingsStore } from '@/stores/useSettingsStore'
import {
  HtmlMusicVoice,
  prepareWebAudioVoice,
  sharedAudioContext,
  SilentMusicVoice,
  type MusicVoice,
} from './musicVoice'
import { AmbientVoice, type Ambience } from './ambience'

const MUSIC_BASE_PATH = '/audio/music/'
const URL_PATTERN = /(https?:\/\/[^\s]+)/g

/** Share of the music volume kept while a voice narrates (about -9 dB). */
export const MUSIC_DUCK = 0.35
/** How long the music takes to dip under a voice, or to come back up, in ms. */
export const MUSIC_DUCK_FADE_MS = 400
/** How long one loop takes to fade out while the next fades in, in ms. */
export const MUSIC_CROSSFADE_MS = 1500
/**
 * How long a change of loop through the dark takes (a change of scene), in ms:
 * the old loop fades out over the first half, the new one rises over the second.
 */
export const MUSIC_THROUGH_MS = 2000
/** How long the title page's music takes to rise from silence, in ms. */
export const MUSIC_FADE_IN_MS = 2000
/** Steps per fade. */
const FADE_STEPS = 10

/**
 * The file to load for a scene with no music: its effects play on their own,
 * on a silent voice that fades as music would.
 */
export const SILENCE = 'silence:'

/** Where the music plays: the scene whose effects sound with it, and the music's own level (0 to 3). */
export interface MusicScene {
  /** The scene's id; '' for none, which has no effects. */
  scene: string
  /** The music's level from the scene's mix, 1 as chosen. */
  level: number
}

/** Music that plays in no scene, at its level as chosen. */
const NO_SCENE: MusicScene = { scene: '', level: 1 }

/**
 * The sound effects of a scene, prepared on `context`; null when it has none.
 * See `ambience.ts`.
 */
export type AmbienceSource = (
  scene: string,
  context: AudioContext,
) => Promise<Ambience | null>

/** No music file has sound effects. */
const NO_AMBIENCE: AmbienceSource = () => Promise.resolve(null)

/**
 * Background music for the current act. On/off and volume come from the
 * player's settings, so changes made anywhere (top bar, Settings dialog)
 * apply immediately. While `narrating` is true the music fades down to
 * `MUSIC_DUCK` of its volume, so voices stand out, and fades back up after.
 * When a different track replaces one that is playing, the old one keeps
 * playing on its own element and fades out while the new one fades in on a
 * second element (`MUSIC_CROSSFADE_MS`), so the old loop never reloads and
 * never drops out; the same track again changes nothing. A change `through`
 * the dark (a change of scene) fades the old loop out over the first half of
 * `MUSIC_THROUGH_MS` and raises the new one over the second. A track loaded with
 * a fade-in time, with nothing playing, rises from silence once it sounds.
 *
 * Loops play on Web Audio (see `musicVoice.ts`): a track is decoded first, the
 * music already playing goes on until it is ready, and the loop then comes
 * round without a click. A browser that cannot decode it plays the element, as
 * before.
 *
 * Each track is loaded in a scene (`MusicScene`): the scene's sound effects,
 * which `ambienceFor` gives, play with its loop on Web Audio (see
 * `ambience.ts`). They start and stop with the music and follow each of its
 * fades, but not the music's own level, which raises or lowers the loop
 * alone. The same track loaded in another scene carries on, at the new level
 * at once, and swaps the effects for the new scene's; so does a loop taken
 * back while it fades out. `SILENCE` plays a scene's effects with no music.
 * A track played on an element plays no effects and ignores its level.
 */
export function useMusic(
  audio: HTMLAudioElement,
  narrating: Readonly<Ref<boolean>> = ref(false),
  ambienceFor: AmbienceSource = NO_AMBIENCE,
) {
  const settings = useSettingsStore()
  const musicMuted = computed(() => !settings.musicOn)
  const currentMusicFile = ref('')
  const musicInfo = ref('')

  /** The voice playing the current track; the other one is the spare. */
  const base = new HtmlMusicVoice(audio)
  let active: MusicVoice = base
  let spare: HtmlMusicVoice | null = null
  /** Counts loads; a load that finds a newer one asked for is dropped. */
  let request = 0
  /** The file asked for last, also while its loop is still being prepared. */
  let requestedFile = ''
  /** The scene it was asked for in last. */
  let requested: MusicScene = NO_SCENE

  function urlFor(file: string): string {
    return MUSIC_BASE_PATH + file.split('/').map(encodeURIComponent).join('/')
  }

  function loadTrack(
    file: string,
    info: string,
    fadeInMs: number = 0,
    through: boolean = false,
    at: MusicScene = NO_SCENE,
  ): void {
    requested = at
    if (!file) {
      request++
      requestedFile = ''
      pendingFadeIn = 0
      stopCrossfade()
      currentMusicFile.value = ''
      musicInfo.value = ''
      if (active !== base) retire(active)
      active = base
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      return
    }

    if (file === requestedFile) {
      applyScene()
      return
    }
    requestedFile = file
    if (file === currentMusicFile.value) {
      // Back to the music that is playing: drop the load under way.
      request++
      applyScene()
      return
    }
    const id = ++request

    const returning = takeFadingOut(file)
    const context = returning ? null : sharedAudioContext()
    if (!returning && file === SILENCE) {
      const silent = new AmbientVoice(
        new SilentMusicVoice(),
        null,
        () => settings.musicVolume / 100,
        at.scene,
      )
      if (context) silent.swap(at.scene, effectsOf(at.scene, context), false)
      startVoice(file, info, silent, false, fadeInMs, through)
      return
    }
    if (returning || !context) {
      // Today's playback: an element, ready at once.
      startVoice(
        file,
        info,
        returning ?? htmlVoiceFor(file),
        returning !== null,
        fadeInMs,
        through,
      )
      applyScene()
      return
    }
    // A loop is decoded first; the music playing goes on until it is ready.
    // Its effects come when they are ready and never hold it back; effects
    // that fail to prepare, or come after the loop is gone, are let go of.
    const effects = effectsOf(at.scene, context)
    void prepareWebAudioVoice(context, urlFor(file)).then((voice) => {
      if (id !== request || !voice) {
        voice?.dispose()
        void effects.then((ambience) => ambience?.dispose())
        if (id !== request) return
      }
      let next: MusicVoice
      if (voice) {
        const ambient = new AmbientVoice(
          voice,
          null,
          () => settings.musicVolume / 100,
          at.scene,
        )
        ambient.swap(at.scene, effects, false)
        next = ambient
      } else next = htmlVoiceFor(file)
      startVoice(file, info, next, false, fadeInMs, through)
      // The player may have walked on to another scene while it was prepared.
      applyScene()
    })
  }

  /** The effects of `scene`, prepared on `context`; none when they fail to prepare. */
  function effectsOf(
    scene: string,
    context: AudioContext,
  ): Promise<Ambience | null> {
    return ambienceFor(scene, context).catch(() => null)
  }

  /**
   * Gives the music playing the scene it was last asked for in: its level at
   * once, and that scene's effects in place of another's. Nothing while the
   * music asked for is still being prepared.
   */
  function applyScene(): void {
    if (currentMusicFile.value !== requestedFile) return
    active.level = requested.level
    if (!(active instanceof AmbientVoice)) return
    if (active.scene === requested.scene) return
    const context = sharedAudioContext()
    active.swap(
      requested.scene,
      context ? effectsOf(requested.scene, context) : Promise.resolve(null),
    )
  }

  /** An element-based voice for `file`, reusing the spare element if any. */
  function htmlVoiceFor(file: string): MusicVoice {
    const crossfade =
      currentMusicFile.value !== '' && !active.paused && !musicMuted.value
    // With nothing audible to fade out, the element in hand is loaded again.
    const voice =
      !crossfade && active instanceof HtmlMusicVoice ? active : takeSpare()
    voice.element.loop = true
    voice.element.src = urlFor(file)
    return voice
  }

  /** Makes `next` the current loop, crossfading from the one playing. */
  function startVoice(
    file: string,
    info: string,
    next: MusicVoice,
    comingBack: boolean,
    fadeInMs: number = 0,
    through: boolean = false,
  ): void {
    const crossfade =
      currentMusicFile.value !== '' && !active.paused && !musicMuted.value
    const fadeIn =
      fadeInMs > 0 && !crossfade && !comingBack && !musicMuted.value
    if (crossfade) {
      fadeOutActive(through ? MUSIC_THROUGH_MS / 2 : MUSIC_CROSSFADE_MS)
      if (!comingBack) next.volume = 0
    } else if (next !== active) {
      if (fade) clearInterval(fade)
      fade = null
      stopCrossfade()
      retire(active)
      // Straight in at the set volume, ducked under a voice; no fade-in.
      if (!comingBack) next.volume = targetVolume.value
    }
    // The element in hand may be the one that plays on: silence it first.
    pendingFadeIn = fadeIn ? fadeInMs : 0
    if (fadeIn) next.volume = 0
    active = next
    currentMusicFile.value = file
    musicInfo.value = info

    clearTimeout(rise)
    rise = undefined
    if (crossfade && through) {
      // Through the dark: the new loop waits for the old one to be gone.
      if (fade) clearInterval(fade)
      fade = null
      rise = setTimeout(() => {
        rise = undefined
        fadeTo(targetVolume.value, MUSIC_THROUGH_MS / 2)
      }, MUSIC_THROUGH_MS / 2)
    } else if (crossfade) fadeTo(targetVolume.value, MUSIC_CROSSFADE_MS)
    if (!musicMuted.value) {
      playActive()
    }
  }

  /** The fade-in still to run, in ms; 0 when none waits for the sound. */
  let pendingFadeIn = 0
  /** The wait before a loop changed through the dark rises. */
  let rise: ReturnType<typeof setTimeout> | undefined

  /**
   * Starts the active voice. A fade-in waiting for the sound runs once play
   * has started, so it is heard also when the browser held the music back
   * until a key press and a later call here starts it.
   */
  function playActive(): void {
    const voice = active
    voice
      .play()
      .then(() => {
        if (pendingFadeIn === 0 || active !== voice) return
        const ms = pendingFadeIn
        pendingFadeIn = 0
        fadeTo(targetVolume.value, ms)
      })
      .catch(() => {})
  }

  /** Lets go of a voice nobody plays any more; an element is kept as the spare. */
  function retire(voice: MusicVoice): void {
    voice.pause()
    if (voice instanceof HtmlMusicVoice) spare = voice
    else voice.dispose()
  }

  /** The loops still fading out, each with the timer that fades it. */
  const outgoing: {
    old: MusicVoice
    file: string
    timer: ReturnType<typeof setInterval>
  }[] = []

  /** Takes back the voice still fading out `file`, or null if none is. */
  function takeFadingOut(file: string): MusicVoice | null {
    const index = outgoing.findIndex((entry) => entry.file === file)
    if (index < 0) return null
    const [entry] = outgoing.splice(index, 1)
    clearInterval(entry.timer)
    return entry.old
  }

  /**
   * The element for the next loop: the spare, else the loop that has been
   * fading out longest (cut) if it is an element, else a new one.
   */
  function takeSpare(): HtmlMusicVoice {
    if (spare) {
      const voice = spare
      spare = null
      return voice
    }
    const index = outgoing.findIndex((e) => e.old instanceof HtmlMusicVoice)
    if (index >= 0) {
      const [oldest] = outgoing.splice(index, 1)
      clearInterval(oldest.timer)
      oldest.old.pause()
      return oldest.old as HtmlMusicVoice
    }
    return new HtmlMusicVoice(new Audio())
  }

  /** Silences every loop still fading out. */
  function stopCrossfade(): void {
    clearTimeout(rise)
    rise = undefined
    for (const { old, timer } of outgoing.splice(0)) {
      clearInterval(timer)
      retire(old)
    }
  }

  /**
   * Fades the active voice out, then pauses it and lets it go. It follows a
   * voice's dip like the active one does, so it never sounds louder than the
   * ducked level.
   */
  function fadeOutActive(ms: number): void {
    const old = active
    const duckAtStart = narrating.value ? MUSIC_DUCK : 1
    const startVolume = old.volume / duckAtStart
    let step = 0
    const entry = {
      old,
      file: currentMusicFile.value,
      timer: setInterval(() => {
        step++
        const duck = narrating.value ? MUSIC_DUCK : 1
        old.volume = Math.max(0, startVolume * duck * (1 - step / FADE_STEPS))
        if (step >= FADE_STEPS) {
          clearInterval(entry.timer)
          outgoing.splice(outgoing.indexOf(entry), 1)
          retire(old)
        }
      }, ms / FADE_STEPS),
    }
    outgoing.push(entry)
  }

  // Sync flush so muting takes effect immediately, wherever it was changed.
  watch(
    () => settings.musicOn,
    (on) => {
      if (!on) {
        stopCrossfade()
        active.pause()
      } else if (currentMusicFile.value) {
        playActive()
      }
    },
    { flush: 'sync' },
  )

  // The volume the music should be at: the setting, dipped under a voice.
  const targetVolume = computed(
    () => (settings.musicVolume / 100) * (narrating.value ? MUSIC_DUCK : 1),
  )
  let fade: ReturnType<typeof setInterval> | null = null

  /** Moves the volume to `volume` over `ms`, replacing any fade under way. */
  function fadeTo(volume: number, ms: number = MUSIC_DUCK_FADE_MS): void {
    if (fade) clearInterval(fade)
    const el = active
    const start = el.volume
    let step = 0
    fade = setInterval(() => {
      step++
      el.volume = start + ((volume - start) * step) / FADE_STEPS
      if (step >= FADE_STEPS && fade) {
        clearInterval(fade)
        fade = null
      }
    }, ms / FADE_STEPS)
  }

  base.volume = targetVolume.value
  // A voice starting or ending fades the music; a settings change applies at once.
  watch(narrating, () => {
    // A music not yet sounding keeps its silence for the fade-in to rise from.
    if (pendingFadeIn === 0 && !rise) fadeTo(targetVolume.value)
  })
  watch(
    () => settings.musicVolume,
    () => {
      if (fade) clearInterval(fade)
      fade = null
      active.volume = targetVolume.value
    },
  )

  function toggleMute(): void {
    settings.musicOn = !settings.musicOn
  }

  function ensureMusicStarted(): void {
    // Also while the first music is still decoding: this input is the
    // gesture that lets the context run.
    const context = sharedAudioContext()
    if (context && context.state !== 'running') void context.resume()
    if (!currentMusicFile.value || musicMuted.value) return
    if (active.paused) playActive()
  }

  function buildAttributionHtml(): string {
    if (!musicInfo.value) return ''

    const lines = musicInfo.value
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((l) => {
        let html = ''
        let lastIndex = 0
        let match: RegExpExecArray | null
        while ((match = URL_PATTERN.exec(l)) !== null) {
          const url = match[0]
          html += escapeHtml(l.slice(lastIndex, match.index))
          const safeUrl = escapeHtml(url)
          html +=
            `<a href="${safeUrl}" target="_blank"` +
            ` rel="noopener">${safeUrl}</a>`
          lastIndex = match.index + url.length
        }
        html += escapeHtml(l.slice(lastIndex))
        URL_PATTERN.lastIndex = 0
        return html
      })
      .join('<br>')

    return (
      '<hr style="border-color:var(--border-color);margin:12px 0">' +
      '<div style="opacity:0.7;font-size:0.85em">' +
      `🎵 <strong>Now playing:</strong><br>${lines}` +
      '</div>'
    )
  }

  return {
    musicMuted,
    currentMusicFile,
    musicInfo,
    loadTrack,
    stopCrossfade,
    toggleMute,
    ensureMusicStarted,
    buildAttributionHtml,
  }
}
