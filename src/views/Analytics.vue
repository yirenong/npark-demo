<!-- src/views/Analytics.vue -->
<template>
    <div class="analytics-container">
        <!-- Page Header -->
        <div class="page-header">
            <div>
                <h2 class="page-title">Analytics</h2>
                <nav class="breadcrumb">
                    <span>Cavill</span> &gt;
                    <span>Menu</span> &gt;
                    <span>Analytics</span>
                </nav>
            </div>

            <div class="actions">
                <button class="control-button outline" @click="reload">
                    <i class="fas fa-sync-alt"></i>
                    <span>Refresh</span>
                </button>
            </div>
        </div>

        <!-- KPI Strip -->
        <div class="kpi-strip">
            <div class="kpi-card">
                <div class="kpi-label">Total Toilets</div>
                <div class="kpi-value">{{ toilets.length }}</div>
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
            <div class="kpi-card">
                <div class="kpi-label">Avg. Utilization</div>
                <div class="kpi-value">{{ (avgUtilization * 100).toFixed(0) }}%</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Ammonia (Good / Mod / Poor / N/A)</div>
                <div class="kpi-value">{{ ammoniaCounts.good }} / {{ ammoniaCounts.moderate }} / {{ ammoniaCounts.poor
                    }} / {{ ammoniaCounts.na }}</div>
            </div>
        </div>

        <!-- Filters -->
        <div class="controls">
            <div class="controls-row">
                <div class="controls-group">
                    <label class="control-label" for="regionSelect">Region</label>
                    <select id="regionSelect" v-model="region" class="control-select">
                        <option value="ALL">All</option>
                        <option v-for="r in REGIONS" :key="r" :value="r">{{ r }}</option>
                    </select>
                </div>
                <div class="controls-group grow">
                    <label class="control-label" for="searchBox">Search</label>
                    <input id="searchBox" v-model="query" class="control-input"
                        placeholder="Filter by name / venue / address…" />
                </div>
            </div>
        </div>

        <!-- Region Summary -->
        <section class="panel">
            <div class="panel-header">
                <h3>Region Summary</h3>
            </div>
            <div class="panel-body">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Region</th>
                            <th class="num">Toilets</th>
                            <th class="num">People In</th>
                            <th class="num">People Out</th>
                            <th class="num">Live Occupancy</th>
                            <th class="num">Avg. Utilization</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in regionRows" :key="row.region">
                            <td>{{ row.region }}</td>
                            <td class="num">{{ row.count }}</td>
                            <td class="num">{{ row.in }}</td>
                            <td class="num">{{ row.out }}</td>
                            <td class="num">{{ row.occ }}</td>
                            <td class="num">{{ (row.avgUtil * 100).toFixed(0) }}%</td>
                        </tr>
                        <tr v-if="regionRows.length === 0">
                            <td colspan="6" class="muted">No data</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Charts -->
        <section class="charts">
            <div class="chart-card">
                <div class="panel-header">
                    <h3>Occupancy by Region</h3>
                </div>
                <div class="panel-body"><canvas ref="occByRegionRef" height="140"></canvas></div>
            </div>
            <div class="chart-card">
                <div class="panel-header">
                    <h3>Ammonia Status Mix</h3>
                </div>
                <div class="panel-body"><canvas ref="ammoniaPieRef" height="140"></canvas></div>
            </div>
        </section>

        <!-- Top 10 busiest -->
        <section class="panel">
            <div class="panel-header">
                <h3>Top 10 Busiest (by Live Occupancy)</h3>
            </div>
            <div class="panel-body">
                <table class="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Region</th>
                            <th>Venue</th>
                            <th class="num">Capacity</th>
                            <th class="num">Occupancy</th>
                            <th class="num">Utilization</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(t, i) in topBusiest" :key="t.id">
                            <td>{{ i + 1 }}</td>
                            <td :title="t.name">{{ t.name }}</td>
                            <td>{{ t.region }}</td>
                            <td>{{ t.venue || '-' }}</td>
                            <td class="num">{{ t.capacity || '-' }}</td>
                            <td class="num">{{ occupancy(t) }}</td>
                            <td class="num">{{ ((occupancy(t) / Math.max(1, t.capacity || 1)) * 100).toFixed(0) }}%</td>
                        </tr>
                        <tr v-if="topBusiest.length === 0">
                            <td colspan="7" class="muted">No data</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import Chart from 'chart.js/auto'

const REGIONS = ['Central', 'North', 'North-East', 'East', 'West', 'South']
const LS_KEY = 'sg-toilets-dashboard-v1'

const toilets = ref([])
const query = ref('')
const region = ref('ALL')

function loadFromLocalStorage() {
    const saved = localStorage.getItem(LS_KEY)
    if (!saved) { toilets.value = []; return }
    try { toilets.value = JSON.parse(saved) } catch { toilets.value = [] }
}

function reload() {
    loadFromLocalStorage()
    drawCharts()
}

onMounted(() => {
    loadFromLocalStorage()
    drawCharts()
})

// Re-draw when filters or data change
watch([() => toilets.value, query, region], () => {
    drawCharts()
}, { deep: true })

function matchQuery(t, q) {
    if (!q) return true
    const hay = `${t.name} ${t.venue ?? ''} ${t.address ?? ''} ${t.region ?? ''}`.toLowerCase()
    return hay.includes(q)
}
function showToilet(t) { return region.value === 'ALL' || t.region === region.value }
function occupancy(t) {
    const i = t.counters?.in ?? 0
    const o = t.counters?.out ?? 0
    const occ = i - o
    return occ < 0 ? 0 : occ
}
function ammoniaStatus(t) {
    const v = t.ammonia?.ppm
    if (v == null) return 'N/A'
    if (v < 20) return 'Good'
    if (v < 35) return 'Moderate'
    return 'Poor'
}

