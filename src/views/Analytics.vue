<!-- src/views/Analytics.vue -->
<template>
    <div class="analytics-container">
        <!-- Page Header -->
        <div class="page-header">
            <div class="title-wrap">
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

        <!-- KPI Strip (fully responsive) -->
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
                <div class="kpi-value">
                    {{ ammoniaCounts.good }} / {{ ammoniaCounts.moderate }} / {{ ammoniaCounts.poor }} / {{
                        ammoniaCounts.na }}
                </div>
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

            <!-- Desktop/Tablet: Table -->
            <div class="panel-body table-wrap hide-on-mobile">
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

            <!-- Mobile: Cards -->
            <div class="panel-body show-on-mobile">
                <div class="cards-list">
                    <div class="summary-card" v-for="row in regionRows" :key="row.region">
                        <div class="summary-title">{{ row.region }}</div>
                        <div class="summary-grid">
                            <div class="summary-item">
                                <div class="label">Toilets</div>
                                <div class="value">{{ row.count }}</div>
                            </div>
                            <div class="summary-item">
                                <div class="label">People In</div>
                                <div class="value">{{ row.in }}</div>
                            </div>
                            <div class="summary-item">
                                <div class="label">People Out</div>
                                <div class="value">{{ row.out }}</div>
                            </div>
                            <div class="summary-item">
                                <div class="label">Live Occ.</div>
                                <div class="value">{{ row.occ }}</div>
                            </div>
                            <div class="summary-item">
                                <div class="label">Avg. Util.</div>
                                <div class="value">{{ (row.avgUtil * 100).toFixed(0) }}%</div>
                            </div>
                        </div>
                    </div>

                    <div v-if="regionRows.length === 0" class="muted">No data</div>
                </div>
            </div>
        </section>

        <!-- Charts -->
        <section class="charts">
            <div class="chart-card">
                <div class="panel-header">
                    <h3>Occupancy by Region</h3>
                </div>
                <div class="panel-body chart-body"><canvas ref="occByRegionRef"></canvas></div>
            </div>
            <div class="chart-card">
                <div class="panel-header">
                    <h3>Ammonia Status Mix</h3>
                </div>
                <div class="panel-body chart-body"><canvas ref="ammoniaPieRef"></canvas></div>
            </div>
        </section>

        <!-- Top 10 Busiest -->
        <section class="panel">
            <div class="panel-header">
                <h3>Top 10 Busiest (by Live Occupancy)</h3>
            </div>

            <!-- Desktop/Tablet: Table -->
            <div class="panel-body table-wrap hide-on-mobile">
                <table class="table minwide">
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

            <!-- Mobile: Cards -->
            <div class="panel-body show-on-mobile">
                <div class="cards-list">
                    <div class="busy-card" v-for="(t, i) in topBusiest" :key="t.id">
                        <div class="busy-header">
                            <div class="rank">#{{ i + 1 }}</div>
                            <div class="name" :title="t.name">{{ t.name }}</div>
                        </div>
                        <div class="busy-tags">
                            <span class="tag">{{ t.region }}</span>
                            <span class="tag" v-if="t.venue">{{ t.venue }}</span>
                        </div>
                        <div class="busy-metrics">
                            <div class="metric">
                                <div class="label">Capacity</div>
                                <div class="value">{{ t.capacity || '-' }}</div>
                            </div>
                            <div class="metric">
                                <div class="label">Occupancy</div>
                                <div class="value">{{ occupancy(t) }}</div>
                            </div>
                            <div class="metric">
                                <div class="label">Utilization</div>
                                <div class="value">{{ ((occupancy(t) / Math.max(1, t.capacity || 1)) * 100).toFixed(0)
                                }}%</div>
                            </div>
                        </div>
                    </div>

                    <div v-if="topBusiest.length === 0" class="muted">No data</div>
                </div>
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
function reload() { loadFromLocalStorage(); drawCharts() }

onMounted(() => { loadFromLocalStorage(); drawCharts() })
watch([() => toilets.value, query, region], () => { drawCharts() }, { deep: true })

function matchQuery(t, q) {
    if (!q) return true
    const hay = `${t.name} ${t.venue ?? ''} ${t.address ?? ''} ${t.region ?? ''}`.toLowerCase()
    return hay.includes(q)
}
function showToilet(t) { return region.value === 'ALL' || t.region === region.value }
function occupancy(t) { const i = t.counters?.in ?? 0, o = t.counters?.out ?? 0; return Math.max(0, i - o) }
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
    if (!filtered.value.length) return 0
    let sum = 0
    for (const t of filtered.value) {
        sum += occupancy(t) / Math.max(1, t.capacity || 1)
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
        if (!list.length) continue
        let inSum = 0, outSum = 0, occSum = 0, utilSum = 0
        for (const t of list) {
            inSum += t.counters?.in ?? 0
            outSum += t.counters?.out ?? 0
            const occ = occupancy(t)
            occSum += occ
            utilSum += occ / Math.max(1, t.capacity || 1)
        }
        rows.push({ region: r, count: list.length, in: inSum, out: outSum, occ: occSum, avgUtil: utilSum / list.length })
    }
    return rows
})

