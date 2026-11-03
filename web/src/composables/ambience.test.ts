/**
 * The effects that play with a room's music: a loop round and round, a one-shot
 * now and then, and the voice that makes them follow the music's fades.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeAudioContext, type FakeSource } from '@/testing/fakeAudioContext'
import { Ambience, AmbientVoice, prepareAmbience } from './ambience'
import type { MusicVoice } from './musicVoice'

/** A music voice with a plain volume that records play and pause. */
class FakeMusic implements MusicVoice {
  volume = 1
  paused = true
  play = vi.fn(() => {
    this.paused = false
    return Promise.resolve()
  })
  pause = vi.fn(() => {
    this.paused = true
  })
  dispose = vi.fn()
}

let ctx: FakeAudioContext
const rain = { duration: 20 } as unknown as AudioBuffer
const strike = { duration: 5 } as unknown as AudioBuffer

/** Where the effects play into (the effects bus). */
const bus = {} as AudioNode

/** An ambience of a rain loop and a lightning strike every 3–8 s. */
function storm(random = () => 0): Ambience {
  return new Ambience(
    ctx as unknown as AudioContext,
    [
      { buffer: rain, loops: true },
      { buffer: strike, loops: false, everySeconds: [3, 8] },
    ],
    bus,
    random,
  )
}

/** The sources playing a buffer. */
function sourcesOf(buffer: AudioBuffer): FakeSource[] {
  return ctx.sources.filter((source) => source.buffer === buffer)
}

beforeEach(() => {
  vi.useFakeTimers()
  ctx = new FakeAudioContext()
  ctx.state = 'running'
})
afterEach(() => {
  vi.useRealTimers()
})

describe('Ambience', () => {
  it('starts a loop round and round on play', () => {
    storm().play()
    const [loop] = sourcesOf(rain)
    expect(loop.loop).toBe(true)
    expect(loop.start).toHaveBeenCalledTimes(1)
  })

  it('plays a one-shot after its shortest wait, at the soonest', () => {
    storm(() => 0).play()
    vi.advanceTimersByTime(2999)
    expect(sourcesOf(strike)).toHaveLength(0)
    vi.advanceTimersByTime(1)
    expect(sourcesOf(strike)).toHaveLength(1)
    expect(sourcesOf(strike)[0].loop).toBe(false)
    expect(sourcesOf(strike)[0].start).toHaveBeenCalled()
  })

  it('waits a random time between the shortest and the longest, again after each', () => {
    const waits = [0.5, 1]
    storm(() => waits.shift() ?? 0).play()
    vi.advanceTimersByTime(5500)
    expect(sourcesOf(strike)).toHaveLength(1)
    vi.advanceTimersByTime(7999)
    expect(sourcesOf(strike)).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(sourcesOf(strike)).toHaveLength(2)
  })

  it('plays nothing twice when played again', () => {
    const ambience = storm()
    ambience.play()
    ambience.play()
    vi.advanceTimersByTime(3000)
    expect(sourcesOf(rain)).toHaveLength(1)
    expect(sourcesOf(strike)).toHaveLength(1)
  })

  it('stops the loop, a strike under way and the next strike on pause', () => {
    const ambience = storm()
    ambience.play()
    vi.advanceTimersByTime(3000)
    ambience.pause()
    expect(sourcesOf(rain)[0].stop).toHaveBeenCalled()
    expect(sourcesOf(strike)[0].stop).toHaveBeenCalled()
    vi.advanceTimersByTime(60_000)
    expect(sourcesOf(strike)).toHaveLength(1)
  })

  it('keeps no strike for later while the browser holds the sound back', () => {
    ctx.state = 'suspended'
    storm().play()
    vi.advanceTimersByTime(30_000)
    expect(sourcesOf(strike)).toHaveLength(0)
    ctx.state = 'running'
    vi.advanceTimersByTime(3000)
    expect(sourcesOf(strike)).toHaveLength(1)
  })

  it('plays into its output at the envelope it follows', () => {
    const ambience = storm()
    expect(ctx.gains[0].connect).toHaveBeenCalledWith(bus)
    expect(ctx.gains[0].gain.value).toBe(1)
    ambience.follow(0.5)
    expect(ctx.gains[0].gain.value).toBeCloseTo(0.5)
  })

  it('lets go of its gain on dispose', () => {
    const ambience = storm()
    ambience.play()
    ambience.dispose()
    expect(sourcesOf(rain)[0].stop).toHaveBeenCalled()
    expect(ctx.gains[0].disconnect).toHaveBeenCalled()
  })
})

describe('AmbientVoice', () => {
  it('fades the effects with the music, as a share of its full volume', () => {
    const ambience = storm()
    const voice = new AmbientVoice(new FakeMusic(), ambience, () => 0.5)
    voice.volume = 0.25
    expect(voice.volume).toBe(0.25)
    expect(ctx.gains[0].gain.value).toBeCloseTo(0.5)
    voice.volume = 0
    expect(ctx.gains[0].gain.value).toBe(0)
    voice.volume = 0.5
    expect(ctx.gains[0].gain.value).toBeCloseTo(1)
  })

  it('takes the music volume it wraps from the start', () => {
    const music = new FakeMusic()
    music.volume = 0
    new AmbientVoice(music, storm(), () => 1)
    expect(ctx.gains[0].gain.value).toBe(0)
  })

  it('silences the effects with the music volume set to nothing', () => {
    const voice = new AmbientVoice(new FakeMusic(), storm(), () => 0)
    voice.volume = 0
    expect(ctx.gains[0].gain.value).toBe(0)
  })

  it('starts and stops the effects with the music', async () => {
    const music = new FakeMusic()
    const voice = new AmbientVoice(music, storm(), () => 1)
    expect(voice.paused).toBe(true)
    await voice.play()
    expect(voice.paused).toBe(false)
    expect(sourcesOf(rain)[0].start).toHaveBeenCalled()
    voice.pause()
    expect(music.pause).toHaveBeenCalled()
    expect(sourcesOf(rain)[0].stop).toHaveBeenCalled()
  })

  it('lets go of both on dispose', () => {
    const music = new FakeMusic()
    const voice = new AmbientVoice(music, storm(), () => 1)
    voice.dispose()
    expect(music.dispose).toHaveBeenCalled()
    expect(ctx.gains[0].disconnect).toHaveBeenCalled()
  })
})

describe('prepareAmbience', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve({
          ok: !url.includes('missing'),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)),
        }),
      ),
    )
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('decodes each clip and plays it as asked', async () => {
    const ambience = await prepareAmbience(
      ctx as unknown as AudioContext,
      [{ url: '/rain.mp3', loops: true }],
      bus,
    )
    ambience?.play()
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0].loop).toBe(true)
  })

  it('leaves out a clip that cannot be fetched', async () => {
    const ambience = await prepareAmbience(
      ctx as unknown as AudioContext,
      [
        { url: '/missing.mp3', loops: true },
        { url: '/rain.mp3', loops: true },
      ],
      bus,
    )
    ambience?.play()
    expect(ctx.sources).toHaveLength(1)
  })

  it('is null when no clip could be prepared', async () => {
    ctx.failDecode = true
    expect(
      await prepareAmbience(
        ctx as unknown as AudioContext,
        [{ url: '/rain.mp3', loops: true }],
        bus,
      ),
    ).toBeNull()
    expect(
      await prepareAmbience(ctx as unknown as AudioContext, [], bus),
    ).toBeNull()
  })
})
