<script setup lang="ts">
import type { NamedItem } from '@/types/bridge'

defineProps<{
  activeQuests: NamedItem[]
  completedQuests: NamedItem[]
  inventory: NamedItem[]
  spells: NamedItem[]
  showActiveQuests: boolean
  showCompletedQuests: boolean
  showInventory: boolean
  showSpells: boolean
}>()

defineEmits<{
  toggleSection: [section: string]
  inventoryClick: [event: MouseEvent, name: string]
  spellClick: [event: MouseEvent, name: string]
}>()
</script>

<template>
  <div class="sidebar">
    <!-- Active Quests -->
    <div class="sidebar-section">
      <div
        class="sidebar-section-title"
        @click="$emit('toggleSection', 'activeQuests')"
      >
        📜 Active Quests
        <span class="toggle-icon" :class="{ collapsed: !showActiveQuests }"
          >▼</span
        >
      </div>
      <div v-if="showActiveQuests">
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
    </div>

    <!-- Completed Quests -->
    <div class="sidebar-section">
      <div
        class="sidebar-section-title"
        @click="$emit('toggleSection', 'completedQuests')"
      >
        🏆 Completed Quests
        <span class="toggle-icon" :class="{ collapsed: !showCompletedQuests }"
          >▼</span
        >
      </div>
      <div v-if="showCompletedQuests">
        <div v-if="completedQuests.length === 0" class="sidebar-empty">
          No completed quests
        </div>
        <div
          v-for="quest in completedQuests"
          :key="quest.name"
          class="sidebar-item"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="sidebar-item-name" v-html="quest.name"></div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="sidebar-item-desc" v-html="quest.description"></div>
        </div>
      </div>
    </div>

    <!-- Inventory -->
    <div class="sidebar-section">
      <div
        class="sidebar-section-title"
        @click="$emit('toggleSection', 'inventory')"
      >
        🎒 Inventory
        <span class="toggle-icon" :class="{ collapsed: !showInventory }"
          >▼</span
        >
      </div>
      <div v-if="showInventory">
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
    </div>

    <!-- Spells -->
    <div class="sidebar-section">
      <div
        class="sidebar-section-title"
        @click="$emit('toggleSection', 'spells')"
      >
        ✨ Spells
        <span class="toggle-icon" :class="{ collapsed: !showSpells }">▼</span>
      </div>
      <div v-if="showSpells">
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
