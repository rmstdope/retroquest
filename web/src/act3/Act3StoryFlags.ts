/**
 * Story flag constants for Act 3.
 *
 * Use these constants to avoid magic strings when checking Act III progression.
 */

// Sunken Ruins progression flags
export const FLAG_ACT3_TIDEWARD_SIGILS_STARTED = 'act3_tideward_sigils_started'
export const FLAG_ACT3_WARDING_PILLARS_PURIFIED =
  'act3_warding_pillars_purified'
export const FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED =
  'act3_tideward_sigils_completed'

export const FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT =
  'act3_lanterns_of_the_deeps_lit'
export const FLAG_ACT3_LANTERN_BRACKETS_FOUND = 'act3_lantern_brackets_found'
export const FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED =
  'act3_crystal_of_light_acquired'
export const FLAG_ACT3_VOW_OF_COURAGE_MADE = 'act3_vow_of_courage_made'
export const FLAG_ACT3_SEA_SEALED_LETTER_READ = 'act3_sea_sealed_letter_read'

// Main quest lifecycle flags
export const FLAG_ACT3_MAIN_STARTED = 'act3_main_started'
export const FLAG_ACT3_MAIN_COMPLETED = 'act3_main_completed'

// Mount Ember / Mirrors of Emberlight progression
export const FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_STARTED =
  'act3_mirrors_of_ember_light_started'
export const FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED =
  'act3_mirrors_of_ember_light_completed'

// Breath of the Mountain (vent calibration / heat ward)
export const FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED =
  'act3_breath_of_the_mountain_started'
export const FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED =
  'act3_breath_of_the_mountain_completed'

// Phoenix Feather acquisition (Mount Ember)
export const FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED =
  'act3_phoenix_feather_acquired'

// Caverns of Shadow / Miners' Rescue
export const FLAG_ACT3_MINERS_RESCUE_STARTED = 'act3_miners_rescue_started'
export const FLAG_ACT3_MINERS_RESCUE_COMPLETED = 'act3_miners_rescue_completed'
// Oath of Stillness (Echo Chambers / Dragon's Hall)
export const FLAG_ACT3_OATH_OF_STILLNESS_STARTED =
  'act3_oath_of_stillness_started'
export const FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED =
  'act3_oath_of_stillness_completed'

// Dragon's Memory (storytelling quest)
export const FLAG_ACT3_DRAGONS_MEMORY_RECEIVED = 'act3_dragons_memory_received'

// Dragon's Scale acquisition
export const FLAG_ACT3_DRAGONS_SCALE_ACQUIRED = 'act3_dragons_scale_acquired'

// Dragon's Oath (oath spoken to the dragon)
export const FLAG_ACT3_DRAGON_OATH_SPOKEN = 'act3_dragon_oath_spoken'

// Old Oath Scrolls examination
export const FLAG_ACT3_OATH_SCROLLS_EXAMINED = 'act3_oath_scrolls_examined'

// Warding Rite and Lifelight Elixir creation
export const FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED =
  'act3_lifelight_elixir_created'

// Fortress approach
export const FLAG_ACT3_FORTRESS_GATES_EXAMINED = 'act3_fortress_gates_examined'

// Echoes of the Hidden Bond storytelling quest
export const FLAG_ACT3_ECHOES_QUEST_STARTED = 'act3_echoes_quest_started'
export const FLAG_ACT3_CHARRED_INSCRIPTION_READ =
  'act3_charred_inscription_read'
export const FLAG_ACT3_ECHOES_QUEST_COMPLETED = 'act3_echoes_quest_completed'

// Mira's confession before the Warding Rite
export const FLAG_ACT3_MIRA_CONFESSED = 'act3_mira_confessed'

// Mira's coming-along scene at the fortress gate (played once, then a short line)
export const FLAG_ACT3_MIRA_GATE_TALKED = 'act3_mira_gate_talked'

// Dragon's dream voice (heard once, straight after the Dragon's memory)
export const FLAG_ACT3_DRAGON_VOICE_HEARD = 'act3_dragon_voice_heard'

// Optional virtue moments (recorded in the cross-act virtue record)
/** Virtue keys Act III records; each is optional and recorded once. */
export const VIRTUE_MERCY = 'mercy'
export const VIRTUE_TRUTH = 'truth'
export const VIRTUE_SELFLESS = 'selfless'
/** Set when the Pier Warden has asked his question about the bad season. */
export const FLAG_ACT3_WARDEN_ASKED = 'act3_warden_asked'
/** Set when the Pier Warden has said his "bad season" line (once). */
export const FLAG_ACT3_WARDEN_BAD_SEASON_SAID = 'act3_warden_bad_season_said'
/** Set when Mira has moved the party on from the Sunken Ruins. */
export const FLAG_ACT3_RUINS_LEFT = 'act3_ruins_left'
/** Set when the wandering phantoms were freed with the word "rest". */
export const FLAG_ACT3_PHANTOMS_FREED = 'act3_phantoms_freed'
/** Set when the dragon's cracked sigils have been mended. */
export const FLAG_ACT3_SIGILS_MENDED = 'act3_sigils_mended'
/** Set when Elior has told the Pier Warden the truth (Act III's own moment). */
// The Pier Warden has pressed the Weathered Coin back into Elior's hand
export const FLAG_ACT3_WARDEN_COIN_PRESSED_BACK =
  'act3_warden_coin_pressed_back'

export const FLAG_ACT3_WARDEN_TRUTH_TOLD = 'act3_warden_truth_told'
/** Set when the Phoenix has told who struck Malakar's name deeper (once). */
export const FLAG_ACT3_PHOENIX_STORY_TOLD = 'act3_phoenix_story_told'
/** Set when Malakar's struck name on the Charred Inscription has been mended. */
export const FLAG_ACT3_INSCRIPTION_MENDED = 'act3_inscription_mended'

// Mira's slips: she lets on, once per relic site, that she knew the Wardens
/** Set when Mira's Sunken Ruins slip about Lysa's hand has played. */
export const FLAG_ACT3_MIRA_RUINS_SLIP_PLAYED = 'act3_mira_ruins_slip_played'
/** Set when Mira's Mount Ember slip over the Phoenix Feather has played. */
export const FLAG_ACT3_MIRA_EMBER_SLIP_PLAYED = 'act3_mira_ember_slip_played'
/** Set when the Ancient Dragon has given its message for Mira. */
export const FLAG_ACT3_DRAGON_MESSAGE_GIVEN = 'act3_dragon_message_given'
/** Set when Mira has received the Ancient Dragon's message at the Cavern Mouth. */
export const FLAG_ACT3_DRAGON_MESSAGE_RELAYED = 'act3_dragon_message_relayed'
/** Set when Elior has answered Sir Cedric's gate line with the refrain. */
export const FLAG_ACT3_CEDRIC_GATE_ANSWERED = 'act3_cedric_gate_answered'
