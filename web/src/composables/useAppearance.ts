import { watchEffect } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { LANTERN_PALETTES, LANTERN_TEXT_SCALE } from '@/lantern/tokens'

/**
 * Mirror the player's appearance settings onto the document root, where
 * lantern.css reads them:
 * - `data-theme` = light | dark (absent = follow the device)
 * - `--lq-text-scale` = story text multiplier for Small / Medium / Large
 * - `data-reduce-motion` = on | off (absent = follow the device)
 *
 * The page's `theme-color` tags (browser and phone chrome; one per device
 * theme in index.html) take the background of a theme chosen in Settings,
 * and their own theme's again when it follows the device.
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

    for (const meta of document.querySelectorAll<HTMLMetaElement>(
      'meta[name="theme-color"]',
    )) {
      const own = meta.getAttribute('media')?.includes('light')
        ? 'light'
        : 'dark'
      const theme = settings.theme === 'device' ? own : settings.theme
      meta.setAttribute('content', LANTERN_PALETTES[theme].bg)
    }

    if (settings.reduceMotion === 'device') {
      root.removeAttribute('data-reduce-motion')
    } else {
      root.setAttribute('data-reduce-motion', settings.reduceMotion)
    }
  })
}
