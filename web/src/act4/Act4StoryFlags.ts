/**
 * Story flag constants for Act 4.
 *
 * Use these constants to avoid magic strings when checking Act IV progression.
 */

// Fortress infiltration phase flags
export const FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED =
  'act4_shattered_ward_guardians_started'
export const FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED =
  'act4_shattered_ward_guardians_completed'
export const FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED =
  'act4_guardians_essence_acquired'
export const FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED =
  'act4_guardians_chain_acquired'
export const FLAG_ACT4_BARRIERS_DISABLED = 'act4_barriers_disabled'

export const FLAG_ACT4_TRAPPED_SERVANTS_STARTED =
  'act4_trapped_servants_started'
export const FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED =
  'act4_trapped_servants_completed'
export const FLAG_ACT4_LOYALTY_TOKEN_ACQUIRED = 'act4_loyalty_token_acquired'
export const FLAG_ACT4_SERVANTS_PENDANT_ACQUIRED =
  'act4_servants_pendant_acquired'
export const FLAG_ACT4_SERVANTS_TRUST_EARNED = 'act4_servants_trust_earned'
export const FLAG_ACT4_SERVANTS_FREED = 'act4_servants_freed'

export const FLAG_ACT4_MAZE_OF_MIRRORS_STARTED = 'act4_maze_of_mirrors_started'
export const FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED =
  'act4_maze_of_mirrors_completed'
export const FLAG_ACT4_MIRROR_SHARD_ACQUIRED = 'act4_mirror_shard_acquired'
export const FLAG_ACT4_ANCIENT_IRON_KEY_ACQUIRED =
  'act4_ancient_iron_key_acquired'

// Lieutenant confrontation phase flags
export const FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED =
  'act4_knight_of_despair_started'
export const FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED =
  'act4_knight_of_despair_completed'
export const FLAG_ACT4_KNIGHTS_REDEMPTION_ACQUIRED =
  'act4_knights_redemption_acquired'
export const FLAG_ACT4_ENHANCED_ECHO_STONE_ACQUIRED =
  'act4_enhanced_echo_stone_acquired'
export const FLAG_ACT4_KNIGHT_SEEN_THROUGH = 'act4_knight_seen_through'
export const FLAG_ACT4_GUARDIANS_CHAIN_RAISED = 'act4_guardians_chain_raised'
export const FLAG_ACT4_WARRIORS_AT_PEACE = 'act4_warriors_at_peace'
export const FLAG_ACT4_LOYALTY_TOKEN_RAISED = 'act4_loyalty_token_raised'
export const FLAG_ACT4_BADGE_SHOWN = 'act4_badge_shown'
export const FLAG_ACT4_HEARTS_TRUTH_CAST = 'act4_hearts_truth_cast'

export const FLAG_ACT4_SORCERESS_OF_LIES_STARTED =
  'act4_sorceress_of_lies_started'
export const FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED =
  'act4_sorceress_of_lies_completed'
export const FLAG_ACT4_SORCERESS_TRUTH_ACQUIRED =
  'act4_sorceress_truth_acquired'
export const FLAG_ACT4_TIME_CRYSTAL_ACQUIRED = 'act4_time_crystal_acquired'

export const FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED =
  'act4_shadow_of_the_past_started'
export const FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED =
  'act4_shadow_of_the_past_completed'
/** The Echo Stone has mended the Memory Vault's orbs; the Shadow has a face. */
export const FLAG_ACT4_MEMORY_ORBS_MENDED = 'act4_memory_orbs_mended'
/** The Sorceress's mask has been shown to the Shadow. */
export const FLAG_ACT4_SHADOW_MASK_SHOWN = 'act4_shadow_mask_shown'
/** The Ancient Amulet has opened the sealed door to the Parents' Vault. */
export const FLAG_ACT4_VAULT_DOOR_OPENED = 'act4_vault_door_opened'
export const FLAG_ACT4_COMBINED_MIRROR_MEMORY_SHARD_ACQUIRED =
  'act4_combined_mirror_memory_shard_acquired'

