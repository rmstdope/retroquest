/**
 * The sound effects that play with a room's music: rain round and round,
 * lightning now and then. An `Ambience` plays the effects of one track on Web
 * Audio through one gain, into an output that sets the player's effects level
 * (`useActMusic`'s effects bus). An `AmbientVoice`
 * wraps the track's music voice with it, so the effects start and stop with
 * the music and follow every fade `useMusic` gives it (a crossfade, a change
 * through the dark, the title page's rise, the dip under a voice): the
 * effects sound at the same share of their level as the music of its own.
 */
import type { EffectPlay } from '@/lantern/effectLists'
import type { MusicVoice } from './musicVoice'

/** How one decoded effect plays: round and round, or once after a random wait, again and again. */
export type AmbientClip = { buffer: AudioBuffer } & EffectPlay

/** Where an effect's clip is, and how it plays. */
export type AmbientClipSource = { url: string } & EffectPlay

/** The effects of one music track, played on Web Audio through one gain into `output`. */
export class Ambience {
  private readonly gain: GainNode
  private playing = false
  /** The sources sounding now: the loops and any one-shot under way. */
  private sources: AudioBufferSourceNode[] = []
  /** The waits before each one-shot's next start. */
  private timers: ReturnType<typeof setTimeout>[] = []

  /** `random` picks each wait between a one-shot's shortest and longest. */
  constructor(
    private readonly context: AudioContext,
    private readonly clips: readonly AmbientClip[],
    output: AudioNode,
    private readonly random: () => number = Math.random,
  ) {
    this.gain = context.createGain()
    this.gain.connect(output)
  }

  /** Follows the music's fade: the effects sound at `envelope` (0 to 1) of their level. */
  follow(envelope: number): void {
    this.gain.gain.value = envelope
  }

  /** Starts the loops and the waits before each one-shot; nothing when already playing. */
  play(): void {
    if (this.playing) return
    this.playing = true
    for (const clip of this.clips) {
      if (clip.loops) this.sound(clip.buffer, true)
      else this.wait(clip.buffer, clip.everySeconds)
    }
  }

  /** Stops every effect and the waits before the next. */
  pause(): void {
    this.playing = false
    for (const timer of this.timers.splice(0)) clearTimeout(timer)
    for (const source of this.sources.splice(0)) {
      source.stop()
      source.disconnect()
    }
  }

  /** Lets go of what the ambience holds; it is not used again. */
  dispose(): void {
    this.pause()
    this.gain.disconnect()
  }

  /**
   * Plays `buffer` once after a random wait in `everySeconds`, then waits
   * again. While the browser holds the sound back, the strike is skipped
   * rather than kept, so none pile up for the moment it lets go.
   */
  private wait(
    buffer: AudioBuffer,
    [shortest, longest]: readonly [number, number],
  ): void {
    const ms = (shortest + this.random() * (longest - shortest)) * 1000
    const timer = setTimeout(() => {
      this.timers.splice(this.timers.indexOf(timer), 1)
      if (this.context.state === 'running') this.sound(buffer, false)
      this.wait(buffer, [shortest, longest])
    }, ms)
    this.timers.push(timer)
  }

  /** Starts a source playing `buffer` through the gain; a one-shot lets go of itself when it ends. */
  private sound(buffer: AudioBuffer, loop: boolean): void {
    const source = this.context.createBufferSource()
    source.buffer = buffer
    source.loop = loop
    source.connect(this.gain)
    if (!loop)
      source.onended = () => {
        const index = this.sources.indexOf(source)
        if (index >= 0) this.sources.splice(index, 1)
        source.disconnect()
      }
    source.start()
    this.sources.push(source)
  }
}

/**
 * A music voice with its track's effects: the effects start and stop with the
 * music, and each change of the music's volume is followed by the effects as
 * a share of `fullLevel` (the music's own volume setting, 0 to 1). With the
 * music turned all the way down the effects are silent too, as with the
 * music off.
 */
export class AmbientVoice implements MusicVoice {
  /** Wraps `music` with `ambience`, which takes the music's present volume. */
  constructor(
    private readonly music: MusicVoice,
    private readonly ambience: Ambience,
    private readonly fullLevel: () => number,
  ) {
    this.volume = music.volume
  }
  /** The music's volume, 0 to 1. */
  get volume(): number {
    return this.music.volume
  }
  /** Sets the music's volume; the effects follow it as a share of the full level. */
  set volume(value: number) {
    this.music.volume = value
    const full = this.fullLevel()
    this.ambience.follow(full > 0 ? Math.min(1, Math.max(0, value / full)) : 0)
  }
  /** True while the music is not sounding. */
  get paused(): boolean {
    return this.music.paused
  }
  /** Starts the music and its effects. */
  play(): Promise<void> {
    const started = this.music.play()
    this.ambience.play()
    return started
  }
  /** Stops the music and its effects. */
  pause(): void {
    this.music.pause()
    this.ambience.pause()
  }
  /** Lets go of the music and its effects. */
  dispose(): void {
    this.music.dispose()
    this.ambience.dispose()
  }
}

/** Fetches and decodes each clip into an ambience playing into `output`, leaving out any that fails; null when none could be. */
export async function prepareAmbience(
  context: AudioContext,
  sources: readonly AmbientClipSource[],
  output: AudioNode,
): Promise<Ambience | null> {
  const clips = await Promise.all(
    sources.map(async ({ url, ...play }): Promise<AmbientClip | null> => {
      try {
        const response = await fetch(url)
        if (!response.ok) return null
        const buffer = await context.decodeAudioData(
          await response.arrayBuffer(),
        )
        return { buffer, ...play }
      } catch {
        return null
      }
    }),
  )
  const ready = clips.filter((clip): clip is AmbientClip => clip !== null)
  return ready.length > 0 ? new Ambience(context, ready, output) : null
}
