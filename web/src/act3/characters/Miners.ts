import {
  Character,
  type GameState,
  type Item,
  characterName,
  speech,
  type NameOptions,
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

  /** Named by what they are, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  /** Several of them, so the default replies take plural verbs. */
  override isPlural(): boolean {
    return true
  }

  constructor() {
    super({
      name: 'miners',
      description:
        'Half a dozen miners, grey with rock dust, passing timbers hand to ' +
        'hand. The oldest of them gives the orders, and nobody argues.',
    })
  }

  /**
   * The lead miner hands the Quiet Charm back and nods toward the boy who
   * needs it; anything else is declined as usual.
   */
  override giveItem(gameState: GameState, item: Item): string {
    if (!(item instanceof QuietCharm)) return super.giveItem(gameState, item)
    return (
      `The ${characterName('lead miner')} turns ${item.nameInSentence()} over and hands it back: ` +
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
          'Thank the gods you found us. Roof came down this morning and ' +
            'kept coming. We sat in the dark and listened to each other ' +
            'breathe.',
        ) +
        '\n\n' +
        'Another miner adds, voice shaking: ' +
        speech(
          'We heard you setting the braces. Every knock, we waited for the ' +
            'roof. It held.',
        ) +
        '\n\n' +
        'The lead miner lowers his voice and nods toward a boy sitting apart ' +
        'from the rest: ' +
        speech(
          "That's Tobin. Youngest of us. He was the one shouting for help, hours of it, " +
            "till his voice went. Hasn't said a word since. Not one.",
        ) +
        '\n\n' +
        'The lead miner wipes his hands on his shirt: ' +
        speech(
          "We owe you, Elior. We'll stay and beam this section properly " +
            'before anyone else comes through. The way east to the Echo ' +
            "Chambers is open, and we'll keep it open.",
        ) +
        '\n\n' +
        'The miners are already reaching for the spare timbers.' +
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
        'Still here, Elior? Beams are going in. The way east to the Echo ' +
          "Chambers is sound. Go when you're ready.",
      )
    )
  }
}
