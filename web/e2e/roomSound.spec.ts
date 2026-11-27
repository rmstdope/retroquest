import { readFileSync } from 'node:fs'
import { test, expect, enterCommand, type Page } from './fixtures'

/** The parts of a scene's mix this spec reads. */
interface Scene {
  music?: { track: string | null }
  effects: { id: string; play: { mode: string }; state?: string }[]
}

/** Read a committed JSON file, by its path below `web/`. */
function committed<T>(path: string): T {
  return JSON.parse(
    readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'),
  ) as T
}

/**
 * The files an Act I room should loop on being entered, whatever the navigator
 * has chosen: its mix's music and the looping effects that play in every state.
 */
function loopsOf(room: string): string[] {
  const scene = committed<{ scenes: Record<string, Scene> }>(
    'src/lantern/scenes/act1.mix.json',
  ).scenes[room]
  const take = (kind: string, id: string): string => {
    const folder = `/audio/${kind}/generated/`
    const manifest = committed<Record<string, { file: string }>>(
      `public${folder}manifest.json`,
    )
    expect(manifest[id], `a chosen take of ${id}`).toBeDefined()
    return folder + manifest[id].file
  }
  const track = scene.music?.track
  const effects = scene.effects.filter(
    (effect) => effect.play.mode === 'loop' && effect.state === undefined,
  )
  expect(track, `music in the mix of ${room}`).toBeTruthy()
  expect(effects, `a looping effect in the mix of ${room}`).not.toHaveLength(0)
  return [
    take('music', track!),
    ...effects.map((effect) => take('soundeffects', effect.id)),
  ]
}

/** The page's record of the loops it has started. */
interface LoopRecord extends Window {
  startedLoops: { path: string; context: BaseAudioContext }[]
}

/**
 * Remember every looping Web Audio source the game starts, by the file it was
 * decoded from. Playback itself is left alone.
 */
async function recordLoops(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const record = window as unknown as LoopRecord
    record.startedLoops = []
    const fetched = new WeakMap<ArrayBuffer, string>()
    const decoded = new WeakMap<AudioBuffer, string>()
    const read = Response.prototype.arrayBuffer
    Response.prototype.arrayBuffer = async function (this: Response) {
      const data = await read.call(this)
      if (this.url) fetched.set(data, new URL(this.url).pathname)
      return data
    }
    const decode = BaseAudioContext.prototype.decodeAudioData
    BaseAudioContext.prototype.decodeAudioData = async function (
      this: BaseAudioContext,
      data: ArrayBuffer,
    ) {
      const path = fetched.get(data)
      const buffer = await decode.call(this, data)
      if (path) decoded.set(buffer, path)
      return buffer
    }
    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (
      this: AudioBufferSourceNode,
      ...args: Parameters<typeof start>
    ) {
      const path = this.buffer && decoded.get(this.buffer)
      if (this.loop && path)
        record.startedLoops.push({ path, context: this.context })
      start.apply(this, args)
    }
  })
}

/** The files looping on a running audio context so far, of those in `among`. */
async function sounding(page: Page, among: string[]): Promise<string[]> {
  const running = await page.evaluate(() =>
    (window as unknown as LoopRecord).startedLoops
      .filter((loop) => loop.context.state === 'running')
      .map((loop) => loop.path),
  )
  return among.filter((path) => running.includes(path))
}

test('SND-2: each room plays its music and its sound effects', async ({
  page,
}): Promise<void> => {
  const dream = loopsOf('act1-the-dream')
  const cottage = loopsOf('act1-eliors-cottage')
  await recordLoops(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()

  // The game opens in the dream, and the cottage is not heard there.
  await expect.poll(() => sounding(page, dream)).toEqual(dream)
  expect(await sounding(page, cottage)).toEqual([])

  // The voice wakes Elior in his cottage.
  await enterCommand(page, 'say hello to voice')
  await expect.poll(() => sounding(page, cottage)).toEqual(cottage)
})
