import {
  Character,
  type GameState,
  type Spell,
  characterName,
  dialogue,
  speech,
} from '@/engine'
import {
  AncientAmulet,
  SIGIL_RECOGNISED_DESCRIPTION,
} from '../items/AncientAmulet'
import { Coins } from '../items/Coins'
import { NaturesCharm } from '../items/NaturesCharm'
import {
  FLAG_CEDRIC_RECOGNISED_SIGIL,
  FLAG_DEMONSTRATED_COMBAT_SKILLS,
  FLAG_SPOKEN_TO_SIR_CEDRIC,
  FLAG_CEDRIKS_HONOR_ACCEPTED,
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_NYX_TRIALS_COMPLETED,
  FLAG_GATHERING_STORM_COMPLETED,
  FLAG_VISION_SHARED,
} from '../Act2StoryFlags'

/** Cedric's description while his name is not yet cleared: old mail, no device, an empty scabbard. */
export const CEDRIC_DESCRIPTION_BEFORE =
  'A tall knight in old, dented mail, bearing the scars of many battles. ' +
  'A pale patch on his surcoat shows where his device has been unpicked, and ' +
  'the scabbard at his hip hangs empty. His eyes hold wisdom and ' +
  'determination all the same.'

/** Cedric's description once the Lord Commander has cleared his name and returned his sword. */
export const CEDRIC_DESCRIPTION_AFTER =
  'A tall knight in old, dented mail, bearing the scars of many battles. His ' +
  'sword hangs at his hip once more, and he carries himself like a man who ' +
  'has been given back his name.'

/** What Cedric and the narration say once the act ends, after the vision has been answered. */
export const VISION_CLOSING =
  'All your life, Malakar has been a name from old books, a story told ' +
  'to frighten children. But the agents asking after the Willowbrook ' +
  'bloodline, the seal on the [item_name]Secret Documents[/item_name], ' +
  'the figure reaching for you in the vision: they all point the same ' +
  'way. Malakar is real, and the bloodline he seeks is yours.\n\n' +
  `${characterName('Sir Cedric')} rests a hand on his sword. ` +
  '"Wherever this road leads, you will not walk it alone." ' +
  '[bold]Act II is complete.[/bold] The storm has a name now.'

/** Elior's telling, when he says the voice did not sound like a hunter. */
const VISION_TELLING =
  `You tell ${characterName('Sir Cedric')} the part you would rather keep ` +
  'to yourself: the voice did not sound like a hunter. It sounded glad to ' +
  'see you.'

/** Cedric's answer to that telling. */
const VISION_TELLING_REPLY =
  'Then it is worse, not better. A thing that wants you to come to it.'

/** The grey line that reminds the player how to answer Cedric during the bout. */
const BOUT_REMINDER =
  '[dim](Answer him with: say strike, say guard or say turn to Sir Cedric.)[/dim]'

/** The forms Cedric names; the player answers one of them with `say`. */
type BoutForm = 'strike' | 'guard' | 'turn'

/** One attack of the bout: what meets it, and the words that go with each outcome. */
interface BoutCall {
  /** The form that meets this attack. */
  answer: BoutForm
  /** Narration of the failed answer. */
  failure: string
  /** Cedric's correction after a wrong answer, up to the repeated attack. */
  correction: string
  /** The attack as it is repeated: narration, then the cry. */
  attackAction: string
  /** The cry that goes with the attack. */
  cry: string
  /** Narration of the right answer. */
  success: string
}

/** The three attacks, in the order Cedric makes them. */
const BOUT_CALLS: BoutCall[] = [
  {
    answer: 'guard',
    failure:
      'You step aside too late, and his blade stops a finger from your neck.',
    correction: 'Dead, if this were steel. Again.',
    attackAction: 'He raises his blade high over his left shoulder.',
    cry: 'High cut!',
    success: 'You bring the training sword up and his blade rings off it.',
  },
  {
    answer: 'turn',
    failure:
      'You bring the sword down to block, and his point slides under it ' +
      'and stops against your ribs.',
    correction: "You can't block a lunge with hope. Again.",
    attackAction: 'He drives straight at your middle.',
    cry: 'Lunge!',
    success: 'You step aside and his point slides past your ribs.',
  },
  {
    answer: 'strike',
    failure: 'You hold your ground, and the opening closes before you move.',
    correction: 'I gave you a door and you stood in it. Again.',
    attackAction: 'He swings wide and leaves his chest open.',
    cry: 'Well?',
    success: 'You tap his chest with the flat of the blade.',
  },
]

