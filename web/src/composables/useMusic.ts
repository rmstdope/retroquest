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
 * When a different track replaces one that is playing, the old one fades out
 * on a throwaway element while the new one fades in (`MUSIC_CROSSFADE_MS`);
 * the same track again changes nothing.
 */
export function useMusic(
  audio: HTMLAudioElement,
  narrating: Readonly<Ref<boolean>> = ref(false),
) {
  const settings = useSettingsStore()
  const musicMuted = computed(() => !settings.musicOn)
  const currentMusicFile = ref('')
  const musicInfo = ref('')

  function loadTrack(file: string, info: string): void {
    if (!file) {
      stopCrossfade()
      currentMusicFile.value = ''
      musicInfo.value = ''
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      return
    }

    if (file === currentMusicFile.value) return

    const crossfade =
      currentMusicFile.value !== '' &&
      !audio.paused &&
      !musicMuted.value &&
      typeof Audio !== 'undefined'
    if (crossfade) fadeOutCopy()

    currentMusicFile.value = file
    musicInfo.value = info
    audio.src =
      MUSIC_BASE_PATH + file.split('/').map(encodeURIComponent).join('/')

    if (crossfade) {
      audio.volume = 0
      fadeTo(targetVolume.value, MUSIC_CROSSFADE_MS)
    }
    if (!musicMuted.value) {
      audio.play().catch(() => {})
    }
  }

  /** The loops still fading out, each with the timer that fades it. */
  const outgoing: {
    old: HTMLAudioElement
    timer: ReturnType<typeof setInterval>
  }[] = []

  /** Silences every loop still fading out. */
  function stopCrossfade(): void {
    for (const { old, timer } of outgoing.splice(0)) {
      clearInterval(timer)
      old.pause()
    }
  }

  /**
   * Plays what `audio` plays on a second element and fades that out. It
   * follows a voice's dip like the main element does, so it never sounds
   * louder than the ducked level.
   */
  function fadeOutCopy(): void {
    const old = new Audio()
    old.loop = true
    old.src = audio.src
    old.currentTime = audio.currentTime
    old.volume = audio.volume
    old.play().catch(() => {})
    const duckAtStart = narrating.value ? MUSIC_DUCK : 1
    const base = audio.volume / duckAtStart
    let step = 0
    const entry = {
      old,
      timer: setInterval(() => {
        step++
        const duck = narrating.value ? MUSIC_DUCK : 1
        old.volume = Math.max(0, base * duck * (1 - step / FADE_STEPS))
        if (step >= FADE_STEPS) {
          clearInterval(entry.timer)
          old.pause()
          outgoing.splice(outgoing.indexOf(entry), 1)
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
        audio.pause()
      } else if (currentMusicFile.value) {
        audio.play().catch(() => {})
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
    const start = audio.volume
    let step = 0
    fade = setInterval(() => {
      step++
      audio.volume = start + ((volume - start) * step) / FADE_STEPS
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
      audio.volume = targetVolume.value
    },
  )

  function toggleMute(): void {
    settings.musicOn = !settings.musicOn
  }

  function ensureMusicStarted(): void {
    if (!currentMusicFile.value || musicMuted.value) return
    if (audio.paused) {
      audio.play().catch(() => {})
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
