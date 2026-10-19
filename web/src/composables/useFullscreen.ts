import { onScopeDispose, ref, type Ref } from 'vue'

/**
 * The page in full screen: whether the browser supports it at all (iPhone
 * Safari does not), whether it is on, and a toggle. Follows changes made
 * outside the button too (Esc, the browser's own controls).
 */
export function useFullscreen(): {
  supported: boolean
  active: Ref<boolean>
  toggle: () => void
} {
  const supported = document.fullscreenEnabled === true
  const active = ref(!!document.fullscreenElement)
  const sync = (): void => {
    active.value = !!document.fullscreenElement
  }
  document.addEventListener('fullscreenchange', sync)
  onScopeDispose(() => document.removeEventListener('fullscreenchange', sync))

  function toggle(): void {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else document.documentElement.requestFullscreen().catch(() => {})
  }

  return { supported, active, toggle }
}
