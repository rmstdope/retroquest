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
/** Set when the merchant has told Elior the news of the ill king. */
export const FLAG_MERCHANT_NEWS_HEARD = 'merchant_news_heard'
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
/** Set when grandmother bakes Elior a fresh loaf for the road. */
export const FLAG_GRANDMOTHER_BAKED_BREAD = 'grandmother_baked_bread'
/** Set when Borin sharpens Elior's knife. */
export const FLAG_BLACKSMITH_SHARPENED_KNIFE = 'blacksmith_sharpened_knife'
/** Set when Tilda has asked Elior whether he cleaned the well. */
export const FLAG_TILDA_ASKED_ABOUT_WELL = 'tilda_asked_about_well'
/**
 * Choice: set when Elior trades the horseshoe, not his mother's wedding ring,
 * for the merchant's boots. Absent means the ring was traded (the golden path).
 */
export const FLAG_KEPT_MOTHERS_RING = 'kept_mothers_ring'
/**
 * Choice: set when Elior lets Patches stay with grandmother instead of
 * carrying her home to Hemlock (the golden path).
 */
export const FLAG_PATCHES_STAYED_WITH_GRANDMOTHER =
  'patches_stayed_with_grandmother'
/** Set when Hemlock, told that Patches stays with grandmother, gives Elior a rope. */
export const FLAG_HEMLOCK_HEARD_PATCHES_STAYED = 'hemlock_heard_patches_stayed'
/** Set when Tilda has said her "spring cleared itself" line (she says it once). */
export const FLAG_TILDA_SPRING_LINE_SAID = 'tilda_spring_line_said'
/** Set when the fox kit has been cut free of the poacher's snare. */
export const FLAG_FOX_KIT_FREED = 'fox_kit_freed'
/** Set when Mira has made her one-time remark about the freed fox kit. */
export const FLAG_MIRA_FOREST_REMARK_SAID = 'mira_forest_remark_said'

/**
 * Virtue moments Act I records in the cross-act virtue record. Each is
 * optional and is recorded once.
 */
export const VIRTUE_MERCY = 'mercy'
export const VIRTUE_TRUTH = 'truth'
export const VIRTUE_SELFLESS = 'selfless'
