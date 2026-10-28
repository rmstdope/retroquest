import {
  Character,
  type GameState,
  characterName,
  dialogue,
  clue,
  effect,
  speech,
} from '@/engine'
import { KeepsakeNote } from '../items/KeepsakeNote'
import { LifelightElixir } from '../items/LifelightElixir'
import {
  CEDRIC_GATE_ARRIVAL,
  CEDRIC_KING_WEAKER_1,
  CEDRIC_KING_WEAKER_2,
  CEDRIC_KING_WEAKER_3,
  cedricAdds,
} from '../CedricLines'
import {
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_MINERS_RESCUE_COMPLETED,
  FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED,
  FLAG_ACT3_MAIN_COMPLETED,
  FLAG_ACT3_SEA_SEALED_LETTER_READ,
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_ECHOES_QUEST_STARTED,
  FLAG_ACT3_MIRA_CONFESSED,
  FLAG_ACT3_MIRA_FORGIVEN,
  FLAG_ACT3_MIRA_GATE_TALKED,
  FLAG_ACT3_MIRA_REPROACHED,
  FLAG_ACT3_RUINS_LEFT,
  FLAG_ACT3_MIRA_RUINS_SLIP_PLAYED,
  FLAG_ACT3_MIRA_EMBER_SLIP_PLAYED,
  FLAG_ACT3_DRAGON_MESSAGE_GIVEN,
  FLAG_ACT3_DRAGON_MESSAGE_RELAYED,
} from '../Act3StoryFlags'
import {
  MIRA_TOPICS_REMINDER,
  miraTopicIn,
  miraTopicReply,
} from '../MiraTopics'
import {
  MIRA_ANSWER_INVITATION,
  MIRA_ANSWER_REMINDER,
  MIRA_ANSWER_REPEAT,
  MIRA_GATE_LINES,
  miraAnswerIn,
  miraAnswerReply,
} from '../MiraAnswers'

/**
 * Act III version of Mira: starts the main quest, handles teleportation
 * between sites and, once everything is complete, confesses that she was the
 * Wardens' pupil before she performs the Warding Rite on the next talk. She
 * also answers `say <topic> to mira` about Elior's parents, Malakar, the
 * amulet and his grandmother, and, between the confession and the rite, lets
 * him forgive her or reproach her (see `sayTo`).
 */
export class Mira extends Character {
  /** How she looks until her confession; old saves are given it back on load. */
  static readonly DESCRIPTION =
    'The village healer, with chalk dust still on her sleeves from the ' +
    'circle in the castle yard. She watches you the way she watches a fever.'

  constructor() {
    super({ name: 'Mira', description: Mira.DESCRIPTION })
  }

  /**
   * Handle conversation with Mira, including quest start and teleportation.
   * No line repeats the typed command, so when her answer opens with a quote
   * her name goes on a line of its own first, as the quote's label.
   */
  override talkTo(gameState: GameState): string {
    const answer = this.converse(gameState).replace(/^\n+/, '')
    const quote = answer.search(/\[dialogue\]/)
    if (
      quote < 0 ||
      answer.slice(0, quote).includes(characterName(this.name))
    ) {
      return answer
    }
    const label = characterName(this.name) + '\n'
    return quote === 0 || answer[quote - 1] === '\n'
      ? answer.slice(0, quote) + label + answer.slice(quote)
      : label + answer
  }

  /** What Mira says and does when talked to, before the speaker is labelled. */
  private converse(gameState: GameState): string {
    const eventMsg = this.pendingSlips(gameState).trimStart()

    // First conversation in Act III: start the main quest
    if (!gameState.getStoryFlag(FLAG_ACT3_MAIN_STARTED)) {
      gameState.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)

      // Give Elior the Keepsake Note
      const keepsakeNote = new KeepsakeNote()
      gameState.inventory.push(keepsakeNote)

      return (
        eventMsg +
        '\n' +
        speech(
          'Elior. Malakar is draining the life out of King Alden, and the ' +
            'king grows weaker every day.',
        ) +
        '\n' +
        speech(
          'Three relics can stand against him: the crystal of light, ' +
            "the phoenix feather and the dragon's scale. We will fetch " +
            'them one at a time.',
        ) +
        '\n' +
        speech('Before we go, take this, and read it.') +
        '\n' +
        'She puts a small, worn piece of parchment in your hand.' +
        '\n' +
        'You receive a [item_name]keepsake note[/item_name].' +
        '\n' +
        speech(
          'Tell me when you are ready, and I will draw the first circle.',
        ) +
        '\n' +
        speech(
          'On the road, ask me what you need to. I may not be able to ' +
            'answer all of it yet.',
        ) +
        '\n' +
        MIRA_TOPICS_REMINDER
      )
    }

