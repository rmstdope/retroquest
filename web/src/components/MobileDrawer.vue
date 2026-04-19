<script setup lang="ts">
import type { NamedItem } from '@/types/bridge'

defineProps<{
  visible: boolean
  activeQuests: NamedItem[]
  inventory: NamedItem[]
  spells: NamedItem[]
}>()

defineEmits<{
  close: []
  inventoryClick: [event: MouseEvent, name: string]
  spellClick: [event: MouseEvent, name: string]
}>()
</script>

<template>
  <div v-if="visible">
    <div class="drawer-scrim" @click="$emit('close')"></div>
    <div class="drawer">
      <div class="drawer-header">
        <span style="font-weight: 700; font-size: 1rem">Menu</span>
        <button
          class="drawer-close-btn"
          aria-label="Close menu"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Active Quests -->
      <div class="sidebar-section">
        <div class="sidebar-section-title">📜 Active Quests</div>
        <div v-if="activeQuests.length === 0" class="sidebar-empty">
          No active quests
        </div>
        <div
          v-for="quest in activeQuests"
          :key="quest.name"
          class="sidebar-item"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="sidebar-item-name" v-html="quest.name"></div>
          <div class="sidebar-item-desc">{{ quest.description }}</div>
        </div>
      </div>

      <!-- Inventory -->
      <div class="sidebar-section">
        <div class="sidebar-section-title">🎒 Inventory</div>
        <div v-if="inventory.length === 0" class="sidebar-empty">
          Inventory is empty
        </div>
        <div
          v-for="item in inventory"
          :key="item.name"
          class="sidebar-item sidebar-clickable"
          @click="$emit('inventoryClick', $event, item.name)"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="sidebar-item-name" v-html="item.name"></div>
          <div class="sidebar-item-desc">{{ item.description }}</div>
        </div>
      </div>

      <!-- Spells -->
      <div class="sidebar-section">
        <div class="sidebar-section-title">✨ Spells</div>
        <div v-if="spells.length === 0" class="sidebar-empty">
          No spells known
        </div>
        <div
          v-for="spell in spells"
          :key="spell.name"
          class="sidebar-item sidebar-clickable"
          @click="$emit('spellClick', $event, spell.name)"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="sidebar-item-name" v-html="spell.name"></div>
          <div class="sidebar-item-desc">{{ spell.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
