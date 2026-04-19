import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEntityMenu } from './useEntityMenu'

describe('useEntityMenu', () => {
  let menu: ReturnType<typeof useEntityMenu>
  const mockSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    menu = useEntityMenu(mockSubmit)
  })

  describe('initial state', () => {
    it('starts with menu closed', () => {
      expect(menu.visible.value).toBe(false)
    })

    it('starts with no target', () => {
      expect(menu.target.value).toBe('')
    })

    it('starts with empty actions', () => {
      expect(menu.actions.value).toEqual([])
    })

    it('starts with zero position', () => {
      expect(menu.x.value).toBe(0)
      expect(menu.y.value).toBe(0)
    })

    it('starts in desktop mode', () => {
      expect(menu.isMobile.value).toBe(false)
    })
  })

  describe('openMenu — character', () => {
    const event = { clientX: 150, clientY: 200 } as MouseEvent

    beforeEach(() => {
      menu.openMenu('character', 'Mira', event)
    })

    it('opens the menu', () => {
      expect(menu.visible.value).toBe(true)
    })

    it('sets the target name', () => {
      expect(menu.target.value).toBe('Mira')
    })

    it('positions from mouse event', () => {
      expect(menu.x.value).toBe(150)
      expect(menu.y.value).toBe(200)
    })

    it('provides character actions', () => {
      const labels = menu.actions.value.map((a) => a.label)
      expect(labels).toContain('💬 Talk to')
      expect(labels).toContain('👀 Look at')
      expect(labels).toContain('🎁 Give item...')
      expect(labels).toContain('✨ Cast spell...')
    })

    it('sets talk command with name', () => {
      const talk = menu.actions.value.find((a) => a.label.includes('Talk'))
      expect(talk?.command).toBe('talk to Mira')
    })
  })

  describe('openMenu — item', () => {
    const event = { clientX: 100, clientY: 100 } as MouseEvent

    it('provides item actions', () => {
      menu.openMenu('item', 'Key', event)
      const labels = menu.actions.value.map((a) => a.label)
      expect(labels).toContain('✋ Take')
      expect(labels).toContain('👀 Look at')
      expect(labels).toContain('🔧 Use')
    })

    it('sets take command with name', () => {
      menu.openMenu('item', 'Key', event)
      const take = menu.actions.value.find((a) => a.label.includes('Take'))
      expect(take?.command).toBe('take Key')
    })
  })

  describe('openMenu — inventory', () => {
    const event = { clientX: 100, clientY: 100 } as MouseEvent

    it('strips markup tags from name', () => {
      menu.openMenu('inventory', '[gold]Sword[/gold]', event)
      expect(menu.target.value).toBe('Sword')
    })

    it('strips count prefix from name', () => {
      menu.openMenu('inventory', '3 Arrows', event)
      expect(menu.target.value).toBe('Arrows')
    })

    it('strips HTML tags from name', () => {
      menu.openMenu('inventory', '<span class="theme-item_name">egg</span>', event)
      expect(menu.target.value).toBe('egg')
    })

    it('generates clean look-at command when name contains HTML tags', () => {
      menu.openMenu('inventory', '<span class="theme-item_name">egg</span>', event)
      const look = menu.actions.value.find((a) => a.label.includes('Look at'))
      expect(look?.command).toBe('look egg')
    })

    it('provides inventory actions', () => {
      menu.openMenu('inventory', 'Potion', event)
      const labels = menu.actions.value.map((a) => a.label)
      expect(labels).toContain('👀 Look at')
      expect(labels).toContain('🔧 Use')
      expect(labels).toContain('🗑️ Drop')
    })
  })

  describe('openMenu — spell', () => {
    const event = { clientX: 100, clientY: 100 } as MouseEvent

    it('strips markup tags from name', () => {
      menu.openMenu('spell', '[magic]Fireball[/magic]', event)
      expect(menu.target.value).toBe('Fireball')
    })

    it('provides spell actions', () => {
      menu.openMenu('spell', 'Heal', event)
      const labels = menu.actions.value.map((a) => a.label)
      expect(labels).toContain('✨ Cast')
      expect(labels).toContain('👀 Look at')
    })
  })

  describe('closeMenu', () => {
    it('hides the menu', () => {
      const event = { clientX: 100, clientY: 100 } as MouseEvent
      menu.openMenu('item', 'Key', event)
      menu.closeMenu()
      expect(menu.visible.value).toBe(false)
    })
  })

  describe('selectAction — simple command', () => {
    it('submits the command and closes menu', () => {
      const event = { clientX: 100, clientY: 100 } as MouseEvent
      menu.openMenu('item', 'Key', event)
      menu.selectAction({
        label: '✋ Take',
        command: 'take Key',
      })
      expect(mockSubmit).toHaveBeenCalledWith('take Key')
      expect(menu.visible.value).toBe(false)
    })
  })

  describe('selectAction — give item (needsItem)', () => {
    const event = { clientX: 100, clientY: 100 } as MouseEvent

    it('shows sub-menu of inventory items', () => {
      menu.openMenu('character', 'Mira', event)
      const inventory = [
        { name: 'Sword', description: '' },
        { name: 'Shield', description: '' },
      ]
      menu.selectAction(
        { label: '🎁 Give item...', command: 'give', needsItem: true },
        inventory,
        [],
      )
      expect(menu.visible.value).toBe(true)
      expect(menu.actions.value).toHaveLength(2)
      expect(menu.actions.value[0].command).toBe('give Sword to Mira')
      expect(menu.actions.value[1].command).toBe('give Shield to Mira')
    })

    it('shows failure message when inventory is empty', () => {
      menu.openMenu('character', 'Mira', event)
      const result = menu.selectAction(
        { label: '🎁 Give item...', command: 'give', needsItem: true },
        [],
        [],
      )
      expect(result).toBe('no-items')
      expect(menu.visible.value).toBe(false)
    })

    it('strips markup from inventory item names', () => {
      menu.openMenu('character', 'Mira', event)
      const inventory = [{ name: '[gold]2 Swords[/gold]', description: '' }]
      menu.selectAction(
        { label: '🎁 Give item...', command: 'give', needsItem: true },
        inventory,
        [],
      )
      expect(menu.actions.value[0].command).toBe('give Swords to Mira')
    })
  })

  describe('selectAction — cast spell (needsSpell)', () => {
    const event = { clientX: 100, clientY: 100 } as MouseEvent

    it('shows sub-menu of spells', () => {
      menu.openMenu('character', 'Mira', event)
      const spells = [
        { name: 'Heal', description: '' },
        { name: 'Fire', description: '' },
      ]
      menu.selectAction(
        {
          label: '✨ Cast spell...',
          command: 'cast',
          needsSpell: true,
        },
        [],
        spells,
      )
      expect(menu.visible.value).toBe(true)
      expect(menu.actions.value[0].command).toBe('cast Heal on Mira')
    })

    it('shows failure message when no spells known', () => {
      menu.openMenu('character', 'Mira', event)
      const result = menu.selectAction(
        {
          label: '✨ Cast spell...',
          command: 'cast',
          needsSpell: true,
        },
        [],
        [],
      )
      expect(result).toBe('no-spells')
      expect(menu.visible.value).toBe(false)
    })

    it('strips markup from spell names', () => {
      menu.openMenu('character', 'Mira', event)
      const spells = [{ name: '[magic]Fireball[/magic]', description: '' }]
      menu.selectAction(
        {
          label: '✨ Cast spell...',
          command: 'cast',
          needsSpell: true,
        },
        [],
        spells,
      )
      expect(menu.actions.value[0].command).toBe('cast Fireball on Mira')
    })
  })

  describe('mobile mode', () => {
    it('can be set to mobile', () => {
      menu.isMobile.value = true
      expect(menu.isMobile.value).toBe(true)
    })

    it('open still sets target and actions in mobile', () => {
      menu.isMobile.value = true
      const event = { clientX: 100, clientY: 100 } as MouseEvent
      menu.openMenu('item', 'Key', event)
      expect(menu.target.value).toBe('Key')
      expect(menu.actions.value.length).toBeGreaterThan(0)
      expect(menu.visible.value).toBe(true)
    })
  })

  describe('position clamping', () => {
    it('clamps x to viewport width minus menu width', () => {
      const event = {
        clientX: 9999,
        clientY: 100,
      } as MouseEvent
      menu.openMenu('item', 'Key', event, {
        viewportWidth: 800,
        viewportHeight: 600,
      })
      expect(menu.x.value).toBe(600) // 800 - 200
    })

    it('clamps y to viewport height minus menu height', () => {
      const event = {
        clientX: 100,
        clientY: 9999,
      } as MouseEvent
      menu.openMenu('item', 'Key', event, {
        viewportWidth: 800,
        viewportHeight: 600,
      })
      expect(menu.y.value).toBe(350) // 600 - 250
    })
  })
})
