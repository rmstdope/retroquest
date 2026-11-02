// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const CLIPS_DIR = join(__dirname, '../../public/audio/music/generated')
/** Bytes from the start of the encoder name to the 12-bit delay field. */
const DELAY_OFFSET = 21

/**
 * Reads the encoder delay and end padding from a clip's LAME/Info header, or
 * null when it has none.
 */
function gaplessInfo(file: string): { delay: number; padding: number } | null {
  const head = readFileSync(join(CLIPS_DIR, file)).subarray(0, 2000)
  const at = head.indexOf('Lavc')
  if (at < 0 || head.indexOf('Info') < 0) return null
  const b = head.subarray(at + DELAY_OFFSET, at + DELAY_OFFSET + 3)
  return {
    delay: (b[0] << 4) | (b[1] >> 4),
    padding: ((b[1] & 15) << 8) | b[2],
  }
}

describe('generated music clips', () => {
  const clips = readdirSync(CLIPS_DIR).filter((f) => f.endsWith('.mp3'))

  it.each(clips)(
    '%s carries gapless info, so the decoder trims delay and padding',
    (clip) => {
      const info = gaplessInfo(clip)
      expect(info).not.toBeNull()
      expect(info?.delay).toBeGreaterThan(0)
    },
  )
})
