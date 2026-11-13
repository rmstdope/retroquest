// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const MUSIC_DIR = join(__dirname, '../../public/audio/music')
const CLIPS_DIR = join(MUSIC_DIR, 'generated')
/** Bytes from "Info"/"Xing" to the encoder name: flags, frames, bytes, TOC, quality. */
const ENCODER_OFFSET = 4 + 4 + 4 + 4 + 100 + 4
/** Bytes from the start of the encoder name to the 12-bit delay field. */
const DELAY_OFFSET = 21

/**
 * Reads the encoder delay and end padding from a clip's LAME/Info header, or
 * null when it has none.
 */
function gaplessInfo(
  dir: string,
  file: string,
): { delay: number; padding: number } | null {
  const head = readFileSync(join(dir, file)).subarray(0, 2000)
  const tag = Math.max(head.indexOf('Info'), head.indexOf('Xing'))
  if (tag < 0) return null
  // The encoder name (LAME, Lavc, …) follows the tag's flags and frame counts.
  const at = tag + ENCODER_OFFSET
  const b = head.subarray(at + DELAY_OFFSET, at + DELAY_OFFSET + 3)
  return {
    delay: (b[0] << 4) | (b[1] >> 4),
    padding: ((b[1] & 15) << 8) | b[2],
  }
}

describe('music clips', () => {
  const clips = [
    ...readdirSync(CLIPS_DIR).map((f) => [CLIPS_DIR, f] as const),
    ...readdirSync(MUSIC_DIR)
      .filter((f) => f.endsWith('.mp3'))
      .map((f) => [MUSIC_DIR, f] as const),
  ].filter(([, f]) => f.endsWith('.mp3'))

  it('every clip carries gapless info, so the decoder trims delay and padding', () => {
    const lacking = clips
      .filter(([dir, clip]) => !((gaplessInfo(dir, clip)?.delay ?? 0) > 0))
      .map(([dir, clip]) => `${dir}/${clip}`)
    expect(lacking).toEqual([])
  })
})
