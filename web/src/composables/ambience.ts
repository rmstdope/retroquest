/**
 * The sound effects that play with a room's music: rain round and round,
 * lightning now and then, a shop bell once on entering, and a whir only while
 * the room is in the state that has it. An `Ambience` plays the effects of
 * one track on Web Audio through one gain, into an output that sets the
 * player's effects level (`useActMusic`'s effects bus); `setState` follows
 * the room's sound state, fading out and in only the clips that change.
 * An `AmbientVoice` wraps the track's music voice with it, so the effects
 * start and stop with the music and follow every fade `useMusic` gives it (a
 * crossfade, a change through the dark, the title page's rise, the dip under
 * a voice): the effects sound at the same share of their level as the music
 * of its own.
 */
import type { EffectPlay, EffectWhen } from '@/lantern/effectLists'
import { fetchAudioBuffer, type MusicVoice } from './musicVoice'

/** How one decoded effect plays (round and round, after a random wait again and again, or once), and in which state. */
export type AmbientClip = { buffer: AudioBuffer } & EffectPlay & EffectWhen

/** Where an effect's clip is, how it plays and in which state. */
export type AmbientClipSource = { url: string } & EffectPlay & EffectWhen

/** How long a clip fades in or out as the room's sound state changes, in seconds. */
const STATE_FADE_SECONDS = 0.3

/** How often a clip played once looks again while the browser holds the sound back, in seconds. */
const ONCE_RETRY_SECONDS = 0.25

/** The effects of one music track, played on Web Audio through one gain into `output`. */
export class Ambience {
  private readonly gain: GainNode
  private playing = false
  /** The room's sound state; a clip with a state plays only in it. */
  private state = ''
  /** The sources sounding now, by clip, each through its own gain: the loops and any one-shot under way. */
  private sources: {
    clip: AmbientClip
    node: AudioBufferSourceNode
    level: GainNode
  }[] = []
  /** The sources fading out after a change of state; a pause cuts them. */
  private fading: { node: AudioBufferSourceNode; level: GainNode }[] = []
  /** The waits before each one-shot's next start, by clip. */
  private timers: {
    clip: AmbientClip
    timer: ReturnType<typeof setTimeout>
  }[] = []
  /** Set once the ambience is let go of. */
  private gone = false
  /** The clips played once that have sounded; they do not sound again. */
  private readonly sounded = new Set<AmbientClip>()

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

  /**
   * Starts the loops and the waits before each one-shot, and before each clip
   * played once that has not sounded yet, of the clips that play in the
   * present state; nothing when already playing.
   */
  play(): void {
    if (this.playing) return
    this.playing = true
    for (const clip of this.clips) if (this.playsNow(clip)) this.start(clip)
  }

  /**
   * Takes the room's sound state. While playing, the clips of the old state
   * fade out and those of the new fade in (`STATE_FADE_SECONDS`); the clips
   * that play in every state go on.
   */
  setState(state: string): void {
    if (state === this.state) return
    const before = this.clips.filter((clip) => this.playsNow(clip))
    this.state = state
    if (!this.playing) return
    for (const clip of this.clips) {
      const was = before.includes(clip)
      const is = this.playsNow(clip)
      if (was && !is) this.stop(clip, true)
      else if (!was && is) this.start(clip, true)
    }
  }

  /** Stops every effect and the waits before the next. */
  pause(): void {
    this.playing = false
    for (const clip of this.clips) this.stop(clip)
    for (const { node, level } of this.fading.splice(0)) {
      node.stop()
      node.disconnect()
      level.disconnect()
    }
  }

  /** Lets go of what the ambience holds; it is not used again. */
  dispose(): void {
    this.pause()
    this.gain.disconnect()
    this.gone = true
  }

  /** Whether the ambience has been let go of. */
  get disposed(): boolean {
    return this.gone
  }

  /** Whether `clip` plays in the present state: always, for one with none. */
  private playsNow(clip: AmbientClip): boolean {
    return clip.state === undefined || clip.state === this.state
  }

  /** Starts `clip` as it plays: round and round (fading in when `fade`), after a random wait, or once. */
  private start(clip: AmbientClip, fade = false): void {
    if (clip.loops) this.sound(clip, true, fade)
    else if ('afterSeconds' in clip) this.once(clip, clip.afterSeconds)
    else this.wait(clip, clip.everySeconds)
  }

  /** Stops `clip`'s waits and its sources: at once, or fading out when `fade`. */
  private stop(clip: AmbientClip, fade = false): void {
    for (const { timer } of this.take(this.timers, clip)) clearTimeout(timer)
    for (const { node, level } of this.take(this.sources, clip)) {
      const letGo = (): void => {
        node.disconnect()
        level.disconnect()
      }
      if (!fade) {
        node.stop()
        letGo()
        continue
      }
      // From where any fade-in under way has got to, so it never swells first.
      const now = this.context.currentTime
      const from = level.gain.value
      level.gain.cancelScheduledValues(now)
      level.gain.setValueAtTime(from, now)
      level.gain.linearRampToValueAtTime(0, now + STATE_FADE_SECONDS)
      const entry = { node, level }
      this.fading.push(entry)
      node.onended = () => {
        const index = this.fading.indexOf(entry)
        if (index >= 0) this.fading.splice(index, 1)
        letGo()
      }
      node.stop(now + STATE_FADE_SECONDS)
    }
  }

  /** Removes and returns the entries of `list` for `clip`. */
  private take<T extends { clip: AmbientClip }>(
    list: T[],
    clip: AmbientClip,
  ): T[] {
    const taken = list.filter((entry) => entry.clip === clip)
    for (const entry of taken) list.splice(list.indexOf(entry), 1)
    return taken
  }

