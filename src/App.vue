<template>
  <div id="app">
    <!-- Sidebar listens for toggle-sidebar to open/close on mobile and desktop -->
    <Sidebar :collapsed="isCollapsed" />

    <div class="main" :class="{ collapsed: isCollapsed }">
      <!-- Navbar also emits toggle-sidebar for hamburger -->
      <Navbar :collapsed="isCollapsed" @toggle-sidebar="toggleSidebar" />

      <!-- Main content area -->
      <div class="view-container">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'

const isCollapsed = ref(false)

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
#app {
  display: flex;
  height: 100vh;
  position: relative;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 15%;
  transition: margin-left 0.3s;
}

.main.collapsed {
  margin-left: 5%;
}

.view-container {
  margin-top: 60px;
  flex: 1;
  overflow: auto;
  background: var(--main-bg-color);
  padding: 20px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .main {
    margin-left: 0%;
  }
}
</style>