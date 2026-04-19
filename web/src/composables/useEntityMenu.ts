/** Composable for entity context menu / action sheet interactions. */
import { ref } from 'vue'
import type { NamedItem } from '@/types/bridge'

export type EntityType = 'character' | 'item' | 'inventory' | 'spell'

export interface EntityMenuAction {
  label: string
  command: string
  needsItem?: boolean
  needsSpell?: boolean
}

export interface ViewportSize {
  viewportWidth: number
  viewportHeight: number
}

const MENU_WIDTH = 200
const MENU_HEIGHT = 250

/**
 * Strip markup tags like [gold]...[/gold] from a string.
 */
function stripMarkup(text: string): string {
  return text.replace(/\[.*?\]/g, '').trim()
}

/**
 * Strip markup tags and leading count prefix (e.g. "3 Arrows").
 */
function cleanInventoryName(text: string): string {
  return stripMarkup(text).replace(/^\d+\s+/, '')
}

function actionsForCharacter(name: string): EntityMenuAction[] {
  return [
    { label: '💬 Talk to', command: `talk to ${name}` },
    { label: '👀 Look at', command: `look ${name}` },
    {
      label: '🎁 Give item...',
      command: 'give',
      needsItem: true,
    },
    {
      label: '✨ Cast spell...',
      command: 'cast',
      needsSpell: true,
    },
  ]
}

function actionsForItem(name: string): EntityMenuAction[] {
  return [
    { label: '✋ Take', command: `take ${name}` },
    { label: '👀 Look at', command: `look ${name}` },
    { label: '🔧 Use', command: `use ${name}` },
  ]
}

function actionsForInventory(name: string): EntityMenuAction[] {
  return [
    { label: '👀 Look at', command: `look ${name}` },
    { label: '🔧 Use', command: `use ${name}` },
    { label: '🗑️ Drop', command: `drop ${name}` },
  ]
}

function actionsForSpell(name: string): EntityMenuAction[] {
  return [
    { label: '✨ Cast', command: `cast ${name}` },
    { label: '👀 Look at', command: `look ${name}` },
  ]
}

/**
 * Composable that manages entity context menu state and actions.
 *
 * @param submitCommand - Callback invoked when a simple action is
 *   selected (receives the command string).
 */
export function useEntityMenu(submitCommand: (cmd: string) => void) {
  const visible = ref(false)
  const target = ref('')
  const actions = ref<EntityMenuAction[]>([])
  const x = ref(0)
  const y = ref(0)
  const isMobile = ref(false)

  /**
   * Open menu for a given entity type and name.
   */
  function openMenu(
    type: EntityType,
    rawName: string,
    event: MouseEvent,
    viewport?: ViewportSize,
  ): void {
    let name: string
    let menuActions: EntityMenuAction[]

    switch (type) {
      case 'character':
        name = rawName
        menuActions = actionsForCharacter(name)
        break
      case 'item':
        name = rawName
        menuActions = actionsForItem(name)
        break
      case 'inventory':
        name = cleanInventoryName(rawName)
        menuActions = actionsForInventory(name)
        break
      case 'spell':
        name = stripMarkup(rawName)
        menuActions = actionsForSpell(name)
        break
    }

    target.value = name
    actions.value = menuActions
    visible.value = true

    const vw =
      viewport?.viewportWidth ??
      (typeof window !== 'undefined' ? window.innerWidth : 1024)
    const vh =
      viewport?.viewportHeight ??
      (typeof window !== 'undefined' ? window.innerHeight : 768)
    x.value = Math.min(event.clientX, vw - MENU_WIDTH)
    y.value = Math.min(event.clientY, vh - MENU_HEIGHT)
  }

  /** Close the menu. */
  function closeMenu(): void {
    visible.value = false
  }

  /**
   * Handle action selection. Simple commands are submitted
   * directly. Actions with needsItem / needsSpell show a
   * sub-menu instead.
   *
   * @returns 'no-items' | 'no-spells' if the sub-menu cannot
   *   be shown, undefined otherwise.
   */
  function selectAction(
    action: EntityMenuAction,
    inventory: NamedItem[] = [],
    spells: NamedItem[] = [],
  ): 'no-items' | 'no-spells' | undefined {
    const savedTarget = target.value

    if (action.needsItem) {
      closeMenu()
      if (inventory.length === 0) return 'no-items'
      const subActions = inventory.map((item) => {
        const clean = cleanInventoryName(item.name)
        return {
          label: `🎁 ${clean}`,
          command: `give ${clean} to ${savedTarget}`,
        }
      })
      target.value = `Give to ${savedTarget}`
      actions.value = subActions
      visible.value = true
      return undefined
    }

    if (action.needsSpell) {
      closeMenu()
      if (spells.length === 0) return 'no-spells'
      const subActions = spells.map((spell) => {
        const clean = stripMarkup(spell.name)
        return {
          label: `✨ ${clean}`,
          command: `cast ${clean} on ${savedTarget}`,
        }
      })
      target.value = `Cast on ${savedTarget}`
      actions.value = subActions
      visible.value = true
      return undefined
    }

    closeMenu()
    submitCommand(action.command)
    return undefined
  }

  return {
    visible,
    target,
    actions,
    x,
    y,
    isMobile,
    openMenu,
    closeMenu,
    selectAction,
  }
}
