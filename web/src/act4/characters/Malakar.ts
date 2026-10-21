import { Character, type GameState, dialogue, event } from '@/engine'
import {
  FLAG_ACT4_ELIXIR_ON_KING,
  FLAG_ACT4_ELIXIR_ON_MALAKAR,
  FLAG_ACT4_FORGIVENESS_SAID,
  FLAG_ACT4_JUSTICE_SAID,
  FLAG_ACT4_LIFELIGHT_ELIXIR_CONSUMED,
  FLAG_ACT4_SACRIFICE_SAID,
  FLAG_ACT4_THRONE_AMULET_OPENED,
  FLAG_ACT4_THRONE_OFFER_HEARD,
  FLAG_ACT4_THRONE_REFRAIN_SAID,
  VIRTUE_MERCY,
} from '../Act4StoryFlags'
import { endingPlayed, justiceChoosable, sacrificeChoosable } from '../endings'
import { AncientAmulet } from '../items/AncientAmulet'
import { LifelightElixir } from '../items/LifelightElixir'
import { Forgiveness } from '../spells/Forgiveness'
import {
  THRONE_CHAMBER_AMULET,
  THRONE_CHAMBER_HEALED,
} from '../rooms/throneDescriptions'
import { normaliseSpokenWord } from '../spokenWord'

/** The speaker label of the dream voice, as in the Memory Vault. */
const SHADOW_LABEL = 'Shadow of the Past'

/** The words that are the refrain, when said in full. */
const REFRAIN_LINE = 'power follows purpose; purpose follows truth'

/** What he says to anything once the wound is closed, and he is still there. */
const NOTHING_LEFT = '[dim]There is nothing left to say. It is over.[/dim]'

/** What he is (not) when Justice has sealed him away. */
const GONE_INTO_SEAL = '[dim]Malakar is gone into the seal.[/dim]'

/** What he says when forgiveness is said but the king is already free. */
const FORGIVENESS_TOO_LATE =
  '[failure]Malakar shakes his head. The king is free and the wound is ' +
  'still open. Forgiveness alone will not close it now.[/failure]'

/** What follows the word of Justice or Sacrifice. */
const AMULET_READY = 'The open amulet grows heavy in your hand, ready.'

/** The same word said twice. */
const SAID_AMULET = '[dim]You have said it. The amulet is waiting.[/dim]'

/** The other word said after one was chosen. */
const CHOSEN = '[dim]You have chosen. The amulet is waiting.[/dim]'

