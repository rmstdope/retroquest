import {
  Seller,
  type GameState,
  type Item,
  type Room,
  type Ware,
  characterName,
  remembered,
  dialogue,
} from '@/engine'
import { RoomKey } from '../items/RoomKey'
import { DruidicCharm } from '../items/DruidicCharm'
import {
  FLAG_KNOWS_ELENA_CURSE,
  FLAG_ELENA_HEALED,
  FLAG_INNKEEPERS_DAUGHTER_COMPLETED,
  FLAG_MARCUS_TOLD_TRUTH,
  VIRTUE_TRUTH,
} from '../Act2StoryFlags'

/** The one ware he sells, by its name in his wares. */
const ROOM_KEY = 'room key'

/**
 * Innkeeper NPC who sells wares and rewards the player after Elena's cure.
 * Once the room key is sold it leaves his wares and his talk. His plea for
 * Elena is said once, and after greater heal he speaks of her colour instead.
 * After the cure every talk ends with his "ill wind" line until Elior tells
 * him the truth about the silver mask: the optional truth moment.
 */
export class InnkeeperMarcus extends Seller {
  /** His one ware, taken off once it is sold. */
  override wares: Record<string, Ware> = {
    [ROOM_KEY]: { item: new RoomKey(), price: 10 },
  }
  /** How he sees Elena once greater heal has taken hold. */
  private static readonly COLOUR_LINE =
    "There's colour in her face again. First time in three weeks."
  /** The talk lines he cycles through; static, so old saves get the current wording. */
  private static readonly IDLE_LINES: readonly string[] = [
    'Welcome to The Silver Stag. Hot stew, clean sheets, and a door that locks.',
    'Hard times or not, this house changes its sheets every week.',
    'A night in a room of your own does more for a body than any healer.',
  ]
  dialogueIndex = 0
  hasGivenCharm = false
  /** True once he has made his plea for Elena (or it was overtaken by the heal). */
  pleaSpoken = false
  /** True once he has remarked on Elena's colour after greater heal. */
  healRemarkSpoken = false

  constructor() {
    super({
      name: 'innkeeper marcus',
      description:
        'A big man in a stained apron who runs The Silver Stag Inn. He talks ' +
        'to every guest and watches only one: his daughter, across the room.',
    })
  }

  /** Also answers to his first name, which the `say truth to marcus` command uses. */
  override otherNames(): string[] {
    return ['marcus']
  }

