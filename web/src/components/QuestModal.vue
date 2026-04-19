<script setup lang="ts">
defineProps<{
  visible: boolean
  title: string
  body: string
}>()

defineEmits<{
  dismiss: []
}>()
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('dismiss')">
    <div class="modal-content">
      <div class="modal-title">{{ title }}</div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="modal-body" v-html="body"></div>
      <button class="modal-dismiss-btn" @click="$emit('dismiss')">
        Continue
      </button>
      <div style="clear: both"></div>
    </div>
  </div>
</template>
