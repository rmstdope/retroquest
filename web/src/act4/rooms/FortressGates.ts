import { Room, type Exits, type GameState, characterName, clue } from '@/engine'
import { WardStoneFragment } from '../items/WardStoneFragment'
import { GuardiansChain } from '../items/GuardiansChain'
import { GuardiansEssence } from '../items/GuardiansEssence'
import { WardStone } from '../items/WardStone'
import { WardStones } from '../items/WardStones'
import { Barriers } from '../items/Barriers'
import {
  FLAG_ACT4_BARRIERS_DISABLED,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED,
} from '../Act4StoryFlags'

/** The Warden sigil on the gate arch, in Act III's words. */
const SIGIL_SENTENCE =
  ' On the arch behind you, under the black, an older carving shows ' +
  'through: a sun rising over three linked rings.'

/** Mira, holding the way out, in both states of the gates. */
const MIRA_SENTENCE =
  ` Just inside the threshold ${characterName('Mira')} keeps the way out, ` +
  'her back to the gatepost.'

/** The gates while the barrier stands and the guardians drift between the stones. */
const GATES_BEFORE_DESCRIPTION =
  'You stand just inside the fortress gates. The ways on, north and east, ' +
  'are barred by a thin wall of violet light, and three ward stones, left, ' +
  'middle and right, swell and fade with it. Guardians made of shadow ' +
  'drift between the stones, watching you.' +
  SIGIL_SENTENCE +
  MIRA_SENTENCE

/** The gates once the stones are dark and the guardians gone. */
const GATES_AFTER_DESCRIPTION =
  'You stand just inside the fortress gates. The ward stones are dark, and ' +
  'the violet wall is gone; the ways north and east lie open.' +
  SIGIL_SENTENCE +
  MIRA_SENTENCE

/**
 * The dark entrance to Malakar's fortress, protected by shadow guardians.
 *
 * A small puzzle: three ward stones keep the barrier's time, and the right
 * one is a breath behind. Light cast on it breaks the rhythm, the barrier
 * falls, and the guardians leave their chain and essence behind.
 */
export class FortressGates extends Room {
  constructor() {
    super({
      name: 'Fortress Gates',
      description: GATES_BEFORE_DESCRIPTION,
      items: [
        new WardStone('left'),
        new WardStone('middle'),
        new WardStone('right'),
        new WardStones(),
        new Barriers(),
      ],
      characters: [],
      exits: { north: 'HallOfEchoes', east: 'OuterCourtyard' },
    })
  }

  /** Whether the gates have already fallen. */
  private isSolved(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED)
  }

  /**
   * The gates' look follows the story: derived from the story flags, so a
   * loaded game always shows the description that matches.
   */
  override descriptionFor(gameState: GameState): string {
    return this.isSolved(gameState)
      ? GATES_AFTER_DESCRIPTION
      : GATES_BEFORE_DESCRIPTION
  }

  /** The ways north and east open once the barrier is down. */
  override getExits(gameState: GameState): Exits {
    if (!gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) return {}
    return { north: this.exits.north, east: this.exits.east }
  }

  /** The barrier throws Elior back (and starts the quest). */
  override blockedExit(gameState: GameState, direction: string): string | null {
    if (direction !== 'north' && direction !== 'east') return null
    if (gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) return null
    gameState.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED, true)
    return clue(
      'The violet wall throws you back. It swells and fades in time with ' +
        'the ward stones.',
    )
  }

  /** Light with no target: nothing to dispel before the gates fall. */
  override light(gameState: GameState): string {
    if (this.isSolved(gameState)) {
      return (
        '[dim]The shadow guardians have already been banished. The way ' +
        'forward is clear.[/dim]'
      )
    }
    return clue(
      'Your light falls on the guardians and slides off them. They ' +
        'stand on the barrier, and the barrier stands on the stones.',
    )
  }

  /** Light on all three stones at once: they keep their count. */
  lightAllStones(gameState: GameState): string {
    if (this.isSolved(gameState)) {
      return 'The ward stones are dark. Your light shows only their runes.'
    }
    return clue(
      'Your light washes over all three stones at once. They drink ' +
        'it together and keep their count.',
    )
  }

  /**
   * Light on one stone. The right one is the answer: the gates fall in a
   * single cast. The others only draw the guardians closer.
   */
  lightStone(gameState: GameState, stone: WardStone): string {
    if (this.isSolved(gameState)) {
      return 'The stone is dark. Your light shows only its runes.'
    }
    if (stone.side !== 'right') {
      return clue(
        'The stone drinks your light and pulses brighter, ' +
          'and the guardians lean closer for a moment. The barrier keeps its ' +
          'rhythm.',
      )
    }
    gameState.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED, true)
    gameState.setStoryFlag(FLAG_ACT4_BARRIERS_DISABLED, true)
    gameState.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED, true)
    this.addItem(new WardStoneFragment())
    this.addItem(new GuardiansChain())
    this.addItem(new GuardiansEssence())
    return (
      'Your light finds the right stone between its beats. It flares, ' +
      'stutters, and goes dark. A fragment cracks from its face and drops ' +
      'to the flagstones. The other two stones falter, lose the count, ' +
      'and go dark with it; the barrier flickers out of time and is gone.\n\n' +
      'Without the barrier the guardians have nothing to stand on. They ' +
      'thin to smoke, and where they drifted lie the ' +
      "[item_name]guardian's chain[/item_name] that bound them and a small, " +
      "steady light: the [item_name]guardian's essence[/item_name]."
    )
  }
}
