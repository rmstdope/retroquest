import {
  Character,
  type GameState,
  affirms,
  characterName,
  clue,
  dialogue,
  speech,
} from '@/engine'
import {
  FLAG_ACT4_ELIXIR_ON_KING,
  FLAG_ACT4_CEDRIC_FORGAVE,
  FLAG_ACT4_ELIXIR_ON_MALAKAR,
  FLAG_ACT4_FORGIVENESS_SAID,
  FLAG_ACT4_JUSTICE_SAID,
  FLAG_ACT4_LIFELIGHT_ELIXIR_CONSUMED,
  FLAG_ACT4_MALAKAR_MESSAGE_HEARD,
  FLAG_ACT4_SACRIFICE_SAID,
  FLAG_ACT4_THRONE_AMULET_OPENED,
  FLAG_ACT4_THRONE_BARGAIN_SEEN,
  FLAG_ACT4_THRONE_EARLY_AMULET_SEEN,
  FLAG_ACT4_THRONE_EARLY_ELIXIR_SEEN,
  FLAG_ACT4_THRONE_OFFER_HEARD,
  FLAG_ACT4_THRONE_REFRAIN_SAID,
  VIRTUE_MERCY,
} from '../Act4StoryFlags'
import { endingPlayed } from '../endings'
import { AncientAmulet } from '../items/AncientAmulet'
import { LifelightElixir } from '../items/LifelightElixir'
import { Forgiveness } from '../spells/Forgiveness'
import {
  THRONE_CHAMBER_AMULET,
  THRONE_CHAMBER_HEALED,
} from '../rooms/throneDescriptions'

/** The speaker label of the dream voice, as in the Memory Vault. */
const SHADOW_LABEL = 'Shadow of the Past'

/** Set a line apart as a held moment: the amber-ruled italic passage. */
function wrapBreath(text: string): string {
  return `[breath]${text}[/breath]`
}

/**
 * The words that are the refrain: its name, or its opening, whatever ends it
 * ("power follows purpose, purpose follows truth"), or with an ellipsis
 * between its words.
 */
const REFRAIN_WORDS = ['refrain', 'power follows purpose']

/** What he says to anything once the wound is closed, and he is still there. */
const NOTHING_LEFT = '[dim]There is nothing left to say. It is over.[/dim]'

/** What he is (not) when Justice has sealed him away. */
const GONE_INTO_SEAL = '[dim]Malakar is gone into the seal.[/dim]'

/** What he says when forgiveness is said but the king is already free. */
const FORGIVENESS_TOO_LATE = clue(
  'Malakar shakes his head. The king is free and the wound is ' +
    'still open. Forgiveness alone will not close it now.',
)

/** What follows the word of Justice or Sacrifice. */
const AMULET_READY = 'The open amulet grows heavy in your hand, ready.'

/** The same word said twice. */
const SAID_AMULET = '[dim]You have said it. The amulet is waiting.[/dim]'

/** The other word said after one was chosen. */
const CHOSEN = '[dim]You have chosen. The amulet is waiting.[/dim]'

/** The ending each word chooses, heard in a sentence that does not deny it. */
const ENDING_WORDS: readonly {
  ending: EndingWord
  words: readonly string[]
}[] = [
  { ending: 'forgiveness', words: ['forgiveness', 'forgive'] },
  { ending: 'justice', words: ['justice'] },
  { ending: 'sacrifice', words: ['sacrifice'] },
]

/** The word that chooses an ending. */
type EndingWord = 'forgiveness' | 'justice' | 'sacrifice'

/** The ending word the words say, or null. */
function endingWordIn(words: string): EndingWord | null {
  return ENDING_WORDS.find((e) => affirms(words, e.words))?.ending ?? null
}

/** What he answers once Elior has forgiven him and the wound is left. */
const FORGIVEN = clue(
  'You have forgiven him. It is the wound that is waiting now.',
)

/**
 * His look once the elixir has healed him and before Elior has forgiven
 * him, which points at forgiveness: through what Sir Cedric did for the
 * knight, if Elior saw him do it, and plainly otherwise.
 */
