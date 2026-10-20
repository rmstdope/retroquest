import { Act, characterName, type GameState, speech } from '@/engine'
import { EliorsCottage } from './rooms/EliorsCottage'
import { VegetableField } from './rooms/VegetableField'
import { ChickenCoop } from './rooms/ChickenCoop'
import { VillageSquare } from './rooms/VillageSquare'
import { MirasHut } from './rooms/MirasHut'
import { BlacksmithsForge } from './rooms/BlacksmithsForge'
import { GeneralStore } from './rooms/GeneralStore'
import { VillageWell } from './rooms/VillageWell'
import { AbandonedShed } from './rooms/AbandonedShed'
import { OldMill } from './rooms/OldMill'
import { Riverbank } from './rooms/Riverbank'
import { ForestPath } from './rooms/ForestPath'
import { HiddenGlade } from './rooms/HiddenGlade'
import { VillageChapel } from './rooms/VillageChapel'
import { RoadToGreendale } from './rooms/RoadToGreendale'
import { HintOfMagicQuest } from './quests/HintOfMagic'
import { CuriosityKilledTheCatQuest } from './quests/CuriosityKilledTheCat'
import { FishingExpeditionQuest } from './quests/FishingExpedition'
import { KnowYourVillageQuest } from './quests/KnowYourVillage'
import { LetThereBeLightQuest } from './quests/LetThereBeLight'
import { MagicForRealQuest } from './quests/MagicForReal'
import { MagnetFishingExpeditionQuest } from './quests/MagnetFishingExpedition'
import { OhDeerOhDeerQuest } from './quests/OhDeerOhDeer'
import { PreparingForTheRoadQuest } from './quests/PreparingForTheRoad'
import { FadedPhotographQuest } from './quests/FadedPhotograph'
import { ShadowsOverWillowbrookQuest } from './quests/ShadowsOverWillowbrook'
import { FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED } from './Act1StoryFlags'
import { ACT1_CLASSES } from './classes'
import { ACT1_GOLDEN_PATH } from './Act1GoldenPath'
import { Shopkeeper } from './characters/Shopkeeper'
import { Villager } from './characters/Villager'

/** Act 1: The Call to Adventure, set in the village of Willowbrook. */
export class Act1 extends Act {
  constructor() {
    const rooms = {
      EliorsCottage: new EliorsCottage(),
      VegetableField: new VegetableField(),
      ChickenCoop: new ChickenCoop(),
      VillageSquare: new VillageSquare(),
      MirasHut: new MirasHut(),
      BlacksmithsForge: new BlacksmithsForge(),
      GeneralStore: new GeneralStore(),
      VillageWell: new VillageWell(),
      AbandonedShed: new AbandonedShed(),
      OldMill: new OldMill(),
      Riverbank: new Riverbank(),
      ForestPath: new ForestPath(),
      HiddenGlade: new HiddenGlade(),
      VillageChapel: new VillageChapel(),
      RoadToGreendale: new RoadToGreendale(),
    }
    const quests = [
      new ShadowsOverWillowbrookQuest(),
      new HintOfMagicQuest(),
      new CuriosityKilledTheCatQuest(),
      new FishingExpeditionQuest(),
      new KnowYourVillageQuest(),
      new LetThereBeLightQuest(),
      new MagicForRealQuest(),
      new MagnetFishingExpeditionQuest(),
      new OhDeerOhDeerQuest(),
      new PreparingForTheRoadQuest(),
      new FadedPhotographQuest(),
    ]
    super({
      name: 'Act1',
      rooms,
      quests,
      musicFile: 'Conquest - Market (freetouse.com).mp3',
      musicInfo:
        'Market by Conquest\nSource: https://freetouse.com/music\nCopyright Free Background Music',
      classes: ACT1_CLASSES,
      goldenPath: ACT1_GOLDEN_PATH,
    })
  }

  override getActIntro(): string {
    return (
      '[bold]ACT 1: THE CALL TO ADVENTURE[/bold]\n\n' +
      `You are ${characterName('Elior')}, a humble farmer boy living in the quiet village of Willowbrook on the outskirts of Eldoria. ` +
      `Raised by your ${characterName('grandmother')} after your parents vanished mysteriously, your life is simple—tending crops and caring for animals. ` +
      'One stormy night, a strange light appears in the sky, and you dream of a shadowy figure calling your name.\n' +
      "\nThe next morning, you awaken to find the village abuzz with rumors: livestock missing, strange footprints by the well, and the old mill's wheel turning on its own. " +
      `Your ${characterName('grandmother')}, usually cheerful, seems worried and distracted, her gaze lingering on a faded photograph.\n` +
      '\nAs you step outside, the air feels charged with something unfamiliar. The villagers gather in the square, debating what to do. ' +
      `${characterName('Mira')}, the wise woman, catches your eye and beckons you over. ` +
      speech('There are secrets in Willowbrook, child,') +
      ' she says. ' +
      speech('Secrets that have waited for you.') +
      '\n' +
      '\nA distant bell tolls from the chapel, and a cold wind rustles the fields. You sense that today, everything will change. ' +
      'With questions swirling in your mind, you take your first step into the unknown.\n' +
      "\nLet's get started! (Type 'help' for a list of commands.)\n"
    )
  }

  /**
   * Bring older saves up to date: drop the matches the store's wares still
   * sell, and give the villager her name, Tilda.
   */
  override afterLoad(gameState: GameState): void {
    for (const room of Object.values(gameState.allRooms)) {
      for (const character of room.characters) {
        if (character instanceof Shopkeeper) character.migrateLegacyWares()
        if (character instanceof Villager) character.migrateLegacyName()
      }
    }
  }

  override isCompleted(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED)
  }
}
