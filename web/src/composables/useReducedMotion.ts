import { computed, type ComputedRef } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useMediaQuery } from './useMediaQuery'

/**
 * Whether the player wants less motion: the Reduce motion setting when it is
 * on or off, the device's own preference when it follows the device. Follows
 * changes of either as they happen.
 */
export function useReducedMotion(): ComputedRef<boolean> {
  const settings = useSettingsStore()
  const device = useMediaQuery('(prefers-reduced-motion: reduce)')
  return computed(() =>
    settings.reduceMotion === 'device'
      ? device.value
      : settings.reduceMotion === 'on',
  )
}
