import { domToBlob } from 'modern-screenshot'

/** The most bytes the feedback service takes for one picture. */
const MAX_BYTES = 2 * 1024 * 1024

/** The scales tried in turn until the picture fits: whole size first. */
const SCALES = [1, 0.75, 0.5, 0.35]

/** Whether a node belongs in the picture: the feedback window, which may be open already, does not. */
function belongsInPicture(node: Node): boolean {
  return !(node instanceof Element && node.closest('[data-feedback-window]'))
}

/**
 * The game as it looks now, as an image the feedback service takes (PNG, else JPEG at a smaller
 * scale until it is under 2 MB), without the feedback window even when it opened meanwhile; null when it cannot be taken, so the window offers no picture.
 */
export async function captureScreen(
  element: HTMLElement,
): Promise<Blob | null> {
  try {
    for (const scale of SCALES) {
      const blob = await domToBlob(element, {
        scale,
        type: scale === 1 ? 'image/png' : 'image/jpeg',
        quality: 0.85,
        filter: belongsInPicture,
      })
      if (blob && blob.size <= MAX_BYTES) return blob
    }
  } catch {
    return null
  }
  return null
}
