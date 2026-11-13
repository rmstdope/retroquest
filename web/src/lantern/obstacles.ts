/**
 * What lies over the room picture, found by marker rather than by name: an
 * element that covers the picture says so with a `data-lq-obstacle` attribute
 * (its kind), and the layer of marks and names measures every marked element
 * in its scope. A button, tab or card added over the picture is marked where it
 * is written, and no list in the layer needs to learn its class.
 */
import type { Rect } from './roomMotionScene'

/** The attribute an element carries to say it lies over the picture. */
export const OBSTACLE_ATTR = 'data-lq-obstacle'
/** The attribute of the element that clips the cards inside it (a scrolling story). */
export const CLIP_ATTR = 'data-lq-clip'

/**
 * What kind of thing lies over the picture:
 * `panel` (the plate, buttons and tabs: no mark or name lies under one),
 * `keep-clear` (a name keeps clear of it, but a mark may lie under it),
 * `words` (words over the picture, under which a mark and name wait), and
 * `card` (a narrator's card or spoken line, counted only where the nearest
 * `data-lq-clip` ancestor shows it).
 */
export type ObstacleKind = 'panel' | 'keep-clear' | 'words' | 'card'

/** The rectangles read, in the names' pixels. */
export interface Obstacles {
  /** The panels no mark may lie under. */
  panels: Rect[]
  /** The words and cards, under which a thing's mark and name wait. */
  words: Rect[]
  /** Everything a name keeps clear of: every kind. */
  all: Rect[]
}

/** Where the names' own pixels start: the corner of the layer and how much larger a screen pixel is than one of theirs. */
export interface LayerFrame {
  left: number
  top: number
  ratio: number
}

/** Whether `value` names a kind of obstacle. */
function isKind(value: string | null): value is ObstacleKind {
  return (
    value === 'panel' ||
    value === 'keep-clear' ||
    value === 'words' ||
    value === 'card'
  )
}

/** The elements of `scope` marked as one of `kinds` (every kind when none is given), in document order; an unknown kind is never counted. */
export function obstacleElements(
  scope: HTMLElement,
  kinds: readonly ObstacleKind[] = ['panel', 'keep-clear', 'words', 'card'],
): HTMLElement[] {
  return [...scope.querySelectorAll<HTMLElement>(`[${OBSTACLE_ATTR}]`)].filter(
    (el) => {
      const kind = el.getAttribute(OBSTACLE_ATTR)
      return isKind(kind) && kinds.includes(kind)
    },
  )
}

/**
 * The rectangles of the marked elements of `scope` that are on show, sorted by
 * kind and in the pixels of `frame`. A card counts where its clip shows it
 * (none outside a clip); an element with no size or hidden (words folded away
 * fade out first) covers nothing.
 */
export function readObstacles(
  scope: HTMLElement,
  frame: LayerFrame,
): Obstacles {
  const read: Obstacles = { panels: [], words: [], all: [] }
  for (const el of obstacleElements(scope)) {
    const kind = el.getAttribute(OBSTACLE_ATTR) as ObstacleKind // `obstacleElements` has let only known kinds through
    let box: { left: number; top: number; right: number; bottom: number } =
      el.getBoundingClientRect()
    if (kind === 'card') {
      const clip = el.closest<HTMLElement>(`[${CLIP_ATTR}]`)
      if (!clip) continue
      const by = clip.getBoundingClientRect()
      box = {
        left: Math.max(box.left, by.left),
        top: Math.max(box.top, by.top),
        right: Math.min(box.right, by.right),
        bottom: Math.min(box.bottom, by.bottom),
      }
    }
    const width = box.right - box.left
    const height = box.bottom - box.top
    if (width < 1 || height < 1) continue
    if (getComputedStyle(el).visibility === 'hidden') continue
    const rect: Rect = {
      x: (box.left - frame.left) / frame.ratio,
      y: (box.top - frame.top) / frame.ratio,
      w: width / frame.ratio,
      h: height / frame.ratio,
    }
    read.all.push(rect)
    if (kind === 'panel') read.panels.push(rect)
    if (kind === 'words' || kind === 'card') read.words.push(rect)
  }
  return read
}
