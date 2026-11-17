/**
 * What the motion renderer can do: each effect type, whether it lives on a
 * drawn spot, and the settings it takes with their range and default. Kept
 * apart from the scene that draws them so both the scene and the manifest
 * reader can use it; `motionRenderer.ts` is the module the studio loads.
 */

/** One setting an effect type takes: a slider in the studio. */
export interface EffectSetting {
  /** The key of the setting in the manifest. */
  id: string
  /** What the studio calls the slider. */
  title: string
  min: number
  max: number
  step: number
  /** The value the game plays when the manifest has none. */
  default: number
}

/** One kind of movement the renderer can draw. */
export interface EffectType {
  /** The key of the type in the manifest. */
  type: string
  /** What the studio calls it. */
  title: string
  /** Whether it lives on a spot drawn on the picture (water, fire, smoke) rather than floating over the whole picture. */
  spot: boolean
  /** The settings it takes. */
  settings: EffectSetting[]
}

/** The amount of an effect: 1 is the density the game always had. */
const AMOUNT: EffectSetting = {
  id: 'amount',
  title: 'Amount',
  min: 0,
  max: 3,
  step: 0.05,
  default: 1,
}
/** The speed of an effect: 1 is the pace the game always had. */
const SPEED: EffectSetting = {
  id: 'speed',
  title: 'Speed',
  min: 0,
  max: 3,
  step: 0.05,
  default: 1,
}
/** How strongly a fire glows. */
const GLOW: EffectSetting = {
  id: 'glow',
  title: 'Glow',
  min: 0,
  max: 2,
  step: 0.05,
  default: 1,
}

/** Every effect type the renderer has, with the settings each takes. */
export const EFFECT_TYPES: readonly EffectType[] = [
  { type: 'dust', title: 'Dust', spot: false, settings: [AMOUNT, SPEED] },
  { type: 'leaves', title: 'Leaves', spot: false, settings: [AMOUNT, SPEED] },
  { type: 'embers', title: 'Embers', spot: false, settings: [AMOUNT, SPEED] },
  {
    type: 'fireflies',
    title: 'Fireflies',
    spot: false,
    settings: [AMOUNT, SPEED],
  },
  { type: 'mist', title: 'Mist', spot: false, settings: [AMOUNT, SPEED] },
  {
    type: 'water',
    title: 'Running water',
    spot: true,
    settings: [AMOUNT, SPEED],
  },
  { type: 'fire', title: 'Fire', spot: true, settings: [AMOUNT, SPEED, GLOW] },
  { type: 'smoke', title: 'Smoke', spot: true, settings: [AMOUNT, SPEED] },
]

/** The effect type `type`, or undefined when the renderer has none of that name. */
export function effectType(type: string): EffectType | undefined {
  return EFFECT_TYPES.find((t) => t.type === type)
}

/**
 * The value of setting `id` of effect `type` given the settings the manifest
 * carries: its default when missing or not a number, else clamped to the
 * setting's range; 1 for a setting the type does not take.
 */
export function settingValue(
  type: string,
  settings: Readonly<Record<string, number>> | undefined,
  id: string,
): number {
  const setting = effectType(type)?.settings.find((s) => s.id === id)
  if (!setting) return 1
  const value = settings?.[id]
  if (typeof value !== 'number' || !Number.isFinite(value))
    return setting.default
  return Math.min(setting.max, Math.max(setting.min, value))
}
