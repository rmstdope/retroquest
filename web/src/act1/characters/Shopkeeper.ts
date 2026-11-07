import {
  Character,
  type GameState,
  type Item,
  type Room,
  characterName,
  speech,
  clue,
  attributeSpeech,
  numberInWords,
} from '@/engine'
import { Rope } from '../items/Rope'
import { Apple } from '../items/Apple'
import { Matches } from '../items/Matches'
import { Coin } from '../items/Coin'
import { AncientAmulet } from '../items/AncientAmulet'
import { RuneToken } from '../items/RuneToken'
import { Armor } from '../items/Armor'
import { Sword } from '../items/Sword'
import { Mechanism } from '../items/Mechanism'
import { Patches } from './Patches'
import {
  FLAG_HEMLOCK_HEARD_PATCHES_STAYED,
  FLAG_MET_HEMLOCK,
  FLAG_PATCHES_FOUND,
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
  FLAG_PRIEST_TALKED_TO,
  FLAG_READ_HEMLOCK_NOTICE,
  FLAG_RUSTY_HOE_SECOND_COIN_FOUND,
  TRIGGER_PATCHES_RETURNS,
} from '../Act1StoryFlags'

/** Python's str.capitalize(): first character upper-cased, the rest lower-cased. */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/** "coin" or "coins", to go with a price. */
function coins(price: number): string {
  return price === 1 ? 'coin' : 'coins'
}

/** The byword for Malakar, said anywhere in the words. */
const MALAKAR = /malakar/i

/** His cat's name, which he answers as a man who knows her. */
const PATCHES = /\bpatches\b/i

/** The healer's name, which he answers as a neighbour she once mended. */
const MIRA = /\bmira\b/i

/**
 * Old Man Hemlock, the shopkeeper of Willowbrook's General Store.
 *
 * He has shut the store to look for his missing cat, Patches, and reopens it
 * when Elior carries her home, paying the notice's reward of a coin. If
 * Elior lets her stay with his grandmother instead, she sends word, the store
 * reopens, and Hemlock gives Elior a rope and his usual apple in place of
 * the coin. Saves made
 * when the hoe still gave a second coin keep the store open and get no
 * second reward.
 *
 * The store's matches are kept for the priest: they are not among the wares
 * and are handed over for free once Elior has spoken with the priest.
 *
 * He has only the one good rope: once it is sold, or given when Patches
 * stays, it is off his shelves (the store's rope is taken from the room),
 * so a coin is always left for Borin's whetstone.
 */
export class Shopkeeper extends Character {
  wares: Record<string, { item: Item; price: number }> = {
    rope: { item: new Rope(), price: 1 },
    sword: { item: new Sword(), price: 5 },
    armor: { item: new Armor(), price: 10 },
  }
  priestMatchesGiven = false
  /** Whether Hemlock has sold his one rope. */
  ropeSold = false
  /**
   * The lines he opens with once the store is open, in turn. Kept out of the
   * saved fields so a save always hears the current wording.
   */
  private static readonly IDLE_LINES: readonly string[] = [
    'Only store in Willowbrook, so I suppose that makes it the finest.',
    "That rope's good hemp, from before the caravans stopped. There'll be " +
      'no more till spring, so mind what you tie with it.',
    "That sword's hung on that wall since my father's day. Nobody in " +
      "Willowbrook has ever needed one. I'd like it to stay that way.",
  ]
  dialogueIndex = 0

  constructor() {
    super({
      name: Shopkeeper.NAME,
      description: Shopkeeper.DESCRIPTION,
    })
  }

  private static readonly NAME = 'Hemlock'
  private static readonly DESCRIPTION =
    `Old Man ${characterName(Shopkeeper.NAME)}, who keeps the General Store. ` +
    'He glances at the door every time it creaks.'

