import { computed, ref, watch, type Ref } from 'vue'
import { escapeHtml } from '@/utils/theme'
import { useSettingsStore } from '@/stores/useSettingsStore'

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
 */
export function useMusic(
  audio: HTMLAudioElement,
  narrating: Readonly<Ref<boolean>> = ref(false),
) {
  const settings = useSettingsStore()
  const musicMuted = computed(() => !settings.musicOn)
  const currentMusicFile = ref('')
  const musicInfo = ref('')

  /** The element playing the current track; the other one is the spare. */
  let active = audio
  let spare: HTMLAudioElement | null = null

  function loadTrack(file: string, info: string): void {
    if (!file) {
      stopCrossfade()
      currentMusicFile.value = ''
      musicInfo.value = ''
      active.pause()
      active.removeAttribute('src')
      active.load()
      return
    }

    if (file === currentMusicFile.value) return

    const crossfade =
      currentMusicFile.value !== '' &&
      !active.paused &&
      !musicMuted.value &&
      typeof Audio !== 'undefined'
    // The element already playing is left alone, so it never reloads and
    // the old loop never drops out; the new loop goes on the other element.
    let next = active
    let comingBack = false
    if (crossfade) {
      // Going back to the loop that is still fading out: fade it up again.
      const returning = takeFadingOut(file)
      comingBack = returning !== null
      next = returning ?? takeSpare()
      fadeOutActive()
      next.loop = true
      if (!comingBack) next.volume = 0
      active = next
    }

    currentMusicFile.value = file
    musicInfo.value = info
    if (!comingBack) {
      next.src =
        MUSIC_BASE_PATH + file.split('/').map(encodeURIComponent).join('/')
    }

    if (crossfade) fadeTo(targetVolume.value, MUSIC_CROSSFADE_MS)
    if (!musicMuted.value) {
      next.play().catch(() => {})
    }
  }

  /** The loops still fading out, each with the timer that fades it. */
  const outgoing: {
    old: HTMLAudioElement
    file: string
    timer: ReturnType<typeof setInterval>
  }[] = []

  /** Takes back the element still fading out `file`, or null if none is. */
  function takeFadingOut(file: string): HTMLAudioElement | null {
    const index = outgoing.findIndex((entry) => entry.file === file)
    if (index < 0) return null
    const [entry] = outgoing.splice(index, 1)
    clearInterval(entry.timer)
    return entry.old
  }

  /**
   * The element for the next loop: the spare, else the loop that has been
   * fading out longest (cut), else a new one.
   */
  function takeSpare(): HTMLAudioElement {
    if (spare) {
      const el = spare
      spare = null
      return el
    }
    const oldest = outgoing.shift()
    if (oldest) {
      clearInterval(oldest.timer)
      oldest.old.pause()
      return oldest.old
    }
    return new Audio()
  }

  /** Silences every loop still fading out. */
  function stopCrossfade(): void {
    for (const { old, timer } of outgoing.splice(0)) {
      clearInterval(timer)
      old.pause()
      spare ??= old
    }
  }

  /**
   * Fades the active element out, then pauses it and keeps it as the spare.
   * It follows a voice's dip like the active one does, so it never sounds
   * louder than the ducked level.
   */
  function fadeOutActive(): void {
    const old = active
    const duckAtStart = narrating.value ? MUSIC_DUCK : 1
    const base = old.volume / duckAtStart
    let step = 0
    const entry = {
      old,
      file: currentMusicFile.value,
      timer: setInterval(() => {
        step++
        const duck = narrating.value ? MUSIC_DUCK : 1
        old.volume = Math.max(0, base * duck * (1 - step / FADE_STEPS))
        if (step >= FADE_STEPS) {
          clearInterval(entry.timer)
          old.pause()
          outgoing.splice(outgoing.indexOf(entry), 1)
          spare = old
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

  audio.volume = targetVolume.value
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