/** The words that choose an ending. */
const ENDING_WORDS = ['forgiveness', 'justice', 'sacrifice']

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
        'holding him up.',
    })
  }

  /** His look. */
  override examine(gameState: GameState): string {
    const ending = endingPlayed(gameState)
    if (ending === 'justice') return event('Malakar is gone into the seal.')
    if (ending) {
      return event(
        ending === 'redemption'
          ? 'Malakar sits by the shards, himself again.'
          : 'Malakar kneels before the king, grey and powerless.',
      )
    }
    return event(this.description)
  }

  /** What he says follows the ending, the refrain, the amulet and the elixir. */
  override talkTo(gameState: GameState): string {
    const ending = endingPlayed(gameState)
    if (ending === 'justice') return GONE_INTO_SEAL
    if (ending === 'redemption') {
      return dialogue(
        this.name,
        'Go home, Elior. Tell Mira I am sorry, and that I remember her.',
      )
    }
    if (ending === 'sacrifice') {
      return dialogue(this.name, 'You gave it all away. For them. For me.')
    }
    if (gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_MALAKAR)) {
      return dialogue(
        this.name,
        'It does not hurt. For the first time in years, it does not hurt.',
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
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_OFFER_HEARD)) {
      return dialogue(
        this.name,
        'They would wake, Elior. Your mother would laugh at something your ' +
          'father said. Is one boy and one tired king too much to pay for ' +
          'that? Give me the amulet.',
      )
    }
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
          "Alden's crown. I have been bleeding the king for years to loosen " +
          'his half. Give me yours and he can stop dying today.',
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
   * elixir is used; any other word only gets a dim answer.
   */
  override sayTo(gameState: GameState, words: string): string {
    const word = normaliseSpokenWord(words)
    const ending = endingPlayed(gameState)
    if (ending === 'justice') return GONE_INTO_SEAL
    if (ending) return NOTHING_LEFT
    if (
      ENDING_WORDS.includes(word) &&
      gameState.getStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED)
    ) {
      return this.endingWord(gameState, word)
    }
    if (word !== 'refrain' && word !== REFRAIN_LINE) {
      return this.otherWords(gameState)
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID)) {
      return '[dim]You have said it. Malakar heard.[/dim]'
    }
    gameState.setStoryFlag(FLAG_ACT4_THRONE_OFFER_HEARD, true)
    gameState.setStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID, true)
    return [
      event(
        '“Power follows purpose; purpose follows truth,” you say. The ' +
          "words from the stone in Willowbrook, from Nyx, from the Dragon's " +
          'hall. They are yours now.',
      ),
      dialogue(
        this.name,
        'We carved those words together, your father and I. I had ' +
          'forgotten them.',
      ),
    ].join('\n')
  }

  /** Hears "forgiveness", "justice" or "sacrifice" with the amulet open. */
  private endingWord(gameState: GameState, word: string): string {
    const onMalakar = gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_MALAKAR)
    if (!onMalakar && !gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)) {
      return '[failure]Not yet. The elixir is still in your hand.[/failure]'
    }
    if (word === 'forgiveness') {
      return onMalakar ? this.forgive(gameState) : FORGIVENESS_TOO_LATE
    }
    if (onMalakar) {
      return '[failure]Malakar has drunk the elixir. That road is closed now.[/failure]'
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
      '“I forgive you,” you say. The words are harder than any spell, and ' +
        'then they are easy. Something warm settles in your chest, like a ' +
        'lesson you always knew.',
      event('You have learned the Forgiveness spell!'),
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
    if (!justiceChoosable(gameState)) {
      return (
        "[failure]The words will not come. Naming another's crimes asks " +
        'for someone who has told the truth when it cost them, and you ' +
        'have not been that often enough yet.[/failure]'
      )
    }
    gameState.setStoryFlag(FLAG_ACT4_JUSTICE_SAID, true)
    return [
      '“You tore the world, Malakar,” you say. “You drained the king. You ' +
        'sent a man to hunt a child in Willowbrook, and you let Sir Cedric ' +
        "take the blame. I will not pretend you didn't.”",
      dialogue(this.name, "No. You won't. Your mother never could either."),
      AMULET_READY,
    ].join('\n')
  }

  /** "Sacrifice" with the prison broken: Elior offers his magic. */
  private chooseSacrifice(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_JUSTICE_SAID)) return CHOSEN
    if (gameState.getStoryFlag(FLAG_ACT4_SACRIFICE_SAID)) return SAID_AMULET
    if (!sacrificeChoosable(gameState)) {
      return (
        '[failure]You reach for your magic to let it go, and your hands ' +
        'close on it instead. You have not yet given often enough without ' +
        'asking anything back.[/failure]'
      )
    }
    gameState.setStoryFlag(FLAG_ACT4_SACRIFICE_SAID, true)
    return [
      '“Take my magic,” you say. “All of it. Close the wound with that.”',
      dialogue(this.name, 'Elior, no. Everything you have learned—'),
      AMULET_READY,
    ].join('\n')
  }

  /** What he answers to words that are not the refrain. */
  private otherWords(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_MALAKAR)) {
      return '[dim]Malakar only waits.[/dim]'
    }
    if (this.choiceMade(gameState)) {
      return '[dim]Malakar listens, but words are not what he needs now.[/dim]'
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED)) {
      return '[dim]Malakar does not answer. He is staring at the open amulet.[/dim]'
    }
    return '[dim]Malakar only waits for your answer.[/dim]'
  }

  /** Whether the elixir has been used, on anyone. */
  private choiceMade(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_MALAKAR) ||
      gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)
    )
  }

  /** The Lifelight Elixir offered to him by hand: the same as using it on him. */
  override giveItem(
    gameState: GameState,
    item: Parameters<Character['giveItem']>[1],
  ): string {
    const ending = endingPlayed(gameState)
    if (ending === 'justice') return GONE_INTO_SEAL
    if (ending) return NOTHING_LEFT
    if (item instanceof LifelightElixir) return this.receiveElixir(gameState)
    if (item instanceof AncientAmulet) return this.otherWords(gameState)
    return super.giveItem(gameState, item)
  }

  /**
   * The Ancient Amulet used here: the third step of the scene. Fails before
   * the refrain, and afterwards only a dim line.
   */
  openAmulet(gameState: GameState): string {
    if (endingPlayed(gameState)) {
      return '[dim]The amulet is only a locket now, warm and quiet.[/dim]'
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED)) {
      return '[dim]The amulet is already open, its light filling the chamber.[/dim]'
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID)) {
      return (
        '[failure]The amulet is cold. Malakar is still waiting for your ' +
        'answer.[/failure]'
      )
    }
    gameState.setStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED, true)
    gameState.currentRoom.description = THRONE_CHAMBER_AMULET
    return [
      event(
        'You raise the amulet. It opens in your hand like a flower, and ' +
          'the light of the ward pours out over the chamber. Malakar ' +
          'staggers. When he speaks again, it is not his voice.',
      ),
      dialogue(
        SHADOW_LABEL,
        'Elior. I tore the world to keep them, and I lost them anyway. I ' +
          'could not wait; you can. Be patient where I was not. Close what ' +
          'I opened, and let them rest.',
      ),
      event(
        'The Lifelight Elixir is warm in your hand. It can be used only ' +
          'once. It could break the crystal and free the king, or it could ' +
          'be offered to Malakar, to heal the wound that is killing him.',
      ),
    ].join('\n')
  }

  /**
   * Why the elixir cannot be used yet, or null once the amulet is open (the
   * choice is then open, and only its targets are accepted).
   */
  elixirRefusal(gameState: GameState): string | null {
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED)) return null
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID)) {
      return '[failure]Not yet. The amulet at your chest is stirring.[/failure]'
    }
    return '[failure]Not yet. Malakar is still waiting for your answer.[/failure]'
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
      event(
        "You kneel and hold the elixir to Malakar's lips. He drinks. The " +
          'grey goes out of his face, and for a moment he is the young man ' +
          'at the workbench again. The wound flickers, and waits.',
      ),
      event('The Lifelight Elixir is gone.'),
    ].join('\n')
  }
}