/** How Cedric goes on after a right answer: his acknowledgement and the next attack. */
const BOUT_ACKNOWLEDGEMENTS: string[] = [
  'Guard. Good.',
  'Turn. He taught you that much.',
]

/** The next attack as first made, after a right answer (calls 2 and 3). */
const BOUT_NEXT_ATTACKS: string[] = [
  ' He steps back, then drives straight at your middle. ',
  ' He swings wide and, for a heartbeat, leaves his chest open. ',
]

/** Disgraced knight who quietly recruits allies and awards honor-based quests. */
export class SirCedric extends Character {
  receivedNaturesCharm = false
  cedricTrustsElior = false
  /** Whether the Knight's Test bout has begun at least once, so the recognition scene plays only then. */
  boutStarted = false
  /** The attack the running bout is on, 1 to 3; 0 when no bout is running. */
  boutCall = 0

  constructor() {
    super({
      name: 'sir cedric',
      description: CEDRIC_DESCRIPTION_BEFORE,
    })
  }

  /** Also answers to his short name, which the `say truth to cedric` command uses. */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'cedric'
  }

  /** Give every Sir Cedric in the game the description that matches the state of his name. */
  static refreshAll(gameState: GameState): void {
    for (const room of Object.values(gameState.allRooms))
      for (const character of room.characters)
        if (character instanceof SirCedric)
          character.refreshDescription(gameState)
  }

  /** Set the description that matches whether his name has been cleared; safe to repeat. */
  refreshDescription(gameState: GameState): void {
    this.description = gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)
      ? CEDRIC_DESCRIPTION_AFTER
      : CEDRIC_DESCRIPTION_BEFORE
  }

  /** The greeting in which Cedric introduces himself as plain Cedric, up to the first words of his errand. */
  private greetingWords(): string {
    return (
      'Greetings, traveler. I am ' +
      characterName('Cedric') +
      ". Some here still call me Sir; you need not. The Lord Commander's " +
      'notice asks for able hands; I ask for mine here in the yard, where I ' +
      'can see what they can do. '
    )
  }

  /**
   * Recruit Elior, reward the knight's test and hand over Nature's Charm. The
   * first talk while Elior carries the Ancient Amulet also holds the one-time
   * recognition of the Wardens' sigil, which changes the amulet's description.
   * While he waits after the vision, any talk ends Act II with the closing lines.
   */
  override talkTo(gameState: GameState): string {
    if (this.boutRunning()) return this.talkDuringBout()
    if (this.waitingForElior(gameState)) return this.endAct(gameState)
    const charmDue =
      gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED) &&
      !this.receivedNaturesCharm
    const reply = this.replyToTalk(gameState)
    if (charmDue && this.receivedNaturesCharm) {
      // The talk that opens the charm scene after the ruling starts with the sword at his hip
      return (
        "Sir Cedric's sword hangs at his hip again. He rests a hand on its " +
        'hilt as you approach, as if to be sure it is real.\n\n' +
        reply
      )
    }
    return reply
  }

  /** Whether the vision has been shared and Cedric waits for Elior to answer before the act ends. */
  private waitingForElior(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_VISION_SHARED) &&
      !gameState.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)
    )
  }

  /** Complete The Gathering Storm, which ends Act II; returns the closing lines after `opening`. */
  private endAct(gameState: GameState, opening = ''): string {
    gameState.setStoryFlag(FLAG_GATHERING_STORM_COMPLETED, true)
    return opening + VISION_CLOSING
  }

  /** Whether a bout is running; older saves lack the field, so compare rather than negate. */
  private boutRunning(): boolean {
    return this.boutCall > 0
  }

  /** The current attack as it is repeated: narration then the cry. */
  private currentAttack(): string {
    const call = BOUT_CALLS[this.boutCall - 1]
    return `${call.attackAction} ${speech(call.cry)}`
  }

  /**
   * Start the Knight's Test bout when Elior uses the training sword here: the
   * first time with the recognition of the blade, later (after leaving
   * mid-bout) with a restart from the first attack. Using the sword again
   * mid-bout only repeats the current attack.
   */
  beginBout(): string {
    if (this.boutRunning()) {
      const call = BOUT_CALLS[this.boutCall - 1]
      return (
        call.attackAction +
        '\n' +
        dialogue('Sir Cedric', call.cry) +
        '\n' +
        BOUT_REMINDER
      )
    }
    const first = !this.boutStarted
    this.boutStarted = true
    this.boutCall = 1
    if (!first) {
      return (
        characterName('Sir Cedric') +
        ' takes up his practice blade again.\n' +
        speech('From the top, then. Strike, guard or turn.') +
        ' ' +
        this.currentAttack() +
        '\n' +
        BOUT_REMINDER
      )
    }
    return (
      'You draw the [item_name]training sword[/item_name]. Before you can ' +
      'take your stance, ' +
      characterName('Sir Cedric') +
      ' catches your wrist and turns the blade to the light.\n' +
      speech(
        'That notch by the guard. I put it there at fourteen, swinging ' +
          "at a post I'd been told to leave alone. Where did you get this?",
      ) +
      '\nYou tell him about the old man by the fire on the mountain path, ' +
      'and what he asked you to say.\n' +
      characterName('Sir Cedric') +
      ' is silent for a long moment. When he speaks, his voice is low.\n' +
      speech(
        "The sergeant never believed in anything he couldn't hit. That " +
          'he believes in me...',
      ) +
      ' He lets go of your wrist and steps back. ' +
      speech('Show me what he taught you, then.') +
      '\n\nHe takes a practice blade from the rack and squares off against you.\n' +
      speech(
        'Three forms, the way he drilled them. When I come at you, answer ' +
          'me: strike, guard or turn. Say it as you do it.',
      ) +
      '\n' +
      BOUT_REMINDER +
      '\n' +
      characterName('Sir Cedric') +
      ' raises his blade high over his left shoulder.\n' +
      speech('High cut!')
    )
  }

  /** Abandon a running bout, as when Elior leaves the courtyard; the next use of the sword restarts it. */
  abandonBout(): void {
    this.boutCall = 0
  }

  /**
   * Answer an attack with a form; the wrong ones cost nothing and repeat the
   * attack. While Cedric waits after the vision, saying "truth" tells him the
   * voice did not sound like a hunter and ends the act; no virtue is recorded.
   */
  override sayTo(gameState: GameState, words: string): string {
    if (!this.boutRunning()) {
      const spoken = words
        .trim()
        .toLowerCase()
        .replace(/[.!?]+$/, '')
      if (spoken === 'truth' && this.waitingForElior(gameState))
        return this.endAct(
          gameState,
          VISION_TELLING +
            '\n\n' +
            dialogue('Sir Cedric', VISION_TELLING_REPLY) +
            '\n\n',
        )
      return super.sayTo(gameState, words)
    }
    const said = words
      .trim()
      .toLowerCase()
      .replace(/[.!?]+$/, '')
    const call = BOUT_CALLS[this.boutCall - 1]
    if (said !== 'strike' && said !== 'guard' && said !== 'turn') {
      return (
        dialogue('Sir Cedric', 'Strike, guard or turn, Elior.') +
        ' ' +
        this.currentAttack()
      )
    }
    if (said !== call.answer) {
      return (
        call.failure +
        '\n' +
        dialogue('Sir Cedric', call.correction) +
        ' ' +
        this.currentAttack() +
        '\n' +
        BOUT_REMINDER
      )
    }
    if (this.boutCall < BOUT_CALLS.length) {
      const index = this.boutCall - 1
      this.boutCall += 1
      const next = BOUT_CALLS[this.boutCall - 1]
      return (
        call.success +
        '\n' +
        dialogue('Sir Cedric', BOUT_ACKNOWLEDGEMENTS[index]) +
        BOUT_NEXT_ATTACKS[index] +
        speech(next.cry)
      )
    }
    return this.passTest(
      gameState,
      call.success +
        '\n' +
        characterName('Sir Cedric') +
        ' lowers his blade and nods approvingly.\n' +
        speech(
          'Excellent! Your martial training is evident. I can trust ' +
            'someone with such disciplined combat skills.',
        ),
    )
  }

  /** During the bout Cedric will not talk; he repeats the attack. */
  private talkDuringBout(): string {
    return dialogue('Sir Cedric', 'Talk after.') + ' ' + this.currentAttack()
  }

  /** Any spell cast on Cedric during the bout ends it: he meets a mage with wary respect. */
  override receiveSpell(gameState: GameState, spell: Spell): string | null {
    if (!this.boutRunning()) return null
    return this.passTest(
      gameState,
      'You let the sword drop to your side and answer with ' +
        `[spell_name]${spell.name}[/spell_name] instead. The air between you ` +
        'hums, and ' +
        characterName('Sir Cedric') +
        "'s practice blade stops short, as if it had struck a wall.\n" +
        characterName('Sir Cedric') +
        ' lowers the blade slowly. He is watching your hands now, not your face.\n' +
        speech(
          "A mage.' A long breath. 'The sergeant never trusted what he " +
            "couldn't hit, and I couldn't hit that. Better it stands beside " +
            'me than against me. I can trust someone who knows when not to ' +
            'fight fair.',
        ),
    )
  }

  /** Complete the Knight's Test: the sword leaves the pack and Cedric goes on to Nyx and the supplies. */
  private passTest(gameState: GameState, opening: string): string {
    this.boutCall = 0
    gameState.setStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS, true)
    gameState.removeItemFromInventory('training sword')
    return (
      '[success]' + opening + '\n\n' + this.missionBriefing() + '[/success]'
    )
  }

  /** Cedric's warning about the dark forces, Nyx and the supplies from the Market District. */
  private missionBriefing(): string {
    return (
      'He pauses, his expression growing more serious. ' +
      speech(
        "Since you've proven your combat prowess, I can share more about " +
          "what lies ahead. The dark forces gathering aren't ordinary " +
          "threats - they're connected to ancient magical energies that have " +
          'been dormant for centuries.',
      ) +
      '\n\n' +
      characterName('Sir Cedric') +
      ' leans closer, lowering his voice. ' +
      speech(
        'There are legends of a being known as ' +
          characterName('Nyx') +
          ' - a mystical entity who dwells deep within the enchanted forest ' +
          'beyond our borders. Nyx is said to possess knowledge of the ' +
          'oldest magics, including secrets that could help us understand ' +
          'and combat these gathering shadows.',
      ) +
      '\n\n' +
      speech('But the enchanted forest is treacherous,') +
      ' he continues. ' +
      speech(
        "You'll need proper supplies before attempting such a journey. " +
          'Visit the Market District and gather essential equipment: a ' +
          'forest survival kit, an enhanced lantern for the dark woods, and ' +
          "quality rope for navigating difficult terrain. Only when you're " +
          'properly equipped should you venture into those mystical lands to ' +
          'seek out Nyx.',
      ) +
      '\n\nHe straightens up, his voice returning to its commanding tone. ' +
      speech(
        'Time is of the essence, Elior. The darkness grows stronger each ' +
          "day, and we need Nyx's ancient wisdom to understand what we're " +
          'truly facing.',
      )
    )
  }

  /** The reply to a talk without the one-time hilt line. */
  private replyToTalk(gameState: GameState): string {
    const amulet = gameState.inventory.find((i) => i instanceof AncientAmulet)
    if (amulet && !gameState.getStoryFlag(FLAG_CEDRIC_RECOGNISED_SIGIL)) {
      gameState.setStoryFlag(FLAG_CEDRIC_RECOGNISED_SIGIL, true)
      amulet.description = SIGIL_RECOGNISED_DESCRIPTION
      if (!gameState.getStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC)) {
        gameState.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
        return this.interruptedGreeting()
      }
      return (
        characterName('Sir Cedric') +
        "'s eyes fall on the " +
        '[item_name]Ancient Amulet[/item_name]' +
        ' at your chest, and he goes very still.' +
        '\n\n' +
        characterName('Sir Cedric') +
        ': ' +
        speech(this.recognitionWords()) +
        '\n\n' +
        this.normalReply(gameState)
      )
    }
    return this.normalReply(gameState)
  }

  /** The words in which Cedric names the sigil and Elior's family bound to the Wardens. */
  private recognitionWords(): string {
    return (
      'That sigil. The sun rising over three linked rings. I have seen it ' +
      'only in the old histories in the castle archive: it is the mark of ' +
      'the Wardens of the Dawn. They guarded this kingdom long ago, and ' +
      'most have forgotten them.' +
      '\n\n' +
      'Whoever wore that amulet before you was a Warden, and your family is ' +
      'bound to them. I know no more than that. But I know enough to listen ' +
      'to you.'
    )
  }

  /** The first meeting when Elior carries the amulet: the greeting breaks off at the sigil. */
  private interruptedGreeting(): string {
    return (
      characterName('Sir Cedric') +
      ': ' +
      speech(
        this.greetingWords() +
          'I have been seeking individuals of courage and skill for a ' +
          'matter of great—',
      ) +
      '\n\n' +
      characterName('Sir Cedric') +
      ' stops mid-sentence. His eyes have fallen on the ' +
      '[item_name]Ancient Amulet[/item_name] at your chest.' +
      '\n\n' +
      characterName('Sir Cedric') +
      ': ' +
      speech(
        this.recognitionWords() +
          '\n\n' +
          "Dark forces are gathering; I call it the 'Gathering Storm', and " +
          'I need allies with magical knowledge and proven abilities. The ' +
          'sigil tells me where you come from; it does not tell me what you ' +
          'can do. Can you demonstrate your martial abilities?',
      )
    )
  }

  /**
   * The words with which Cedric gives Nature's Charm: they refer back to his
   * refusal at the send-off when Elior heard it, and stand alone otherwise.
   */
  private charmHandOverWords(): string {
    if (this.cedricTrustsElior) {
      return (
        'Do you remember what I told you in the yard? That I would not give ' +
        'an heirloom of my house to someone I had known a day. I have known ' +
        "you long enough now. Take Nature's Charm. It was blessed by the " +
        'ancient knights who first made pacts with the forest spirits, and ' +
        'it is one of the three that call Nyx. You will need it more than I ' +
        'will.'
      )
    }
    return (
      "Please accept this Nature's Charm. It has been in my family for " +
      'generations, blessed by the ancient knights who first made pacts with ' +
      'the forest spirits. A day ago I would not have given it to someone I ' +
      'had only just met. But you have done more for me than men I have ' +
      'known for years. The old texts say this is one of three sacred ' +
      'charms needed to summon Nyx. I believe you will need it for the ' +
      'greater challenges ahead.'
    )
  }

  /** Cedric's reply to a talk, by the stage of the act; the recognition never changes it. */
  private normalReply(gameState: GameState): string {
    // Check if Nyx trials are completed - highest priority response
    if (gameState.getStoryFlag(FLAG_NYX_TRIALS_COMPLETED)) {
      return (
        characterName('Sir Cedric') +
        ': ' +
        speech(
          'My friend, I sense something extraordinary has happened. You ' +
            'carry an aura of ancient magic, and your eyes hold depths I had ' +
            'not seen before. Have you succeeded in your quest to find Nyx? ' +
            'The prophetic vision spell you learned is the sort of mystical ' +
            'knowledge we need. With your ability to glimpse possible futures, ' +
            'we can better anticipate threats and develop strategies to ' +
            'counter them. You have become a formidable ally in our fight ' +
            'against the darkness.',
        )
      )
    }

    if (
      gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED) &&
      !this.receivedNaturesCharm
    ) {
      // Honor has been restored, give Nature's Charm
      this.receivedNaturesCharm = true
      const charm = new NaturesCharm()
      gameState.inventory.push(charm)

      return (
        characterName('Sir Cedric') +
        ': ' +
        speech(
          'My friend, I cannot express how grateful I am. You have restored ' +
            'my honor and cleared my name. And more: the king was not lost on ' +
            'my watch. He was taken, by men who were paid to let it happen.',
        ) +
        '\n\nHe is quiet for a moment.\n\n' +
        speech(
          'Malakar. My grandmother frightened me with that name when I was ' +
            'small. Whoever hides behind it took my king, and I mean to find ' +
            'him.',
        ) +
        '\n\n' +
        characterName('Sir Cedric') +
        ' reaches into his pack and withdraws an ancient wooden charm.' +
        '\n\n' +
        characterName('Sir Cedric') +
        ': ' +
        speech(this.charmHandOverWords())
      )
    }

    if (gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)) {
      return (
        characterName('Sir Cedric') +
        ': ' +
        speech(
          'Thanks to you, my knighthood is restored and the charge struck from ' +
            'my record. Now I can turn to what matters: finding the king, and ' +
            'whoever wears that old name.',
        )
      )
    }

    if (!gameState.getStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC)) {
      // First meeting - explain the main quest and give knight's test
      gameState.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
      return (
        characterName('Sir Cedric') +
        ': ' +
        speech(
          this.greetingWords() +
            'I have been seeking individuals of courage and skill for a ' +
            'matter of great importance. Dark forces are gathering; I call it ' +
            "the 'Gathering Storm', and I need allies with magical knowledge " +
            'and proven abilities. Before I can trust you with this ' +
            'responsibility, I need proof of your combat skills. Can you ' +
            'demonstrate your martial abilities?',
        )
      )
    } else if (
      gameState.isQuestCompleted("The Knight's Test") &&
      !this.cedricTrustsElior
    ) {
      this.cedricTrustsElior = true

      // Give Elior 150 individual coins using the new batching system
      const coin = new Coins(1) // Create a single coin worth 1 gold
      gameState.addItemToInventory(coin, 150) // Add 150 of them

      return (
        characterName('Sir Cedric') +
        ': ' +
        speech(
          'Excellent demonstration! Your combat skills are impressive. I can ' +
            'see you have the training and discipline needed for the ' +
            'challenges ahead.',
        ) +
        '\n\n' +
        characterName('Sir Cedric') +
        ' reaches into his pouch and hands you a bag of coins.' +
        '\n\n' +
        characterName('Sir Cedric') +
        ': ' +
        speech(
          'Please accept these 150 gold coins. I should have provided them ' +
            "earlier for your supply purchasing. You'll need proper equipment " +
            'for the forest expedition: a survival kit, an enhanced lantern, ' +
            'and quality rope from the Market District. The realm faces a ' +
            'great threat, and we must be prepared.',
        ) +
        '\n\n' +
        characterName('Sir Cedric') +
        ' hesitates, then rests a hand on a small pouch at his belt.' +
        '\n\n' +
        characterName('Sir Cedric') +
        ': ' +
        speech(
          'One more thing, since the forest is where you are bound. My ' +
            "family has kept a charm for generations: Nature's Charm, " +
            'carved for the knights who first made pacts with the forest ' +
            'spirits. The old texts say it is one of three that can call the ' +
            'sprite Nyx. I will not hand an heirloom of my house to someone ' +
            'I have known for a day. Prove yourself in more than a sparring ' +
            'yard, and we will speak of it again.',
        )
      )
    } else if (this.cedricTrustsElior) {
      const preparation =
        characterName('Sir Cedric') +
        ': ' +
        speech(
          'How goes your preparation? The gathering storm grows stronger ' +
            'each day. I trust you are making good progress in gathering ' +
            'allies and supplies.',
        )
      if (!gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED))
        return preparation
      // He has heard of his own disgrace: he owns it without defending himself
      return (
        preparation +
        "\n\nSir Cedric's jaw tightens.\n\n" +
        speech(
          "You will have heard what they say of me. I held the king's wall " +
            'the night he vanished, and he was taken on my watch. Whatever ' +
            'else is true, that is. I will not make excuses.',
        )
      )
    }
    return (
      characterName('Sir Cedric') +
      ': ' +
      speech(
        'I await your demonstration of combat skills before we can proceed ' +
          'with more serious matters.',
      )
    )
  }
}