  /** Waits `ms`, then runs `then` for `clip`, forgetting the wait as it ends. */
  private after(clip: AmbientClip, ms: number, then: () => void): void {
    const entry = {
      clip,
      timer: setTimeout(() => {
        this.timers.splice(this.timers.indexOf(entry), 1)
        then()
      }, ms),
    }
    this.timers.push(entry)
  }

  /**
   * Plays `clip` once after a random wait in `everySeconds`, then waits
   * again. While the browser holds the sound back, the strike is skipped
   * rather than kept, so none pile up for the moment it lets go.
   */
  private wait(
    clip: AmbientClip,
    [shortest, longest]: readonly [number, number],
  ): void {
    const ms = (shortest + this.random() * (longest - shortest)) * 1000
    this.after(clip, ms, () => {
      if (this.context.state === 'running') this.sound(clip, false)
      this.wait(clip, [shortest, longest])
    })
  }

  /**
   * Plays `clip` after `seconds`, the one time it sounds for this ambience.
   * While the browser holds the sound back as it is due, it looks again every
   * `ONCE_RETRY_SECONDS` and plays as soon as the sound is let go; a pause
   * before then leaves it for the next play. Going straight back into a room
   * whose music is still fading out picks up that same ambience, so its clip
   * played once does not sound again.
   */
  private once(clip: AmbientClip, seconds: number): void {
    if (this.sounded.has(clip)) return
    this.after(clip, seconds * 1000, () => {
      if (this.context.state !== 'running') {
        this.once(clip, ONCE_RETRY_SECONDS)
        return
      }
      this.sounded.add(clip)
      this.sound(clip, false)
    })
  }

  /**
   * Starts a source playing `clip` through its own gain into the ambience's,
   * rising from silence when `fade`; a one-shot lets go of itself when it ends.
   */
  private sound(clip: AmbientClip, loop: boolean, fade = false): void {
    const node = this.context.createBufferSource()
    node.buffer = clip.buffer
    node.loop = loop
    const level = this.context.createGain()
    if (fade) {
      const now = this.context.currentTime
      level.gain.setValueAtTime(0, now)
      level.gain.linearRampToValueAtTime(1, now + STATE_FADE_SECONDS)
    }
    node.connect(level)
    level.connect(this.gain)
    const entry = { clip, node, level }
    if (!loop)
      node.onended = () => {
        const index = this.sources.indexOf(entry)
        if (index >= 0) this.sources.splice(index, 1)
        node.disconnect()
        level.disconnect()
      }
    node.start()
    this.sources.push(entry)
  }
}

/**
 * A music voice with its track's effects: the effects start and stop with the
 * music, and each change of the music's volume is followed by the effects as
 * a share of `fullLevel` (the music's own volume setting, 0 to 1). With the
 * music turned all the way down the effects are silent too, as with the
 * music off. The effects may come after the music has started (`attach`), so
 * they never hold it back.
 */
export class AmbientVoice implements MusicVoice {
  /** Set once the voice is let go of; effects arriving later are let go of too. */
  private gone = false

  /** Wraps `music` with `ambience` (or none yet), which takes the music's present volume. */
  constructor(
    private readonly music: MusicVoice,
    private ambience: Ambience | null,
    private readonly fullLevel: () => number,
  ) {
    this.volume = music.volume
  }

  /**
   * Adds effects that arrived after the music: at the music's present share,
   * and sounding at once when the music does. After `dispose` they are let go of.
   */
  attach(ambience: Ambience): void {
    if (this.gone) {
      ambience.dispose()
      return
    }
    this.ambience?.dispose()
    this.ambience = ambience
    this.follow()
    if (!this.music.paused) ambience.play()
  }

  /** The music's volume, 0 to 1. */
  get volume(): number {
    return this.music.volume
  }
  /** Sets the music's volume; the effects follow it as a share of the full level. */
  set volume(value: number) {
    this.music.volume = value
    this.follow()
  }
  /** True while the music is not sounding. */
  get paused(): boolean {
    return this.music.paused
  }
  /** Starts the music and its effects. */
  play(): Promise<void> {
    const started = this.music.play()
    this.ambience?.play()
    return started
  }
  /** Stops the music and its effects. */
  pause(): void {
    this.music.pause()
    this.ambience?.pause()
  }
  /** Lets go of the music and its effects. */
  dispose(): void {
    this.gone = true
    this.music.dispose()
    this.ambience?.dispose()
  }

  /** Sets the effects to the music's present share of its full level. */
  private follow(): void {
    const full = this.fullLevel()
    const value = this.music.volume
    this.ambience?.follow(full > 0 ? Math.min(1, Math.max(0, value / full)) : 0)
  }
}

/** Gives the decoded clip at a URL; null when it cannot be had. */
export type ClipLoader = (url: string) => Promise<AudioBuffer | null>

/**
 * Decodes each clip (through `load`, which may keep clips it has decoded
 * before) into an ambience playing into `output`, leaving out any that fails;
 * null when none could be.
 */
export async function prepareAmbience(
  context: AudioContext,
  sources: readonly AmbientClipSource[],
  output: AudioNode,
  load: ClipLoader = (url) => fetchAudioBuffer(context, url),
): Promise<Ambience | null> {
  const clips = await Promise.all(
    sources.map(async ({ url, ...play }): Promise<AmbientClip | null> => {
      const buffer = await load(url)
      return buffer ? { buffer, ...play } : null
    }),
  )
  const ready = clips.filter((clip): clip is AmbientClip => clip !== null)
  return ready.length > 0 ? new Ambience(context, ready, output) : null
}
