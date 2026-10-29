/**
 * The Hall of Echoes' descriptions after the knight is redeemed. Kept apart
 * from the room, the knight and the spell so none of them imports another.
 */
import { characterName } from '@/engine'

/** The Hall of Echoes while the knight still stands at the stair. */
export const HALL_BEFORE_REDEMPTION =
  'A long hall, so high the ceiling is lost. Everything that was ever said ' +
  'here is still being said, very quietly: orders, jokes, names, someone ' +
  'counting. Tattered banners hang high along the walls, grimed past ' +
  'reading. At the far end, before the stair, a knight in tarnished armour ' +
  'stands without moving, the way a man stands at a grave.'

/** The Hall of Echoes once the knight kneels by the stair (no warriors left). */
export const HALL_AFTER_REDEMPTION =
  'A long hall, so high the ceiling is lost. The echoes have softened to a ' +
  'murmur. By the stair to the east the knight kneels with his helm beside ' +
  'him, his grey cloak folded on the stone.'

/** Added to the hall while Sir Cedric has not forgiven the knight. */
export const HALL_CEDRIC_AT_DOOR =
  ` ${characterName('Sir Cedric')} stands by the south door, the way out at ` +
  'his back, his eyes on the knight.'

/** Sir Cedric on the stair beside the knight, once he has forgiven him. */
export const CEDRIC_ON_STAIR =
  `${characterName('Sir Cedric')} sits on the stair beside the knight. ` +
  'Neither of them is saying much.'

/** Added to the hall once Sir Cedric has forgiven the knight. */
export const HALL_CEDRIC_ON_STAIR = ` ${CEDRIC_ON_STAIR}`

/** The sentence about the warriors, added to the hall while they remain. */
export const HALL_WARRIORS_SENTENCE =
  ' Among the tattered banners, ghostly warriors still fight a battle that ' +
  'ended long ago.'
