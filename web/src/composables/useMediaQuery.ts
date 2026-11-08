import { onScopeDispose, ref, type Ref } from 'vue'

/** Screens that get the laptop layout (side column, room card). */
export const WIDE_QUERY = '(min-width: 1024px) and (min-height: 560px)'
/** Laptop windows wide enough for the narrator on one side and speech on the other; narrower ones (and phones) tell everything in one column. */
export const SIDES_QUERY = '(min-width: 1100px)'
/** A mouse or trackpad and a keyboard: the player has keys to press, not taps. */
export const KEYBOARD_QUERY = '(hover: hover) and (pointer: fine)'
/** Short screens (phone landscape): the section tabs move into the header. */
export const SHORT_QUERY = '(max-height: 519px)'

/** A phone: a touch screen whose shorter side is under 600 pixels. Phones are played sideways; tablets and narrow mouse windows are not phones. */
export const PHONE_QUERY =
  '(hover: none) and (pointer: coarse) and ((max-width: 599px) or (max-height: 599px))'
/** The screen is held upright (taller than wide). */
export const PORTRAIT_QUERY = '(orientation: portrait)'

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
