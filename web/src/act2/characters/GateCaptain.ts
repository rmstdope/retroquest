import {
  Character,
  type GameState,
  type Item,
  characterName,
  speech,
  type NameOptions,
} from '@/engine'
import { EntryPass } from '../items/EntryPass'

/** Entry authority who validates `EntryPass` and leaves the gate area once it is shown. */
export class GateCaptain extends Character {
  entryPassGiven = false

  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  constructor() {
    super({
      name: 'gate captain',
      description:
        "An officer of the city watch in polished mail, the watch's badge on " +
        'his shoulder. He looks at every face that comes up the road, and ' +
        'then at its papers.',
    })
  }

  /**
   * Ask for entry papers. Once the pass was shown he has normally left; only
   * an older save can still have him here, and then he bids farewell and goes.
   */
  override talkTo(gameState: GameState): string {
    if (!this.entryPassGiven) {
      return (
        'The ' +
        characterName('Gate Captain') +
        ' looks at your boots, then at your face. ' +
        speech(
          'State your business in Greendale, traveler. Nobody goes through ' +
            'this gate without a pass.',
        )
      )
    } else {
      if (this.leaveRoom(gameState)) {
        return (
          'The ' +
          characterName('Gate Captain') +
          ' nods. ' +
          speech(
            'Welcome to Greendale. A map would help you find your way; the ' +
              'streets in there turn back on themselves. Travelers leave all ' +
              'sorts at the information post by the arch. Have a look before ' +
              'you go in.',
          ) +
          ' With that, he salutes smartly and walks off along the wall.'
        )
      } else {
        return (
          '[failure]The Gate Captain has already returned to his duties and is ' +
          'no longer present.[/failure]'
        )
      }
    }
  }

  /** Walk out of the current room; false when he was not in it. */
  private leaveRoom(gameState: GameState): boolean {
    const characters = gameState.currentRoom.characters
    const index = characters.indexOf(this)
    if (index === -1) {
      return false
    }
    characters.splice(index, 1)
    return true
  }

  /**
   * Accept the entry pass, point the player to the information post and walk
   * away in the same turn; politely decline any other item.
   */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof EntryPass) {
      if (this.entryPassGiven) {
        const name = this.name
        return (
          'You have already shown the entry pass to the ' +
          characterName(name) +
          '. He waves you through with respect.'
        )
      }

      this.entryPassGiven = true
      this.leaveRoom(gameState)

      return (
        'The ' +
        characterName('Gate Captain') +
        ' turns the pass over in his hands. He runs a thumb along the line ' +
        'where a name should be; it has been scraped away with a blade. Then ' +
        'he looks at the seal, and grunts. ' +
        speech(
          "Somebody's scraped the name off this. The seal's good, though, " +
            "and the seal's what I answer for. Welcome to Greendale.",
        ) +
        ' ' +
        speech(
          'A map would help you find your way; the streets in there turn ' +
            'back on themselves. Travelers leave things at the information ' +
            'post by the arch. Have a look before you go in.',
        ) +
        ' With that, he salutes smartly and walks off along the wall.'
      )
    }

    return (
      'The ' +
      characterName('Gate Captain') +
      ` politely declines ${item.nameInSentence()}. ` +
      speech('Papers, traveler. A pass, with a seal I can answer for.')
    )
  }
}
