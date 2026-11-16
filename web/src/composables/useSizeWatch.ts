import { getCurrentScope, onScopeDispose } from 'vue'

/**
 * The one place that decides when a size observer's work may run and when it
 * may start watching another element.
 *
 * A `ResizeObserver` that writes layout, or adds a target, while the browser
 * is delivering its report can make the browser raise "ResizeObserver loop
 * completed with undelivered notifications". That was fixed three times by
 * hand-writing a wait-a-frame into one more observer (rq-bbsj, rq-rmg7,
 * rq-zaqg); here the rule is held once. By default the work runs on the next
 * animation frame, once a frame however many reports arrive. An observer that
 * must act inside the report says so with `inReport`, and even then a target
 * added while the report is delivered is only watched from the next frame.
 */

/** What a component does with a size watch. */
export interface SizeWatch {
  /** Watch `el`; from the next frame when a report is being delivered. */
  observe(el: Element): void
  /** Stop watching `el`. */
  unobserve(el: Element): void
  /** Watch exactly `els` from now on, and drop any work waiting for a frame. */
  retarget(...els: Element[]): void
  /** Stop watching and drop what waits for a frame (done on its own when the effect scope ends). */
  stop(): void
}

/** How a size watch delivers its work. */
export interface SizeWatchOptions {
  /** Run the work inside the size report instead of on the next frame; only for work that moves nothing observed. */
  inReport?: boolean
}

/**
 * Watch the size of elements and call `work` when one changes: on the next
 * frame, or inside the report with `inReport`. A no-op where the browser has
 * no `ResizeObserver`. Inside a component's `setup` (any effect scope) it
 * stops on unmount.
 */
export function useSizeWatch(
  work: () => void,
  options: SizeWatchOptions = {},
): SizeWatch {
  let observer: ResizeObserver | undefined
  let targets: Element[] = []
  /** Targets added during a report, watched from the next frame. */
  let waiting: Element[] = []
  let reporting = false
  let workDue = false
  let frame: number | undefined

  /** The observer, made on first use from the browser's own class. */
  function ensure(): ResizeObserver | undefined {
    if (!observer && typeof ResizeObserver === 'function')
      observer = new ResizeObserver(onReport)
    return observer
  }

  /** Ask for the next frame, once. */
  function schedule(): void {
    frame ??= requestAnimationFrame(onFrame)
  }

  /** The browser reports sizes. */
  function onReport(): void {
    if (options.inReport) {
      reporting = true
      try {
        work()
      } finally {
        reporting = false
      }
    } else {
      workDue = true
      schedule()
    }
  }

  /** The frame: watch what waited, and do the work that waited. */
  function onFrame(): void {
    frame = undefined
    const adding = waiting
    waiting = []
    for (const el of adding) add(el)
    if (workDue) {
      workDue = false
      work()
    }
  }

  /** Start watching `el` at once. */
  function add(el: Element): void {
    if (targets.includes(el)) return
    targets.push(el)
    ensure()?.observe(el)
  }

  /** Drop what waits for a frame. */
  function cancel(): void {
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = undefined
    workDue = false
    waiting = []
  }

  const watch: SizeWatch = {
    observe(el) {
      if (reporting) {
        if (!waiting.includes(el)) waiting.push(el)
        schedule()
      } else add(el)
    },
    unobserve(el) {
      waiting = waiting.filter((w) => w !== el)
      if (!targets.includes(el)) return
      targets = targets.filter((t) => t !== el)
      observer?.unobserve(el)
    },
    retarget(...els) {
      cancel()
      observer?.disconnect()
      targets = []
      for (const el of els) watch.observe(el)
    },
    stop() {
      cancel()
      observer?.disconnect()
      targets = []
    },
  }
  if (getCurrentScope()) onScopeDispose(watch.stop)
  return watch
}
