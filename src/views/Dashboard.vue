<!-- src/views/Dashboard.vue -->
<template>
    <div class="dashboard-container">
        <!-- Page Header -->
        <div class="page-header">
            <div>
                <h2 class="page-title">NParks Toilets Dashboard</h2>
                <nav class="breadcrumb">
                    <span>Cavill</span> &gt;
                    <span>Menu</span> &gt;
                    <span>Home</span>
                </nav>
            </div>

            <!-- KPI Strip -->
            <div class="kpi-strip">
                <div class="kpi-card">
                    <div class="kpi-label">Total Toilets</div>
                    <div class="kpi-value">{{ filteredToilets.length }}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">People In (Today)</div>
                    <div class="kpi-value">{{ totals.in }}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">People Out (Today)</div>
                    <div class="kpi-value">{{ totals.out }}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Live Occupancy</div>
                    <div class="kpi-value">{{ totals.occ }}</div>
                </div>
            </div>
        </div>

        <!-- Controls -->
        <div class="controls">
            <div class="controls-row">
                <div class="controls-group grow">
                    <label class="control-label" for="searchBox">Search</label>
                    <input id="searchBox" v-model="query" type="text" placeholder="Search by name, mall, address…"
                        class="control-input" />
                </div>

                <div class="controls-group">
                    <label class="control-label" for="regionSelect">Region</label>
                    <select id="regionSelect" v-model="region" class="control-select">
                        <option value="ALL">All</option>
                        <option v-for="r in REGIONS" :key="r" :value="r">{{ r }}</option>
                    </select>
                </div>

                <div class="controls-group">
                    <label class="control-label" for="sortSelect">Sort By</label>
                    <select id="sortSelect" v-model="sortBy" class="control-select">
                        <option value="name">Name (A–Z)</option>
                        <option value="occ_desc">Occupancy (High → Low)</option>
                        <option value="in_desc">People In (Today)</option>
                        <option value="updated_desc">Last Updated (Newest)</option>
                    </select>
                </div>

                <div class="controls-group">
                    <label class="control-label" for="mockToggle">Mock Updates</label>
                    <button id="mockToggle" class="control-button" @click="toggleMock">
                        <i class="fas" :class="mockRunning ? 'fa-pause' : 'fa-play'"></i>
                        <span>{{ mockRunning ? 'Pause' : 'Start' }}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Grid -->
        <div class="dashboard-grid">
            <div v-for="t in filteredToilets" :key="t.id" class="card-wrapper">
                <div class="toilet-card">
                    <div class="toilet-header">
                        <div class="title-and-tags">
                            <div class="toilet-name" :title="t.name">{{ t.name }}</div>
                            <div class="tags">
                                <span class="tag">{{ t.region }}</span>
                                <span class="tag" v-if="t.venue">{{ t.venue }}</span>
                            </div>
                        </div>

                        <!-- Only EDIT remains -->
                        <div class="header-actions">
                            <button class="icon-btn" title="Edit" @click="editToiletById(t.id)">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </div>

                    <div class="toilet-body">
                        <div class="metric">
                            <div class="metric-label">
                                <i class="fas fa-sign-in-alt"></i> People In (today)
                            </div>
                            <div class="metric-value">{{ t.counters.in }}</div>
                        </div>

                        <div class="metric">
                            <div class="metric-label">
                                <i class="fas fa-sign-out-alt"></i> People Out (today)
                            </div>
                            <div class="metric-value">{{ t.counters.out }}</div>
                        </div>

                        <div class="metric">
                            <div class="metric-label">
                                <i class="fas fa-user-friends"></i> Live Occupancy
                            </div>
                            <div class="metric-value" :class="occColorClass(t)">{{ occupancy(t) }}</div>
                        </div>

                        <div class="metric">
                            <div class="metric-label">
                                <i class="fas fa-vial"></i> Ammonia (NH₃)
                            </div>
                            <div class="metric-value">
                                <template v-if="t.ammonia?.ppm != null">
                                    <span :class="ammoniaColorClass(t)">{{ t.ammonia.ppm.toFixed(0) }} ppm</span>
                                    <span class="badge" :class="ammoniaBadgeClass(t)">{{ ammoniaStatus(t) }}</span>
                                </template>
                                <template v-else>
                                    <span class="muted">Coming Soon</span>
                                </template>
                            </div>
                        </div>
                    </div>

                    <div class="toilet-footer">
                        <div class="updated">
                            <i class="far fa-clock"></i>
                            Updated {{ timeAgo(t.updatedAt) }}
                        </div>
                        <div class="addr" v-if="t.address">
                            <i class="fas fa-map-marker-alt"></i>
                            {{ t.address }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty state -->
        <div v-if="filteredToilets.length === 0" class="empty-state">
            <i class="far fa-folder-open"></i>
            <p>No toilets match your filters. Try adjusting search or region.</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const REGIONS = ['Central', 'North', 'North-East', 'East', 'West', 'South']

const toilets = ref([])
const query = ref('')
const region = ref('ALL')
const sortBy = ref('name')
const mockRunning = ref(false)
let mockTimer = null

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
function nowISO() { return new Date().toISOString() }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)) }

