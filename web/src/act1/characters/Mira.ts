import {
  Character,
  type GameState,
  type Item,
  characterName,
  speech,
  attributeSpeech,
} from '@/engine'
import { RareFlower } from '../items/RareFlower'
import { AncientAmulet } from '../items/AncientAmulet'
import { MothersLetter } from '../items/MothersLetter'
import { FadedPhotograph } from '../items/FadedPhotograph'
import { Mechanism } from '../items/Mechanism'
import { RuneToken } from '../items/RuneToken'
import { HealSpell } from '../spells/HealSpell'
import { UnlockSpell } from '../spells/UnlockSpell'
import { LightSpell } from '../spells/LightSpell'
import {
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_INVESTIGATED_WITHERED_CROPS,
  FLAG_VILLAGER_TALKED_TO,
  FLAG_WELL_EXAMINED,
  FLAG_CONNECT_WITH_NATURE,
  FLAG_MIRA_NAMED_FOULING_SIGIL,
  FLAG_FOX_KIT_FREED,
  FLAG_MIRA_FOREST_REMARK_SAID,
  FLAG_MIRA_MET,
} from '../Act1StoryFlags'

/** Her words once the amulet is Elior's, after either opening narration. */
const GOODBYE = speech(
  'Still here? Go and say a proper goodbye to your grandmother. Then go.',
)

/** Her request for the rare flower, and the well, after she names the one wound. */
const FLOWER_REQUEST =
  speech(
    'There is a [item_name]rare flower[/item_name] in the ' +
      '[room_name]Hidden Glade[/room_name]. It only opens for ' +
      'someone the land trusts. Bring me one. If it opens for you, ' +
      "I'll know what I need to know.",
  ) +
  '\n' +
  speech(
    "And look at that well again on your way. Water doesn't sour " +
      'without a reason.',
  )

/** Village healer and wise woman who teaches spells and guides quests. */
export class Mira extends Character {
  /** Flag set when the rare flower is given to Mira. */
  questPrepareForJourneyGiven = false
  amuletGiven = false

  constructor() {
    super({
      name: 'Mira',
      description:
        `${characterName('Mira')}, the village healer. Her hut smells of ` +
        'drying sage, and she looks at you a moment longer than people ' +
        'usually do.',
    })
  }

  /**
   * Mira's lines for each stage of the act. Built on demand rather than kept
   * in a field, so a save always shows the current wording.
   */
  private dialogue(
    stage:
      | 'initial'
      | 'reminder_before_request'
      | 'reminder_before_request_after_remark'
      | 'reminder_flower'
      | 'quest_conditions_not_met'
      | 'quest_complete_amulet_given'
      | 'post_amulet'
      | 'post_amulet_after_remark',
  ): string {
    switch (stage) {
      case 'initial':
        return (
          `${characterName(this.name)} looks up from the herbs she is ` +
          'tying. ' +
          speech(`${characterName('Elior')}. Come in, mind the sage.`) +
          '\nShe studies your face. ' +
          speech(
            "You've been dreaming. It's written all over you. What brings you?",
          )
        )
      case 'reminder_before_request':
        return (
          `${characterName(this.name)} glances up, a sprig of sage between ` +
          'her fingers. ' +
          speech(
            `Back already, ${characterName('Elior')}. Tell me what you've seen.`,
          )
        )
      case 'reminder_before_request_after_remark':
        return speech(
          `Back already, ${characterName('Elior')}. Tell me what you've seen.`,
        )
      case 'reminder_flower':
        return (
          `${characterName(this.name)} doesn't put the herbs down. ` +
          speech(
            'The flower, ' +
              `${characterName('Elior')}. The [room_name]Hidden Glade[/room_name]. ` +
              "I'll know the rest when I see it open.",
          )
        )
      case 'quest_conditions_not_met':
        return (
          `${characterName(this.name)} looks you over, from your boots up. ` +
          speech(
            "Not yet. I'll not send you out half-dressed and half-taught. " +
              "Come back when you're ready for the road, with a blessing " +
              'on you for it.',
          )
        )
      case 'quest_complete_amulet_given':
        return (
          `${characterName(this.name)} looks you over: cloak, boots, pack. ` +
          'She nods once. ' +
          speech("You're ready. Or as ready as anyone gets.") +
          '\nShe lifts the [item_name]ancient amulet[/item_name] from its ' +
          'stand, puts it in your hand and closes your fingers over it. It ' +
          'is warm.' +
          '\nYou now carry the [item_name]ancient amulet[/item_name].' +
          '\nShe lowers her voice. ' +
          speech(
            'I knew your parents better than I have said. ' +
              'Once you are truly ready, I will tell you.',
          ) +
          '\nShe holds your hand a moment longer. ' +
          speech(
            'A man came to my door at the turn of the month, in a grey ' +
              'cloak, asking after this. I told him I grow herbs.',
          ) +
          '\n' +
          speech(
            `Your road leads to Greendale, ${characterName('Elior')}. ` +
              'Once there, show the amulet to no one lightly. ' +
              'Those who know what it is will find you.',
          )
        )
      case 'post_amulet':
        return (
          `${characterName(this.name)} doesn't look up from her herbs. ` +
          GOODBYE
        )
      case 'post_amulet_after_remark':
        return 'She turns back to her herbs. ' + GOODBYE
    }
  }

