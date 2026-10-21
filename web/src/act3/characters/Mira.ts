import {
  Character,
  type GameState,
  characterName,
  event,
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
  FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED,
  FLAG_ACT3_MAIN_COMPLETED,
  FLAG_ACT3_SEA_SEALED_LETTER_READ,
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_ECHOES_QUEST_STARTED,
  FLAG_ACT3_MIRA_CONFESSED,
  FLAG_ACT3_MIRA_GATE_TALKED,
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

/**
 * Act III version of Mira: starts the main quest, handles teleportation
 * between sites and, once everything is complete, confesses that she was the
 * Wardens' pupil before she performs the Warding Rite on the next talk. She
 * also answers `say <topic> to mira` about Elior's parents, Malakar, the
 * amulet and his grandmother (see `sayTo`).
 */
export class Mira extends Character {
  constructor() {
    super({
      name: 'Mira',
      description:
        'The village healer returns with renewed purpose. Her eyes shine ' +
        'with resolve as she speaks of the three relics needed to confront ' +
        'Malakar.',
    })
  }

  /** Handle conversation with Mira, including quest start and teleportation. */
  override talkTo(gameState: GameState): string {
    const eventMsg =
      event('You speak with ' + characterName(this.name) + '.') +
      this.pendingSlips(gameState)

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
          "Elior. Malakar is draining King Alden's life to break " +
            "Eldoria's wards, and the king grows weaker every day.",
        ) +
        '\n' +
        speech(
          'Three relics can stand against him: the Crystal of Light, ' +
            "the Phoenix Feather and the Dragon's Scale. We will fetch " +
            'them one at a time.',
        ) +
        '\n' +
        speech('Before we go, take this, and read it. Then we can leave.') +
        '\n' +
        event('Mira hands you a small, worn piece of parchment.') +
        '\n' +
        speech('Say the word, and I will draw the first circle.') +
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
      if (!gameState.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)) {
        return (
          eventMsg +
          '\n' +
          speech(
            "The shadows here run deep, Elior. The miners' plight is a " +
              'test of selflessness—lend your strength, and the path to the dragon ' +
              'will open. ' +
              'The caverns will not yield their heart until all are safe.',
          )
        )
      }
      destinationKey = 'MirasHut'
      flavor =
        speech(
          "The three relics are yours, Elior. The dragon's " +
            'wisdom runs deep—its scale will turn aside shadow and bind ' +
            'your oath. Let us return to my hut where we can combine their ' +
            'power into something that can save the king.',
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
            'Here, Wisdom is taught in ' +
              'embers. Old guides here tell of a phoenix that nested where ' +
              'the rock blooms with heat — a bird of returning flame. From ' +
              'its ash a single feather rises renewed, and such a feather ' +
              'is said to clear the eyes and steady a wavering hand. ' +
              'Listen for songs on the wind, and tend any sparks you find; ' +
              'they may be more than mere kindle.',
          )
        )
      }

      // Check if Charred Inscription has been read before proceeding to Cavern Mouth
      if (!gameState.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ)) {
        return (
          eventMsg +
          '\n' +
          speech(
            'Before we descend into shadow, Elior, you must ' +
              'discover the words your parents left burned into stone upon ' +
              'these ember heights. Their message will guide you through ' +
              'the darkness ahead.',
          )
        )
      }

      destinationKey = 'CavernMouth'
      flavor =
        speech(
          'You have done well, Elior. The Phoenix Feather is a ' +
            'token of wisdom; it will guide you through darkness and flame. ' +
            'Ahead lies the Cavern Mouth—gaping stone jaws that breathe cold ' +
            'and shadow. Steel your heart and hold your light high.',
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
            'This place keeps its secrets in salt and song. ' +
              'Within the Sunken Ruins lies the Crystal of Light—an old ' +
              'relic that answers to courage. It parts veils and steadies ' +
              'the spirit. When you stand before the ' +
              'tide-born guardian, speak your vow and let it steady you.',
          )
        )
      }

      // Check if Sea-Sealed Letter has been read before proceeding to Lower Switchback
      if (!gameState.getStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ)) {
        return (
          eventMsg +
          '\n' +
          speech(
            'Before we venture into the shadowed depths, Elior, ' +
              'you should seek the traces your parents left behind in the ' +
              'sunken ruins. Their story will give you strength for what ' +
              'lies ahead on the ember heights.',
          )
        )
      }

      destinationKey = 'LowerSwitchbacks'
      // Moving the party on closes the Pier Warden's optional moment.
      gameState.setStoryFlag(FLAG_ACT3_RUINS_LEFT, true)
      flavor =
        speech(
          'Well done, Elior. The Crystal answers to courage; you ' +
            'have steadied the tide. Ahead lies the Lower Switchbacks—ridges ' +
            'of ember and knife-rolled stone where ash chokes the air and the ' +
            'path winds like a fever dream. Keep your footing and watch the ' +
            'skies for falling cinders.',
        ) +
        '\n' +
        speech(
          'And Elior—I can feel the king through the focus. He is weaker than ' +
            'when we set out.',
        ) +
        cedricAdds(gameState, CEDRIC_KING_WEAKER_1)
    } else if (gameState.currentRoom.name === "Mira's Hut") {
      // Check if Elior has read the Keepsake Note first
      if (!gameState.getStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED)) {
        return (
          eventMsg +
          '\n' +
          speech(
            'Before we proceed, Elior, you should read the note ' +
              'I gave you. It contains important guidance about your journey ' +
              'that you may find... enlightening.',
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
              'Not yet. Something is still left undone out there, Elior — ' +
                'I can feel it in the weave. Until it is set right, the ' +
                'three relics cannot be joined safely.',
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
            'The three relics resonate with ancient power, ' +
              'Elior. The Crystal of Light, the Phoenix Feather, and the ' +
              "Dragon's Scale—courage, wisdom, and selflessness made " +
              'manifest.',
          ) +
            '\n' +
            event(
              'Mira carefully arranges the three relics in a precise ' +
                'triangle. She begins an intricate ritual, weaving threads of ' +
                'starlight around each relic. The Crystal flares with brilliant ' +
                'light, the Feather ignites with phoenix fire, and the Scale ' +
                'hums with draconic power.',
            ) +
            '\n' +
            event(
              'Mira takes the healing herbs from the shelf and presses the ' +
                'sachets into your hands. Their resin-sweet scent steadies ' +
                'your breath as the starlight tightens around the relics.',
            ) +
            '\n' +
            speech(
              'By light and flame and ancient oath, let these ' +
                'virtues merge into one vessel of protection!',
            ) +
            '\n' +
            event(
              'The three relics dissolve into streams of pure essence ' +
                'that spiral together into a crystalline vial. The resulting ' +
                'elixir shimmers with liquid starlight—the Lifelight Elixir, ' +
                'born from the union of three virtues.',
            ) +
            '\n' +
            speech(
              "It is done. This elixir can counter Malakar's " +
                'life-draining ritual and save King Alden. Take it, and we ' +
                'shall proceed to the fortress.',
            ))
        )
      } else if (gameState.getStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED)) {
        // Step 28 continued: Check if elixir is in inventory before teleporting to fortress
        if (!gameState.hasItem('Lifelight Elixir')) {
          return (
            eventMsg +
            '\n' +
            speech(
              'Elior, you must take the Lifelight Elixir before we ' +
                'depart for the fortress. We cannot face Malakar without it—the ' +
                'elixir is our only hope of countering his life-draining ritual ' +
                'and saving King Alden.',
            )
          )
        }
        // Step 28 continued: Teleport to fortress
        destinationKey = 'FortressEntrance'
        flavor =
          speech(
            'The Lifelight Elixir pulses with the power of three ' +
              "virtues. Now we make our final journey—to Malakar's fortress, " +
              "where the kingdom's fate awaits.",
          ) +
          '\n' +
          speech(
            'Steel yourself, Elior. Beyond this circle lies the ' +
              'heart of shadow itself. But you carry the light that can pierce ' +
              "even Malakar's darkness.",
          )
      } else {
        // Initial teleport to start the quest
        destinationKey = 'TidalCauseway'
        flavor =
          speech(
            'The hour is upon us, Elior. We will draw the first ' +
              'circle at the Tidal Causeway, where moonlight marries the ' +
              'sea.',
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
        event(
          'Mira traces a prism with her finger; the air folds and the ' +
            'world blurs. When it clears, you arrive at your next ' +
            'destination.',
        ) + '\n'
      return (
        eventMsg +
        '\n' +
        flavor +
        '\n' +
        arrivalFx +
        event(
          'You arrive at ' +
            `[room_name]${gameState.currentRoom.name}[/room_name].`,
        ) +
        atGate
      )
    }
    return (
      eventMsg +
      '\n' +
      '[failure]Mira hesitates—she cannot find the proper anchor to send ' +
      'you there yet.[/failure]'
    )
  }

  /**
   * Elior asks Mira about his past: parents, Malakar, the amulet or his
   * grandmother. She dodges before her confession and answers honestly after
   * it; any other words get the same shake of the head. Works in every room
   * she is in.
   */
  override sayTo(gameState: GameState, words: string): string {
    return miraTopicReply(
      miraTopicIn(words),
      gameState.getStoryFlag(FLAG_ACT3_MIRA_CONFESSED),
    )
  }

  /**
   * Mira's talk at the fortress gate: the first time she refuses to stay
   * behind and says she is coming along; every later time one short line.
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
    return [
      eventMsg,
      event(
        'Mira leans on the cold stone of the gate. Her hands are still ' +
          'shaking from the last circle.',
      ),
      speech('I know how I look, Elior. Do not ask me to stay behind.'),
      speech(
        'Your parents walked into the dark without me once. I will not ' +
          'let you do the same. Go with courage, wisdom, and ' +
          'selflessness—I am coming with you.',
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
      event(
        characterName('Mira') +
          ' turns to the sea before you can ask what she means.',
      )
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
        event('She looks at the feather a long time.'),
        speech('…even when the world burns.'),
        event(
          'She says it softly, as if finishing a sentence someone else began.',
        ),
      )
    }
    if (
      room === 'Cavern Mouth' &&
      gameState.getStoryFlag(FLAG_ACT3_DRAGON_MESSAGE_GIVEN) &&
      !gameState.getStoryFlag(FLAG_ACT3_DRAGON_MESSAGE_RELAYED)
    ) {
      gameState.setStoryFlag(FLAG_ACT3_DRAGON_MESSAGE_RELAYED, true)
      lines.push(
        event(
          "You give her the dragon's words. " +
            characterName('Mira') +
            ' does not answer.',
        ),
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
      event(
        "Mira's hands stop above the three relics. She does not begin the rite.",
      ),
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
      event(
        'For a moment you cannot speak. Then the words come out harder than ' +
          "you meant them: 'Why didn't you tell me?'",
      ),
      speech(
        "Because the seal could not bear it. Malakar's cloaked agent " +
          "walked Willowbrook's lanes searching for the amulet, and any " +
          'word of who you were could have reached him.',
      ),
      speech(
        'I am telling you now because you have earned the truth. The ' +
          'amulet you carry is the anchor of the ward your parents became.',
      ),
      event('She looks down at the relics, and then back at you.'),
      speech('When you are ready, tell me, and I will begin the Warding Rite.'),
      speech(
        'And ask me anything you like now — about your parents, Malakar, ' +
          'the amulet, your grandmother. I will not hide from you again.',
      ),
      MIRA_TOPICS_REMINDER,
    ].join('\n')
  }
}