function waitingForForgiveness(gameState: GameState): string {
  return gameState.getStoryFlag(FLAG_ACT4_CEDRIC_FORGAVE)
    ? `${characterName('Malakar')} looks at you the way the knight looked ` +
        `at ${characterName('Sir Cedric')} in the hall, before ` +
        `${characterName('Sir Cedric')} gave him his hand.`
    : `${characterName('Malakar')} looks up at you like a man waiting to ` +
        'be forgiven.'
}

/**
 * Malakar in the Throne Chamber: tired and pleading, a grieving friend. He
 * plays the climax scene in ordered steps (his offer, the refrain, the open
 * amulet), takes the Lifelight Elixir if Elior offers it, and hears the word
 * of the ending Elior chooses (forgiveness, justice or sacrifice). His state
 * is all story flags, so saves return it exactly.
 */
export class Malakar extends Character {
  constructor() {
    super({
      name: 'Malakar',
      description:
        "A tall man in a grey robe that was once a Warden's blue. His hair " +
        'is white, though he cannot be much older than your father would ' +
        'have been. He leans on the throne as if it is the only thing ' +
        'holding him up. He is looking at the wound, not at you.',
    })
  }

  /** The look once the refrain has turned him from the wound. */
  private static readonly DESCRIPTION_TURNED =
    "A tall man in a grey robe that was once a Warden's blue. His hair " +
    'is white, though he cannot be much older than your father would ' +
    'have been. He leans on the throne as if it is the only thing ' +
    'holding him up, and he does not look away from you.'

