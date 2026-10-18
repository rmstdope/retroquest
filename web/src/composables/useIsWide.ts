import { onScopeDispose, ref, type Ref } from 'vue'

/** Width at which the Lantern UI switches to the laptop layout. */
export const WIDE_QUERY = '(min-width: 1024px)'

/** Whether the window is laptop-wide; follows resizes until the scope ends. */
export function useIsWide(): Ref<boolean> {
  const wide = ref(false)
  if (typeof globalThis.matchMedia !== 'function') return wide
  const query = globalThis.matchMedia(WIDE_QUERY)
  wide.value = query.matches
  const onChange = (event: { matches: boolean }): void => {
    wide.value = event.matches
  }
  query.addEventListener('change', onChange)
  onScopeDispose(() => query.removeEventListener('change', onChange))
  return wide
}
