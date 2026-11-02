import { computed, ref, watch, type Ref } from 'vue'
import { escapeHtml } from '@/utils/theme'
import { useSettingsStore } from '@/stores/useSettingsStore'
import {
  HtmlMusicVoice,
  prepareWebAudioVoice,
  sharedAudioContext,
  type MusicVoice,
} from './musicVoice'

const MUSIC_BASE_PATH = '/audio/music/'
const URL_PATTERN = /(https?:\/\/[^\s]+)/g

/** Share of the music volume kept while a voice narrates (about -9 dB). */
export const MUSIC_DUCK = 0.35
/** How long the music takes to dip under a voice, or to come back up, in ms. */
export const MUSIC_DUCK_FADE_MS = 400
/** How long one loop takes to fade out while the next fades in, in ms. */
export const MUSIC_CROSSFADE_MS = 1500
/** Steps per fade. */
const FADE_STEPS = 10

/**
 * Background music for the current act. On/off and volume come from the
 * player's settings, so changes made anywhere (top bar, Settings dialog)
 * apply immediately. While `narrating` is true the music fades down to
 * `MUSIC_DUCK` of its volume, so voices stand out, and fades back up after.
 * When a different track replaces one that is playing, the old one keeps
 * playing on its own element and fades out while the new one fades in on a
 * second element (`MUSIC_CROSSFADE_MS`), so the old loop never reloads and
 * never drops out; the same track again changes nothing.
 *
 * Loops play on Web Audio (see `musicVoice.ts`): a track is decoded first, the
 * music already playing goes on until it is ready, and the loop then comes
 * round without a click. A browser that cannot decode it plays the element, as
 * before.
 */
export function useMusic(
  audio: HTMLAudioElement,
  narrating: Readonly<Ref<boolean>> = ref(false),
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

  function urlFor(file: string): string {
    return MUSIC_BASE_PATH + file.split('/').map(encodeURIComponent).join('/')
  }

  function loadTrack(file: string, info: string): void {
    if (!file) {
      request++
      requestedFile = ''
      stopCrossfade()
      currentMusicFile.value = ''
      musicInfo.value = ''
      retire(active)
      active = base
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      return
    }

    if (file === requestedFile) return
    requestedFile = file
    const id = ++request

    const returning = takeFadingOut(file)
    const context = returning ? null : sharedAudioContext()
    if (returning || !context) {
      // Today's playback: an element, ready at once.
      startVoice(
        file,
        info,
        returning ?? htmlVoiceFor(file),
        returning !== null,
      )
      return
    }
    // A loop is decoded first; the music playing goes on until it is ready.
    void prepareWebAudioVoice(context, urlFor(file)).then((voice) => {
      if (id !== request) {
        voice?.dispose()
        return
      }
      startVoice(file, info, voice ?? htmlVoiceFor(file), false)
    })
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
  ): void {
    const crossfade =
      currentMusicFile.value !== '' && !active.paused && !musicMuted.value
    if (crossfade) {
      fadeOutActive()
      if (!comingBack) next.volume = 0
    } else if (next !== active) {
      if (fade) clearInterval(fade)
      fade = null
      stopCrossfade()
      retire(active)
      // Straight in at the set volume, ducked under a voice; no fade-in.
      if (!comingBack) next.volume = targetVolume.value
    }
    active = next
    currentMusicFile.value = file
    musicInfo.value = info

    if (crossfade) fadeTo(targetVolume.value, MUSIC_CROSSFADE_MS)
    if (!musicMuted.value) {
      next.play().catch(() => {})
    }
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
  function fadeOutActive(): void {
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
      }, MUSIC_CROSSFADE_MS / FADE_STEPS),
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
        active.play().catch(() => {})
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
  watch(narrating, () => fadeTo(targetVolume.value))
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
    if (!currentMusicFile.value || musicMuted.value) return
    const context = sharedAudioContext()
    if (context && context.state !== 'running') void context.resume()
    if (active.paused) {
      active.play().catch(() => {})
    }
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
