/**
 * The sound requirements, heard in a real browser: the spec listens to every
 * media element the game plays and to every source it starts on Web Audio.
 */
import { test, expect, enterCommand, type Page } from './fixtures'

// A new player's settings (the config saves narration at 0 for the other specs).
test.use({
  storageState: { cookies: [], origins: [] },
  narrationRecordings: true,
})

/** How loud each kind of sound is now, 0 to 1 and above; null when nothing of it is playing. */
interface Heard {
  music: number | null
  effects: number | null
  narration: number | null
}

/** The window of a page that is being listened to. */
interface ListeningWindow extends Window {
  heard(): Heard
}

/**
 * Listen to the page from its start. A music or effects source is as loud as
 * the gains between it and the speakers, multiplied (the loudest of its kind
 * still playing counts); the narration is as loud as the voice's element
 * last played.
 */
async function listen(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const urls = new WeakMap<ArrayBuffer | AudioBuffer, string>()
    const outputs = new WeakMap<AudioNode, Set<unknown>>()
    /** The Web Audio sources started and not yet ended or stopped. */
    const sources = new Set<AudioBufferSourceNode>()
    /** The narration elements played, the newest last. */
    const voices: HTMLMediaElement[] = []

    const arrayBuffer = Response.prototype.arrayBuffer
    Response.prototype.arrayBuffer = async function (this: Response) {
      const data = await arrayBuffer.call(this)
      urls.set(data, this.url)
      return data
    }
    const decode = BaseAudioContext.prototype.decodeAudioData
    BaseAudioContext.prototype.decodeAudioData = async function (
      this: BaseAudioContext,
      data: ArrayBuffer,
    ) {
      // Read first: decoding empties the data.
      const url = urls.get(data)
      const buffer = await decode.call(this, data)
      if (url) urls.set(buffer, url)
      return buffer
    }
    const connect = AudioNode.prototype.connect as (
      this: AudioNode,
      to: AudioNode,
    ) => AudioNode
    AudioNode.prototype.connect = function (this: AudioNode, to: AudioNode) {
      outputs.set(this, (outputs.get(this) ?? new Set()).add(to))
      return connect.call(this, to)
    } as typeof AudioNode.prototype.connect
    const disconnect = AudioNode.prototype.disconnect as (
      this: AudioNode,
    ) => void
    AudioNode.prototype.disconnect = function (this: AudioNode) {
      outputs.delete(this)
      disconnect.call(this)
    }
    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (
      this: AudioBufferSourceNode,
      ...when: number[]
    ) {
      sources.add(this)
      this.addEventListener('ended', () => sources.delete(this))
      start.apply(this, when)
    }
    const stop = AudioBufferSourceNode.prototype.stop
    AudioBufferSourceNode.prototype.stop = function (
      this: AudioBufferSourceNode,
      when?: number,
    ) {
      // One stopped now is gone at once; one stopped later goes as it ends.
      if (when === undefined) sources.delete(this)
      stop.call(this, when)
    }
    // No audio device in CI: a media element is noted, not played.
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (this.src.includes('/audio/narration/')) voices.push(this)
      return Promise.resolve()
    }

    /** The loudness of `node` at the speakers: 0 when nothing leads there. */
    const loudness = (node: AudioNode): number => {
      if (node instanceof AudioDestinationNode) return 1
      const own = node instanceof GainNode ? node.gain.value : 1
      const onward = [...(outputs.get(node) ?? [])] as AudioNode[]
      return own * Math.max(0, ...onward.map(loudness))
    }
    /** The loudest sounding source from the `folder` of sounds; null with none. */
    const loudest = (folder: string): number | null => {
      const levels = [...sources]
        .filter((source) =>
          (source.buffer && urls.get(source.buffer))?.includes(
            `/audio/${folder}/`,
          ),
        )
        .map(loudness)
      return levels.length ? Math.max(...levels) : null
    }
    ;(window as unknown as ListeningWindow).heard = (): Heard => {
      const heard: Heard = {
        music: loudest('music'),
        effects: loudest('soundeffects'),
        narration: null,
      }
      const voice = voices.at(-1)
      if (voice) heard.narration = voice.muted ? 0 : voice.volume
      return heard
    }
  })
}

/** What the page sounds like now. */
const heard = (page: Page): Promise<Heard> =>
  page.evaluate(() => (window as unknown as ListeningWindow).heard())

/** Wait until each kind named in `audible` is heard, or is silent, as it says. */
async function expectHeard(
  page: Page,
  audible: Partial<Record<keyof Heard, boolean>>,
): Promise<void> {
  await expect
    .poll(async () => {
      const now = await heard(page)
      return Object.fromEntries(
        Object.keys(audible).map((kind) => [
          kind,
          (now[kind as keyof Heard] ?? 0) > 0,
        ]),
      )
    })
    .toEqual(audible)
}

/**
 * Press Start, begin the act once its chapter page is being read (so the
 * recordings have arrived), and talk to the voice, whose answer is read too.
 */
async function startPlaying(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.locator('.lq-chapter-title.lq-speaking')).toHaveCount(1)
  await page.locator('.lq-chapter-button').click()
  await enterCommand(page, 'talk to voice')
  await expect(page.locator('.lq-speaking')).not.toHaveCount(0)
}

/** Open Settings from the menu. */
async function openSettings(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
}

test('SND-3: each volume at 0 silences its sound, and the volumes are kept between visits', async ({
  page,
}): Promise<void> => {
  await listen(page)
  await page.goto('/')
  await startPlaying(page)
  await expectHeard(page, { music: true, effects: true, narration: true })

  // The menu opens while the voice's answer is still being read, and holds it
  // there: the narration volume is heard on that line.
  // Effects before music: music turned right down takes the room's effects with it.
  await openSettings(page)
  await page.getByLabel('Sound effects volume').fill('0')
  await expectHeard(page, { music: true, effects: false, narration: true })
  await page.getByLabel('Narration volume').fill('0')
  await expectHeard(page, { music: true, effects: false, narration: false })
  await page.getByLabel('Music volume').fill('0')
  await expectHeard(page, { music: false, effects: false, narration: false })

  await page.reload()
  await startPlaying(page)
  // The music and the voice play again, unheard (0, not null: they are there);
  // an effect may be unheard by not playing at all.
  await expect
    .poll(async () => {
      const now = await heard(page)
      return { ...now, effects: now.effects ?? 0 }
    })
    .toEqual({ music: 0, effects: 0, narration: 0 })
  await openSettings(page)
  for (const name of [
    'Music volume',
    'Sound effects volume',
    'Narration volume',
  ])
    await expect(page.getByLabel(name)).toHaveValue('0')
})