  /**
   * Name the rune token from the well a fouling sigil and hand it back. The
   * first time she tells all she reads in it, tying it to the mill when Elior
   * has jammed the mechanism there.
   */
  private readRuneToken(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_MIRA_NAMED_FOULING_SIGIL)) {
      return (
        `${characterName(this.name)} closes your fingers over the ` +
        '[item_name]rune token[/item_name] without taking it. ' +
        speech(
          'I have told you what I know of it. ' +
            'Keep it hidden, and keep your eyes open.',
        )
      )
    }
    gameState.setStoryFlag(FLAG_MIRA_NAMED_FOULING_SIGIL, true)
    const millJammed = gameState.allRooms.OldMill?.items.some(
      (millItem) => millItem instanceof Mechanism && millItem.repaired,
    )
    const mill = millJammed
      ? '\nYou tell her of the black-iron mechanism at the mill, and the ' +
        'twisted rune on its housing. She nods slowly. ' +
        speech(
          'The same hand, then. The mill stands on old power, ' +
            'and that thing was drinking it. You did well to stop it.',
        )
      : ''
    return (
      `${characterName(this.name)} turns the ` +
      '[item_name]rune token[/item_name] over in her fingers, ' +
      'and the color drains from her face. ' +
      speech(
        `This is a fouling sigil, ${characterName('Elior')}. ` +
          'Dropped into a well, it sours the water from below, slowly, ' +
          'so that no one thinks to look.',
      ) +
      '\n' +
      speech('The well did not sicken. Someone poisoned it on purpose.') +
      mill +
      '\n' +
      speech('The cloaked stranger the villagers whisper about.') +
      ' She stops, as if she has said more than she meant to. ' +
      speech(
        'Whoever carried this was not here to spoil a well and leave. ' +
          'They were searching Willowbrook for something.',
      ) +
      ' She is quiet a moment. ' +
      speech('Or for someone.') +
      '\nShe presses the token back into your palm. ' +
      speech('Keep it close, and keep it hidden.')
    )
  }

  /**
   * Accept the rare flower, teach the basic spells and give the journey
   * quest; read the rune token from the well and hand it back.
   */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof RuneToken) return this.readRuneToken(gameState)
    if (item instanceof RareFlower) {
      gameState.removeItemFromInventory(item.name)

      const spellsToTeach = [
        new HealSpell(),
        new UnlockSpell(),
        new LightSpell(),
      ]
      for (const spellInstance of spellsToTeach) {
        gameState.learnSpell(spellInstance)
      }

      gameState.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)

      // Short beats: the flower, the teaching, then the road ahead.
      return (
        'The [item_name]flower[/item_name] is open in your hand. ' +
        `${characterName('Mira')} looks at it for a long moment before she ` +
        'takes it. ' +
        speech('Well. There it is.') +
        '\nShe sits you down, puts her hands over yours, and shows you ' +
        'three things, slowly: how to mend, how to open, how to make a ' +
        'light. None of it feels new. It feels like remembering.' +
        '\nYou have learned [spell_name]heal[/spell_name], ' +
        '[spell_name]unlock[/spell_name] and [spell_name]light[/spell_name].' +
        '\n' +
        speech("It was always in you. I've only shown you where the door is.") +
        '\nHer tone turns practical. ' +
        speech(
          'Now, the road. ' +
            "You'll need warmth, protection, food, boots and a [item_name]map[/item_name]. " +
            'And learn what else this village can teach you, and go with ' +
            "a blessing on you. When you're ready, the " +
            '[item_name]ancient amulet[/item_name] ' +
            'is yours.',
        )
      )
    }
    if (item instanceof MothersLetter) return this.letterAnswer(gameState)
    if (item instanceof FadedPhotograph) return this.photographAnswer()
    return (
      `${characterName('Mira')} regards it, then shakes her head gently. ` +
      speech('I have no need for this, child.')
    )
  }

  /**
   * The mother's letter: she reads it to the end and hands it back. Before
   * Elior carries the amulet she asks him to wait until he is ready; once he
   * carries it, she tells him she kept it and he must now.
   */
  private letterAnswer(gameState: GameState): string {
    if (gameState.inventory.some((item) => item instanceof AncientAmulet)) {
      return (
        `${characterName('Mira')} reads it, then looks at the ` +
        '[item_name]amulet[/item_name] you carry. ' +
        speech('I kept it. Now you keep it.') +
        '\nShe hands the letter back. ' +
        speech('And mind what she says about answering questions.')
      )
    }
    return (
      `${characterName('Mira')} reads it to the end, and her thumb stays on ` +
      'one line. ' +
      speech('She always did trust me with more than I asked for.') +
      '\nShe hands it back. ' +
      speech(
        'When you are ready, Elior. Not before. ' +
          'Those are her words, and they are mine.',
      )
    )
  }

  /** The faded photograph: she looks long, says one thing and gives it back. */
  private photographAnswer(): string {
    return (
      `${characterName('Mira')} holds it by the edges, the way you do, and ` +
      'looks at it a long time. ' +
      speech('You were a loud baby.') +
      ' She gives it back. That is all she says.'
    )
  }

  /**
   * Dialogue depending on quest progress; hands over the amulet when ready.
   * The first talk after the fox kit was freed opens with her one-time
   * remark about the forest, then goes on as it would have.
   */
  override talkTo(gameState: GameState): string {
    return attributeSpeech(this.name, this.talkAnswer(gameState))
  }

  /**
   * What Mira answers when spoken to, before the speaker is labelled. When her
   * forest remark opens the turn, her answer is told as following on from it.
   */
  private talkAnswer(gameState: GameState): string {
    const remark = this.forestRemark(gameState)
    return remark + this.talkByProgress(gameState, remark !== '')
  }

  /** Her one-time remark, placed before her answer, once the fox kit is freed; else ''. */
  private forestRemark(gameState: GameState): string {
    if (
      !gameState.getStoryFlag(FLAG_FOX_KIT_FREED) ||
      gameState.getStoryFlag(FLAG_MIRA_FOREST_REMARK_SAID)
    ) {
      return ''
    }
    gameState.setStoryFlag(FLAG_MIRA_FOREST_REMARK_SAID, true)
    return (
      speech(
        'A fox kit came past my door this morning with a bit of snare wire ' +
          'still round its leg. I took it off.',
      ) +
      ' She glances at you. ' +
      speech(
        "It didn't get out of that snare on its own. " +
          `That was kindly done, ${characterName('Elior')}.`,
      ) +
      '\n'
    )
  }

  /**
   * Elior tells her of the crops, the square and the well, once he has seen
   * all three and not yet told her: sets FLAG_CONNECT_WITH_NATURE and returns
   * true. Otherwise changes nothing and returns false.
   */
  private hearsThreeSignsNow(gameState: GameState): boolean {
    if (
      gameState.getStoryFlag(FLAG_CONNECT_WITH_NATURE) ||
      !gameState.getStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS) ||
      !gameState.getStoryFlag(FLAG_VILLAGER_TALKED_TO) ||
      !gameState.getStoryFlag(FLAG_WELL_EXAMINED)
    ) {
      return false
    }
    gameState.setStoryFlag(FLAG_CONNECT_WITH_NATURE, true)
    return true
  }

  /** Elior tells her of the three signs, and she calls the land and the king one wound. */
  private oneWound(): string {
    return (
      `You tell ${characterName('Mira')} about the grey crops, the ` +
      'hushed square and the sour smell of the well. She stops tying ' +
      'herbs. ' +
      speech('None of that is weather.') +
      '\nShe sets the bundle down. ' +
      speech(
        'They say the king is ill, and no one can name it. The fields ' +
          'are ill, and no one can name that either. ' +
          `I think it's one wound, ${characterName('Elior')}, and we're ` +
          'feeling it in two places.',
      )
    )
  }

  /**
   * Her dialogue for the stage Elior has reached in the act. `afterRemark` is
   * true when her forest remark, in which she glances at Elior, comes first
   * in the same turn.
   */
  private talkByProgress(gameState: GameState, afterRemark: boolean): string {
    // The flower came before the three signs: her words on the land and the
    // king still come, without the request, before anything else she says.
    if (
      gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED) &&
      this.hearsThreeSignsNow(gameState)
    ) {
      return this.oneWound()
    }

    // 1. Give the post_amulet message if amulet is in inventory
    if (gameState.hasItem('Ancient Amulet')) {
      return this.dialogue(
        afterRemark ? 'post_amulet_after_remark' : 'post_amulet',
      )
    }

    // 2. Give the initial message if the story flag 'magic_fully_unlocked' is not set
    //    (i.e., flower hasn't been given yet)
    if (!gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      // A save from before the flag existed has heard the request, so has met her.
      const met =
        gameState.getStoryFlag(FLAG_MIRA_MET) ||
        gameState.getStoryFlag(FLAG_CONNECT_WITH_NATURE)
      gameState.setStoryFlag(FLAG_MIRA_MET, true)
      if (this.hearsThreeSignsNow(gameState)) {
        const extra = `\n${this.oneWound()}\n` + FLOWER_REQUEST
        // Once met, the request alone follows; the first meeting is not replayed.
        return met ? extra.trimStart() : this.dialogue('initial') + extra
      }
      if (met) {
        return this.dialogue(
          gameState.getStoryFlag(FLAG_CONNECT_WITH_NATURE)
            ? 'reminder_flower'
            : afterRemark
              ? 'reminder_before_request_after_remark'
              : 'reminder_before_request',
        )
      }
      return this.dialogue('initial')
    }

    // 3. If 'magic_fully_unlocked' is set (flower given) and player doesn't have amulet:
    //    Quest is active or completable.
    // The quest always exists in Act 1; Python would have raised if it were missing.
    const quest = gameState.getQuest('Preparing for the Road')!
    if (quest.checkCompletion(gameState)) {
      // Conditions are fulfilled: give amulet and quest_complete_amulet_given message
      // The amulet leaves its stand: there is one amulet in the world.
      const standAmulet = gameState.currentRoom.removeItem('ancient amulet')
      gameState.addItemToInventory(standAmulet ?? new AncientAmulet())
      this.amuletGiven = true
      return this.dialogue('quest_complete_amulet_given')
    }
    // Conditions not fulfilled: give quest_conditions_not_met message
    return this.dialogue('quest_conditions_not_met')
  }
}