  /**
   * Take the truth about the curse. After the cure, saying "truth" tells him
   * the silver mask was set on Elena on purpose: his reply and the remembered
   * line, recorded once. Before the cure he points at her, getting worse
   * or, after greater heal, with colour back but still cold; afterwards he
   * has heard it. Any other words get the usual reply.
   */
  override sayTo(gameState: GameState, words: string): string {
    if (words.trim().toLowerCase() !== 'truth') {
      return super.sayTo(gameState, words)
    }
    if (!gameState.getStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED)) {
      if (gameState.getStoryFlag(FLAG_ELENA_HEALED)) {
        return dialogue(
          this.name,
          'The truth? The only truth I care about is over there. ' +
            `${InnkeeperMarcus.COLOUR_LINE} And still she's cold to the touch.`,
        )
      }
      return dialogue(
        this.name,
        'The truth? The only truth I care about is over there, and ' +
          "she's getting worse.",
      )
    }
    if (gameState.getStoryFlag(FLAG_MARCUS_TOLD_TRUTH)) {
      return dialogue(
        this.name,
        'I heard you the first time, friend. ' +
          "I've not slept right since, but I'd rather know.",
      )
    }
    gameState.setStoryFlag(FLAG_MARCUS_TOLD_TRUTH, true)
    gameState.addVirtue(VIRTUE_TRUTH)
    return (
      `You tell ${characterName('Marcus')} about the silver mask on ` +
      `${characterName('Elena')}'s wrist: the curse was no ill wind. ` +
      'Someone set it on her on purpose.' +
      '\n' +
      dialogue(
        this.name,
        'On purpose. … Someone chose my girl. … Then this house sleeps ' +
          'with one eye open from now on. Thank you for telling me. ' +
          "I'd sooner know it than be comforted by a lie.",
      ) +
      '\n' +
      remembered('Truth')
    )
  }

  /**
   * Reward the cure with the Druidic Charm, or name what he still sells and,
   * once, plead for help or remark on Elena's colour. Every line he speaks
   * is a quote opening with his name and a colon, which the story view shows
   * as the speaker's label.
   */
  override talkTo(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED)) {
      if (!this.hasGivenCharm) {
        // First time speaking after Elena is cured - give the Druidic Charm
        this.hasGivenCharm = true
        const druidicCharm = new DruidicCharm()
        gameState.addItemToInventory(druidicCharm)

        const charm = `[item_name]${druidicCharm.name}[/item_name]`
        const direction =
          characterName('Marcus') + ' has to wipe his eyes before he can speak.'
        const words =
          `You gave me back my girl. … This ${charm} has hung over our ` +
          "door longer than there's been a Silver Stag. My grandmother said " +
          'it came out of the forest, and the forest would know it again. ' +
          'Take it. It kept this house. Let it keep you.'
        const tail =
          '[success]He presses the carved wood into your hands. ' +
          `You receive a ${charm}.[/success]`
        return direction + '\n\n' + dialogue(this.name, words) + '\n\n' + tail
      } else {
        const usual = dialogue(
          this.name,
          'My daughter is healthy and happy again. Hear her? Singing over ' +
            "the trays. Your room's free here as long as this house stands.",
        )
        if (gameState.getStoryFlag(FLAG_MARCUS_TOLD_TRUTH)) return usual
        return (
          usual +
          '\n\n' +
          dialogue(
            this.name,
            "An ill wind, that's all it was. Bad luck, blown in off the " +
              'road, settling on the one soul in this house who never harmed ' +
              'anyone.',
          )
        )
      }
    }

    // His prices, spoken in the same bubble as his opening line
    this.forgetSoldKey(gameState)
    const waresInfo = this.priceSentence()

    // Cycle through dialogue options
    const option = InnkeeperMarcus.IDLE_LINES[this.dialogueIndex]
    this.dialogueIndex =
      (this.dialogueIndex + 1) % InnkeeperMarcus.IDLE_LINES.length
    const name = this.name

    const opening = dialogue(
      name,
      waresInfo ? `${option} ${waresInfo}` : option,
    )

    if (gameState.getStoryFlag(FLAG_ELENA_HEALED)) {
      this.pleaSpoken = true
      if (this.healRemarkSpoken) return opening
      this.healRemarkSpoken = true
      return (
        opening +
        '\n\n' +
        dialogue(
          name,
          `${InnkeeperMarcus.COLOUR_LINE} … But she's still cold to the ` +
            "touch. Whatever you did, it isn't finished.",
        )
      )
    }

    if (gameState.getStoryFlag(FLAG_KNOWS_ELENA_CURSE)) {
      if (this.pleaSpoken) return opening
      this.pleaSpoken = true
      const plea = dialogue(
        name,
        "You've spoken with " +
          characterName('Elena') +
          ". Then you've seen. She says she's only tired. … If you can " +
          'help her, name it, and this house will find it.',
      )
      const weekTheKingWent =
        '\n\n' +
        dialogue(
          name,
          'It came on her the week the king went. The whole town was out in ' +
            'the streets asking after him, and I was upstairs with a cold cloth.',
        )
      return opening + '\n\n' + plea + weekTheKingWent
    } else {
      const closing = dialogue(
        name,
        "My girl, Elena. She's been poorly three weeks. … Talk to her, if " +
          "you've a kind word to spare. She'll tell it better than I can.",
      )
      return opening + '\n\n' + closing
    }
  }

  /**
   * Drop the room key from his wares once it is sold: held by the guest, or
   * used on the inn's door. A save made before the sale took the key off his
   * wares still has it there, and this tidies it on the next talk or buy.
   */
  private forgetSoldKey(gameState: GameState): void {
    if (this.keySold(gameState)) delete this.wares[ROOM_KEY]
  }

  /** Whether the room key is still among his wares but already sold. */
  private keySold(gameState: GameState): boolean {
    if (!(ROOM_KEY in this.wares)) return false
    const held = gameState.inventory.some(
      (item) => item instanceof RoomKey && item.canBeCarried,
    )
    const inn: Room | undefined = gameState.allRooms.SilverStagInn
    const doorOpened = inn !== undefined && 'east' in inn.exits
    return held || doorOpened
  }

  /**
   * His answer to a second room key: the key is still in hand, or the room
   * it opened is the guest's already.
   */
  private secondKeyRefusal(gameState: GameState): string {
    const held = gameState.inventory.some(
      (item) => item instanceof RoomKey && item.canBeCarried,
    )
    return dialogue(
      this.name,
      (held
        ? `You've a [item_name]${ROOM_KEY}[/item_name] already. `
        : 'The room upstairs is yours already. ') +
        "One room's plenty for one guest.",
    )
  }

  /**
   * Lists the wares now on offer, leaving out a room key already sold. It
   * only reads the state; the suggestions are rebuilt after every command.
   */
  override sells(gameState: GameState): string[] {
    return super
      .sells(gameState)
      .filter((ware) => !(ware === ROOM_KEY && this.keySold(gameState)))
  }

  /**
   * Take a sold key off his wares first. A sold room key leaves them, so a
   * second one is refused whether or not the first is still held.
   */
  protected override refusalBeforeSale(
    gameState: GameState,
    wareName: string,
  ): string | null {
    this.forgetSoldKey(gameState)
    if (wareName === ROOM_KEY && !(ROOM_KEY in this.wares)) {
      return this.secondKeyRefusal(gameState)
    }
    return null
  }

  /** He has rooms to let and nothing else. */
  protected override notSoldAnswer(_wareName: string): string {
    return dialogue(this.name, "I've rooms to let, and nothing else for sale.")
  }

  /** Hand the ware over as any seller does, then take it off his wares. */
  protected override handOver(
    gameState: GameState,
    wareName: string,
    ware: Ware,
  ): Item {
    const item = super.handOver(gameState, wareName, ware)
    delete this.wares[wareName]
    return item
  }

  /** The key changes hands, and he speaks of the room's last lodger. */
  protected override soldAnswer(
    _gameState: GameState,
    item: Item,
    price: number,
  ): string {
    const purchaseMsg =
      `[success]${this.yoursFor(item.name, price)} ` +
      characterName('Marcus') +
      ' hands you a brass key and nods at the [item_name]door[/item_name] ' +
      'behind the bar.[/success]'
    const lodger = dialogue(
      this.name,
      'That room upstairs? Its last lodger was a man in a grey cloak. ' +
        'Never gave a name, wrote half the night by candle, and was ' +
        'gone one morning without paying. It was the week the king ' +
        "went. I've aired it since. You'll find it clean.",
    )
    return purchaseMsg + '\n\n' + lodger
  }
}
