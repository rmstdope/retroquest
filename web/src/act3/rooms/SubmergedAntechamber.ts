import { Room, event } from '@/engine'
import type { Exits, GameState } from '@/engine'
import {
  FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
  FLAG_ACT3_LANTERN_BRACKETS_FOUND,
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
} from '../Act3StoryFlags'
import { LanternBracket } from '../items/LanternBracket'
import { PrismLantern } from '../items/PrismLantern'

/** An antechamber where salt and memory linger in the stones. */
export class SubmergedAntechamber extends Room {
  constructor() {
    super({
      name: 'Submerged Antechamber',
      description:
        'The hall lies half-swallowed by tide and time. Salt-smoothed stone ' +
        'arches bear weathered carvings that pulse with a cold, inner glow. ' +
        'A hush hangs in the air as if the sea itself listens; faint, ' +
        'distant echoes suggest something patient and watchful beyond the ' +
        'veil of gloom. The place tastes of old prayers and the memory of ' +
        'rituals long since folded into the stones.',
      items: [],
      characters: [],
      exits: {
        north: 'OuterWards',
        east: 'SanctumOfTheTide',
        west: 'TidalCauseway',
      },
    })
  }

  /**
   * Describe the room; once the Tideward sigils are completed the tide has
   * withdrawn and the stored description changes to the unmasked hall.
   */
  override describe(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED)) {
      this.description =
        'The hall, recently unmasked by a withdrawing tide, shows the bare ' +
        'lines of its carved work. Salt crystals glitter on exposed stone; ' +
        "the air feels colder and the rooms' echoes are clearer than before."
    }
    return super.describe(gameState)
  }

  /** Search the antechamber for subtle traces and hidden marks. */
  override search(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED)) {
      return event(
        "The water in the hall sits high and murky. It's impossible to " +
          'search effectively here — the flooded approach hides whatever might ' +
          'lie beneath the surface.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT)) {
      return event(
        'The niches glow with steady, pearlescent flame. The lanterns you ' +
          'set here still burn.',
      )
    }
    const alreadyHere = this.items.some((i) => i instanceof LanternBracket)
    if (!alreadyHere) {
      // Add three brackets to the room for players to mount lanterns on
      this.items.push(
        new LanternBracket(),
        new LanternBracket(),
        new LanternBracket(),
      )
      gameState.setStoryFlag(FLAG_ACT3_LANTERN_BRACKETS_FOUND, true)
      return event(
        'You wade through chilled water. As you peer into the niches, ' +
          'three carved brackets become apparent; their grooves catch the ' +
          'faint tide-light.',
      )
    }
    return event(
      'You wade through chilled water. Three empty brackets line the ' +
        'approach; their carved grooves catch the faint tide-light.',
    )
  }

  /** Place a prism lantern into an available mount in the hall. */
  mountLantern(gameState: GameState): string {
    const empty = this.items.find(
      (b): b is LanternBracket => b instanceof LanternBracket && !b.hasLantern,
    )
    if (!empty) {
      return '[dim]All brackets here are already filled.[/dim]'
    }
    const lantern = gameState.inventory.find((i) => i instanceof PrismLantern)
    if (!lantern) {
      return (
        '[failure]You need a [item_name]Prism Lantern[/item_name] to mount ' +
        'here.[/failure]'
      )
    }
    gameState.inventory.splice(gameState.inventory.indexOf(lantern), 1)
    empty.putLantern()
    return event(
      'You seat the prism lantern; water hums softly as the bracket takes its ' +
        'weight.',
    )
  }

  /** Cast light to awaken the hall's latent illumination using mounted lanterns. */
  castLightHere(gameState: GameState): string {
    const brackets = this.items.filter(
      (b): b is LanternBracket => b instanceof LanternBracket,
    )
    if (brackets.length === 0) {
      return event(
        'A warm spark flares in your palm and fades—nothing here seems to ' +
          'catch.',
      )
    }
    if (!brackets.every((b) => b.hasLantern)) {
      return (
        '[failure]You kindle a spark, but without lanterns mounted, nothing ' +
        'gets lit.[/failure]'
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT)) {
      return '[dim]The prism lanterns already burn with steady, cold flame.[/dim]'
    }
    gameState.setStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, true)
    return (
      '[success]Light pours from the prisms, weaving a clear path through ' +
      'the flooded hall. The way to the sanctum stands revealed.[/success]'
    )
  }

  /** Return exits, gating the sanctum entrance on two Act III story flags. */
  override getExits(gameState: GameState): Exits {
    const exits = { ...this.exits }
    const lanternsLit = gameState.getStoryFlag(
      FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
    )
    const sigilsDone = gameState.getStoryFlag(
      FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
    )
    if (!(lanternsLit && sigilsDone)) {
      delete exits.east
    }
    return exits
  }
}
