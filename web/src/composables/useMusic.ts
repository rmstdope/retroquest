import { ref } from 'vue'
import { escapeHtml } from '@/utils/theme'

const STORAGE_KEY = 'retroquest_music_muted'
const MUSIC_BASE_PATH = '/python-src/retroquest/audio/music/'
const URL_PATTERN = /(https?:\/\/[^\s]+)/g

export function useMusic(audio: HTMLAudioElement) {
  const musicMuted = ref(localStorage.getItem(STORAGE_KEY) === 'true')
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

  function toggleMute(): void {
    musicMuted.value = !musicMuted.value
    localStorage.setItem(STORAGE_KEY, String(musicMuted.value))

    if (musicMuted.value) {
      audio.pause()
    } else if (currentMusicFile.value) {
      audio.play().catch(() => {})
    }
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
