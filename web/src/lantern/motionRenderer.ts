/**
 * The game's motion renderer, the module Content Studio loads (named in
 * `content-studio.json` as `images.motion`) to play an image's movement
 * exactly as the game does. It names what the renderer can do
 * (`EFFECT_TYPES`: each effect type, whether it lives on a drawn spot, and the
 * settings it takes with their range and default) and hands out the scene
 * that draws it (`createMotionScene`). The studio saves an image's effects
 * into the images manifest, and the game reads them back from there
 * (`roomMotion.ts`); a setting left out plays at its default.
 *
 * The scene handed out here takes the effects in the shape the studio exports
 * them (`{ kind, settings?, spot?, mark? }`) and turns them into what the game's
 * scene plays through the same code the game uses for the manifest
 * (`madeEffect`, `effectSpecs`), so a drawn spot is placed in the studio as it
 * is in the game. A spot kind handed no `spot` at all plays over the whole
 * picture, for a studio that clips it to the shape itself; the game never
 * plays one so. One handed a `spot` with no usable shape plays nothing, as in
 * the game.
 * Patch ties are the studio's to apply: it hands over only what plays.
 */
import { effectSpecs, madeEffect, type MotionSpec } from './roomMotion'
import {
  createMotionScene as createGameScene,
  type MotionScene,
} from './roomMotionScene'

export {
  EFFECT_TYPES,
  effectType,
  settingValue,
  type EffectSetting,
  type EffectType,
} from './motionEffects'

/** A scene as the studio drives it: like the game's, but given the effects as the studio exports them. */
export interface StudioMotionScene extends Omit<MotionScene, 'setEffects'> {
  /** What plays now, as the studio exports it; with `instant`, a new layer is run ahead and starts at full strength. */
  setEffects(effects: readonly unknown[], instant: boolean): void
}

/**
 * What the game's scene plays for one effect the studio hands over: nothing
 * for a broken one or a kind the renderer lacks, and, as in the game, nothing
 * for a spot handed only shapes that are not shapes.
 */
function studioSpecs(value: unknown): MotionSpec[] {
  const effect = madeEffect(value)
  if (!effect) return []
  const handedSpot =
    typeof value === 'object' && value !== null && 'spot' in value
  if (effect.spot || handedSpot) return effectSpecs(effect)
  return [
    effect.settings
      ? { kind: effect.kind, settings: effect.settings }
      : { kind: effect.kind },
  ]
}

/** A scene of the game's renderer, driven by the effects as the studio exports them. */
export function createMotionScene(): StudioMotionScene {
  const scene = createGameScene()
  return {
    setSource: (source) => scene.setSource(source),
    resize: (width, height, picture) => scene.resize(width, height, picture),
    setEffects: (effects, instant) =>
      scene.setEffects(effects.flatMap(studioSpecs), instant),
    step: (ms) => scene.step(ms),
    draw: (ctx) => scene.draw(ctx),
    isEmpty: () => scene.isEmpty(),
    count: (kind) => scene.count(kind),
  }
}
