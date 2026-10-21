import { Item, type GameState } from '@/engine'
import { FLAG_ACT3_SHELL_HEARD } from '../Act3StoryFlags'

/** What the shell plays the first time it is listened to. */
const FIRST_LISTEN =
  'You hold the shell to your ear. Beneath the hush of the sea, a woman is ' +
  'humming: a slow tune that climbs three notes and settles home again. You ' +
  'almost know how it goes on. When you lower the shell, the tune stays ' +
  'with you a moment longer.'

/** What the shell plays every time after the first. */
const LATER_LISTEN =
  'The woman in the shell is still humming the same slow tune.'

/** The hint, appended to the description, that the shell hums. */
const HUM_HINT = 'Held close, it seems to hum.'

/**
 * A smooth shell polished by tides; can be picked up. Held to the ear it
 * hums a woman's tune, which the phantoms and the dream voice echo later.
 */
export class PolishedShell extends Item {
  constructor() {
    super({
      name: 'Polished Shell',
      description:
        "A small, iridescent shell smoothed by long tides. It's pretty and " +
        'shines in the moonlight.',
      shortName: 'shell',
      canBeCarried: true,
    })
  }

  /**
   * Examine the shell: the description plus the hint that it hums. The hint
   * is added here, not in the description, so a save made before it existed
   * (which restores the old description) still shows it.
   */
  override examine(gameState: GameState): string {
    const saved = this.description
    this.description = `${saved} ${HUM_HINT}`
    try {
      return super.examine(gameState)
    } finally {
      this.description = saved
    }
  }

  /** Play the tune: the full passage once, then one short line. */
  override listen(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT3_SHELL_HEARD)) return LATER_LISTEN
    gameState.setStoryFlag(FLAG_ACT3_SHELL_HEARD, true)
    return FIRST_LISTEN
  }

  /** Using the shell is listening to it. */
  override use(gameState: GameState): string {
    return this.listen(gameState)
  }
}