const SEED = [
    {
        id: generateId(),
        name: 'Raffles City Tower - L3 (M)',
        region: 'Central',
        venue: 'Raffles City',
        address: '252 North Bridge Rd, 179103',
        capacity: 40,
        counters: { in: 328, out: 309 },
        ammonia: { ppm: null },
        updatedAt: nowISO()
    },
    {
        id: generateId(),
        name: 'Jewel Changi - B2 (F)',
        region: 'East',
        venue: 'Jewel Changi Airport',
        address: '78 Airport Blvd, 819666',
        capacity: 60,
        counters: { in: 880, out: 850 },
        ammonia: { ppm: 12 },
        updatedAt: nowISO()
    },
    {
        id: generateId(),
        name: 'Northpoint City - L1 (Unisex)',
        region: 'North',
        venue: 'Northpoint City',
        address: '930 Yishun Ave 2, 769098',
        capacity: 30,
        counters: { in: 410, out: 405 },
        ammonia: { ppm: 28 },
        updatedAt: nowISO()
    },
    {
        id: generateId(),
        name: 'VivoCity - L2 (F)',
        region: 'South',
        venue: 'VivoCity',
        address: '1 HarbourFront Walk, 098585',
        capacity: 55,
        counters: { in: 710, out: 690 },
        ammonia: { ppm: 45 },
        updatedAt: nowISO()
    },
    {
        id: generateId(),
        name: 'Jurong Point - L3 (M)',
        region: 'West',
        venue: 'Jurong Point',
        address: '1 Jurong West Central 2, 648886',
        capacity: 50,
        counters: { in: 520, out: 500 },
        ammonia: { ppm: 8 },
        updatedAt: nowISO()
    }
]

const LS_KEY = 'sg-toilets-dashboard-v1'
onMounted(() => {
    const saved = localStorage.getItem(LS_KEY)
    if (saved) {
        try { toilets.value = JSON.parse(saved) } catch { toilets.value = SEED }
    } else {
        toilets.value = SEED
    }
})
watch(toilets, (v) => localStorage.setItem(LS_KEY, JSON.stringify(v)), { deep: true })

const filteredToilets = computed(() => {
    const q = query.value.trim().toLowerCase()
    const list = toilets.value.filter((t) => showToilet(t) && matchQuery(t, q))
    switch (sortBy.value) {
        case 'occ_desc': return list.sort((a, b) => occupancy(b) - occupancy(a))
        case 'in_desc': return list.sort((a, b) => (b.counters?.in ?? 0) - (a.counters?.in ?? 0))
        case 'updated_desc': return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        default: return list.sort((a, b) => a.name.localeCompare(b.name))
    }
})
const totals = computed(() => {
    let i = 0, o = 0, occ = 0
    for (const t of filteredToilets.value) {
        i += t.counters?.in ?? 0
        o += t.counters?.out ?? 0
        occ += occupancy(t)
    }
    return { in: i, out: o, occ }
})