const filtered = computed(() => {
    const q = query.value.trim().toLowerCase()
    return toilets.value.filter(t => showToilet(t) && matchQuery(t, q))
})

const totals = computed(() => {
    let inSum = 0, outSum = 0, occSum = 0
    for (const t of filtered.value) {
        inSum += t.counters?.in ?? 0
        outSum += t.counters?.out ?? 0
        occSum += occupancy(t)
    }
    return { in: inSum, out: outSum, occ: occSum }
})

const avgUtilization = computed(() => {
    if (filtered.value.length === 0) return 0
    let sum = 0
    for (const t of filtered.value) {
        const cap = Math.max(1, t.capacity || 1)
        sum += occupancy(t) / cap
    }
    return sum / filtered.value.length
})

const ammoniaCounts = computed(() => {
    let good = 0, moderate = 0, poor = 0, na = 0
    for (const t of filtered.value) {
        const s = ammoniaStatus(t)
        if (s === 'Good') good++
        else if (s === 'Moderate') moderate++
        else if (s === 'Poor') poor++
        else na++
    }
    return { good, moderate, poor, na }
})

const regionRows = computed(() => {
    const rows = []
    for (const r of REGIONS) {
        const list = filtered.value.filter(t => t.region === r)
        if (list.length === 0) continue
        let inSum = 0, outSum = 0, occSum = 0, utilSum = 0
        for (const t of list) {
            inSum += t.counters?.in ?? 0
            outSum += t.counters?.out ?? 0
            const occ = occupancy(t)
            occSum += occ
            utilSum += occ / Math.max(1, t.capacity || 1)
        }
        rows.push({
            region: r,
            count: list.length,
            in: inSum,
            out: outSum,
            occ: occSum,
            avgUtil: utilSum / list.length
        })
    }
    return rows
})

const topBusiest = computed(() => {
    return [...filtered.value]
        .sort((a, b) => occupancy(b) - occupancy(a))
        .slice(0, 10)
})

/* Charts */
const occByRegionRef = ref(null)
const ammoniaPieRef = ref(null)
let occByRegionChart = null
let ammoniaPieChart = null

function destroyCharts() {
    if (occByRegionChart) { occByRegionChart.destroy(); occByRegionChart = null }
    if (ammoniaPieChart) { ammoniaPieChart.destroy(); ammoniaPieChart = null }
}

function drawCharts() {
    // Avoid drawing before mount
    if (!occByRegionRef.value || !ammoniaPieRef.value) return
    destroyCharts()

    // Occupancy by Region (bar)
    const labels = regionRows.value.map(r => r.region)
    const dataOcc = regionRows.value.map(r => r.occ)
    occByRegionChart = new Chart(occByRegionRef.value.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{ label: 'Live Occupancy', data: dataOcc }]
        },
        options: {
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    })

    // Ammonia status (pie)
    const ac = ammoniaCounts.value
    ammoniaPieChart = new Chart(ammoniaPieRef.value.getContext('2d'), {
        type: 'pie',
        data: {
            labels: ['Good', 'Moderate', 'Poor', 'N/A'],
            datasets: [{ data: [ac.good, ac.moderate, ac.poor, ac.na] }]
        },
        options: {
            maintainAspectRatio: false
        }
    })
}

onBeforeUnmount(() => destroyCharts())
</script>

<style scoped>
.analytics-container {
    padding: 20px;
}

/* Header */
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

.actions {
    display: flex;
    gap: 10px;
}

.control-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: transparent;
    color: var(--main-text-color);
    border: 1px solid var(--header-border-color);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
}

.control-button.outline:hover {
    filter: brightness(0.95);
}

/* KPIs */
.kpi-strip {
    display: grid;
    grid-template-columns: repeat(6, minmax(130px, 1fr));
    gap: 10px;
    margin-top: 6px;
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
    margin: 16px 0 12px;
}

.controls-row {
    display: grid;
    grid-template-columns: 0.6fr 1.4fr;
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

/* Panels */
.panel {
    border: 1px solid var(--header-border-color);
    border-radius: 12px;
    margin-bottom: 16px;
}

.panel-header {
    padding: 12px 14px;
    border-bottom: 1px solid var(--header-border-color);
}

.panel-header h3 {
    margin: 0;
    font-size: 16px;
}

.panel-body {
    padding: 14px;
}

/* Tables */
.table {
    width: 100%;
    border-collapse: collapse;
}

.table th,
.table td {
    padding: 10px;
    border-bottom: 1px solid var(--header-border-color);
}

.table th {
    text-align: left;
    font-weight: 700;
}

.table .num {
    text-align: right;
}

.muted {
    opacity: 0.7;
    text-align: center;
    padding: 16px;
}

/* Charts */
.charts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
}

.chart-card {
    border: 1px solid var(--header-border-color);
    border-radius: 12px;
}

.chart-card .panel-header {
    border-bottom: 1px solid var(--header-border-color);
}

.chart-card .panel-body {
    height: 260px;
}

/* Responsive */
@media (max-width: 1024px) {
    .kpi-strip {
        grid-template-columns: repeat(3, 1fr);
    }

    .controls-row {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .analytics-container {
        padding: 10px;
    }

    .kpi-strip {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>

<style>
/* Dark-mode overrides */
body.dark-mode .analytics-container {
    background: var(--main-bg-color);
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
</style>
