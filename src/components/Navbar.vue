<template>
    <header :class="['app-header', { collapsed }]">
        <button class="hamburger-menu" @click="$emit('toggle-sidebar')" title="Menu">
            <i class="fas fa-bars"></i>
        </button>

        <div class="flex-spacer"></div>

        <div class="header-right">
            <button class="header-icon" @click="toggleFullScreen" title="Fullscreen">
                <i class="fas fa-expand"></i>
            </button>
            <button class="header-icon" @click="toggleTheme" title="Toggle theme">
                <i :class="isDarkMode ? 'fas fa-sun' : 'fas fa-moon'"></i>
            </button>
            <button class="header-icon user-icon" title="Account">
                <i class="fas fa-user"></i>
            </button>
        </div>
    </header>
</template>

<script setup>
import { ref } from 'vue'
defineProps({ collapsed: { type: Boolean, default: false } })

const isDarkMode = ref(false)
function toggleTheme() {
    isDarkMode.value = !isDarkMode.value
    document.body.classList.toggle('dark-mode', isDarkMode.value)
}
function toggleFullScreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen?.()
}
</script>

<style scoped>
.app-header {
    position: fixed;
    top: 0;
    left: 15%;
    width: calc(100% - 15%);
    height: 60px;
    background: var(--header-bg-color);
    border-bottom: 1px solid var(--header-border-color);
    display: flex;
    align-items: center;
    padding: 0 20px;
    transition: left 0.3s, width 0.3s;
    z-index: 10;
}

.app-header.collapsed {
    left: 5%;
    width: calc(100% - 5%);
}

.hamburger-menu,
.header-icon {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--header-text-color);
}

.hamburger-menu {
    font-size: 24px;
}

.flex-spacer {
    flex: 1;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 15px;
}

.header-icon {
    font-size: 20px;
    transition: color 0.3s;
}

.header-icon:hover {
    color: var(--header-icon-hover-color);
}

.user-icon {
    font-size: 20px;
}

/* Mobile: header spans full width */
@media (max-width: 768px) {
    .app-header {
        left: 0 !important;
        width: 100% !important;
        padding: 0 10px;
    }
}
</style>
