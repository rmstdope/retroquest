/**
 * Story flag constants used throughout Act 1. Each flag marks an event,
 * interaction or milestone (discoveries, character talks, investigations,
 * magical progression and major story beats) that game logic tracks.
 */
export const FLAG_INVESTIGATED_WITHERED_CROPS = 'investigated_withered_crops'
export const FLAG_WITNESSED_SHADOW_EVENT = 'witnessed_shadow_event'
export const FLAG_ACCEPTED_MIRA_APPRENTICESHIP = 'accepted_mira_apprenticeship'
export const FLAG_LEARNED_FIRST_SPELL = 'learned_first_spell'
export const FLAG_MAGIC_FULLY_UNLOCKED = 'magic_fully_unlocked'
export const FLAG_JOURNEY_BLESS_COMPLETED = 'journey_bless_completed'
export const FLAG_PRIEST_TALKED_TO = 'priest_talked_to'
export const FLAG_PRIEST_BLESSED = 'priest_blessed'
export const FLAG_TALKED_TO_FISHERMAN = 'talked_to_fisherman'
export const FLAG_DEER_CAN_BE_OBSERVED = 'deer_can_be_observed'
export const FLAG_BLACKSMITH_MET = 'blacksmith_met'
export const FLAG_RUSTY_HOE_FIRST_COIN_FOUND = 'rusty_hoe_first_coin_found'
/**
 * Set only by saves made when the hoe still gave a second coin. Such saves
 * keep the General Store open and get no coin for returning Patches.
 */
export const FLAG_RUSTY_HOE_SECOND_COIN_FOUND = 'rusty_hoe_second_coin_found'
export const FLAG_FOUND_PHOTO = 'found_photo'
export const FLAG_READ_PHOTO_MESSAGE = 'read_photo_message'
export const FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO =
  'talked_to_grandmother_about_photo'
export const FLAG_VILLAGER_TALKED_TO = 'villager_talked_to'
export const FLAG_WELL_EXAMINED = 'well_examined'
export const FLAG_CONNECT_WITH_NATURE = 'connect_with_nature'
export const FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED =
  'shadows_over_willowbrook_completed'
export const FLAG_FISHERMAN_TOLD_OF_TIN = 'fisherman_told_of_tin'
export const FLAG_FOUND_MOTHERS_LETTER = 'found_mothers_letter'
export const FLAG_READ_MOTHERS_LETTER = 'read_mothers_letter'
export const FLAG_HEALED_FISHERMAN_ARM = 'healed_fisherman_arm'
export const FLAG_MET_HEMLOCK = 'met_hemlock'
export const FLAG_PATCHES_FOUND = 'patches_found'
export const FLAG_PATCHES_RETURNED = 'patches_returned'
/** Set when the rune token comes up out of the purified well with the ring. */
export const FLAG_FOUND_RUNE_TOKEN = 'found_rune_token'
/** Set when Mira names the rune token a fouling sigil. */
export const FLAG_MIRA_NAMED_FOULING_SIGIL = 'mira_named_fouling_sigil'
/** Set when the Vegetable Field is watered with purified well water. */
export const FLAG_VEGETABLE_FIELD_WATERED = 'vegetable_field_watered'
