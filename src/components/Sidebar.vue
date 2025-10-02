<template>
    <aside :class="['app-sidebar', { collapsed }]">
        <div class="logo-section">
            <img src="../assets/cavill_logo.png" alt="Logo" class="logo" />
        </div>

        <!-- Close button on mobile only -->
        <button class="close-btn" @click="$emit('toggle-sidebar')">&times;</button>

        <nav>
            <div class="menu-section">
                <span class="menu-title">MENU</span>
                <ul class="menu">
                    <li>
                        <router-link to="/" class="menu-link" @click="onLinkClick">
                            <i class="fas fa-home"></i>
                            <span class="link-text">Homepage</span>
                        </router-link>
                    </li>
                </ul>
            </div>

            <div class="menu-section">
                <span class="menu-title">Analytics</span>
                <ul class="menu">
                    <li>
                        <router-link to="/analytics" class="menu-link" @click="onLinkClick">
                            <i class="fas fa-tint"></i>
                            <span class="link-text">Analytics</span>
                        </router-link>
                    </li>
                </ul>
            </div>

            <div class="menu-section">
                <span class="menu-title">Threshold</span>
                <ul class="menu">
                    <li>
                        <router-link to="/threshold" class="menu-link" @click="onLinkClick">
                            <i class="fas fa-tint"></i>
                            <span class="link-text">Threshold</span>
                        </router-link>
                    </li>
                </ul>
            </div>
        </nav>
    </aside>
</template>

<script setup>
defineProps({ collapsed: Boolean })
const emit = defineEmits(['toggle-sidebar'])
const isMobile = () => window.matchMedia('(max-width: 768px)').matches
function onLinkClick() { if (isMobile()) emit('toggle-sidebar') } // close drawer only on mobile
</script>

<style scoped>
.app-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 15%;
    background: var(--sidebar-bg-color);
    color: var(--sidebar-text-color);
    padding-top: 24px;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    transition: width 0.3s, transform 0.3s;
    overflow: hidden;
    z-index: 2000;
}

.app-sidebar.collapsed {
    width: 5%;
}

.menu-section {
    margin-bottom: 32px;
}

.menu li {
    margin: 8px 0;
}

.menu-link {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    color: inherit;
    text-decoration: none;
    border-radius: 4px;
    transition: background 0.2s;
}

.menu-link i {
    margin-right: 12px;
    font-size: 16px;
}

.menu-link:hover {
    background: var(--sidebar-hover-color);
}

.router-link-active {
    background: var(--sidebar-hover-color);
    border-left: 4px solid var(--header-icon-hover-color);
    padding-left: 12px;
    color: var(--sidebar-text-color);
}

.logo-section {
    text-align: center;
    margin-bottom: 32px;
}

.logo {
    height: 48px;
}

.menu-title {
    margin-left: 16px;
    margin-bottom: 8px;
    font-size: 11px;
    letter-spacing: 1px;
    color: var(--sidebar-text-color);
    text-transform: uppercase;
}

.link-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.app-sidebar.collapsed .menu-section {
    margin-bottom: 0;
    margin-top: 24%;
}

/* ---- Desktop-only collapsed rail behavior (HIDE TEXT) ---- */
@media (min-width: 769px) {

    .app-sidebar.collapsed .menu-title,
    .app-sidebar.collapsed .link-text {
        display: none;
        /* hide labels in rail */
    }

    .app-sidebar.collapsed .menu-link {
        justify-content: center;
        /* center icons */
        padding: 12px 0;
        /* tighter padding */
    }

    .app-sidebar.collapsed .menu-link i {
        margin-right: 0;
        /* remove gap since text is hidden */
    }

    .app-sidebar.collapsed .router-link-active {
        border-left: 0;
        /* remove active left bar in rail */
        padding-left: 0;
    }

    .app-sidebar.collapsed .logo {
        height: 40px;
    }

    .app-sidebar.collapsed .logo-section {
        margin-bottom: 16px;
    }
}

/* ---- Mobile drawer ---- */
.close-btn {
    display: none;
}

@media (max-width: 768px) {
    .app-sidebar {
        transform: translateX(-100%);
        width: 0;
    }

    .app-sidebar.collapsed {
        transform: translateX(0);
        width: 100%;
    }

    .close-btn {
        display: block;
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        color: var(--sidebar-text-color);
        font-size: 24px;
        cursor: pointer;
    }

    /* Always show text/titles on mobile */
    .link-text,
    .menu-title {
        display: block !important;
    }

    .app-sidebar.collapsed .menu-link {
        justify-content: left;
        padding: 16px 16px;
    }
}
</style>
