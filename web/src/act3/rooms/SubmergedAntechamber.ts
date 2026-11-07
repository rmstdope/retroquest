import { Room, clue } from '@/engine'
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
        'A hall half under the tide. ' +
        'Salt-smoothed arches bear worn carvings that glow cold from within. ' +
        'It is very quiet. ' +
        'Somewhere further in, water drips.',
      items: [],
      characters: [],
      exits: {
        north: 'OuterWards',
        east: 'SanctumOfTheTide',
        west: 'TidalCauseway',
      },
    })
  }

  /** Give a save made with older wording the current description. */
  override refreshSavedText(): void {
    this.description = new SubmergedAntechamber().description
  }

  /**
   * The flooded hall; once the Tideward sigils are completed the tide has
   * withdrawn and the room reads as the unmasked hall.
   */
  override descriptionFor(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED)) {
      return (
        'The tide has drawn back, and the water in the hall is low and cold. ' +
        'Salt crystals glitter on the stone it left bare, ' +
        'and niches stand open along the carved walls. ' +
        'The air is colder, and your steps echo.'
      )
    }
    return this.description
  }

  /**
   * Search the antechamber: flooded before the sigils, the brackets revealed
   * on the first search, then how many of them hold a lantern, and the
   * burning lanterns once they are lit.
   */
  override search(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED)) {
      return (
        "The water in the hall sits high and murky. It's impossible to " +
        'search effectively here — the flooded approach hides whatever might ' +
        'lie beneath the surface.'
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT)) {
      return (
        'The niches glow with steady, pearlescent flame. The lanterns you ' +
        'set here still burn.'
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
      return (
        'You wade through chilled water. As you peer into the niches, ' +
        'three carved brackets become apparent; their grooves catch the ' +
        'faint tide-light.'
      )
    }
    const mounted = this.items.filter(
      (b) => b instanceof LanternBracket && b.hasLantern,
    ).length
    if (mounted === 1) {
      return (
        'You wade through chilled water. A prism lantern sits in one ' +
        'bracket; the other two stand empty, their grooves catching the ' +
        'faint tide-light.'
      )
    }
    if (mounted === 2) {
      return (
        'You wade through chilled water. Prism lanterns sit in two of the ' +
        'brackets; the third stands empty, its grooves catching the faint ' +
        'tide-light.'
      )
    }
    if (mounted >= 3) {
      return (
        'You wade through chilled water. All three brackets hold prism ' +
        'lanterns, still unlit.'
      )
    }
    return (
      'You wade through chilled water. Three empty brackets line the ' +
      'approach; their carved grooves catch the faint tide-light.'
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
      return clue('The bracket is empty, and you have nothing to set in it.')
    }
    gameState.inventory.splice(gameState.inventory.indexOf(lantern), 1)
    empty.putLantern()
    return (
      'The prism lantern settles into the bracket; water hums softly as it ' +
      'takes the weight.'
    )
  }

  /** Cast light to awaken the hall's latent illumination using mounted lanterns. */
  castLightHere(gameState: GameState): string {
    const brackets = this.items.filter(
      (b): b is LanternBracket => b instanceof LanternBracket,
    )
    if (brackets.length === 0) {
      return (
        'A warm spark flares in your palm and fades—nothing here seems to ' +
        'catch.'
      )
    }
    if (!brackets.every((b) => b.hasLantern)) {
      return clue(
        'You kindle a spark, but without lanterns mounted, nothing gets lit.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT)) {
      return '[failure]The prism lanterns already burn with steady, cold flame.[/failure]'
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
