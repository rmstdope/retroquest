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

  describe('a clip played once on entry', () => {
    const bell = { duration: 2 } as unknown as AudioBuffer

    /** An ambience of a bell rung once, 1.5 s after the room's music starts. */
    function shop(): Ambience {
      return new Ambience(
        ctx as unknown as AudioContext,
        [{ buffer: bell, loops: false, afterSeconds: 1.5 }],
        bus,
      )
    }

    it('plays once, after its wait', () => {
      shop().play()
      vi.advanceTimersByTime(1499)
      expect(sourcesOf(bell)).toHaveLength(0)
      vi.advanceTimersByTime(1)
      expect(sourcesOf(bell)).toHaveLength(1)
      expect(sourcesOf(bell)[0].loop).toBe(false)
      vi.advanceTimersByTime(60_000)
      expect(sourcesOf(bell)).toHaveLength(1)
    })

    it('does not play again when the music stops and starts again', () => {
      const ambience = shop()
      ambience.play()
      vi.advanceTimersByTime(1500)
      ambience.pause()
      ambience.play()
      vi.advanceTimersByTime(60_000)
      expect(sourcesOf(bell)).toHaveLength(1)
    })

    it('still plays when the music stopped before it sounded', () => {
      const ambience = shop()
      ambience.play()
      ambience.pause()
      vi.advanceTimersByTime(60_000)
      expect(sourcesOf(bell)).toHaveLength(0)
      ambience.play()
      vi.advanceTimersByTime(1500)
      expect(sourcesOf(bell)).toHaveLength(1)
    })

    it('plays as soon as the browser lets the sound go, while the music plays on', () => {
      const ambience = shop()
      ctx.state = 'suspended'
      ambience.play()
      vi.advanceTimersByTime(5000)
      expect(sourcesOf(bell)).toHaveLength(0)
      ctx.state = 'running'
      vi.advanceTimersByTime(250)
      expect(sourcesOf(bell)).toHaveLength(1)
      vi.advanceTimersByTime(60_000)
      expect(sourcesOf(bell)).toHaveLength(1)
    })

    it('still plays when the browser held the sound back as it was due', () => {
      const ambience = shop()
      ctx.state = 'suspended'
      ambience.play()
      vi.advanceTimersByTime(1500)
      expect(sourcesOf(bell)).toHaveLength(0)
      ambience.pause()
      ctx.state = 'running'
      ambience.play()
      vi.advanceTimersByTime(1500)
      expect(sourcesOf(bell)).toHaveLength(1)
    })
  })

  describe('clips that follow the room’s sound state', () => {
    const whir = { duration: 20 } as unknown as AudioBuffer
    const wind = { duration: 20 } as unknown as AudioBuffer
    const creak = { duration: 3 } as unknown as AudioBuffer

    /** A mill: wind always, a whir while `whirring`, a creak every 5 s once `jammed`. */
    function mill(): Ambience {
      return new Ambience(
        ctx as unknown as AudioContext,
        [
          { buffer: wind, loops: true },
          { buffer: whir, loops: true, state: 'whirring' },
          {
            buffer: creak,
            loops: false,
            everySeconds: [5, 5],
            state: 'jammed',
          },
        ],
        bus,
      )
    }

    it('plays a clip with a state only in that state', () => {
      const ambience = mill()
      ambience.setState('whirring')
      ambience.play()
      vi.advanceTimersByTime(10_000)
      expect(sourcesOf(wind)).toHaveLength(1)
      expect(sourcesOf(whir)).toHaveLength(1)
      expect(sourcesOf(creak)).toHaveLength(0)
    })

    it('plays none of them in no state', () => {
      mill().play()
      vi.advanceTimersByTime(10_000)
      expect(sourcesOf(wind)).toHaveLength(1)
      expect(sourcesOf(whir)).toHaveLength(0)
      expect(sourcesOf(creak)).toHaveLength(0)
    })

    it('stops the old state’s clips and starts the new one’s as it changes, leaving the rest', () => {
      const ambience = mill()
      ambience.setState('whirring')
      ambience.play()
      ambience.setState('jammed')
      expect(sourcesOf(whir)[0].stop).toHaveBeenCalled()
      expect(sourcesOf(wind)[0].stop).not.toHaveBeenCalled()
      vi.advanceTimersByTime(5000)
      expect(sourcesOf(creak)).toHaveLength(1)
      expect(sourcesOf(wind)).toHaveLength(1)
    })

    /** The gain a source plays through: its own, the one it connects to. */
    function gainOf(source: FakeSource) {
      return source.connect.mock.calls[0][0] as unknown as {
        gain: {
          setValueAtTime: ReturnType<typeof vi.fn>
          linearRampToValueAtTime: ReturnType<typeof vi.fn>
          cancelScheduledValues: ReturnType<typeof vi.fn>
        }
      }
    }

    it('fades the old state’s loop out and the new one’s in, rather than cutting', () => {
      const wail = { duration: 20 } as unknown as AudioBuffer
      const ambience = new Ambience(
        ctx as unknown as AudioContext,
        [
          { buffer: whir, loops: true, state: 'whirring' },
          { buffer: wail, loops: true, state: 'jammed' },
        ],
        bus,
      )
      ambience.setState('whirring')
      ambience.play()
      ctx.currentTime = 10
      ambience.setState('jammed')
      const [old] = sourcesOf(whir)
      expect(gainOf(old).gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0,
        10.3,
      )
      expect(old.stop).toHaveBeenCalledWith(10.3)
      const [fresh] = sourcesOf(wail)
      expect(gainOf(fresh).gain.setValueAtTime).toHaveBeenCalledWith(0, 10)
      expect(gainOf(fresh).gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        1,
        10.3,
      )
    })

    it('fades out from where a fade-in had got to, without swelling first', () => {
      const ambience = mill()
      ambience.play()
      ctx.currentTime = 1
      ambience.setState('whirring')
      ctx.currentTime = 1.1
      ambience.setState('')
      const [whirring] = sourcesOf(whir)
      expect(gainOf(whirring).gain.cancelScheduledValues).toHaveBeenCalledWith(
        1.1,
      )
    })

    it('cuts a clip still fading out when the music stops', () => {
      const ambience = mill()
      ambience.setState('whirring')
      ambience.play()
      ambience.setState('jammed')
      const [old] = sourcesOf(whir)
      ambience.pause()
      expect(old.stop).toHaveBeenLastCalledWith()
    })

    it('starts nothing when the state changes while paused, until it plays', () => {
      const ambience = mill()
      ambience.setState('jammed')
      vi.advanceTimersByTime(10_000)
      expect(ctx.sources).toHaveLength(0)
      ambience.play()
      vi.advanceTimersByTime(5000)
      expect(sourcesOf(creak)).toHaveLength(1)
    })

    it('cancels the waits of the old state’s one-shots as it changes', () => {
      const ambience = mill()
      ambience.setState('jammed')
      ambience.play()
      ambience.setState('whirring')
      vi.advanceTimersByTime(60_000)
      expect(sourcesOf(creak)).toHaveLength(0)
    })

    it('changes nothing when told the state it is in', () => {
      const ambience = mill()
      ambience.setState('whirring')
      ambience.play()
      ambience.setState('whirring')
      expect(sourcesOf(whir)).toHaveLength(1)
      expect(sourcesOf(whir)[0].stop).not.toHaveBeenCalled()
    })
  })

  describe('the volume of each clip', () => {
    /** The gain a source plays through: its own, the one it connects to. */
    function levelOf(source: FakeSource): { value: number } {
      return (source.connect.mock.calls[0][0] as { gain: { value: number } })
        .gain
    }

    /** A storm whose lightning plays at `volume` (rain at its own 1). */
    function loudStorm(volume: number): Ambience {
      return new Ambience(
        ctx as unknown as AudioContext,
        [
          { buffer: rain, loops: true, id: 'rain' },
          {
            buffer: strike,
            loops: false,
            everySeconds: [3, 8],
            id: 'lightning',
            volume,
          },
        ],
        bus,
        () => 0,
      )
    }

    it('plays each clip at its own volume, the full one by default', () => {
      loudStorm(2.5).play()
      vi.advanceTimersByTime(3000)
      expect(levelOf(sourcesOf(rain)[0]).value).toBe(1)
      expect(levelOf(sourcesOf(strike)[0]).value).toBe(2.5)
    })

    it('changes a clip’s volume as it plays, and for its next start', () => {
      const ambience = loudStorm(1)
      ambience.play()
      ambience.setVolume('rain', 0.4)
      expect(levelOf(sourcesOf(rain)[0]).value).toBeCloseTo(0.4)
      ambience.setVolume('lightning', 3)
      vi.advanceTimersByTime(3000)
      expect(levelOf(sourcesOf(strike)[0]).value).toBe(3)
    })

    it('plays a one-shot at once when asked, besides its own waits', () => {
      const ambience = loudStorm(1)
      ambience.play()
      ambience.audition('lightning')
      expect(sourcesOf(strike)).toHaveLength(1)
      vi.advanceTimersByTime(3000)
      expect(sourcesOf(strike)).toHaveLength(2)
    })

    it('plays nothing on request while the music is stopped', () => {
      loudStorm(1).audition('lightning')
      expect(sourcesOf(strike)).toHaveLength(0)
    })

    it('plays a one-shot asked for at its own volume, even while another is soloed', () => {
      const ambience = loudStorm(2)
      ambience.play()
      ambience.solo('rain')
      ambience.audition('lightning')
      expect(levelOf(sourcesOf(strike)[0]).value).toBe(2)
    })

    it('keeps a one-shot asked for sounding while levels change under a solo', () => {
      const ambience = loudStorm(2)
      ambience.play()
      ambience.solo('rain')
      ambience.audition('lightning')
      ambience.setVolume('rain', 0.5)
      expect(levelOf(sourcesOf(strike)[0]).value).toBe(2)
    })

    it('takes a level set during a fade-in at once, without the ramp undoing it', () => {
      const wail = { duration: 20 } as unknown as AudioBuffer
      const ambience = new Ambience(
        ctx as unknown as AudioContext,
        [
          { buffer: rain, loops: true, id: 'rain' },
          { buffer: wail, loops: true, id: 'wail', state: 'lit' },
        ],
        bus,
      )
      ambience.play()
      ambience.setState('lit')
      ctx.currentTime = 5
      ambience.solo('rain')
      const gain = (
        sourcesOf(wail)[0].connect.mock.calls[0][0] as {
          gain: {
            value: number
            cancelScheduledValues: ReturnType<typeof vi.fn>
          }
        }
      ).gain
      expect(gain.cancelScheduledValues).toHaveBeenCalledWith(5)
      expect(gain.value).toBe(0)
    })

    it('silences every other clip while one is soloed, and gives them back after', () => {
      const ambience = loudStorm(2)
      ambience.play()
      ambience.solo('lightning')
      expect(levelOf(sourcesOf(rain)[0]).value).toBe(0)
      vi.advanceTimersByTime(3000)
      expect(levelOf(sourcesOf(strike)[0]).value).toBe(2)
      ambience.solo(null)
      expect(levelOf(sourcesOf(rain)[0]).value).toBe(1)
    })
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

  it('takes effects that arrive after the music started, at its present share', async () => {
    const music = new FakeMusic()
    const voice = new AmbientVoice(music, null, () => 1)
    await voice.play()
    voice.volume = 0.5
    voice.attach(storm())
    expect(sourcesOf(rain)[0].start).toHaveBeenCalled()
    expect(ctx.gains[0].gain.value).toBeCloseTo(0.5)
  })

  it('keeps effects that arrive while the music is stopped for its next play', async () => {
    const voice = new AmbientVoice(new FakeMusic(), null, () => 1)
    voice.attach(storm())
    expect(sourcesOf(rain)).toHaveLength(0)
    await voice.play()
    expect(sourcesOf(rain)).toHaveLength(1)
  })

  it('lets go of effects that arrive after it was let go of', () => {
    const voice = new AmbientVoice(new FakeMusic(), null, () => 1)
    voice.dispose()
    voice.attach(storm())
    expect(sourcesOf(rain)).toHaveLength(0)
    expect(ctx.gains[0].disconnect).toHaveBeenCalled()
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
