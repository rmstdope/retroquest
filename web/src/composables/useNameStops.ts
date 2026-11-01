import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/** Every character or item name the story renders. */
export const NAME_SELECTOR = '.theme-item_name, .theme-character_name'

/** What decides which names are Tab stops. */
export interface NameStopOptions {
  /** Whether the wide layout is shown (the band then has stops in the newest turn only). */
  wide: () => boolean
  /** Whether the name has a menu right now. */
  reachable: (name: HTMLElement) => boolean
}

/** Make `name` a Tab stop that reads as a button opening a menu. */
function mark(name: HTMLElement): void {
  name.setAttribute('tabindex', '0')
  name.setAttribute('role', 'button')
  name.setAttribute('aria-haspopup', 'menu')
}

/** Take the stop marks off `name`. */
function unmark(name: HTMLElement): void {
  name.removeAttribute('tabindex')
  name.removeAttribute('role')
  name.removeAttribute('aria-haspopup')
}

/**
 * Names in the story as Tab stops. The names are rendered markup (`v-html`,
 * re-rendered while a turn is narrated), so the marks are set on the DOM after
 * each render: a MutationObserver on `root` re-applies them, and `sync()` is
 * called when what is here changes (room, bag, spells, layout). In the story
 * drawer every reachable name is a stop; in the story band only the newest
 * turn's are, unless the layout is narrow (no drawer there). Nothing is saved.
 */
export function useNameStops(
  root: Ref<HTMLElement | null>,
  options: NameStopOptions,
): { sync: () => void } {
  let observer: MutationObserver | undefined
  let pending = false
  /** The stop that has focus: where it is among its scope's stops, to find it again after a re-render. */
  let focused: { scope: string; index: number } | null = null

  /** The stops of a scope ("drawer" or "band"), in order. */
  function stopsOf(scope: string): HTMLElement[] {
    const area = scope === 'drawer' ? '.lq-story-drawer' : '.lq-story'
    return [
      ...(root.value?.querySelectorAll<HTMLElement>(
        `${area} ${NAME_SELECTOR}`,
      ) ?? []),
    ].filter((name) => name.hasAttribute('tabindex'))
  }

  /** Remember which stop takes focus. */
  function onFocusIn(event: FocusEvent): void {
    const name = event.target instanceof HTMLElement ? event.target : null
    if (!name?.matches(NAME_SELECTOR)) {
      focused = null
      return
    }
    const scope = name.closest('.lq-story-drawer') ? 'drawer' : 'band'
    focused = { scope, index: stopsOf(scope).indexOf(name) }
  }

  /** Forget the stop when focus moves on by itself (a re-render removing it is not that). */
  function onFocusOut(event: FocusEvent): void {
    const name = event.target instanceof HTMLElement ? event.target : null
    if (name?.isConnected) focused = null
  }

  /** Mark the reachable names in scope and clear every other name. */
  function sync(): void {
    pending = false
    const el = root.value
    if (!el) return
    const inScope = new Set<HTMLElement>()
    const take = (scope: ParentNode | null): void => {
      scope?.querySelectorAll<HTMLElement>(NAME_SELECTOR).forEach((name) => {
        if (options.reachable(name)) inScope.add(name)
      })
    }
    take(el.querySelector('.lq-story-drawer'))
    const turns = el.querySelectorAll('.lq-story .lq-turn')
    take(
      options.wide()
        ? (turns[turns.length - 1] ?? null)
        : el.querySelector('.lq-story'),
    )
    el.querySelectorAll<HTMLElement>(NAME_SELECTOR).forEach((name) => {
      if (inScope.has(name)) mark(name)
      else unmark(name)
    })
    // Narration re-renders a turn's text and the focused name with it:
    // focus goes back to the same stop.
    if (
      focused &&
      document.activeElement === document.body &&
      !document.querySelector('.lq-name-menu')
    ) {
      stopsOf(focused.scope)[focused.index]?.focus({ preventScroll: true })
    }
  }

  /** Re-sync once after a burst of re-renders. */
  function schedule(): void {
    if (pending) return
    pending = true
    queueMicrotask(sync)
  }

  onMounted(() => {
    if (!root.value || typeof MutationObserver === 'undefined') return
    observer = new MutationObserver(schedule)
    observer.observe(root.value, { childList: true, subtree: true })
    root.value.addEventListener('focusin', onFocusIn)
    root.value.addEventListener('focusout', onFocusOut)
    sync()
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
    root.value?.removeEventListener('focusin', onFocusIn)
    root.value?.removeEventListener('focusout', onFocusOut)
  })

  return { sync }
}
