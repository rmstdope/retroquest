import { Room, type Exits, type GameState, event } from '@/engine'
import { WardStoneFragment } from '../items/WardStoneFragment'
import { GuardiansChain } from '../items/GuardiansChain'
import { GuardiansEssence } from '../items/GuardiansEssence'
import { WardStones } from '../items/WardStones'
import { Barriers } from '../items/Barriers'
import {
  FLAG_ACT4_BARRIERS_DISABLED,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED,
} from '../Act4StoryFlags'

/** The gates once the ward stones have fallen dark and the barrier is gone. */
const GATES_AFTER_DESCRIPTION =
  'Towering obsidian gates loom before you, carved with writhing shadows ' +
  'that seem to move in the corners of your vision. The ward stones stand ' +
  'dark and silent now, and the barrier is gone. Whispers of forgotten ' +
  'souls still echo from deep within the fortress.'

/**
 * The dark entrance to Malakar's fortress, protected by shadow guardians.
 *
 * First breach point requiring courage and light magic to overcome defenses:
 * ward stones must be examined and fragments used to disable barriers.
 */
export class FortressGates extends Room {
  private shadowGuardiansBanished = false

  constructor() {
    super({
      name: 'Fortress Gates',
      description:
        'Towering obsidian gates loom before you, carved with writhing shadows that ' +
        'seem to move in the corners of your vision. Ancient ward stones pulse with ' +
        'malevolent energy, casting eerie purple light across the threshold. The air ' +
        'crackles with dark magic, and whispers of forgotten souls echo from beyond ' +
        'the barrier. Spectral guardians drift between the stones, their hollow eyes ' +
        'fixed upon any who dare approach this cursed entrance.',
      items: [
        new WardStoneFragment(),
        new GuardiansChain(),
        new WardStones(),
        new Barriers(),
      ],
      characters: [],
      exits: { north: 'HallOfEchoes', east: 'OuterCourtyard' },
    })
  }

  /**
   * The way east opens once the barrier is down; north waits for the Hall of
   * Echoes. `exits` keeps the finished map, only the open part is offered.
   */
  override getExits(gameState: GameState): Exits {
    if (!gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) return {}
    return { east: this.exits.east }
  }

  /** The barrier throws Elior back (and starts the quest); the Hall is not built yet. */
  override blockedExit(gameState: GameState, direction: string): string | null {
    if (direction !== 'north' && direction !== 'east') return null
    if (!gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) {
      gameState.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED, true)
      return (
        '[failure]A shimmering barrier of dark energy throws you back. ' +
        'It pulses in rhythm with the ward stones.[/failure]'
      )
    }
    return (
      '[failure]Beyond the gates to the north, a great hall lies in darkness, ' +
      'its doorway heaped with fallen stone. There is no way through — ' +
      'not yet.[/failure]'
    )
  }

  /** Cast light spell to dispel shadow guardians. */
  override light(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) {
      return (
        '[failure]The shadow guardians resist your light magic while the ward ' +
        'stones remain active. You must disable the magical barriers first.[/failure]'
      )
    }
    if (!this.shadowGuardiansBanished) {
      this.shadowGuardiansBanished = true
      this.description = GATES_AFTER_DESCRIPTION
      gameState.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED, true)
      // Add Guardian's Essence to the room
      this.addItem(new GuardiansEssence())
      return event(
        'Your light magic blazes forth, dispelling the shadow guardians in ' +
          'brilliant flashes of purifying energy. As they vanish, their essence ' +
          'coalesces into a glowing orb that settles gently on the ground - the ' +
          "Guardian's Essence, proof of your courage.",
      )
    }
    return (
      '[dim]The shadow guardians have already been banished. The way forward ' +
      'is clear.[/dim]'
    )
  }

  /** Handle examining specific targets in the room. */
  examine(gameState: GameState, target: string): string {
    const targetLower = target.toLowerCase()
    if (targetLower.includes('ward stone') || targetLower.includes('stones')) {
      return event(
        'You examine the ward stones closely. Each stone is carved with ' +
          'ancient protective runes that pulse with dark energy. The stones appear ' +
          'to be the anchor points for the shadow guardians and magical barriers. ' +
          'A fragment has broken off from one stone, perhaps weakening the network.',
      )
    }
    if (targetLower.includes('guardian')) {
      if (!this.shadowGuardiansBanished) {
        return event(
          'The spectral guardians drift menacingly between the ward stones, ' +
            'their forms shifting between solid and ethereal. Their hollow eyes burn ' +
            "with malevolent purpose, and they seem bound to the stones' dark " +
            'energy.',
        )
      }
      return event(
        'The shadow guardians have been banished by your light magic.',
      )
    }
    if (targetLower.includes('barrier')) {
      if (!gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) {
        return event(
          'Shimmering barriers of dark energy block the entrances to the ' +
            'fortress. The barriers pulse in rhythm with the ward stones, drawing ' +
            'power from their dark magic.',
        )
      }
      return event(
        'The magical barriers have been disabled and no longer ' +
          'block your way.',
      )
    }
    return event(
      `You examine the ${target} but find nothing particularly ` +
        'noteworthy about it.',
    )
  }
}
