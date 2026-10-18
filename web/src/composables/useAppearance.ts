import { watchEffect } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { LANTERN_TEXT_SCALE } from '@/lantern/tokens'

/**
 * Mirror the player's appearance settings onto the document root, where
 * lantern.css reads them:
 * - `data-theme` = light | dark (absent = follow the device)
 * - `--lq-text-scale` = story text multiplier for Small / Medium / Large
 * - `data-reduce-motion` = on | off (absent = follow the device)
 *
 * Call from a component's setup (or an effect scope); it stops with it.
 */
export function useAppearance(root: HTMLElement = document.documentElement) {
  const settings = useSettingsStore()

  watchEffect(() => {
    if (settings.theme === 'device') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', settings.theme)
    }

    root.style.setProperty(
      '--lq-text-scale',
      String(LANTERN_TEXT_SCALE[settings.textSize]),
    )

    if (settings.reduceMotion === 'device') {
      root.removeAttribute('data-reduce-motion')
    } else {
      root.setAttribute('data-reduce-motion', settings.reduceMotion)
    }
  })
}