function showToilet(t) { return region.value === 'ALL' || t.region === region.value }
function matchQuery(t, q) {
    if (!q) return true
    return (`${t.name} ${t.venue ?? ''} ${t.address ?? ''} ${t.region ?? ''}`.toLowerCase()).includes(q)
}
function occupancy(t) {
    const occ = (t.counters?.in ?? 0) - (t.counters?.out ?? 0)
    return occ < 0 ? 0 : occ
}
function occColorClass(t) {
    const p = occupancy(t) / (t.capacity || 1)
    if (p >= 0.9) return 'danger'
    if (p >= 0.7) return 'warning'
    return 'ok'
}
function ammoniaStatus(t) {
    const v = t.ammonia?.ppm
    if (v == null) return 'N/A'
    if (v < 20) return 'Good'
    if (v < 35) return 'Moderate'
    return 'Poor'
}
function ammoniaBadgeClass(t) {
    const s = ammoniaStatus(t)
    return s === 'Good' ? 'badge-ok' : s === 'Moderate' ? 'badge-warn' : 'badge-danger'
}
function ammoniaColorClass(t) {
    const s = ammoniaStatus(t)
    return s === 'Good' ? 'ok' : s === 'Moderate' ? 'warning' : 'danger'
}
function timeAgo(iso) {
    const d = new Date(iso); const sec = Math.floor((Date.now() - d.getTime()) / 1000)
    if (sec < 60) return `${sec}s ago`
    const min = Math.floor(sec / 60); if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60); if (hr < 24) return `${hr}h ago`
    return `${Math.floor(hr / 24)}d ago`
}

function editToiletById(id) {
    const idx = toilets.value.findIndex(t => t.id === id); if (idx < 0) return
    const t = toilets.value[idx]
    const name = prompt('Edit Name:', t.name); if (name === null) return
    const venue = prompt('Edit Venue:', t.venue ?? '') ?? ''
    const address = prompt('Edit Address:', t.address ?? '') ?? ''
    const regionSel = prompt(`Edit Region (${REGIONS.join(', ')}):`, t.region) ?? t.region
    const capacity = Number(prompt('Edit Capacity:', String(t.capacity ?? 40))) || t.capacity || 40
    Object.assign(t, {
        name, venue, address,
        region: REGIONS.includes(regionSel) ? regionSel : t.region,
        capacity, updatedAt: nowISO()
    })
}

/* Mock live updates */
function toggleMock() {
    mockRunning.value = !mockRunning.value
    if (mockRunning.value) {
        mockTimer = setInterval(() => {
            const n = Math.min(3, toilets.value.length)
            for (let k = 0; k < n; k++) {
                const i = Math.floor(Math.random() * toilets.value.length)
                const t = toilets.value[i]; if (!t) continue
                const inDelta = Math.random() < 0.7 ? Math.floor(Math.random() * 5) : 0
                const outDelta = Math.random() < 0.6 ? Math.floor(Math.random() * 4) : 0
                const newIn = (t.counters?.in ?? 0) + inDelta
                const newOut = Math.max(0, Math.min((t.counters?.out ?? 0) + outDelta, newIn))
                if (t.ammonia?.ppm != null) {
                    const drift = (Math.random() - 0.5) * 2
                    t.ammonia.ppm = Math.max(0, Math.min(Math.round(t.ammonia.ppm + drift), 100))
                }
                t.counters.in = newIn
                t.counters.out = newOut
                t.updatedAt = nowISO()
            }
        }, 1500)
    } else {
        clearInterval(mockTimer); mockTimer = null
    }
}
onBeforeUnmount(() => { if (mockTimer) clearInterval(mockTimer) })
</script>

<style scoped>
.dashboard-container {
    padding: 20px;
}

/* Header & KPI */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;
}

.page-title {
    font-size: 24px;
    margin: 0 0 6px;
    color: var(--main-text-color);
}

.breadcrumb span {
    font-size: 14px;
    color: var(--main-text-color);
    margin: 0 4px;
}

.kpi-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(130px, 1fr));
    gap: 10px;
    min-width: 520px;
}

.kpi-card {
    background: var(--card-bg, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--header-border-color);
    border-radius: 10px;
    padding: 10px 12px;
    min-height: 60px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-shadow: var(--card-shadow, 0 2px 6px rgba(0, 0, 0, 0.08));
}

.kpi-label {
    font-size: 12px;
    opacity: 0.8;
}

.kpi-value {
    font-size: 20px;
    font-weight: 700;
    margin-top: 4px;
}

/* Controls */
.controls {
    margin: 12px 0 20px;
}

