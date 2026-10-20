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
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED,
  FLAG_ACT3_MAIN_COMPLETED,
  FLAG_ACT3_SEA_SEALED_LETTER_READ,
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_ECHOES_QUEST_STARTED,
} from '../Act3StoryFlags'

/**
 * Act III version of Mira: starts the main quest and handles teleportation
 * between sites.
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
    const eventMsg = event('You speak with ' + characterName(this.name) + '.')

    // First conversation in Act III: start the main quest
    if (!gameState.getStoryFlag(FLAG_ACT3_MAIN_STARTED)) {
      gameState.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)

      // Give Elior the Keepsake Note
      const keepsakeNote = new KeepsakeNote()
      gameState.inventory.push(keepsakeNote)

      return (
        eventMsg +
        '\n' +
        (speech(
          "'Elior, the weave bends and the hourglass shivers. " +
            "Threads of fate tighten about us.'",
        ) +
          '\n' +
          speech(
            "'Malakar drains King Alden to unbind Eldoria's wards. " +
              "We will not reach him unscathed without protection.'",
          ) +
          '\n' +
          speech(
            "'To walk the last road, you must embody three virtues—" +
              'Courage, Wisdom, and Selflessness—and three relics must be won to ' +
              'counter his working and shield you from his influence: the Crystal ' +
              'of Light from the Sunken Ruins, the Phoenix Feather from Mount ' +
              "Ember, and the Dragon's Scale from the Caverns of " +
              "Shadow.'",
          ) +
          '\n' +
          speech(
            "'Listen to what the tide whispers, what embers teach, " +
              "and what the deep stone remembers.'",
          ) +
          '\n' +
          speech(
            "'The Crystal will part veils and steady your spirit; " +
              'the Feather will awaken guiding fire and clarity; the Scale will ' +
              "turn aside shadow and bind your oath.'",
          ) +
          '\n' +
          speech(
            "'We will travel by my focus. I will anchor circles at " +
              'the edges of each site: first the Tidal Causeway of the Sunken ' +
              'Ruins, then the Lower Switchbacks on Mount Ember, and finally the ' +
              "Cavern Mouth of the shadowed halls.'",
          ) +
          '\n' +
          speech(
            "'Before we depart, take this note. It contains guidance " +
              "about traces of the past you may find on your journey.'",
          ) +
          '\n' +
          event('Mira hands you a small, worn piece of parchment.') +
          '\n' +
          speech(
            "'When all three are gathered, I will set our last " +
              'circle at the fortress gate. Say the word, and I will draw the ' +
              "first circle—where moonlight marries the sea.'",
          ))
      )
    }

    let destinationKey = ''
    let flavor = ''
    // Subsequent conversation: teleport onward based on current location.
    // Special-case: if we're at the Tidal Causeway, hint about the relic
    // unless the Crystal of Light has been acquired. If acquired, Mira can
    // draw the circle onward to Mount Ember.
    // If we're already at Lower Switchbacks, do not teleport; instead
    // provide lore about the second virtue and the phoenix legend.
    // Special dialogue for Cavern Mouth
    if (gameState.currentRoom.name === "Entrance to Malakar's Fortress") {
      return (
        eventMsg +
        '\n' +
        (speech(
          "'The journey has taken its toll on me, Elior. The magic " +
            "required to transport us here has drained much of my strength.'",
        ) +
          '\n' +
          speech(
            "'I must rest and recover while you and Sir Cedric press " +
              'forward into the fortress. The fate of the kingdom now rests in ' +
              "your capable hands.'",
          ) +
          '\n' +
          speech(
            "'Go with courage, wisdom, and selflessness—the three " +
              'virtues you have proven. The Lifelight Elixir will guide you to ' +
              "victory. I will await your return.'",
          ))
      )
    } else if (gameState.currentRoom.name === 'Cavern Mouth') {
      // Check if dragon's scale has been acquired
      if (!gameState.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)) {
        return (
          eventMsg +
          '\n' +
          speech(
            "'The shadows here run deep, Elior. The miners' plight is a " +
              'test of selflessness—lend your strength, and the path to the dragon ' +
              'will open. ' +
              'When you are ready, I can draw the next circle, but the caverns will ' +
              "not yield their heart until all are safe.'",
          )
        )
      }
      destinationKey = 'MirasHut'
      flavor = speech(
        "'The three relics are yours, Elior. The dragon's " +
          'wisdom runs deep—its scale will turn aside shadow and bind ' +
          'your oath. Let us return to my hut where we can combine their ' +
          "power into something that can save the king.'",
      )
    } else if (gameState.currentRoom.name === 'Lower Switchbacks') {
      if (!gameState.getStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED)) {
        return (
          eventMsg +
          '\n' +
          speech(
            "'There the second virtue, Wisdom, is taught in " +
              'embers. Old guides here tell of a phoenix that nested where ' +
              'the rock blooms with heat — a bird of returning flame. From ' +
              'its ash a single feather rises renewed, and such a feather ' +
              'is said to clear the eyes and steady a wavering hand. ' +
              'Listen for songs on the wind, and tend any sparks you find; ' +
              "they may be more than mere kindle.'",
          )
        )
      }

      // Check if Charred Inscription has been read before proceeding to Cavern Mouth
      if (!gameState.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ)) {
        return (
          eventMsg +
          '\n' +
          speech(
            "'Before we descend into shadow, Elior, you must " +
              'discover the words your parents left burned into stone upon ' +
              'these ember heights. Their message will guide you through ' +
              "the darkness ahead.'",
          )
        )
      }

      destinationKey = 'CavernMouth'
      flavor = speech(
        "'You have done well, Elior. The Phoenix Feather is a " +
          'token of wisdom; it will guide you through darkness and flame. ' +
          'Ahead lies the Cavern Mouth—gaping stone jaws that breathe cold ' +
          "and shadow. Steel your heart and hold your light high.'",
      )
    } else if (gameState.currentRoom.name === 'Tidal Causeway') {
      if (!gameState.getStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED)) {
        return (
          eventMsg +
          '\n' +
          speech(
            "'This place keeps its secrets in salt and song. " +
              'Within the Sunken Ruins lies the Crystal of Light—an old ' +
              'relic that answers to courage. When you stand before the ' +
              "tide-born guardian, speak your vow and let it steady you.'",
          )
        )
      }

      // Check if Sea-Sealed Letter has been read before proceeding to Lower Switchback
      if (!gameState.getStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ)) {
        return (
          eventMsg +
          '\n' +
          speech(
            "'Before we venture into the shadowed depths, Elior, " +
              'you should seek the traces your parents left behind in the ' +
              'sunken ruins. Their story will give you strength for what ' +
              "lies ahead in the caverns.'",
          )
        )
      }

      destinationKey = 'LowerSwitchbacks'
      flavor = speech(
        "'Well done, Elior. The Crystal answers to courage; you " +
          'have steadied the tide. Ahead lies the Lower Switchbacks—ridges ' +
          'of ember and knife-rolled stone where ash chokes the air and the ' +
          'path winds like a fever dream. Keep your footing and watch the ' +
          "skies for falling cinders.'",
      )
    } else if (gameState.currentRoom.name === "Mira's Hut") {
      // Check if Elior has read the Keepsake Note first
      if (!gameState.getStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED)) {
        return (
          eventMsg +
          '\n' +
          speech(
            "'Before we proceed, Elior, you should read the note " +
              'I gave you. It contains important guidance about your journey ' +
              "that you may find... enlightening.'",
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
              "'Before the Warding Rite, every remaining quest in " +
                'this act must be complete. Only then can the three relics ' +
                "be joined safely.'",
            )
          )
        }

        // Step 28: Perform the Warding Rite to create Lifelight Elixir
        gameState.setStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED, true)
        gameState.setStoryFlag(FLAG_ACT3_MAIN_COMPLETED, true)

        // Remove the three virtue relics from inventory/room
        gameState.removeItemFromInventoryOrRoom('Crystal of Light', 1)
        gameState.removeItemFromInventoryOrRoom('Phoenix Feather', 1)
        gameState.removeItemFromInventoryOrRoom("Dragon's Scale", 1)

        // Add Lifelight Elixir to the room for pickup
        const lifelightElixir = new LifelightElixir()
        gameState.currentRoom.addItem(lifelightElixir)
        return (
          eventMsg +
          '\n' +
          (speech(
            "'The three relics resonate with ancient power, " +
              'Elior. The Crystal of Light, the Phoenix Feather, and the ' +
              "Dragon's Scale—courage, wisdom, and selflessness made " +
              "manifest.'",
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
            speech(
              "'By light and flame and ancient oath, let these " +
                "virtues merge into one vessel of protection!'",
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
              "'It is done. This elixir can counter Malakar's " +
                'life-draining ritual and save King Alden. Take it, and we ' +
                "shall proceed to the fortress.'",
            ))
        )
      } else if (gameState.getStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED)) {
        // Step 28 continued: Check if elixir is in inventory before teleporting to fortress
        if (!gameState.hasItem('Lifelight Elixir')) {
          return (
            eventMsg +
            '\n' +
            speech(
              "'Elior, you must take the Lifelight Elixir before we " +
                'depart for the fortress. We cannot face Malakar without it—the ' +
                'elixir is our only hope of countering his life-draining ritual ' +
                "and saving King Alden.'",
            )
          )
        }
        // Step 28 continued: Teleport to fortress
        destinationKey = 'FortressEntrance'
        flavor =
          speech(
            "'The Lifelight Elixir pulses with the power of three " +
              "virtues. Now we make our final journey—to Malakar's fortress, " +
              "where the kingdom's fate awaits.'",
          ) +
          '\n' +
          speech(
            "'Steel yourself, Elior. Beyond this circle lies the " +
              'heart of shadow itself. But you carry the light that can pierce ' +
              "even Malakar's darkness.'",
          )
      } else {
        // Initial teleport to start the quest
        destinationKey = 'TidalCauseway'
        flavor =
          speech(
            "'The hour is upon us, Elior. We will draw the first " +
              'circle at the Tidal Causeway, where moonlight marries the ' +
              "sea.'",
          ) +
          '\n' +
          speech(
            "'When the air folds and the mist closes, breathe. It " +
              "will pass in a heartbeat.'",
          )
      }
    }

    if (destinationKey in gameState.allRooms) {
      // Capture origin and destination rooms
      const originRoom = gameState.currentRoom
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
        )
      )
    }
    return (
      eventMsg +
      '\n' +
      '[failure]Mira hesitates—she cannot find the proper anchor to send ' +
      'you there yet.[/failure]'
    )
  }
}