    let destinationKey = ''
    let flavor = ''
    // Subsequent conversation: teleport onward based on current location.
    // Special-case: if we're at the Tidal Causeway, hint about the relic
    // unless the Crystal of Light has been acquired. If acquired, Mira can
    // draw the circle onward to Mount Ember.
    // If we're already at Lower Switchbacks, do not teleport; instead
    // provide lore about Wisdom and the phoenix legend.
    // The fortress gate has its own talk (see talkAtGate).
    if (gameState.currentRoom.name === "Entrance to Malakar's Fortress") {
      return this.talkAtGate(gameState, eventMsg)
    } else if (gameState.currentRoom.name === 'Cavern Mouth') {
      // Check if dragon's scale has been acquired
      if (
        !gameState.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED) &&
        gameState.getStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED)
      ) {
        return (
          eventMsg +
          '\n' +
          speech(
            'The miners are out, all of them. The dragon is further in, ' +
              'past the galleries, where the caves go quiet.',
          )
        )
      }
      if (!gameState.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)) {
        return (
          eventMsg +
          '\n' +
          speech(
            'There are miners trapped somewhere under this hill, Elior. ' +
              'Help them first. The way to the dragon goes through their ' +
              'galleries, and I would not walk past them if it did not.',
          )
        )
      }
      destinationKey = 'MirasHut'
      flavor =
        speech(
          'That is all three. Now we go home, to my hut, and I make them ' +
            'into something the king can use.',
        ) +
        '\n' +
        speech('The king is fading, Elior. We have less time than I hoped.') +
        cedricAdds(gameState, CEDRIC_KING_WEAKER_3)
    } else if (gameState.currentRoom.name === 'Lower Switchbacks') {
      if (!gameState.getStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED)) {
        return (
          eventMsg +
          '\n' +
          speech(
            'A phoenix nests at the top of this mountain, where the rock is ' +
              'hottest. Only it can give the feather, and it asks for ' +
              'wisdom. The scholar camped on this path has read these slopes ' +
              'for years; start with him. And Elior: this mountain will not ' +
              'be hurried.',
          )
        )
      }

      // Check if Charred Inscription has been read before proceeding to Cavern Mouth
      if (!gameState.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ)) {
        return (
          eventMsg +
          '\n' +
          speech(
            'Not yet, Elior. First discover the words your parents left ' +
              'burned into stone on these ember heights, up on the terraces. ' +
              'I will not take you into the dark without them.',
          )
        )
      }

      destinationKey = 'CavernMouth'
      flavor =
        speech(
          'That is two. The last is under the hills. The circle comes down ' +
            'at the Cavern Mouth, and it is cold in there, colder than you ' +
            'think. Keep your coat on.',
        ) +
        '\n' +
        speech(
          'There is a word the old folk will reach for when this ash comes ' +
            'down on them: the Wasting. It is not that. The Wasting killed. ' +
            'This drinks.',
        ) +
        '\n' +
        speech(
          'The king is weaker still. Whatever drains him draws harder with every ' +
            'site we reach.',
        ) +
        cedricAdds(gameState, CEDRIC_KING_WEAKER_2)
    } else if (gameState.currentRoom.name === 'Tidal Causeway') {
      if (!gameState.getStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED)) {
        return (
          eventMsg +
          '\n' +
          speech(
            'The crystal of light is somewhere in these ruins. It answers ' +
              'to courage. It parts veils and steadies the spirit. When you ' +
              'stand before the tide-born guardian, speak your vow, and mean ' +
              'it.',
          )
        )
      }

      // Check if Sea-Sealed Letter has been read before proceeding to Lower Switchback
      if (!gameState.getStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ)) {
        return (
          eventMsg +
          '\n' +
          speech(
            'Not yet, Elior. First seek the traces your parents left behind ' +
              'in the sunken ruins. I will not take you up to the ember ' +
              'heights without them.',
          )
        )
      }

      destinationKey = 'LowerSwitchbacks'
      // Moving the party on closes the Pier Warden's optional moment.
      gameState.setStoryFlag(FLAG_ACT3_RUINS_LEFT, true)
      flavor =
        speech(
          'That is one. Next is the mountain. The circle comes down on the ' +
            'Lower Switchbacks, where the path climbs over black glass and ' +
            'the wind carries ash. Keep your footing.',
        ) +
        '\n' +
        speech(
          'And Elior. I can feel the king through the circle. He is weaker ' +
            'than when we set out.',
        ) +
        cedricAdds(gameState, CEDRIC_KING_WEAKER_1)
    } else if (gameState.currentRoom.name === "Mira's Hut") {
      // Check if Elior has read the Keepsake Note first
      if (!gameState.getStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED)) {
        return (
          eventMsg +
          '\n' +
          speech(
            'You should read the note I gave you first, Elior. I wrote it ' +
              'for the road, and I want it read before we go.',
          )
        )
      }

      // Check if all three relics have been gathered
      const allRelicsGathered =
        gameState.getStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED) &&
        gameState.getStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED) &&
        gameState.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)
      if (
        allRelicsGathered &&
        !gameState.getStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED)
      ) {
        const unfinishedSideQuests = [
          ...gameState.nonActivatedQuests,
          ...gameState.activatedQuests,
        ].some((quest) => !quest.isMain())
        if (unfinishedSideQuests) {
          return (
            eventMsg +
            '\n' +
            speech(
              'Not yet. Something is still left undone out there, Elior. ' +
                'Until it is set right, I will not join them.',
            )
          )
        }

        // The confession plays on one talk; the rite follows on the next.
        if (!gameState.getStoryFlag(FLAG_ACT3_MIRA_CONFESSED)) {
          return this.confess(gameState, eventMsg)
        }

        // Step 28: Perform the Warding Rite to create Lifelight Elixir
        gameState.setStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED, true)
        gameState.setStoryFlag(FLAG_ACT3_MAIN_COMPLETED, true)

        // Remove the three virtue relics from inventory/room
        gameState.removeItemFromInventoryOrRoom('Crystal of Light', 1)
        gameState.removeItemFromInventoryOrRoom('Phoenix Feather', 1)
        gameState.removeItemFromInventoryOrRoom("Dragon's Scale", 1)
        // The rite calls for the herbs, as Mira promised: they leave the hut.
        gameState.removeItemFromInventoryOrRoom('healing herbs', 1)

        // Add Lifelight Elixir to the room for pickup
        const lifelightElixir = new LifelightElixir()
        gameState.currentRoom.addItem(lifelightElixir)
        return (
          eventMsg +
          '\n' +
          (speech(
            'The three relics resonate, Elior. Listen. They were made ' +
              'together, and they know it.',
          ) +
            '\n' +
            (`${characterName(this.name)} sets the three relics in a ` +
              'triangle on her table and draws a chalk circle round them, ' +
              'the way she drew the one in the castle yard. The crystal ' +
              'flares white. The feather catches fire and does not burn. ' +
              'The scale hums.') +
            '\n' +
            ('She takes the [item_name]healing herbs[/item_name] from the ' +
              'shelf and presses the sachets into your hands. They smell of ' +
              'resin, and your breath slows while the circle tightens.') +
            '\n' +
            'She says three words under her breath, and the chalk lines go ' +
            'dark one after another.' +
            '\n' +
            ('The relics soften at the edges, run together like wax, and ' +
              'are gone. On the table where they stood is a small glass vial ' +
              'the colour of first light: the ' +
              '[item_name]lifelight elixir[/item_name].') +
            '\n' +
            speech(
              'It is done. This can stop what he is doing to the king. Take ' +
                'it, and tell me when you are ready for the fortress.',
            ))
        )
      } else if (gameState.getStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED)) {
        // Step 28 continued: Check if elixir is in inventory before teleporting to fortress
        if (!gameState.hasItem('Lifelight Elixir')) {
          return (
            eventMsg +
            '\n' +
            speech(
              'The elixir, Elior. You must take the lifelight elixir before ' +
                'we depart. I did not make it to leave it on my table.',
            )
          )
        }
        // Step 28 continued: Teleport to fortress
        destinationKey = 'FortressEntrance'
        flavor =
          speech("Then this is the final journey. Malakar's fortress.") +
          '\n' +
          speech(
            'I know the road. I walked it as a girl, when it was the ' +
              "Wardens' hall and not his fortress. Your parents made the " +
              'relics there, at a workbench under the dome.',
          ) +
          '\n' +
          speech(
            'It is the longest circle I have ever drawn. Stay close when we ' +
              'land.',
          )
      } else {
        // Initial teleport to start the quest
        destinationKey = 'TidalCauseway'
        flavor =
          speech(
            'Then we go. The first circle sets us down on the Tidal ' +
              'Causeway, by the Sunken Ruins.',
          ) +
          '\n' +
          speech(
            'When the air folds and the mist closes, breathe. It ' +
              'will pass in a heartbeat.',
          )
      }
    }

    if (destinationKey in gameState.allRooms) {
      // Capture origin and destination rooms
      const originRoom = gameState.currentRoom
      // Sir Cedric's gate line plays as the circle sets them down at the fortress.
      const atGate =
        destinationKey === 'FortressEntrance'
          ? cedricAdds(gameState, CEDRIC_GATE_ARRIVAL)
          : ''
      const destinationRoom = gameState.allRooms[destinationKey]

      // Move Mira and Sir Cedric to the new room to accompany the player
      const selfIndex = originRoom.characters.indexOf(this)
      if (selfIndex >= 0) originRoom.characters.splice(selfIndex, 1)
      destinationRoom.characters.push(this)
      const sirCedric = originRoom.getCharacterByName('Sir Cedric')
      if (sirCedric) {
        originRoom.characters.splice(
          originRoom.characters.indexOf(sirCedric),
          1,
        )
        destinationRoom.characters.push(sirCedric)
      }

      // Perform the teleport by switching the current room
      gameState.currentRoom = destinationRoom
      // Call room hook and mark visited for consistency
      gameState.currentRoom.onEnter(gameState)
      gameState.markVisited(gameState.currentRoom)
      const arrivalFx =
        `${characterName(this.name)} traces a prism in the air with one ` +
        'finger. The air folds and the world blurs, and when it clears you ' +
        'arrive at your next destination.' +
        '\n'
      return eventMsg + '\n' + flavor + '\n' + arrivalFx + atGate
    }
    return (
      eventMsg +
      '\n' +
      clue(
        `${characterName(this.name)} stops with her finger in the air. She ` +
          'cannot find the anchor for that place yet.',
      )
    )
  }

  /**
   * Elior asks Mira about his past: parents, Malakar, the amulet or his
   * grandmother. She dodges before her confession and answers honestly after
   * it; any other words get the same shake of the head. Works in every room
   * she is in. Between the confession and the Warding Rite he may instead
   * answer the confession (forgive her or reproach her): the first answer is
   * remembered, a later one only gets her acknowledgement.
   */
  override sayTo(gameState: GameState, words: string): string {
    const answer = miraAnswerIn(words)
    if (
      answer &&
      gameState.getStoryFlag(FLAG_ACT3_MIRA_CONFESSED) &&
      !gameState.getStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED)
    ) {
      if (
        gameState.getStoryFlag(FLAG_ACT3_MIRA_FORGIVEN) ||
        gameState.getStoryFlag(FLAG_ACT3_MIRA_REPROACHED)
      ) {
        return dialogue('Mira', MIRA_ANSWER_REPEAT)
      }
      gameState.setStoryFlag(
        answer === 'forgive'
          ? FLAG_ACT3_MIRA_FORGIVEN
          : FLAG_ACT3_MIRA_REPROACHED,
        true,
      )
      return miraAnswerReply(answer)
    }
    return miraTopicReply(
      miraTopicIn(words),
      gameState.getStoryFlag(FLAG_ACT3_MIRA_CONFESSED),
    )
  }

  /**
   * Mira's talk at the fortress gate: the first time she refuses to stay
   * behind and says she is coming along (her second line follows Elior's
   * answer to the confession, if he gave one); every later time one short
   * line.
   */
  private talkAtGate(gameState: GameState, eventMsg: string): string {
    if (gameState.getStoryFlag(FLAG_ACT3_MIRA_GATE_TALKED)) {
      return (
        eventMsg +
        '\n' +
        speech(
          'I am right behind you, Elior. The gates will not open ' +
            'themselves.',
        )
      )
    }
    gameState.setStoryFlag(FLAG_ACT3_MIRA_GATE_TALKED, true)
    const answeredLine = gameState.getStoryFlag(FLAG_ACT3_MIRA_FORGIVEN)
      ? MIRA_GATE_LINES.forgive
      : gameState.getStoryFlag(FLAG_ACT3_MIRA_REPROACHED)
        ? MIRA_GATE_LINES.reproach
        : null
    return [
      eventMsg,
      `${characterName(this.name)} leans on the cold stone of the gate. ` +
        'Her hands are still shaking from the last circle.',
      speech('I know how I look, Elior. Do not ask me to stay behind.'),
      speech(
        answeredLine ??
          'Your parents walked into the dark without me once. I will not ' +
            'let you do the same. I am coming with you.',
      ),
    ].join('\n')
  }

  /**
   * The Sunken Ruins slip: Mira recognises Lysa's hand in the letter. Marks
   * it played, so it is heard once, either as the letter is read with her
   * in the room or, failing that, at her next talk.
   */
  static ruinsSlip(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT3_MIRA_RUINS_SLIP_PLAYED, true)
    return (
      speech("Lysa's hand. She always crossed her sevens.") +
      '\n' +
      (characterName('Mira') +
        ' turns to the sea before you can ask what she means.')
    )
  }

  /**
   * The slips that open a talk with Mira, each marked played as it is told:
   * the Ruins slip if the letter was read without her (never once the party
   * has left the ruins), the Ember slip on
   * the first talk at the Switchbacks with the feather in hand, and the
   * relay of the dragon's message at the Cavern Mouth. Returns the lines
   * with a leading newline, or an empty string.
   */
  private pendingSlips(gameState: GameState): string {
    const lines: string[] = []
    const room = gameState.currentRoom.name
    if (
      gameState.getStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ) &&
      !gameState.getStoryFlag(FLAG_ACT3_RUINS_LEFT) &&
      !gameState.getStoryFlag(FLAG_ACT3_MIRA_RUINS_SLIP_PLAYED)
    ) {
      lines.push(Mira.ruinsSlip(gameState))
    }
    if (
      room === 'Lower Switchbacks' &&
      gameState.getStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED) &&
      !gameState.getStoryFlag(FLAG_ACT3_MIRA_EMBER_SLIP_PLAYED)
    ) {
      gameState.setStoryFlag(FLAG_ACT3_MIRA_EMBER_SLIP_PLAYED, true)
      lines.push(
        `${characterName(this.name)} looks at the feather a long time.`,
        speech('…even when the world burns.'),
        'She says it softly, before you have told her what the phoenix said.',
      )
    }
    if (
      room === 'Cavern Mouth' &&
      gameState.getStoryFlag(FLAG_ACT3_DRAGON_MESSAGE_GIVEN) &&
      !gameState.getStoryFlag(FLAG_ACT3_DRAGON_MESSAGE_RELAYED)
    ) {
      gameState.setStoryFlag(FLAG_ACT3_DRAGON_MESSAGE_RELAYED, true)
      lines.push(
        `${effect("You give her the dragon's words.")} ${characterName('Mira')} does not answer.`,
      )
    }
    return lines.map((line) => '\n' + line).join('')
  }

  /**
   * Plays Mira's confession (a fixed conversation), records it and gives her
   * the description she has from now on.
   */
  private confess(gameState: GameState, eventMsg: string): string {
    gameState.setStoryFlag(FLAG_ACT3_MIRA_CONFESSED, true)
    this.description =
      "The village healer — and, you know now, the Wardens' pupil, who " +
      'stayed in Willowbrook for your sake. She meets your eyes more easily ' +
      'than before.'
    return [
      eventMsg,
      `${characterName(this.name)}'s hands stop above the three relics. ` +
        'She does not begin the rite.',
      speech(
        'Before I join them, Elior, there is something you must hear from ' +
          'me, and not from a stone or a dragon.',
      ),
      speech('You noticed. I saw you notice.'),
      speech(
        'I knew your parents. Not as a healer knows a neighbour. I was ' +
          "their pupil — Aren's, Lysa's, and Malakar's. The three of them " +
          'taught me everything I know of circles and wards.',
      ),
      speech(
        'When Aren and Lysa poured themselves into the ward, someone had ' +
          'to stay with the child it hid. I came to Willowbrook as its ' +
          'healer, and I have watched over you every day since.',
      ),
      speech(
        "Your grandmother knew. She is Lysa's mother, and she kept the " +
          'secret with me.',
      ),
      'For a moment you cannot speak. Then the words come out harder than ' +
        'you meant them.',
      dialogue('Elior', "Why didn't you tell me?"),
      dialogue(
        'Mira',
        "Because the seal could not bear it. Malakar's cloaked agent " +
          "walked Willowbrook's lanes searching for the amulet, and any " +
          'word of who you were could have reached him.',
      ),
      speech(
        'Lyria wrote to me from Greendale, about a girl with a mask on her ' +
          'wrist. I burned the letter. If I had gone, I would have shown ' +
          'Greendale what the healer at Willowbrook can do, with his agent ' +
          'in both towns and you in one of them. I have never been so ' +
          'ashamed of anything.',
      ),
      speech(
        'I am telling you now because you have earned the truth. The ' +
          'amulet you carry is the anchor of the ward your parents became.',
      ),
      speech(MIRA_ANSWER_INVITATION),
      MIRA_ANSWER_REMINDER,
      'She looks down at the relics, and then back at you.',
      speech('When you are ready, tell me, and I will begin the Warding Rite.'),
      speech(
        'And ask me anything you like now — about your parents, Malakar, ' +
          'the amulet, your grandmother. I will not hide from you again.',
      ),
      MIRA_TOPICS_REMINDER,
    ].join('\n')
  }
}
