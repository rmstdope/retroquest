import { vi } from 'vitest'

/** A fake source node: records `start`/`stop` and the `loop` flag. */
export class FakeSource {
  loop = false
  buffer: unknown = null
  start = vi.fn()
  stop = vi.fn()
  connect = vi.fn()
  disconnect = vi.fn()
}

/** A fake gain node with a plain `gain.value`. */
export class FakeGain {
  gain = { value: 1 }
  connect = vi.fn()
  disconnect = vi.fn()
}

/**
 * A stand-in for `AudioContext` in tests: it makes recorded gain and source
 * nodes and decodes anything unless `failDecode` is set.
 */
export class FakeAudioContext {
  static last: FakeAudioContext
  state = 'suspended'
  destination = {}
  gains: FakeGain[] = []
  sources: FakeSource[] = []
  failDecode = false
  resume = vi.fn(() => {
    this.state = 'running'
    return Promise.resolve()
  })
  constructor() {
    FakeAudioContext.last = this
  }
  createGain(): FakeGain {
    const gain = new FakeGain()
    this.gains.push(gain)
    return gain
  }
  createBufferSource(): FakeSource {
    const source = new FakeSource()
    this.sources.push(source)
    return source
  }
  decodeAudioData(_data: ArrayBuffer): Promise<unknown> {
    return this.failDecode
      ? Promise.reject(new Error('bad data'))
      : Promise.resolve({ duration: 60 })
  }
}
