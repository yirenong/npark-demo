<template>
  <div id="app">
    <Sidebar :collapsed="isCollapsed" @toggle-sidebar="toggleSidebar" />

    <!-- On desktop: 'collapsed' class makes main margin 5%.
         On mobile: main is always full width (CSS media query). -->
    <div class="main" :class="{ collapsed: isCollapsed && isDesktop }">
      <Navbar :collapsed="isCollapsed && isDesktop" @toggle-sidebar="toggleSidebar" />

      <div class="view-container">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'

/**
 * Unified state:
 * - Desktop: isCollapsed=true => slim rail (5%)
 * - Mobile:  isCollapsed=true => drawer OPEN
 */
const isCollapsed = ref(false)
const isMobile = ref(false)
const isDesktop = ref(true)

let mq

function updateViewportFlags() {
  const mobile = mq.matches
  isMobile.value = mobile
  isDesktop.value = !mobile
  // When switching viewport, keep current collapsed state:
  //  - desktop: keep slim/expanded as user set
  //  - mobile: keep drawer open/closed as user set
  applyScrollLock()
}

function toggleSidebar() {
  // Now toggles BOTH desktop (slim rail) and mobile (drawer)
  isCollapsed.value = !isCollapsed.value
  applyScrollLock()
}

/* Lock body scroll only when the MOBILE drawer is open */
function lockBody(lock) {
  document.documentElement.style.overflow = lock ? 'hidden' : ''
  document.body.style.overflow = lock ? 'hidden' : ''
}
function applyScrollLock() {
  lockBody(isMobile.value && isCollapsed.value)
}

onMounted(() => {
  mq = window.matchMedia('(max-width: 768px)')
  updateViewportFlags()
  mq.addEventListener?.('change', updateViewportFlags)
})

onBeforeUnmount(() => {
  mq?.removeEventListener?.('change', updateViewportFlags)
})

watch(isCollapsed, applyScrollLock)
</script>

<style scoped>
#app {
  display: flex;
  height: 100vh;
  position: relative;
}

/* Desktop layout: reserve space for sidebar */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 15%;
  transition: margin-left 0.3s;
}

/* Only apply slim margin when desktop AND (if you ever set collapsed) */
.main.collapsed {
  margin-left: 5%;
}

/* Content area */
.view-container {
  margin-top: 60px;
  /* space for Navbar */
  flex: 1;
  overflow: auto;
  background: var(--main-bg-color);
  padding: 20px;
}

/* Mobile: sidebar is off-canvas; main should take full width */
@media (max-width: 768px) {
  .main {
    margin-left: 0;
  }
}
</style>
