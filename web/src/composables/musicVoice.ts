/**
 * The voices a music loop plays on. A voice is what `useMusic` fades, ducks,
 * starts and stops. `WebAudioMusicVoice` loops a decoded buffer, so the loop
 * comes round without a click; `HtmlMusicVoice` is today's element-based
 * playback, kept for a browser that cannot prepare a loop for Web Audio;
 * `SilentMusicVoice` plays nothing, for a scene with no music whose effects
 * still follow a voice's fades (see `ambience.ts`).
 */

/** What `useMusic` needs from a playing loop. */
export interface MusicVoice {
  /** Loudness, 0 to 1: the player's setting, with every fade and dip. */
  volume: number
  /**
   * The music's own level from the scene mix, 0 to 3, 1 as chosen; it raises
   * or lowers the music on top of `volume`. A voice that cannot go above 1
   * ignores it.
   */
  level: number
  /** True while the loop is not sounding. */
  readonly paused: boolean
  /** Starts (or restarts) the loop. */
  play(): Promise<void>
  /** Stops the loop. */
  pause(): void
  /** Lets go of what the voice holds; it is not used again. */
  dispose(): void
}

/** A loop played on an `HTMLAudioElement` (with `loop = true`), as before. */
export class HtmlMusicVoice implements MusicVoice {
  /** Kept but not heard: an element cannot be raised above its full volume. */
  level = 1
  constructor(readonly element: HTMLAudioElement) {}
  get volume(): number {
    return this.element.volume
  }
  set volume(value: number) {
    this.element.volume = value
  }
  get paused(): boolean {
    return this.element.paused
  }
  play(): Promise<void> {
    return this.element.play()
  }
  pause(): void {
    this.element.pause()
  }
  dispose(): void {
    this.element.pause()
  }
}

/** A loop played from a decoded buffer on a looping source node, through a gain at its volume times its level. */
export class WebAudioMusicVoice implements MusicVoice {
  private readonly gain: GainNode
  private source: AudioBufferSourceNode | null = null
  private loudness = 1
  private ownLevel = 1

  constructor(
    private readonly context: AudioContext,
    private readonly buffer: AudioBuffer,
  ) {
    this.gain = context.createGain()
    this.gain.connect(context.destination)
  }
  get volume(): number {
    return this.loudness
  }
  set volume(value: number) {
    this.loudness = value
    this.gain.gain.value = value * this.ownLevel
  }
  get level(): number {
    return this.ownLevel
  }
  set level(value: number) {
    this.ownLevel = value
    this.gain.gain.value = this.loudness * value
  }
  get paused(): boolean {
    return this.source === null
  }
  play(): Promise<void> {
    if (this.source) return Promise.resolve()
    const source = this.context.createBufferSource()
    source.buffer = this.buffer
    source.loop = true
    source.connect(this.gain)
    source.start()
    this.source = source
    return this.context.state === 'suspended'
      ? this.context.resume()
      : Promise.resolve()
  }
  pause(): void {
    if (!this.source) return
    this.source.stop()
    this.source.disconnect()
    this.source = null
  }
  dispose(): void {
    this.pause()
    this.gain.disconnect()
  }
}

/** A voice that plays nothing: a scene with no music, whose effects still follow its fades. */
export class SilentMusicVoice implements MusicVoice {
  volume = 1
  level = 1
  paused = true
  /** Starts the silence. */
  play(): Promise<void> {
    this.paused = false
    return Promise.resolve()
  }
  /** Stops the silence. */
  pause(): void {
    this.paused = true
  }
  /** Holds nothing to let go of. */
  dispose(): void {
    this.paused = true
  }
}

/** Fetches and decodes `url` into a voice; null when either step fails. */
export async function prepareWebAudioVoice(
  context: AudioContext,
  url: string,
): Promise<MusicVoice | null> {
  const buffer = await fetchAudioBuffer(context, url)
  return buffer ? new WebAudioMusicVoice(context, buffer) : null
}

/** Fetches and decodes the audio file at `url` on `context`; null when it cannot be fetched or decoded. */
export async function fetchAudioBuffer(
  context: AudioContext,
  url: string,
): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return await context.decodeAudioData(await response.arrayBuffer())
  } catch {
    return null
  }
}

let context: AudioContext | null | undefined

/**
 * The page's one `AudioContext`, made on first use; null where the browser
 * has none. Asks for the "playback" audio session (iPhone), so the ring/silent
 * switch does not mute the music, as it does not mute the narration.
 */
export function sharedAudioContext(): AudioContext | null {
  if (context !== undefined && context !== null) return context
  const Ctor: typeof AudioContext | undefined =
    typeof AudioContext === 'undefined' ? undefined : AudioContext
  if (!Ctor) return null
  try {
    context = new Ctor()
  } catch {
    return null
  }
  if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
    const session = navigator.audioSession
    if (typeof session === 'object' && session !== null && 'type' in session)
      session.type = 'playback'
  }
  return context
}