  /**
   * His prices as one spoken sentence, in the order of the wares: the first
   * ware names its coin ("[Rope]'s a [coin]"), the rest only their number.
   * When the shelves are bare it is the empty-shelf line instead. The rope
   * is left out once it is gone.
   */
  private priceSentence(gameState: GameState): string {
    const entries = Object.entries(this.wares).filter(
      ([name]) => name !== 'rope' || !this.ropeGone(gameState),
    )
    if (entries.length === 0) return "I've nothing left on the shelves."
    const spoken = entries.map(([name, details], index) => {
      const ware = `[item_name]${index === 0 ? capitalize(name) : name}[/item_name]`
      const price =
        index === 0
          ? this.firstPrice(details.price)
          : numberInWords(details.price)
      return index === 0 ? `${ware}'s ${price}` : `the ${ware}'s ${price}`
    })
    const last = spoken.pop()
    return spoken.length === 0
      ? `${last}.`
      : `${spoken.join(', ')} and ${last}.`
  }

  /**
   * Whether his one rope is gone: sold, or given to Elior when Patches
   * stayed with grandmother (read from the story, so a save made after the
   * gift agrees).
   */
  private ropeGone(gameState: GameState): boolean {
    return (
      this.ropeSold ||
      (gameState.getStoryFlag(FLAG_HEMLOCK_HEARD_PATCHES_STAYED) &&
        !gameState.getStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND))
    )
  }

  /** The first price, with its coin word: "a [coin]" or "five [coins]". */
  private firstPrice(price: number): string {
    const coin = `[item_name]${coins(price)}[/item_name]`
    return price === 1 ? `a ${coin}` : `${numberInWords(price)} ${coin}`
  }

  /**
   * Bring a shopkeeper from a save made before he was named up to date: he
   * is Hemlock now. Safe to run more than once.
   */
  migrateLegacyName(): void {
    this.name = Shopkeeper.NAME
    this.description = Shopkeeper.DESCRIPTION
  }

  /**
   * Answers to his name, Hemlock, and still to shopkeeper, "Old Hemlock" and
   * "Old Man Hemlock": his description and the notice name him so.
   */
  override answersTo(name: string): boolean {
    return (
      super.answersTo(name) ||
      ['shopkeeper', 'old hemlock', 'old man hemlock'].includes(
        name.toLowerCase(),
      )
    )
  }

  /**
   * Whether the store is open: once Patches is home, or staying with
   * grandmother, or in a save made when the hoe's second coin, not Patches,
   * paid for the rope. Shared by the store's description and the priest's
   * quest, so every part of the act agrees on when the store trades.
   */
  static isStoreOpen(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_PATCHES_RETURNED) ||
      gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER) ||
      gameState.getStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND)
    )
  }

  /**
   * Whether Elior has heard of the reward for Patches: from Hemlock himself,
   * or from the notice on the village board.
   */
  private rewardHeardOf(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_MET_HEMLOCK) ||
      gameState.getStoryFlag(FLAG_READ_HEMLOCK_NOTICE)
    )
  }

  /**
   * Hemlock's byword over the stopped caravans, with a knock on the counter,
   * as a new line after what he has said: spoken in whichever scene Elior
   * first meets him in, so a player who walks in carrying Patches hears it
   * too.
   */
  private byword(): string {
    return (
      '\n' +
      speech(
        'And the caravans have stopped coming, now the king is ill and the ' +
          "roads are what they are. Malakar's luck, my father would have " +
          'called it.',
      ) +
      ' He raps the counter twice with his knuckles.'
    )
  }

  /**
   * Hemlock's word on the priest's errand while the store is shut, or null
   * when there is none to give: once the priest has sent Elior for his
   * matches and they have not been handed over, he has not forgotten them,
   * but sees to nothing until Patches is home. Not while Elior carries
   * Patches: she is about to be home.
   */
  priestErrandWhileShut(gameState: GameState): string | null {
    if (
      Shopkeeper.isStoreOpen(gameState) ||
      gameState.getStoryFlag(FLAG_PATCHES_FOUND) ||
      !gameState.getStoryFlag(FLAG_PRIEST_TALKED_TO) ||
      this.priestMatchesGiven
    ) {
      return null
    }
    return speech(
      `The ${characterName('priest')}'s [item_name]matches[/item_name]? ` +
        "They're under the counter, and they'll keep. " +
        `I'll see to him the day ${characterName('Patches')} is home; ` +
        "I've no head for anything else till then.",
    )
  }

  /** The errand line as a new line after what he has said, or nothing. */
  private errandAfter(gameState: GameState): string {
    const errand = this.priestErrandWhileShut(gameState)
    return errand ? '\n' + errand : ''
  }

  /**
   * Why the store is shut: Hemlock frets about Patches the first time, then
   * only asks after her. Either way he adds his word on the priest's errand
   * once Elior has been sent for the matches.
   */
  private shutDialogue(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_MET_HEMLOCK)) {
      gameState.setStoryFlag(FLAG_MET_HEMLOCK, true)
      return (
        `${this.nameInSentence({ atStart: true })} looks up from the window, ` +
        'his face creased with worry. ' +
        speech(
          'Oh! Forgive me, lad, I was watching for her. ' +
            `${characterName('Patches')}. Gone for days now, and you've seen ` +
            'her on this counter often enough to know she never goes far. ' +
            "Can't think about business with her out there in the cold, so " +
            "the store stays shut until she's home.",
        ) +
        '\n' +
        speech(
          'She was last seen near the old well. If you find her, ' +
            "there's a reward in it for you.",
        ) +
        this.byword() +
        this.errandAfter(gameState)
      )
    }
    return (
      `${this.nameInSentence({ atStart: true })} shakes his head before ` +
      'you can say anything. ' +
      speech(
        `No sign of ${characterName('Patches')}, then. I put a saucer ` +
          'out every night, near the ' +
          'old well where she was last seen. ' +
          "It's always still full in the morning. The store stays shut " +
          "till she's home, lad.",
      ) +
      this.errandAfter(gameState)
    )
  }

  /**
   * Take Patches back from Elior, pay the notice's coin (unless the save
   * already had the hoe's second coin), reopen the store and settle her on
   * the counter. He calls the coin the reward he promised only when Elior
   * heard of it. When this is the first time Elior meets him, he adds his
   * byword.
   */
  private welcomePatchesHome(gameState: GameState): string {
    const firstMeeting = !gameState.getStoryFlag(FLAG_MET_HEMLOCK)
    const promised = this.rewardHeardOf(gameState)
    gameState.setStoryFlag(FLAG_PATCHES_RETURNED, true)
    gameState.fireSound(TRIGGER_PATCHES_RETURNS)
    gameState.setStoryFlag(FLAG_MET_HEMLOCK, true)
    gameState.currentRoom.addCharacter(new Patches())
    const paid = !gameState.getStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND)
    if (paid) gameState.addItemToInventory(new Coin())
    const reward = !paid
      ? "You'll always be welcome in this store, lad."
      : promised
        ? "Here, the reward I promised. It isn't much, but it's honestly given."
        : "Here, a little something for your trouble. It isn't much, but it's " +
          'honestly given.'
    return (
      `${characterName('Patches')} butts her head against ` +
      `${this.nameInSentence()}'s hand, and his face lights up. ` +
      speech(
        `${characterName('Patches')}! You found her! ` +
          `Old ${characterName('Hemlock')} won't forget this. ` +
          `${reward} And the store's open again, so have a look around.`,
      ) +
      (paid ? '\n' + 'You receive a [item_name]coin[/item_name].' : '') +
      (firstMeeting ? this.byword() : '') +
      '\n' +
      `${characterName('Patches')} curls up beside the till and begins to purr.`
    )
  }

  /**
   * Hemlock's first word after grandmother has kept Patches: he thanks Elior
   * and, unless the save already had the hoe's second coin, gives him a rope
   * and the apple that goes with every sale, in place of the coin; the
   * reward is news to Elior unless he heard of it. When this is the first
   * time Elior meets him, he adds his byword.
   */
  private patchesStayedNews(gameState: GameState): string {
    const firstMeeting = !gameState.getStoryFlag(FLAG_MET_HEMLOCK)
    const rewardWas = this.rewardHeardOf(gameState)
      ? 'The reward was for'
      : 'There was to be a reward for'
    gameState.setStoryFlag(FLAG_HEMLOCK_HEARD_PATCHES_STAYED, true)
    gameState.setStoryFlag(FLAG_MET_HEMLOCK, true)
    const gift = !gameState.getStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND)
    if (gift) {
      Shopkeeper.clearShelfRope(gameState.currentRoom)
      const rope = new Rope()
      rope.canBeCarried = true
      gameState.addItemToInventory(rope)
      const apple = new Apple()
      apple.canBeCarried = true
      gameState.addItemToInventory(apple)
    }
    return (
      `${this.nameInSentence({ atStart: true })} hurries over the moment you come in. ` +
      speech(
        `Your ${characterName('grandmother')} sent word, lad. ` +
          `${characterName('Patches')} is safe and warm by her hearth. ` +
          "I'll not drag her back; she always did like a fire better " +
          'than a draughty old store, and I can call in and see her.',
      ) +
      '\n' +
      speech(
        (gift
          ? `${rewardWas} bringing her home, and she found a new one. ` +
            "But you'll not leave empty-handed: take this " +
            "[item_name]rope[/item_name], on the house, and there's " +
            'always an [item_name]apple[/item_name] to go with it. '
          : '') + "And the store's open again, so have a look around.",
      ) +
      (gift
        ? '\n' +
          ('You receive a [item_name]rope[/item_name] and an ' +
            '[item_name]apple[/item_name].')
        : '') +
      (firstMeeting ? this.byword() : '')
    )
  }

  /**
   * Hemlock's answer while the store is shut or a Patches scene is due, or
   * null once it is open: Patches in Elior's arms is welcomed home first, then
   * the news that she stays with grandmother; otherwise he explains why the
   * store is shut.
   */
  private whileShut(gameState: GameState): string | null {
    const stayed = gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)
    if (
      gameState.getStoryFlag(FLAG_PATCHES_FOUND) &&
      !gameState.getStoryFlag(FLAG_PATCHES_RETURNED) &&
      !stayed
    ) {
      return this.welcomePatchesHome(gameState)
    }
    if (stayed && !gameState.getStoryFlag(FLAG_HEMLOCK_HEARD_PATCHES_STAYED)) {
      return this.patchesStayedNews(gameState)
    }
    return Shopkeeper.isStoreOpen(gameState)
      ? null
      : this.shutDialogue(gameState)
  }

  /**
   * Greet Elior: while the store is shut, welcome Patches home or ask after
   * her; once open, hand over the priest's matches or list the wares.
   */
  override talkTo(gameState: GameState): string {
    return attributeSpeech(this.name, this.talkAnswer(gameState))
  }

  /** What the shopkeeper answers when spoken to, before the speaker is labelled. */
  private talkAnswer(gameState: GameState): string {
    const shut = this.whileShut(gameState)
    if (shut) return shut

    // Check if priest needs matches and shopkeeper hasn't given them yet
    if (
      gameState.getStoryFlag(FLAG_PRIEST_TALKED_TO) &&
      !this.priestMatchesGiven
    ) {
      // Give matches to player for the priest
      gameState.currentRoom.removeItem('Matches')

      const newMatches = new Matches() // Create a new instance for the inventory
      newMatches.canBeCarried = true // handed over, so Elior may carry them
      gameState.addItemToInventory(newMatches)

      // Remember the hand-over so the matches can't be given again
      this.priestMatchesGiven = true

      return (
        `${this.nameInSentence({ atStart: true })} leans in. ` +
        speech(
          `Been to see the ${characterName('priest')}, have you? ` +
            'He does get through his [item_name]matches[/item_name].',
        ) +
        ' He takes a box from under the counter. ' +
        speech(
          "They're on the house. Always have been; my father said a chapel without " +
            "a light is bad luck, and I've never been brave enough to find " +
            'out.',
        ) +
        '\n\n' +
        'You receive a box of [item_name]matches[/item_name].'
      )
    }

    // Standard dialogue if matches aren't being given for the priest
    const waresInfo =
      this.priceSentence(gameState) +
      " And there's an [item_name]apple[/item_name] with everything. " +
      "My mother's rule."

    const lines = Shopkeeper.IDLE_LINES
    const dialogue = lines[this.dialogueIndex % lines.length]
    this.dialogueIndex = (this.dialogueIndex + 1) % lines.length

    return (
      `${this.nameInSentence({ atStart: true })}
` + speech(`${dialogue} ${waresInfo}`)
    )
  }

  /**
   * Bring a shopkeeper from a save made before the matches left the wares up
   * to date. Such saves listed the matches for sale until the hand-over and
   * had no `priestMatchesGiven`, so the hand-over is read from their absence
   * before they are dropped from the wares. Safe to run more than once.
   */
  migrateLegacyWares(): void {
    this.priestMatchesGiven ??= !('matches' in this.wares)
    delete this.wares.matches
  }

  /**
   * Bring a shopkeeper from an older save up to date on his one rope. Saves
   * made before he had only the one have no `ropeSold`, which is read from
   * the story; saves made before the rope left his shelf with its sale still
   * show it, and it is taken off. Safe to run more than once.
   */
  migrateLegacyRope(gameState: GameState): void {
    if (typeof this.ropeSold !== 'boolean')
      this.ropeSold = this.legacyRopeSold(gameState)
    if (!this.ropeGone(gameState)) return
    for (const room of Object.values(gameState.allRooms)) {
      if (room.characters.includes(this)) Shopkeeper.clearShelfRope(room)
    }
  }

  /**
   * Take his one rope off the shelf once it is gone, so the store no longer
   * offers it (`Rope.isOnDisplay`).
   */
  private static clearShelfRope(room: Room): void {
    room.items = room.items.filter((item) => !Rope.isOnDisplay(item))
  }

  /**
   * Whether a save made before he had only the one rope had sold it: a rope
   * comes only from Hemlock, so one that Elior holds, or that jams the
   * mill's mechanism, was sold unless it was his gift when Patches stayed.
   */
  private legacyRopeSold(gameState: GameState): boolean {
    const giftGiven =
      gameState.getStoryFlag(FLAG_HEMLOCK_HEARD_PATCHES_STAYED) &&
      !gameState.getStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND)
    const ropeHad =
      gameState.inventory.some((item) => item instanceof Rope) ||
      Object.values(gameState.allRooms).some((room) =>
        room.items.some((item) => item instanceof Mechanism && item.repaired),
      )
    return ropeHad && !giftGiven
  }

  /**
   * Patches is carried in the story, not held as an item: giving her to him
   * while Elior carries her welcomes her home, as talking to him does.
   */
  override giveUnheld(gameState: GameState, name: string): string | null {
    const carrying =
      gameState.getStoryFlag(FLAG_PATCHES_FOUND) &&
      !gameState.getStoryFlag(FLAG_PATCHES_RETURNED) &&
      !gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)
    if (!carrying || !new Patches().answersTo(name)) return null
    return this.talkTo(gameState)
  }

  /**
   * The shopkeeper does not accept gifts: a coin he sends back for spending,
   * the amulet he will not price and bids Elior put away, the rune token he
   * will not have on his counter.
   */
  override giveItem(_gameState: GameState, item: Item): string {
    if (item instanceof Coin) {
      return (
        `${this.nameInSentence({ atStart: true })} pushes it back across ` +
        'the counter. ' +
        speech(
          "Put your coin away, lad, till there's something you want for it.",
        )
      )
    }
    if (item instanceof AncientAmulet) {
      return (
        `${this.nameInSentence({ atStart: true })} leans over the counter ` +
        'for a look, and keeps both hands on his ledger. ' +
        speech(
          "That's not shop goods, lad, and I'd not put a price on it if it " +
            'were.',
        ) +
        ' He glances at the door. ' +
        speech('Put it away. Things like that get asked after.')
      )
    }
    if (item instanceof RuneToken) {
      return (
        `${this.nameInSentence({ atStart: true })} will not touch it. He ` +
        'sweeps it back to you with the edge of his ledger. ' +
        speech(
          "I'll not have that on my counter, lad. Trade's thin enough this " +
            'year without that in the shop.',
        ) +
        ' He rubs the spot where it lay with his sleeve.'
      )
    }
    return (
      `${this.nameInSentence({ atStart: true })} chuckles and pushes it ` +
      'back across the counter. ' +
      speech("I sell things, lad. I don't take them in.")
    )
  }

  /**
   * Sell a ware for coins, adding the bonus apple to the inventory. Nothing
   * is sold while the store is shut (Patches in Elior's arms is welcomed home
   * instead), the matches are kept for the priest and never sold, his one
   * rope is sold only once, and the apples are never sold on their own,
   * since one comes with every sale.
   */
  override buyItem(gameState: GameState, itemName: string): string {
    return attributeSpeech(this.name, this.buyAnswer(gameState, itemName))
  }

  /** What the shopkeeper answers to a purchase, before the speaker is labelled. */
  private buyAnswer(gameState: GameState, itemName: string): string {
    const shut = this.whileShut(gameState)
    if (shut) return shut
    const itemNameToBuy = itemName.toLowerCase()
    if (gameState.currentRoom.getItemByName(itemNameToBuy) instanceof Matches) {
      return speech(
        `Those [item_name]matches[/item_name] are the ${characterName('priest')}'s. ` +
          "He gets them on the house whenever he asks, so they're not for sale.",
      )
    }
    if (itemNameToBuy === 'rope' && this.ropeGone(gameState)) {
      return speech(
        "That was my last good rope, lad. There'll be no more till spring.",
      )
    }
    if (gameState.currentRoom.getItemByName(itemNameToBuy) instanceof Apple) {
      return speech(
        "I don't sell the [item_name]apples[/item_name], lad. " +
          "There's one with everything you buy.",
      )
    }
    if (!(itemNameToBuy in this.wares)) {
      return speech(
        'Not something I carry, lad. Not since the caravans stopped, anyway.',
      )
    }

    const wareDetails = this.wares[itemNameToBuy]
    const price = wareDetails.price

    // Check if player has enough coins
    let coinCount = 0
    for (const item of gameState.inventory) {
      if (item instanceof Coin) {
        coinCount += 1
      }
    }

    if (coinCount < price) {
      return clue("You don't have enough coins for that.")
    }

    // Remove coins from inventory
    let removedCoins = 0
    for (const item of [...gameState.inventory]) {
      // Iterate over a copy for safe removal
      if (item instanceof Coin && removedCoins < price) {
        gameState.inventory.splice(gameState.inventory.indexOf(item), 1)
        removedCoins += 1
      }
    }

    // Add item to inventory
    // Need to create a new instance of the item to add to inventory
    const apple = new Apple() // The shopkeeper gives an apple with every purchase
    apple.canBeCarried = true
    gameState.addItemToInventory(apple)
    let newItem: Item
    if (itemNameToBuy === 'rope') {
      newItem = new Rope()
      this.ropeSold = true
      Shopkeeper.clearShelfRope(gameState.currentRoom)
    } else if (itemNameToBuy === 'sword') {
      newItem = new Sword()
    } else if (itemNameToBuy === 'armor') {
      newItem = new Armor()
    } else {
      // Should not happen if itemNameToBuy is in this.wares
      return 'An unexpected error occurred trying to sell the item.'
    }
    newItem.canBeCarried = true
    gameState.addItemToInventory(newItem)

    // The sword and armor have infinite stock; the rope is sold only once.

    return (
      `He counts the ${coins(price)} twice and hands over the ` +
      `[item_name]${newItem.name}[/item_name], and an ` +
      '[item_name]apple[/item_name] with it.\n' +
      `You receive a [item_name]${newItem.name}[/item_name] and an ` +
      '[item_name]apple[/item_name].'
    )
  }

  /**
   * Raps the counter at the byword "Malakar", the same every time and in
   * every state of the store. Answers the name of his cat as a man who
   * knows her (see `patchesAnswer`) and the healer's as a neighbour she
   * once mended (see `miraAnswer`); any other word gets his turn-taking
   * answers.
   */
  override sayTo(gameState: GameState, words: string): string {
    if (!MALAKAR.test(words)) {
      if (PATCHES.test(words)) return this.patchesAnswer(gameState)
      if (MIRA.test(words)) return this.miraAnswer()
      return super.sayTo(gameState, words)
    }
    return attributeSpeech(
      this.name,
      `${this.nameInSentence({ atStart: true })} raps the counter twice with his knuckles. ` +
        speech("Not under this roof, lad. We've had luck enough this year."),
    )
  }

  /**
   * His answer to his cat's name: with her in Elior's arms, or news of her
   * still to hear, or before Elior has met him, the same scene as speaking
   * to him (so saying her name counts as meeting him); then where she is now,
   * by grandmother's hearth or home on his counter, or, while she is still
   * missing, his hope that Elior has seen her.
   */
  private patchesAnswer(gameState: GameState): string {
    const stayed = gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)
    const carried =
      gameState.getStoryFlag(FLAG_PATCHES_FOUND) &&
      !gameState.getStoryFlag(FLAG_PATCHES_RETURNED) &&
      !stayed
    const newsToHear =
      stayed && !gameState.getStoryFlag(FLAG_HEMLOCK_HEARD_PATCHES_STAYED)
    const unmet = !gameState.getStoryFlag(FLAG_MET_HEMLOCK)
    if (carried || newsToHear || unmet) return this.talkTo(gameState)
    if (stayed) {
      return attributeSpeech(
        this.name,
        `${this.nameInSentence({ atStart: true })} smiles. ` +
          speech(
            `Your ${characterName('grandmother')} tells me she's taken the ` +
              "warm spot by the hearth. I call in when I can, lad, and she's " +
              'never once got up for me.',
          ),
      )
    }
    if (gameState.getStoryFlag(FLAG_PATCHES_RETURNED)) {
      return attributeSpeech(
        this.name,
        `${characterName('Patches')} is asleep by the till. ` +
          `${this.nameInSentence({ atStart: true })} nods at her. ` +
          speech(
            "Home where she belongs, and she's not stirred off that counter " +
              'since.',
          ),
      )
    }
    return attributeSpeech(
      this.name,
      `${this.nameInSentence({ atStart: true })} looks up at once. ` +
        speech(
          `${characterName('Patches')}? You've not seen her, have you, lad? ` +
            'She was last seen near the old well.',
        ),
    )
  }

  /** His answer to the healer's name, the same in every state of the store. */
  private miraAnswer(): string {
    return attributeSpeech(
      this.name,
      `${this.nameInSentence({ atStart: true })} rubs his wrist. ` +
        speech(
          `${characterName('Mira')} set my wrist the winter I went down on ` +
            "the ice, lad, and wouldn't take a coin for it. " +
            "There's not many would say no to a coin these days.",
        ),
    )
  }

  /** The two answers to a word with no particular reply, given in turn. */
  protected override unknownWordAnswers(): readonly string[] {
    return [
      `${this.nameInSentence({ atStart: true })} scratches his chin. ` +
        speech("You'd best ask someone with more time than I have, lad."),
      `${this.nameInSentence({ atStart: true })} glances at the door, then back at you. ` +
        speech("Keep it for later, lad. I've a shop to mind."),
    ]
  }
}
