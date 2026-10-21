import { Room, type Exits, type GameState, dialogue, event } from '@/engine'
import {
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_SHADOW_MASK_SHOWN,
  FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED,
  FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED,
  FLAG_ACT4_VAULT_DOOR_OPENED,
} from '../Act4StoryFlags'
import { ShadowOfThePast } from '../characters/ShadowOfThePast'
import { MemoryOrbs } from '../items/MemoryOrbs'
import { VaultDoor } from '../items/VaultDoor'
import { MEMORY_VAULT_AFTER, MEMORY_VAULT_BEFORE } from './vaultDescriptions'

/** The Shadow's speaker label, once it has a face. */
const SHADOW_LABEL = 'Shadow of the Past'

/**
 * A temporal chamber of broken memories where the Shadow of the Past waits.
 *
 * The enhanced Echo Stone mends the orbs, the Sorceress's mask is shown to the
 * Shadow, and the Ancient Amulet opens the sealed door east to the Parents'
 * Vault. The two scenes live here because the stone and the mask both play
 * them, and the room owns the state they change.
 */
export class MemoryVault extends Room {
  constructor() {
    super({
      name: 'Memory Vault',
      description: MEMORY_VAULT_BEFORE,
      items: [new MemoryOrbs(), new VaultDoor()],
      characters: [new ShadowOfThePast()],
      exits: { south: 'ChamberOfWhispers', east: 'ParentsVault' },
    })
  }

  /** Entering the vault starts the Shadow's side quest. */
  override onEnter(gameState: GameState): void {
    gameState.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED, true)
  }

  /** South is always open; east once the amulet has opened the door. */
  override getExits(gameState: GameState): Exits {
    if (!gameState.getStoryFlag(FLAG_ACT4_VAULT_DOOR_OPENED)) {
      return { south: this.exits.south }
    }
    return { south: this.exits.south, east: this.exits.east }
  }

  /** The sealed door explains itself. */
  override blockedExit(gameState: GameState, direction: string): string | null {
    if (direction !== 'east') return null
    if (gameState.getStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED)) {
      return (
        '[failure]The door is sealed. Its runes glow faintly, waiting for ' +
        'the amulet.[/failure]'
      )
    }
    return '[failure]The sealed door will not move. Its runes are dark.[/failure]'
  }

  /** The enhanced Echo Stone mends the orbs (once): the recognition of the dream voice. */
  mendOrbs(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED)) {
      return '[dim]The orbs are whole. The stone lies quiet in your hand.[/dim]'
    }
    gameState.setStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED, true)
    gameState.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED, true)
    this.description = MEMORY_VAULT_AFTER
    for (const character of this.characters) {
      if (character instanceof ShadowOfThePast) character.gainFace()
    }
    return [
      event(
        'You raise the Echo Stone. The voices inside it pour out into the ' +
          'vault, and the orbs drink them in. One by one the cracks close ' +
          'and the scenes grow still and clear. The shadow turns towards ' +
          'you, and for the first time it has a face.',
      ),
      dialogue(SHADOW_LABEL, 'Elior. You came.'),
      event(
        'You know the voice before you know the face. It is the voice from ' +
          'your dream, the one that called your name on the stormy night in ' +
          "Willowbrook, and in Nyx's vision, and in the Dragon's hall.",
      ),
    ].join('\n')
  }

  /** Sorceress's Truth is shown to the Shadow: needs the orbs mended; once. */
  showMask(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED)) {
      return (
        '[failure]You hold out the mask, but the Shadow cannot see it ' +
        'through the broken memories.[/failure]'
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_SHADOW_MASK_SHOWN)) {
      return '[dim]The Shadow has seen the mask. It is enough.[/dim]'
    }
    gameState.setStoryFlag(FLAG_ACT4_SHADOW_MASK_SHOWN, true)
    return [
      event(
        'You hold out the silver mask. The Shadow turns it over in hands ' +
          'that are almost solid now, and gives it back.',
      ),
      dialogue(
        SHADOW_LABEL,
        'She lied for him for years, and still she chose the truth. Then ' +
          'perhaps he can too. But not by force, Elior. Never by force.',
      ),
    ].join('\n')
  }
}
