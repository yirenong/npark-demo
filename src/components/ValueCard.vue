<template>
    <WidgetCard :title="title">
        <template #icon>
            <i class="fas fa-bolt"></i>
        </template>
        <div class="value-display">{{ value }}</div>
        <template #actions>
            <slot name="actions" />
        </template>
    </WidgetCard>
</template>

<script setup>
import { defineProps } from 'vue'
import WidgetCard from './WidgetCard.vue'

const props = defineProps({
    title: { type: String, required: true },
    value: { type: [Number, String], required: true }
})
</script>

<style scoped>
.value-display {
    font-size: 2.5rem;
    font-weight: 600;
    text-align: center;
    margin: 16px 0;
}
</style>