const topBusiest = computed(() => {
    return [...filtered.value].sort((a, b) => occupancy(b) - occupancy(a)).slice(0, 10)
})

/* Charts */
const occByRegionRef = ref(null)
const ammoniaPieRef = ref(null)
let occByRegionChart = null, ammoniaPieChart = null

function destroyCharts() {
    if (occByRegionChart) { occByRegionChart.destroy(); occByRegionChart = null }
    if (ammoniaPieChart) { ammoniaPieChart.destroy(); ammoniaPieChart = null }
}

function drawCharts() {
    if (!occByRegionRef.value || !ammoniaPieRef.value) return
    destroyCharts()

    const labels = regionRows.value.map(r => r.region)
    const dataOcc = regionRows.value.map(r => r.occ)
    occByRegionChart = new Chart(occByRegionRef.value.getContext('2d'), {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Live Occupancy', data: dataOcc }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    })

    const ac = ammoniaCounts.value
    ammoniaPieChart = new Chart(ammoniaPieRef.value.getContext('2d'), {
        type: 'pie',
        data: { labels: ['Good', 'Moderate', 'Poor', 'N/A'], datasets: [{ data: [ac.good, ac.moderate, ac.poor, ac.na] }] },
        options: { responsive: true, maintainAspectRatio: false }
    })
}

onBeforeUnmount(() => destroyCharts())
</script>

<style scoped>
/* Container */
.analytics-container {
    padding: 16px;
}

/* Header */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}

.title-wrap {
    min-width: 0;
}

.page-title {
    font-size: 24px;
    margin: 0 0 6px;
    color: var(--main-text-color);
}

.breadcrumb span {
    font-size: 14px;
    color: var(--main-text-color);
    margin-right: 4px;
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

/* KPI Grid: responsive cards */
.kpi-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    /* auto-fit for responsive wrap */
    gap: 12px;
    margin-top: 6px;
}

.kpi-card {
    background: var(--card-bg, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--header-border-color);
    border-radius: 12px;
    padding: 14px;
    min-height: 72px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.kpi-label {
    font-size: 12px;
    opacity: 0.8;
}

.kpi-value {
    font-size: 22px;
    font-weight: 800;
    margin-top: 6px;
}

/* Filters */
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

/* Tables (desktop/tablet) */
.table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.table {
    width: 100%;
    border-collapse: collapse;
    min-width: 640px;
}

.table.minwide {
    min-width: 760px;
}

.table th,
.table td {
    padding: 10px;
    border-bottom: 1px solid var(--header-border-color);
}

.table th {
    text-align: left;
    font-weight: 700;
    white-space: nowrap;
}

.table .num {
    text-align: right;
}

/* Mobile cards for tables */
.cards-list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
}

/* Region summary card */
.summary-card {
    border: 1px solid var(--header-border-color);
    border-radius: 12px;
    padding: 12px;
    background: var(--card-bg, rgba(255, 255, 255, 0.04));
}

.summary-title {
    font-weight: 800;
    margin-bottom: 8px;
    font-size: 16px;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.summary-item .label {
    font-size: 12px;
    opacity: 0.75;
}

.summary-item .value {
    font-size: 18px;
    font-weight: 700;
    margin-top: 2px;
}

/* Top 10 card */
.busy-card {
    border: 1px solid var(--header-border-color);
    border-radius: 12px;
    padding: 12px;
    background: var(--card-bg, rgba(255, 255, 255, 0.04));
}

.busy-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
}

.busy-header .rank {
    font-weight: 800;
}

.busy-header .name {
    font-weight: 700;
    flex: 1;
    min-width: 0;
}

.busy-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin: 6px 0 10px;
}

.tag {
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid var(--header-border-color);
}

.busy-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
}

.busy-metrics .label {
    font-size: 12px;
    opacity: 0.75;
}

.busy-metrics .value {
    font-size: 18px;
    font-weight: 700;
    margin-top: 2px;
}

.muted {
    opacity: 0.7;
    text-align: center;
    padding: 16px;
}

/* Charts */
.charts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
}

.chart-card {
    border: 1px solid var(--header-border-color);
    border-radius: 12px;
}

.chart-card .panel-header {
    border-bottom: 1px solid var(--header-border-color);
}

.chart-body {
    height: 280px;
}

/* Visibility helpers */
.hide-on-mobile {
    display: block;
}

.show-on-mobile {
    display: none;
}

/* Responsive tweaks */
@media (max-width: 1024px) {
    .controls-row {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .analytics-container {
        padding: 12px;
    }

    .page-title {
        font-size: 20px;
    }

    .kpi-strip {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }

    .summary-grid {
        grid-template-columns: 1fr 1fr;
    }

    .busy-metrics {
        grid-template-columns: 1fr 1fr 1fr;
    }

    .chart-body {
        height: 240px;
    }

    .hide-on-mobile {
        display: none;
    }

    .show-on-mobile {
        display: block;
    }
}
</style>

<style>
/* Dark-mode overrides */
body.dark-mode .analytics-container {
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
</style>
