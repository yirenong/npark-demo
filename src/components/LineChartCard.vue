<template>
    <WidgetCard :title="title">
        <template #icon>
            <i class="fas fa-chart-line"></i>
        </template>
        <canvas ref="canvas"></canvas>
        <template #actions>
            <slot name="actions" />
        </template>
    </WidgetCard>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import WidgetCard from './WidgetCard.vue'

Chart.register(...registerables)
const props = defineProps({
    title: { type: String, required: true },
    chartData: { type: Object, required: true },
    options: { type: Object, default: () => ({ responsive: true }) }
})

const canvas = ref(null)
let chartInstance = null

onMounted(() => {
    if (canvas.value && props.chartData && props.chartData.labels) {
        chartInstance = new Chart(canvas.value, {
            type: 'line',
            data: props.chartData,
            options: props.options
        })
    }
})

watch(() => props.chartData, (newData) => {
    if (chartInstance && newData && newData.labels) {
        chartInstance.data = newData
        chartInstance.update()
    }
}, { deep: true })
</script>

<style scoped>
canvas {
    width: 100% !important;
    height: 100% !important;
}
</style>