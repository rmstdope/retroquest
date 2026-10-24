import {
  Character,
  type GameState,
  type Item,
  characterName,
  speech,
} from '@/engine'
import { CEDRIC_STAY_BEHIND, cedricAdds } from '../CedricLines'
import {
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_MINERS_RESCUE_COMPLETED,
  FLAG_ACT3_TOBIN_GIVEN_CHARM,
} from '../Act3StoryFlags'
import { QuietCharm } from '../items/QuietCharm'
import { Tobin } from './Tobin'

/** Trapped miners awaiting rescue in the collapsed galleries. */
export class Miners extends Character {
  /** Whether the lead miner has thanked the player for Tobin's voice. */
  thanked = false

  constructor() {
    super({
      name: 'miners',
      description:
        'A group of miners trapped behind the fallen rock, their voices ' +
        'echoing faintly through the debris.',
    })
  }

  /**
   * The lead miner hands the Quiet Charm back and nods toward the boy who
   * needs it; anything else is declined as usual.
   */
  override giveItem(gameState: GameState, item: Item): string {
    if (!(item instanceof QuietCharm)) return super.giveItem(gameState, item)
    return (
      `The ${characterName('lead miner')} turns the [item_name]${item.name}[/item_name] over and hands it back: ` +
      speech('Pretty thing. Not much use to an old man with a pick, though.') +
      ' His eyes go to the boy on the bucket. ' +
      speech("If it's quiet you're handing out, I know who needs it.")
    )
  }

  /** Handle talking to the miners for rescue completion. */
  override talkTo(gameState: GameState): string {
    // Since miners are only added to the room after passage is freed,
    // they can be rescued immediately when talked to
    if (!gameState.getStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED)) {
      gameState.setStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED, true)
      gameState.currentRoom.addCharacter(new Tobin())
      return (
        'The ' +
        characterName(this.name) +
        ' gather around as ' +
        'the lead miner steps forward, dust-covered but relieved: ' +
        speech(
          'Thank the gods you found us. When that section collapsed this ' +
            'morning, we thought we were done for. The whole ceiling came down like ' +
            'thunder—trapped us behind tons of rock with barely any air.',
        ) +
        '\n\n' +
        'Another miner adds, voice shaking: ' +
        speech(
          'We could hear you working ' +
            "on the other side, but we didn't dare hope. Those braces you placed " +
            "saved our lives—without them, the whole tunnel would've come down on " +
            'our heads.',
        ) +
        '\n\n' +
        'The lead miner lowers his voice and nods toward a boy sitting apart ' +
        'from the rest: ' +
        speech(
          "That's Tobin. Youngest of us. He was the one shouting for help, hours of it, " +
            "till his voice went. Hasn't said a word since. Not one.",
        ) +
        '\n\n' +
        'The lead miner nods gratefully: ' +
        speech(
          "We can't thank you enough, " +
            "Elior. Now that the immediate danger's passed, we'll get to work " +
            'reinforcing this whole section. These old caverns need proper support ' +
            'beams before anyone else ventures through. The route to the Echo ' +
            "Chambers is open, but we'll make sure it stays that way.",
        ) +
        '\n\n' +
        'The miners begin setting up additional supports as you prepare ' +
        'to continue your journey.' +
        cedricAdds(gameState, CEDRIC_STAY_BEHIND)
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_TOBIN_GIVEN_CHARM) && !this.thanked) {
      this.thanked = true
      return (
        `The ${characterName('lead miner')} nods toward the bucket, where ` +
        'Tobin sits with the charm in his fist: ' +
        speech(
          "He talked to me. Asked me how long till we're up top. First thing " +
            "he's said since the rock came down.",
        ) +
        ' He clears his throat. ' +
        speech('Thank you, Elior.')
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED)) {
      return (
        'The ' +
        characterName('lead miner') +
        " leans on his pick, but he isn't working: " +
        speech(
          "You hear it too, don't you? The quiet. The picks stopped " +
            "ringing. I've worked this seam thirty years and the rock always " +
            'talked back — creaks, drips, the little groans before a fall. Now ' +
            "it's gone dead. Like something down here forgot how to breathe.",
        )
      )
    }
    return (
      'The ' +
      characterName(this.name) +
      ' look up from their ' +
      'work, tools in hand: ' +
      speech(
        'Still ' +
          "here, Elior? We're making good progress on these support beams. " +
          'The passage to the Echo Chambers is secure now—you can head east ' +
          "whenever you're ready. We'll keep working to make sure these old " +
          'caverns are safe for future travelers.',
      )
    )
  }
}
