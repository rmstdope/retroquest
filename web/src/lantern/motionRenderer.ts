/**
 * The game's motion renderer, the module Content Studio loads to play an
 * image's movement exactly as the game does. It names what the renderer can
 * do (`EFFECT_TYPES`: each effect type, whether it lives on a drawn spot, and
 * the settings it takes with their range and default) and hands out the
 * scene that draws it (`createMotionScene`). The studio saves an image's
 * effects with their settings into the images manifest, and the game reads
 * them back from there (`roomMotion.ts`); a setting left out plays at its
 * default, which is how every room moved before the settings existed.
 */
import { createMotionScene } from './roomMotionScene'

export { createMotionScene }
export {
  EFFECT_TYPES,
  effectType,
  settingValue,
  type EffectSetting,
  type EffectType,
} from './motionEffects'