.controls-row {
    display: grid;
    grid-template-columns: 1.8fr 0.8fr 0.9fr auto;
    gap: 12px;
    align-items: end;
}

.controls-group {
    display: flex;
    flex-direction: column;
}

.grow {
    width: 100%;
}

.control-label {
    font-weight: 600;
    margin-bottom: 6px;
    color: var(--main-text-color);
}

.control-input,
.control-select {
    padding: 10px 12px;
    border: 1px solid var(--header-border-color);
    border-radius: 8px;
    background: var(--main-bg-color);
    color: var(--main-text-color);
}

.control-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: var(--header-icon-hover-color);
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
}

/* Grid */
.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 16px;
}

.card-wrapper {
    position: relative;
}

/* Toilet Card */
.toilet-card {
    background: var(--card-bg, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--header-border-color);
    border-radius: 14px;
    padding: 16px;
    min-height: 160px;
    box-shadow: var(--card-shadow, 0 2px 6px rgba(0, 0, 0, 0.08));
}

.toilet-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 10px;
}

.title-and-tags {
    min-width: 0;
}

.toilet-name {
    font-size: 16px;
    font-weight: 800;
    color: var(--main-text-color);
    line-height: 1.2;
    word-break: break-word;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 6px;
}

.tag {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid var(--header-border-color);
    color: var(--main-text-color);
    opacity: 0.9;
}

/* Header actions (only Edit) */
.header-actions {
    display: flex;
    gap: 8px;
    flex: 0 0 auto;
}

.icon-btn {
    background: none;
    border: 1px solid var(--header-border-color);
    color: var(--header-text-color);
    cursor: pointer;
    font-size: 16px;
    padding: 6px 8px;
    border-radius: 8px;
}

.icon-btn:hover {
    background: rgba(255, 255, 255, 0.08);
}

.toilet-body {
    display: grid;
    grid-template-columns: repeat(2, minmax(120px, 1fr));
    gap: 10px 16px;
}

.metric {
    background: rgba(0, 0, 0, 0.08);
    border: 1px solid var(--header-border-color);
    border-radius: 10px;
    padding: 10px;
}

.metric-label {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    opacity: 0.85;
}

.metric-value {
    margin-top: 6px;
    font-size: 20px;
    font-weight: 700;
}

.metric-value.ok {
    color: #38a169;
}

.metric-value.warning {
    color: #dd6b20;
}

.metric-value.danger {
    color: #e53e3e;
}

.badge {
    margin-left: 8px;
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid transparent;
    vertical-align: middle;
}

.badge-ok {
    background: rgba(56, 161, 105, 0.15);
    border-color: rgba(56, 161, 105, 0.35);
}

.badge-warn {
    background: rgba(221, 107, 32, 0.15);
    border-color: rgba(221, 107, 32, 0.35);
}

.badge-danger {
    background: rgba(229, 62, 62, 0.15);
    border-color: rgba(229, 62, 62, 0.35);
}

.muted {
    opacity: 0.7;
}

.toilet-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
    font-size: 12px;
    opacity: 0.85;
}

.updated,
.addr {
    display: flex;
    align-items: center;
    gap: 6px;
}

/* Responsive */
@media (max-width: 1024px) {
    .kpi-strip {
        min-width: 0;
        grid-template-columns: repeat(2, 1fr);
    }

    .controls-row {
        grid-template-columns: 1fr 1fr;
    }
}

@media (max-width: 768px) {
    .dashboard-container {
        padding: 10px;
    }

    .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .page-title {
        font-size: 20px;
    }

    .controls-row {
        grid-template-columns: 1fr;
    }

    .dashboard-grid {
        grid-template-columns: 1fr;
        gap: 14px;
    }
}
</style>

<style>
/* Dark-mode overrides */
body.dark-mode .dashboard-container {
    background: var(--main-bg-color);
    color: white;
}

body.dark-mode .page-title,
body.dark-mode .breadcrumb,
body.dark-mode .breadcrumb span,
body.dark-mode .control-label {
    color: #fff;
}

body.dark-mode .control-input,
body.dark-mode .control-select {
    background: #1a1f2e;
    color: #fff;
    border-color: #2b3553;
}

body.dark-mode .control-button {
    background: #fff;
    color: #000;
}
</style>
