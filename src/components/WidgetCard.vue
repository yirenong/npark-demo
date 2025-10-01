<template>
    <div class="card" :style="customStyle">
        <div class="card-header">
            <slot name="icon" />
            <h3>{{ title }}</h3>
        </div>
        <div class="card-body">
            <slot />
        </div>
    </div>
</template>

<script setup>
const props = defineProps({ title: String, customStyle: Object })
</script>

<style scoped>
.card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 16px;
    display: flex;
    flex-direction: column;
}

.card-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 12px;
    gap: 8px;
    text-align: center;
}

.card-body {
    flex: 1;
}
</style>