  /** His look. */
  override examine(gameState: GameState): string {
    const ending = endingPlayed(gameState)
    if (ending === 'justice') return 'Malakar is gone into the seal.'
    if (ending) {
      return ending === 'redemption'
        ? 'Malakar sits by the shards, himself again.'
        : 'Malakar kneels before the king, grey and powerless.'
    }
    return gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID)
      ? Malakar.DESCRIPTION_TURNED
      : this.description
  }

  /** What he says follows the ending, the refrain, the amulet and the elixir. */
  override talkTo(gameState: GameState): string {
    const ending = endingPlayed(gameState)
    if (ending === 'justice') return GONE_INTO_SEAL
    if (ending === 'redemption') {
      gameState.setStoryFlag(FLAG_ACT4_MALAKAR_MESSAGE_HEARD, true)
      return dialogue(
        this.name,
        'Go home, Elior. Tell Mira I am sorry, and that I remember her.',
      )
    }
    if (ending === 'sacrifice') {
      return dialogue(this.name, 'You gave it all away. For them. For me.')
    }
    if (gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_MALAKAR)) {
      return (
        dialogue(
          this.name,
          'It does not hurt. For the first time in years, it does not hurt.',
        ) +
        (gameState.getStoryFlag(FLAG_ACT4_FORGIVENESS_SAID)
          ? ''
          : '\n' + waitingForForgiveness(gameState))
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)) {
      return dialogue(
        this.name,
        'You chose the king. Of course you did. So would they.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED)) {
      return '[dim]Malakar does not answer. He is staring at the open amulet.[/dim]'
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID)) {
      return dialogue(this.name, 'Then show me what they left you.')
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_BARGAIN_SEEN)) {
      return dialogue(
        this.name,
        'It would not break for me. Perhaps it would for you.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_OFFER_HEARD)) {
      return dialogue(
        this.name,
        'They would wake, Elior. Your mother would laugh at something your ' +
          'father said. Is one boy and one tired king too much to pay for ' +
          'that? Give me the amulet.',
      )
    }
    return this.makeOffer(gameState)
  }

  /** His offer, the four paragraphs of the first talk; marks it heard. */
  private makeOffer(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_THRONE_OFFER_HEARD, true)
    return [
      dialogue(
        this.name,
        "Aren's son. You have their eyes, both of them. You have seen the " +
          'vault, so you know what I did, and you know it worked. They woke, ' +
          'Elior. For a little while, they woke.',
      ),
      dialogue(
        this.name,
        'The wound runs backwards. Open it all the way and it pulls the ' +
          'days back to before the fever, and they wake at the workbench as ' +
          'they were. I am not lying to you. I have done the sums.',
      ),
      dialogue(
        this.name,
        'Only the ward holds it shut: half in your amulet, half in ' +
          "Alden's crown. Since my man brought him here I have been " +
          'bleeding the king to loosen his half. Give me yours and the ' +
          'bleeding stops today.',
      ),
      dialogue(
        this.name,
        'And the price is the rest of it. The king. Every year the kingdom ' +
          'has had since. And you. You were born after the tear, Elior. ' +
          'When the days go back, you go with them. I am sorry. The sums ' +
          'are still right.',
      ),
    ].join('\n')
  }

  /**
   * The refrain is the refusal; the words of the endings are heard once the
   * elixir is used; any other word only gets a dim answer. Each is heard in
   * a sentence too, unless it is denied ("I will never forgive you",
   * "Justice? No.").
   */
  override sayTo(gameState: GameState, words: string): string {
    const ending = endingPlayed(gameState)
    if (ending === 'justice') return GONE_INTO_SEAL
    if (ending) return NOTHING_LEFT
    const word = endingWordIn(words)
    if (word && gameState.getStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED)) {
      return this.endingWord(gameState, word)
    }
    if (!affirms(words, REFRAIN_WORDS)) {
      return this.otherWords(gameState)
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID)) {
      return '[dim]You have said it. Malakar heard.[/dim]'
    }
    const refrainLine = [
      dialogue('Elior', 'Power follows purpose; purpose follows truth.'),
      "The words from the stone in Willowbrook, from Nyx, from the Dragon's " +
        'hall. They are yours now.',
    ].join('\n')
    if (!gameState.getStoryFlag(FLAG_ACT4_THRONE_OFFER_HEARD)) {
      // Said before he has spoken: the refrain does not count yet.
      return [
        refrainLine,
        'Malakar laughs, a dry sound that goes on too long. Then it ' +
          'stops, all at once.',
        dialogue(
          this.name,
          'Not yet. You have not heard me. Hear me, and then say it to my ' +
            'face.',
        ),
        this.makeOffer(gameState),
      ].join('\n')
    }
    gameState.setStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID, true)
    return [
      refrainLine,
      'Malakar turns from the wound. For the first time since you came ' +
        'in, he is looking at you.',
      dialogue(
        this.name,
        'We carved those words together, your father and I. I had ' +
          'forgotten them.',
      ),
    ].join('\n')
  }

  /** Hears "forgiveness", "justice" or "sacrifice" with the amulet open. */
  private endingWord(gameState: GameState, word: EndingWord): string {
    const onMalakar = gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_MALAKAR)
    if (!onMalakar && !gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)) {
      return clue('Not yet. The elixir is still in your hand.')
    }
    if (word === 'forgiveness') {
      return onMalakar ? this.forgive(gameState) : FORGIVENESS_TOO_LATE
    }
    if (onMalakar) {
      return clue('Malakar has drunk the elixir. That road is closed now.')
    }
    return word === 'justice'
      ? this.chooseJustice(gameState)
      : this.chooseSacrifice(gameState)
  }

  /** "Forgiveness" to the healed Malakar: Elior learns the spell. */
  private forgive(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_FORGIVENESS_SAID)) {
      return '[dim]You have said it. The wound is waiting.[/dim]'
    }
    gameState.setStoryFlag(FLAG_ACT4_FORGIVENESS_SAID, true)
    gameState.learnSpell(new Forgiveness())
    const lines = [
      dialogue('Elior', 'I forgive you.'),
      'The words are harder than any spell, and then they are easy.',
      'You have learned [spell_name]forgiveness[/spell_name].',
      dialogue(this.name, 'You would forgive me. They would have too.'),
    ]
    if (gameState.hasVirtue(VIRTUE_MERCY)) {
      lines.push(
        dialogue(
          this.name,
          'And not for the first time, I think. You have shown mercy ' +
            'before, where none was owed. I can see it on you.',
        ),
      )
    }
    return lines.join('\n')
  }

  /** "Justice" with the prison broken: Elior names the crimes. */
  private chooseJustice(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_SACRIFICE_SAID)) return CHOSEN
    if (gameState.getStoryFlag(FLAG_ACT4_JUSTICE_SAID)) return SAID_AMULET
    gameState.setStoryFlag(FLAG_ACT4_JUSTICE_SAID, true)
    return [
      dialogue(
        'Elior',
        'You tore the world, Malakar. You drained the king. You sent a man ' +
          'to hunt a child in Willowbrook, and you had Sir Cedric framed ' +
          "for taking the king. I will not pretend you didn't.",
      ),
      dialogue(this.name, "No. You won't. Your mother never could either."),
      AMULET_READY,
    ].join('\n')
  }

  /** "Sacrifice" with the prison broken: Elior offers his magic. */
  private chooseSacrifice(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_JUSTICE_SAID)) return CHOSEN
    if (gameState.getStoryFlag(FLAG_ACT4_SACRIFICE_SAID)) return SAID_AMULET
    gameState.setStoryFlag(FLAG_ACT4_SACRIFICE_SAID, true)
    return [
      dialogue('Elior', 'Take my magic. All of it. Close the wound with that.'),
      dialogue(
        this.name,
        'No. Your parents gave themselves to hold that wound shut. It does ' +
          'not get to have you too.',
      ),
      AMULET_READY,
    ].join('\n')
  }

  /** What he answers to words that are not the refrain. */
  private otherWords(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_MALAKAR)) {
      return gameState.getStoryFlag(FLAG_ACT4_FORGIVENESS_SAID)
        ? FORGIVEN
        : waitingForForgiveness(gameState)
    }
    if (this.choiceMade(gameState)) {
      return '[dim]Malakar listens, but words are not what he needs now.[/dim]'
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED)) {
      return '[dim]Malakar does not answer. He is staring at the open amulet.[/dim]'
    }
    return (
      `${characterName(this.name)} waits. Your mother and father told him ` +
      'no once, in a letter. It did not stop him.'
    )
  }

  /** Whether the elixir has been used, on anyone. */
  private choiceMade(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_MALAKAR) ||
      gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)
    )
  }

  /**
   * Items offered to him by hand: the Lifelight Elixir is the same as using it
   * on him, and the Ancient Amulet may accept his bargain (see `amuletGiven`).
   */
  override giveItem(
    gameState: GameState,
    item: Parameters<Character['giveItem']>[1],
  ): string {
    const ending = endingPlayed(gameState)
    if (ending === 'justice') return GONE_INTO_SEAL
    if (ending) return NOTHING_LEFT
    if (item instanceof LifelightElixir) return this.receiveElixir(gameState)
    if (item instanceof AncientAmulet) return this.amuletGiven(gameState)
    return super.giveItem(gameState, item)
  }

  /**
   * The amulet given to him by hand. After the offer and before the refrain
   * it accepts the offer and plays the Bargain once (then a dim line);
   * otherwise he only waits, as for any other words.
   */
  private amuletGiven(gameState: GameState): string {
    const open =
      gameState.getStoryFlag(FLAG_ACT4_THRONE_OFFER_HEARD) &&
      !gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID)
    if (!open) return this.otherWords(gameState)
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_BARGAIN_SEEN)) {
      return '[dim]Malakar does not reach for it. He has seen what it will not do.[/dim]'
    }
    gameState.setStoryFlag(FLAG_ACT4_THRONE_BARGAIN_SEEN, true)
    return [
      "Malakar's hand closes on the amulet, and for a moment neither of " +
        'you lets go. Then you do.',
      'He lifts it toward the thread of light that bleeds from the ' +
        "king's crown. The wound in the air yawns wide, and the chamber " +
        'goes grey, and then gold.',
      wrapBreath(
        'A workshop in the late sun. Aren bends over the workbench; Lysa ' +
          'laughs at something he has said. They are young. They do not ' +
          'look up.',
      ),
      dialogue(SHADOW_LABEL, 'Not like this. Not by force.'),
      'The amulet will not break. The light runs backwards through the ' +
        'chamber and Malakar is thrown against the throne. You are ' +
        'standing where you stood, and the amulet is warm in your hand.',
      dialogue(this.name, 'You saw. Then you know I was not lying.'),
    ].join('\n')
  }

  /**
   * The Ancient Amulet used here: the third step of the scene. Before the
   * refrain it burns Malakar (once, then a dim line).
   */
  openAmulet(gameState: GameState): string {
    if (endingPlayed(gameState)) {
      return '[dim]The amulet is dark now, and still warm.[/dim]'
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED)) {
      return '[dim]The amulet is already open, its light filling the chamber.[/dim]'
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID)) {
      return this.burnedByAmulet(gameState)
    }
    gameState.setStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED, true)
    gameState.currentRoom.description = THRONE_CHAMBER_AMULET
    return [
      'The amulet opens in your hand like a flower, and ' +
        'the light of the ward pours out over the chamber. Malakar ' +
        'staggers. When he speaks again, it is not his voice.',
      dialogue(
        SHADOW_LABEL,
        'Elior. I tore the world to keep them, and I lost them anyway. Be ' +
          'patient where I was not. Close what I opened, and let them rest.',
      ),
      'The [item_name]lifelight elixir[/item_name] is warm in your hand. It ' +
        'can be used only ' +
        'once. It could break the crystal and free the king, or it could ' +
        'be offered to Malakar, to heal the wound that is killing him.',
    ].join('\n')
  }

  /** The amulet raised too early: the burn plays once, then a dim line. */
  private burnedByAmulet(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_EARLY_AMULET_SEEN)) {
      return '[dim]The amulet is still warm. Malakar keeps his hand well away from it.[/dim]'
    }
    gameState.setStoryFlag(FLAG_ACT4_THRONE_EARLY_AMULET_SEEN, true)
    return [
      'Malakar lunges for the amulet. The moment his fingers close on ' +
        'it, it burns white, and he snatches his hand back.',
      dialogue(SHADOW_LABEL, 'Not like this.'),
      'The voice is gone as soon as it came. Malakar holds his hand ' +
        'against his chest and will not look at you.',
    ].join('\n')
  }

  /** The elixir held out too early: the reach plays once, then a dim line. */
  private reachedForElixir(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_EARLY_ELIXIR_SEEN)) {
      return "[dim]Malakar's hand twitches toward the glass, and stays where it is.[/dim]"
    }
    gameState.setStoryFlag(FLAG_ACT4_THRONE_EARLY_ELIXIR_SEEN, true)
    const reply = gameState.getStoryFlag(FLAG_ACT4_THRONE_OFFER_HEARD)
      ? 'You would waste it on me? Keep it for them, then. Give me the ' +
        'amulet, Elior, and your mother wakes before that glass is empty.'
      : 'You would waste it on me? You have not even heard what I am ' +
        'offering.'
    return [
      "Malakar's hand comes up for the elixir, and stops a finger's " +
        'width from the glass.',
      dialogue(this.name, reply),
    ].join('\n')
  }

  /**
   * Why the elixir cannot be used yet, or null once the amulet is open (the
   * choice is then open, and only its targets are accepted).
   */
  elixirRefusal(gameState: GameState): string | null {
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED)) return null
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID)) {
      return clue('Not yet. The amulet at your chest is stirring.')
    }
    return this.reachedForElixir(gameState)
  }

  /** Malakar drinks the elixir: the grey leaves him and the wound waits. */
  receiveElixir(gameState: GameState): string {
    const refusal = this.elixirRefusal(gameState)
    if (refusal) return refusal
    gameState.setStoryFlag(FLAG_ACT4_ELIXIR_ON_MALAKAR, true)
    gameState.setStoryFlag(FLAG_ACT4_LIFELIGHT_ELIXIR_CONSUMED, true)
    gameState.removeItemFromInventoryOrRoom('Lifelight Elixir', 1)
    gameState.currentRoom.description = THRONE_CHAMBER_HEALED
    return [
      `You kneel and hold the elixir to ${characterName(this.name)}'s lips. ` +
        'He drinks. The grey goes out of his face, and for a moment he is ' +
        'the young man at the workbench again. ' +
        speech('Hush, little seed,') +
        ' he sings under his breath, and does not seem to know he does. ' +
        'The wound flickers, and waits.',
      'The lifelight elixir is gone.',
    ].join('\n')
  }
}