// Inner sanctum phase flags
export const FLAG_ACT4_KING_ALDENS_RESCUE_STARTED =
  'act4_king_aldens_rescue_started'
export const FLAG_ACT4_KING_ALDENS_RESCUE_COMPLETED =
  'act4_king_aldens_rescue_completed'
export const FLAG_ACT4_ROYAL_SIGIL_ACQUIRED = 'act4_royal_sigil_acquired'
export const FLAG_ACT4_HEROS_MEMORIAL_ACQUIRED = 'act4_heros_memorial_acquired'
export const FLAG_ACT4_LIFELIGHT_ELIXIR_CONSUMED =
  'act4_lifelight_elixir_consumed'

export const FLAG_ACT4_PARENTS_LEGACY_STARTED = 'act4_parents_legacy_started'
export const FLAG_ACT4_PARENTS_LEGACY_COMPLETED =
  'act4_parents_legacy_completed'
export const FLAG_ACT4_THRONE_KEY_ACQUIRED = 'act4_throne_key_acquired'

// Final confrontation flags
/** Malakar has made his offer in the Throne Chamber. */
export const FLAG_ACT4_THRONE_OFFER_HEARD = 'act4_throne_offer_heard'
/** Elior has answered Malakar with the refrain. */
export const FLAG_ACT4_THRONE_REFRAIN_SAID = 'act4_throne_refrain_said'
/** The Ancient Amulet has opened in the Throne Chamber. */
export const FLAG_ACT4_THRONE_AMULET_OPENED = 'act4_throne_amulet_opened'
/** The Lifelight Elixir was given to Malakar. */
export const FLAG_ACT4_ELIXIR_ON_MALAKAR = 'act4_elixir_on_malakar'
/** The Lifelight Elixir broke the crystal prison and freed King Alden. */
export const FLAG_ACT4_ELIXIR_ON_KING = 'act4_elixir_on_king'
export const FLAG_ACT4_FINAL_STAND_STARTED = 'act4_final_stand_started'
export const FLAG_ACT4_FINAL_STAND_COMPLETED = 'act4_final_stand_completed'
export const FLAG_ACT4_CROWN_OF_ELDORIA_ACQUIRED =
  'act4_crown_of_eldoria_acquired'

// Main quest lifecycle flags
export const FLAG_ACT4_MAIN_STARTED = 'act4_main_started'
export const FLAG_ACT4_MAIN_COMPLETED = 'act4_main_completed'

// Ending choice flags
export const FLAG_ACT4_REDEMPTION_ENDING = 'act4_redemption_ending'
export const FLAG_ACT4_JUSTICE_ENDING = 'act4_justice_ending'
export const FLAG_ACT4_SACRIFICE_ENDING = 'act4_sacrifice_ending'
/** Elior has said "forgiveness" to the healed Malakar and learned the spell. */
export const FLAG_ACT4_FORGIVENESS_SAID = 'act4_forgiveness_said'
/** Elior has said "justice" to Malakar; the amulet is waiting. */
export const FLAG_ACT4_JUSTICE_SAID = 'act4_justice_said'
/** Elior has said "sacrifice" to Malakar; the amulet is waiting. */
export const FLAG_ACT4_SACRIFICE_SAID = 'act4_sacrifice_said'
export const FLAG_ACT4_CROWN_ENDING = 'act4_crown_ending'
export const FLAG_ACT4_HOME_ENDING = 'act4_home_ending'

// The True Self in the Mirror Labyrinth (optional)
export const FLAG_ACT4_TRUTH_TOLD = 'act4_truth_told'

/** The virtue moment recorded when Elior tells the True Self the truth. */
export const VIRTUE_TRUTH = 'truth'

/** The virtue moment recorded when Elior puts the Ghostly Warriors to rest. */
export const VIRTUE_MERCY = 'mercy'

/** The virtue moment recorded for help that gains nothing. */
export const VIRTUE_SELFLESS = 'selfless'
