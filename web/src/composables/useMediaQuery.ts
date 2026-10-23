import { onScopeDispose, ref, type Ref } from 'vue'

/** Screens that get the laptop layout (side column, room card). */
export const WIDE_QUERY = '(min-width: 1024px) and (min-height: 560px)'
/** A mouse or trackpad and a keyboard: the player has keys to press, not taps. */
export const KEYBOARD_QUERY = '(hover: hover) and (pointer: fine)'
/** Short screens (phone landscape): the section tabs move into the header. */
export const SHORT_QUERY = '(max-height: 519px)'

/** Whether a CSS media query matches; follows changes until the scope ends. */
export function useMediaQuery(media: string): Ref<boolean> {
  const matches = ref(false)
  if (typeof globalThis.matchMedia !== 'function') return matches
  const query = globalThis.matchMedia(media)
  matches.value = query.matches
  const onChange = (event: { matches: boolean }): void => {
    matches.value = event.matches
  }
  query.addEventListener('change', onChange)
  onScopeDispose(() => query.removeEventListener('change', onChange))
  return matches
}
