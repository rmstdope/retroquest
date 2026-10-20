import { Room, type GameState } from '@/engine'
import { WardStoneFragment } from '../items/WardStoneFragment'
import { GuardiansChain } from '../items/GuardiansChain'
import { GuardiansEssence } from '../items/GuardiansEssence'
import { WardStones } from '../items/WardStones'
import { Barriers } from '../items/Barriers'
import {
  FLAG_ACT4_BARRIERS_DISABLED,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
} from '../Act4StoryFlags'

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
      gameState.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED, true)
      // Add Guardian's Essence to the room
      this.addItem(new GuardiansEssence())
      return (
        '[event]Your light magic blazes forth, dispelling the shadow guardians in ' +
        'brilliant flashes of purifying energy. As they vanish, their essence ' +
        'coalesces into a glowing orb that settles gently on the ground - the ' +
        "Guardian's Essence, proof of your courage.[/event]"
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
      return (
        '[event]You examine the ward stones closely. Each stone is carved with ' +
        'ancient protective runes that pulse with dark energy. The stones appear ' +
        'to be the anchor points for the shadow guardians and magical barriers. ' +
        'A fragment has broken off from one stone, perhaps weakening the network.[/event]'
      )
    }
    if (targetLower.includes('guardian')) {
      if (!this.shadowGuardiansBanished) {
        return (
          '[event]The spectral guardians drift menacingly between the ward stones, ' +
          'their forms shifting between solid and ethereal. Their hollow eyes burn ' +
          "with malevolent purpose, and they seem bound to the stones' dark " +
          'energy.[/event]'
        )
      }
      return '[event]The shadow guardians have been banished by your light magic.[/event]'
    }
    if (targetLower.includes('barrier')) {
      if (!gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) {
        return (
          '[event]Shimmering barriers of dark energy block the entrances to the ' +
          'fortress. The barriers pulse in rhythm with the ward stones, drawing ' +
          'power from their dark magic.[/event]'
        )
      }
      return (
        '[event]The magical barriers have been disabled and no longer ' +
        'block your way.[/event]'
      )
    }
    return (
      `[event]You examine the ${target} but find nothing particularly ` +
      'noteworthy about it.[/event]'
    )
  }
}
