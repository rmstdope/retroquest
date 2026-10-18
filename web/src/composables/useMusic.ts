import { computed, ref, watch } from 'vue'
import { escapeHtml } from '@/utils/theme'
import { useSettingsStore } from '@/stores/useSettingsStore'

const MUSIC_BASE_PATH = '/python-src/retroquest/audio/music/'
const URL_PATTERN = /(https?:\/\/[^\s]+)/g

/**
 * Background music for the current act. On/off and volume come from the
 * player's settings, so changes made anywhere (top bar, Settings dialog)
 * apply immediately.
 */
export function useMusic(audio: HTMLAudioElement) {
  const settings = useSettingsStore()
  const musicMuted = computed(() => !settings.musicOn)
  const currentMusicFile = ref('')
  const musicInfo = ref('')

  function loadTrack(file: string, info: string): void {
    if (!file) {
      currentMusicFile.value = ''
      musicInfo.value = ''
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      return
    }

    if (file === currentMusicFile.value) return

    currentMusicFile.value = file
    musicInfo.value = info
    audio.src = MUSIC_BASE_PATH + encodeURIComponent(file)

    if (!musicMuted.value) {
      audio.play().catch(() => {})
    }
  }

  // Sync flush so muting takes effect immediately, wherever it was changed.
  watch(
    () => settings.musicOn,
    (on) => {
      if (!on) {
        audio.pause()
      } else if (currentMusicFile.value) {
        audio.play().catch(() => {})
      }
    },
    { flush: 'sync' },
  )

  watch(
    () => settings.musicVolume,
    (volume) => {
      audio.volume = volume / 100
    },
    { immediate: true },
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
    toggleMute,
    ensureMusicStarted,
    buildAttributionHtml,
  }
}
