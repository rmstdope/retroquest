import { Act, type GameState } from '@/engine'
import { FortressGates } from './rooms/FortressGates'
import { OuterCourtyard } from './rooms/OuterCourtyard'
import { MirrorLabyrinth } from './rooms/MirrorLabyrinth'
import { HallOfEchoes } from './rooms/HallOfEchoes'
import { TowerOfShadows } from './rooms/TowerOfShadows'
import { ChamberOfWhispers } from './rooms/ChamberOfWhispers'
import { MemoryVault } from './rooms/MemoryVault'
import { ThroneChamer } from './rooms/ThroneChamer'
import { Light } from './spells/Light'
import { Bless } from './spells/Bless'
import { ACT4_CLASSES } from './classes'
import { ACT4_GOLDEN_PATH } from './Act4GoldenPath'

/** Act 4 of RetroQuest: The Awakening. */
export class Act4 extends Act {
  constructor() {
    const rooms = {
      // Fortress entrance
      FortressGates: new FortressGates(),
      OuterCourtyard: new OuterCourtyard(),

      // Inner fortress
      MirrorLabyrinth: new MirrorLabyrinth(),
      HallOfEchoes: new HallOfEchoes(),
      TowerOfShadows: new TowerOfShadows(),
      ChamberOfWhispers: new ChamberOfWhispers(),
      MemoryVault: new MemoryVault(),

      // Final area (its way in comes with the Parents' Vault)
      ThroneChamer: new ThroneChamer(),
    }

    super({
      name: 'Act4',
      rooms,
      // Quests will be added when implemented
      quests: [],
      musicFile: 'Conquest - The Silver Grail (freetouse.com).mp3',
      musicInfo:
        'Music track: The Silver Grail by Conquest\n' +
        'Source: https://freetouse.com/music\n' +
        'Music for Videos (Free Download)\n',
      classes: ACT4_CLASSES,
      goldenPath: ACT4_GOLDEN_PATH,
    })
  }

  /** Return the introductory text for Act IV. */
  override getActIntro(): string {
    return (
      '[bold]ACT IV: THE FINAL CONFRONTATION[/bold]\n\n' +
      "With the Lifelight Elixir in hand, you stand before Malakar's fortress. " +
      'The obsidian gates loom ahead, wreathed in shadow and ancient magic. ' +
      'This is the culmination of your journey—a test of courage, wisdom, and ' +
      'selflessness that will determine the fate of the kingdom.\n\n' +
      'The final confrontation awaits. Every choice you make will echo through ' +
      'eternity.\n\n' +
      "Let's begin. (Type 'help' for a list of commands.)\n"
    )
  }

  /** Check if Act IV is completed. */
  override isCompleted(_gameState: GameState): boolean {
    // Completion check will be implemented when quests are added
    return false
  }

  /** Setup initial state for Act IV. */
  override setupGameState(gameState: GameState): void {
    // Add basic spells that player needs for phase 1
    const lightSpell = new Light()
    const blessSpell = new Bless()

    // Add spells to known spells if not already known
    if (!gameState.hasSpell(lightSpell.id)) {
      gameState.learnSpell(lightSpell)
    }
    if (!gameState.hasSpell(blessSpell.id)) {
      gameState.learnSpell(blessSpell)
    }

    // Set starting room to Fortress Gates
    if ('FortressGates' in this.rooms) {
      gameState.currentRoom = this.rooms.FortressGates
    }
  }
}
