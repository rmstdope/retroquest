import { Act, characterName, type GameState } from '@/engine'
import { TheDream } from './rooms/TheDream'
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
import { Locket } from './items/Locket'
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
import {
  FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED,
  FLAG_VEGETABLE_FIELD_WATERED,
} from './Act1StoryFlags'
import { ACT1_CLASSES } from './classes'
import { ACT1_GOLDEN_PATH } from './Act1GoldenPath'
import { Shopkeeper } from './characters/Shopkeeper'
import { Villager } from './characters/Villager'

/** Act 1: The Call to Adventure, set in the village of Willowbrook. */
export class Act1 extends Act {
  constructor() {
    const rooms = {
      TheDream: new TheDream(),
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
      `You are ${characterName('Elior')}, a farmer boy in the village of Willowbrook, on the outskirts of Eldoria. ` +
      `Your ${characterName('grandmother')} raised you after your parents vanished, and your days are the crops, the hens and the weather.\n` +
      '\nTonight the weather is a storm, and a light that is not lightning has split the sky over the fields. ' +
      'Sleep, when it comes, is not quiet.\n' +
      "\nLet's get started! (Type 'help' for a list of commands.)\n"
    )
  }

  /** The hook that opens Act I's complete page: the amulet and the search for it. */
  override getCompletionHook(): string {
    return (
      "The amulet was your parents'. " +
      'And someone has come to Willowbrook looking for it.'
    )
  }

  /**
   * Bring older saves up to date: drop the matches the store's wares still
   * sell, give the villager her name, Tilda, and give the rooms and the locket
   * whose description a save stores the wording they have now.
   */
  override afterLoad(gameState: GameState): void {
    const rooms = gameState.allRooms
    rooms.VillageSquare.description = new VillageSquare().description
    rooms.BlacksmithsForge.description = new BlacksmithsForge().description
    rooms.RoadToGreendale.description = new RoadToGreendale().description
    rooms.AbandonedShed.description = new AbandonedShed().description
    rooms.MirasHut.description = new MirasHut().description
    const carriers = [
      ...gameState.inventory,
      ...Object.values(rooms).flatMap((room) => room.items),
    ]
    for (const item of carriers) {
      if (item instanceof Locket) item.description = new Locket().description
    }
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

  /** Whether the field was watered travels to the epilogue, which remembers it. */
  override carriedFlags(): string[] {
    return [FLAG_VEGETABLE_FIELD_WATERED]
  }
}
