/**
 * The descriptions of the Throne Chamber in each state of the climax. Kept
 * apart from the room, Malakar and the prison so none of them imports another
 * just for a line of text.
 */
import { ARCH_SENTENCE } from '../endings'

/** The chamber until the amulet opens. */
export const THRONE_CHAMBER_FIRST =
  'A vast chamber under a broken dome. A throne of black stone, twisted ' +
  'like a root, stands at its head. Above a ritual circle King Alden hangs ' +
  'in a prison of crystal, and from his crown a thin thread of light bleeds into ' +
  'a rift in the air: the wound in time. Malakar stands beside it, grey and ' +
  'failing. The wound is killing him too.'

/** The whole description once the amulet is open, before the choice. */
export const THRONE_CHAMBER_AMULET =
  'The light of the ward fills the chamber from the open amulet. King ' +
  'Alden hangs in his crystal prison, the wound bleeds in the air beside ' +
  'him, and Malakar waits on his knees between them. The Lifelight Elixir ' +
  'is warm in your hand.'

/** The whole description once Malakar has drunk the elixir. */
export const THRONE_CHAMBER_HEALED =
  'Malakar sits by the wound, the grey gone from his face, watching it ' +
  'with the eyes of the young man at the workbench. The wound still ' +
  'flickers in the air. King Alden hangs in his prison, waiting.'

/** The whole description once the prison is broken. */
export const THRONE_CHAMBER_SHATTERED =
  'The crystal lies in shards around the ritual circle. King Alden sits ' +
  'among them, weak but alive. The wound still stands open, and Malakar ' +
  'stands beside it, greyer than before.'

/** The whole description after the Redemption ending. */
export const THRONE_CHAMBER_REDEMPTION =
  'The dome is quiet. Where the wound was there is only air. King Alden ' +
  'sits among the shards of his prison, alive, and Malakar sits beside ' +
  `him, himself again. ${ARCH_SENTENCE}`

/** The whole description after the Justice ending. */
export const THRONE_CHAMBER_JUSTICE =
  'The dome is quiet. Where the wound was, a seal of gold and pale light ' +
  'hangs in the air, and Malakar is somewhere inside it. King Alden stands ' +
  `at the throne, alive, his crown bright again. ${ARCH_SENTENCE}`

/** The whole description after the Sacrifice ending. */
export const THRONE_CHAMBER_SACRIFICE =
  'The dome is quiet. Where the wound was there is only air. King Alden ' +
  'stands at the throne, alive, and Malakar kneels before him, grey and ' +
  `powerless, waiting to be judged. ${ARCH_SENTENCE}`
