import {
  Seller,
  type GameState,
  type Item,
  type Room,
  type Ware,
  characterName,
  dialogue,
  speech,
} from '@/engine'
import { ForestSurvivalKit } from '../items/ForestSurvivalKit'
import { EnhancedLantern } from '../items/EnhancedLantern'
import { QualityRope } from '../items/QualityRope'
import { MerchantsFlyer } from '../items/MerchantsFlyer'

/** A room that can lay out display wares, like the Market District. */
function hasAddWares(room: Room): room is Room & { addWares: () => void } {
  return 'addWares' in room && typeof room.addWares === 'function'
}

/** Merchant selling adventure gear and expedition supplies. */
export class MasterMerchantAldric extends Seller {
  /** His stock, never running out: he refuses only a second of one carried. */
  override wares: Record<string, Ware> = {
    'forest survival kit': { item: new ForestSurvivalKit(), price: 50 },
    'enhanced lantern': { item: new EnhancedLantern(), price: 40 },
    'quality rope': { item: new QualityRope(), price: 20 },
  }
  /** The talk lines he cycles through; static, so old saves get the current wording. */
  private static readonly IDLE_LINES: readonly string[] = [
    "Welcome to Aldric's. Rope that holds, lanterns that stay lit, and " +
      'nothing that comes apart on the road.',
    "Planning an expedition? Tell me where, and I'll tell you what you'll " +
      "wish you'd brought.",
    "I've heard tales of strange happenings in the forest. The carters who " +
      'still go in buy two things from me: a lantern and a good rope.',
    'Bread costs near twice what it did in spring. The farms west of the city ' +
      'send half the grain they used to, and what does come is grey at the ' +
      'husk. Not my trade, mind, but my suppliers talk of little else.',
  ]
  dialogueIndex = 0
  /** His answer before the flyer; static, so old saves get the current wording. */
  private static readonly CLOSED_DIALOGUE: string =
    characterName('Master Merchant Aldric') +
    ' looks at your boots, then at your face. ' +
    speech(
      'I deal only with established customers. A new face brings me an ' +
        'introduction. Even one of my own handbills will do.',
    )
  gaveFlyer = false

  constructor() {
    super({
      name: 'master merchant aldric',
      description:
        'A broad man in a good coat, standing among coils of rope and racks ' +
        'of lanterns. He looks at your boots before he looks at your face.',
    })
  }

  /** Turn away newcomers, or present the wares once the flyer was shown. */
  override talkTo(_gameState: GameState): string {
    // If merchant hasn't been given the flyer, shop is not fully open yet
    if (!this.gaveFlyer) {
      return MasterMerchantAldric.CLOSED_DIALOGUE
    }

    // His prices, spoken in the same bubble as his opening line
    const waresInfo =
      this.priceSentence() || 'My racks are bare till the next cart comes in.'

    // Cycle through dialogue options like Act 1 Shopkeeper
    const line = MasterMerchantAldric.IDLE_LINES[this.dialogueIndex]
    this.dialogueIndex =
      (this.dialogueIndex + 1) % MasterMerchantAldric.IDLE_LINES.length

    return dialogue('Master Merchant Aldric', `${line} ${waresInfo}`)
  }

  /** Handle giving items to Master Merchant Aldric. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof MerchantsFlyer) {
      // Remove the flyer from inventory
      const index = gameState.inventory.indexOf(item)
      if (index >= 0) gameState.inventory.splice(index, 1)
      this.gaveFlyer = true
      if (hasAddWares(gameState.currentRoom)) gameState.currentRoom.addWares()
      return (
        '[success]' +
        characterName('Master Merchant Aldric') +
        ' turns the flyer over and finds his own name on it. ' +
        speech(
          'One of mine. Then someone thought you worth sending. ' +
            'Have a look.',
        ) +
        '[/success]'
      )
    }

    // Non-flyer items are politely declined
    return (
      characterName('Master Merchant Aldric') +
      ` turns the [item_name]${item.name}[/item_name] over and hands it back. ` +
      speech(
        "I sell gear, friend; I don't take it in. " +
          "Bring coin, and we'll talk.",
      )
    )
  }

  /** Lists the wares now on offer; none until the flyer has been given. */
  override sells(gameState: GameState): string[] {
    return this.gaveFlyer ? super.sells(gameState) : []
  }

  /** Nothing is discussed, let alone sold, before the flyer. */
  protected override refusalBeforeSale(
    _gameState: GameState,
    _wareName: string,
  ): string | null {
    return this.gaveFlyer ? null : MasterMerchantAldric.CLOSED_DIALOGUE
  }

  /** He names what was asked for and points at what is laid out. */
  protected override notSoldAnswer(wareName: string): string {
    return dialogue(
      this.name,
      `I don't stock any [item_name]${wareName}[/item_name]. ` +
        'What I sell is laid out here.',
    )
  }

  /**
   * He sells no second of a ware Elior carries; the one on display in the
   * room does not count.
   */
  protected override refusalAfterPayment(
    gameState: GameState,
    wareName: string,
  ): string | null {
    const carried = gameState.inventory.some(
      (item) => item.name.toLowerCase() === wareName && item.canBeCarried,
    )
    if (!carried) return null
    return dialogue(
      this.name,
      `You've a [item_name]${wareName}[/item_name] already. ` +
        "I'd sooner sell you something you'll use.",
    )
  }
}
