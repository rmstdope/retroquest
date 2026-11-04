// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  HtmlMusicVoice,
  SilentMusicVoice,
  WebAudioMusicVoice,
  prepareWebAudioVoice,
  sharedAudioContext,
} from './musicVoice'
import { FakeAudioContext } from '@/testing/fakeAudioContext'

describe('HtmlMusicVoice', () => {
  it('mirrors the element it wraps', async () => {
    const el = {
      volume: 1,
      paused: true as boolean,
      play: vi.fn(() => {
        el.paused = false
        return Promise.resolve()
      }),
      pause: vi.fn(() => {
        el.paused = true
      }),
    }
    const voice = new HtmlMusicVoice(el as unknown as HTMLAudioElement)
    voice.volume = 0.4
    expect(el.volume).toBe(0.4)
    expect(voice.paused).toBe(true)
    await voice.play()
    expect(voice.paused).toBe(false)
    voice.pause()
    expect(el.pause).toHaveBeenCalled()
  })
})

describe('WebAudioMusicVoice', () => {
  it('plays a looping source through a gain; pause stops it and play makes a new one', async () => {
    const ctx = new FakeAudioContext()
    const voice = new WebAudioMusicVoice(
      ctx as unknown as AudioContext,
      {} as AudioBuffer,
    )
    voice.volume = 0.5
    expect(ctx.gains[0].gain.value).toBe(0.5)
    expect(voice.paused).toBe(true)
    await voice.play()
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0].loop).toBe(true)
    expect(ctx.sources[0].start).toHaveBeenCalled()
    expect(voice.paused).toBe(false)
    voice.pause()
    expect(ctx.sources[0].stop).toHaveBeenCalled()
    expect(voice.paused).toBe(true)
    await voice.play()
    expect(ctx.sources).toHaveLength(2)
  })

  it('raises or lowers the music by its level, on top of its volume', () => {
    const ctx = new FakeAudioContext()
    const voice = new WebAudioMusicVoice(
      ctx as unknown as AudioContext,
      {} as AudioBuffer,
    )
    voice.volume = 0.5
    voice.level = 2.5
    expect(voice.volume).toBe(0.5)
    expect(ctx.gains[0].gain.value).toBeCloseTo(1.25)
    voice.volume = 0.2
    expect(ctx.gains[0].gain.value).toBeCloseTo(0.5)
  })
})

describe('SilentMusicVoice', () => {
  it('plays and pauses nothing, keeping the volume it is faded to', async () => {
    const voice = new SilentMusicVoice()
    expect(voice.paused).toBe(true)
    await voice.play()
    expect(voice.paused).toBe(false)
    voice.volume = 0.3
    expect(voice.volume).toBe(0.3)
    voice.pause()
    expect(voice.paused).toBe(true)
  })
})

describe('prepareWebAudioVoice', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('decodes the file into a voice', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)),
        }),
      ),
    )
    const ctx = new FakeAudioContext()
    const voice = await prepareWebAudioVoice(
      ctx as unknown as AudioContext,
      '/a.mp3',
    )
    expect(voice).toBeInstanceOf(WebAudioMusicVoice)
  })

  it('gives null when the file cannot be fetched or decoded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false })),
    )
    const ctx = new FakeAudioContext()
    expect(
      await prepareWebAudioVoice(ctx as unknown as AudioContext, '/a.mp3'),
    ).toBeNull()
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)),
        }),
      ),
    )
    ctx.failDecode = true
    expect(
      await prepareWebAudioVoice(ctx as unknown as AudioContext, '/a.mp3'),
    ).toBeNull()
  })
})

describe('sharedAudioContext', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('is null where the browser has no AudioContext', () => {
    vi.stubGlobal('AudioContext', undefined)
    expect(sharedAudioContext()).toBeNull()
  })

  it('asks for playback audio so the iPhone silent switch does not mute it', async () => {
    vi.resetModules()
    vi.stubGlobal('AudioContext', FakeAudioContext)
    const session = { type: 'auto' }
    vi.stubGlobal('navigator', { audioSession: session })
    const mod = await import('./musicVoice')
    expect(mod.sharedAudioContext()).not.toBeNull()
    expect(session.type).toBe('playback')
  })
})
