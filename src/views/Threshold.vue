<template>
    <div class="thresholds-container">
        <!-- Header -->
        <div class="page-header">
            <div>
                <h2 class="page-title">Threshold Settings</h2>
                <nav class="breadcrumb">
                    <span>Cavill</span> &gt;
                    <span>Menu</span> &gt;
                    <span>Thresholds</span>
                </nav>
            </div>

            <div class="actions">
                <button class="control-button outline" @click="evaluateNow">
                    <i class="fas fa-play"></i><span>Evaluate Now</span>
                </button>
                <button class="control-button outline" @click="sendTestEmail">
                    <i class="fas fa-paper-plane"></i><span>Send Test Email</span>
                </button>
            </div>
        </div>

        <!-- Settings Form -->
        <section class="panel">
            <div class="panel-header">
                <h3>Alert Configuration</h3>
            </div>

            <div class="panel-body">
                <!-- Row: Enable -->
                <div class="form-line">
                    <label class="label">Enable Alerts</label>
                    <label class="switch">
                        <input type="checkbox" v-model="settings.enabled" />
                        <span class="slider"></span>
                    </label>
                </div>

                <!-- Row: Emails -->
                <div class="form-line">
                    <label class="label">Notification Emails</label>
                    <div class="field-col">
                        <input class="input" v-model="emailsRaw" placeholder="e.g. ops@example.com, alan@np.gov.sg" />
                        <small class="hint">Comma-separated list. We’ll validate before saving.</small>
                        <div v-if="emailErrors.length" class="error">
                            Invalid: {{ emailErrors.join(', ') }}
                        </div>
                    </div>
                </div>

                <!-- Each on its own line -->
                <div class="form-line">
                    <label class="label">Occupancy Threshold (%)</label>
                    <input class="input input-sm" type="number" min="1" max="100"
                        v-model.number="settings.occPercent" />
                </div>

                <div class="form-line">
                    <label class="label">Time Over Threshold (min)</label>
                    <input class="input input-sm" type="number" min="1" v-model.number="settings.windowMinutes" />
                </div>

                <div class="form-line">
                    <label class="label">Cooldown (min)</label>
                    <input class="input input-sm" type="number" min="1" v-model.number="settings.cooldownMinutes" />
                </div>

                <div class="form-line">
                    <label class="label">
                        Ammonia Threshold (ppm) <span class="muted">(optional / future)</span>
                    </label>
                    <div class="inline-field">
                        <input class="input input-sm" type="number" min="1" step="1"
                            :placeholder="DEFAULT_AMMONIA_PPM.toString()" v-model.number="settings.ammoniaPpm" />
                        <button type="button" class="control-button outline sm"
                            @click="settings.ammoniaPpm = DEFAULT_AMMONIA_PPM">
                            Use {{ DEFAULT_AMMONIA_PPM }}
                        </button>
                    </div>
                </div>



                <div class="form-actions">
                    <button class="control-button primary" @click="saveSettings">
                        <i class="fas fa-save"></i><span>Save Settings</span>
                    </button>
                    <span class="save-status" v-if="saveMsg">{{ saveMsg }}</span>
                </div>
            </div>
        </section>

        <!-- History -->
        <section class="panel">
            <div class="panel-header">
                <h3>Recent Alerts</h3>
                <div class="panel-actions">
                    <button class="control-button outline sm" @click="clearHistory">
                        <i class="fas fa-trash"></i><span>Clear History</span>
                    </button>
                </div>
            </div>
            <div class="panel-body">
                <table class="table" v-if="historySorted.length">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Type</th>
                            <th>Toilet</th>
                            <th class="num">Occupancy</th>
                            <th class="num">Capacity</th>
                            <th class="num">Utilization</th>
                            <th>Recipients</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="h in historySorted" :key="h.id">
                            <td :title="fmt(h.ts)">{{ fmt(h.ts) }}</td>
                            <td><span class="pill pill-occupancy" v-if="h.kind === 'Occupancy'">Occupancy</span><span
                                    v-else class="pill">{{ h.kind }}</span></td>
                            <td>
                                <div class="toilet-name">{{ h.toilet?.name || h.toilet?.id || '-' }}</div>
                                <div class="muted small" v-if="h.toilet?.region">{{ h.toilet.region }}</div>
                            </td>
                            <td class="num">{{ h.metrics?.occupancy ?? '-' }}</td>
                            <td class="num">{{ h.metrics?.capacity ?? '-' }}</td>
                            <td class="num">
                                <span v-if="h.metrics">
                                    {{ Math.round((h.metrics.occupancy / Math.max(1, h.metrics.capacity || 1)) * 100)
                                    }}%
                                </span>
                                <span v-else>-</span>
                            </td>
                            <td class="wrap">{{ (h.recipients || []).join(', ') }}</td>
                            <td>
                                <span :class="['status', h.status]">{{ h.status }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div v-else class="muted">No alerts yet.</div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'

/* Storage keys */
const LS_TOILETS = 'sg-toilets-dashboard-v1'
const LS_SETTINGS = 'threshold-settings-v1'
const LS_HISTORY = 'threshold-history-v1'
const LS_LASTFIRE = 'threshold-lastFired-v1'

// near the top of <script setup>
const DEFAULT_AMMONIA_PPM = 35

// in settings reactive state
const settings = reactive({
    enabled: true,
    occPercent: 80,
    windowMinutes: 5,
    cooldownMinutes: 30,
    ammoniaPpm: DEFAULT_AMMONIA_PPM,   // <-- preset
    recipients: []
})

const emailsRaw = ref('')
const saveMsg = ref('')
const history = ref([])

/* Load/Save settings & history */
function loadSettings() {
    const raw = localStorage.getItem(LS_SETTINGS)
    if (raw) {
        try {
            const s = JSON.parse(raw)
            Object.assign(settings, s)
            // backfill if missing or empty
            if (settings.ammoniaPpm == null || settings.ammoniaPpm === '') {
                settings.ammoniaPpm = DEFAULT_AMMONIA_PPM
            }
            emailsRaw.value = (s.recipients || []).join(', ')
        } catch { }
    }
}

function saveSettings() {
    const valid = validateEmails()
    if (!valid) return
    settings.recipients = parsedEmails()
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings))
    saveMsg.value = 'Saved.'
    setTimeout(() => (saveMsg.value = ''), 1500)
}
function loadHistory() {
    const raw = localStorage.getItem(LS_HISTORY)
    history.value = raw ? JSON.parse(raw) : []
}
function pushHistory(entry) {
    const list = [...history.value, entry]
    history.value = list
    localStorage.setItem(LS_HISTORY, JSON.stringify(list))
}
function clearHistory() {
    history.value = []
    localStorage.removeItem(LS_HISTORY)
}

/* Email helpers */
const emailErrors = ref([])
function parsedEmails() {
    return emailsRaw.value
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
}
function validateEmails() {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const list = parsedEmails()
    emailErrors.value = list.filter(e => !re.test(e))
    return emailErrors.value.length === 0
}

/* Evaluator loop */
let timer = null
const POLL_MS = 30000 // 30s
const lastFired = ref({})
const exceedSince = ref({})

function loadLastFired() {
    const raw = localStorage.getItem(LS_LASTFIRE)
    lastFired.value = raw ? JSON.parse(raw) : {}
}
function saveLastFired() {
    localStorage.setItem(LS_LASTFIRE, JSON.stringify(lastFired.value))
}
function readToilets() {
    const raw = localStorage.getItem(LS_TOILETS)
    try { return raw ? JSON.parse(raw) : [] } catch { return [] }
}
function occupancyOf(t) {
    const i = t.counters?.in ?? 0
    const o = t.counters?.out ?? 0
    return Math.max(0, i - o)
}
function evaluateNow() {
    if (!settings.enabled) return
    const toilets = readToilets()
    const now = Date.now()

    const thresholdRatio = (settings.occPercent / 100)
    const windowMs = settings.windowMinutes * 60 * 1000
    const cooldownMs = settings.cooldownMinutes * 60 * 1000

    for (const t of toilets) {
        const cap = Math.max(1, t.capacity || 1)
        const occ = occupancyOf(t)
        const util = occ / cap
        const id = t.id || t.name || t.address || JSON.stringify(t)

        if (util >= thresholdRatio) {
            if (!exceedSince.value[id]) exceedSince.value[id] = now
        } else {
            delete exceedSince.value[id]
            continue
        }

        const exceededFor = now - (exceedSince.value[id] || now)
        if (exceededFor < windowMs) continue

        const last = lastFired.value[id] || 0
        if (now - last < cooldownMs) continue

        const entry = {
            id: `${now}-${id}`,
            ts: now,
            kind: 'Occupancy',
            recipients: settings.recipients,
            toilet: { id, name: t.name, region: t.region },
            metrics: { occupancy: occ, capacity: cap },
            status: 'queued'
        }

        sendAlertEmail(settings.recipients, entry)
            .then(() => entry.status = 'sent')
            .catch(() => entry.status = 'failed')
            .finally(() => pushHistory(entry))

        lastFired.value[id] = now
        saveLastFired()
    }
}

/* Email sending stub */
async function sendAlertEmail(recipients, payload) {
    if (!recipients || recipients.length === 0) throw new Error('No recipients configured')
    await new Promise(res => setTimeout(res, 200))
    return true
}

/* Demo seed: add hardcoded recent alerts if empty */
function seedDemoAlertsIfEmpty() {
    if (history.value && history.value.length) return
    const now = Date.now()
    const sampleToilets = [
        { id: 'raffles-m-3', name: 'Raffles City Tower - L3 (M)', region: 'Central' },
        { id: 'marina-f-1', name: 'Marina Bay Sands - L1 (F)', region: 'South' },
        { id: 'orchard-m-b2', name: 'ION Orchard - B2 (M)', region: 'Central' }
    ]
    const samples = [
        {
            id: `demo-${now - 5 * 60 * 1000}`,
            ts: now - 5 * 60 * 1000,
            kind: 'Occupancy',
            recipients: settings.recipients.length ? settings.recipients : ['ops@cavill.biz'],
            toilet: sampleToilets[0],
            metrics: { occupancy: 19, capacity: 20 },
            status: 'sent'
        },
        {
            id: `demo-${now - 40 * 60 * 1000}`,
            ts: now - 40 * 60 * 1000,
            kind: 'Occupancy',
            recipients: settings.recipients.length ? settings.recipients : ['ops@cavill.biz'],
            toilet: sampleToilets[1],
            metrics: { occupancy: 45, capacity: 50 },
            status: 'sent'
        },
        {
            id: `demo-${now - 2 * 60 * 60 * 1000}`,
            ts: now - 2 * 60 * 60 * 1000,
            kind: 'Occupancy',
            recipients: settings.recipients.length ? settings.recipients : ['ops@cavill.biz'],
            toilet: sampleToilets[2],
            metrics: { occupancy: 32, capacity: 40 },
            status: 'failed'
        }
    ]
    history.value = samples
    localStorage.setItem(LS_HISTORY, JSON.stringify(samples))
}

/* Utils */
const historySorted = computed(() => [...history.value].sort((a, b) => b.ts - a.ts))
const fmt = ts => new Date(ts).toLocaleString()

/* Lifecycle */
onMounted(() => {
    loadSettings()
    loadHistory()
    loadLastFired()
    seedDemoAlertsIfEmpty()  // <--- remove this line if you don't want seeded alerts
    timer = setInterval(evaluateNow, POLL_MS)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.thresholds-container {
    padding: 20px;
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
    flex-wrap: wrap;
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

.control-button.primary {
    background: var(--header-icon-hover-color);
    color: #fff;
    border-color: transparent;
}

.control-button.sm {
    padding: 8px 10px;
    font-size: 12px;
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.panel-header h3 {
    margin: 0;
    font-size: 16px;
}

.panel-actions {
    display: flex;
    gap: 8px;
}

.panel-body {
    padding: 14px;
}

/* Form layout */
.form-line {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 16px;
    align-items: center;
    margin-bottom: 14px;
}

.label {
    font-weight: 700;
    color: var(--main-text-color);
}

.sub-label {
    font-weight: 700;
    color: var(--main-text-color);
    font-size: 13px;
}

.field-col {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(160px, 1fr));
    gap: 12px;
    margin: 10px 0 6px;
}

.inline-field {
    display: inline-flex;
    gap: 8px;
    align-items: center;
}

@media (max-width: 1024px) {
    .inline-field {
        display: grid;
        grid-template-columns: 1fr auto;
    }
}


.form-group.compact .input {
    max-width: 220px;
}

/* Already in your file – ensures label/field row */
.form-line {
    display: grid;
    grid-template-columns: 240px 1fr;
    /* label | field */
    gap: 16px;
    align-items: center;
    margin-bottom: 14px;
}

/* Make inputs pleasantly compact on desktop, full width on mobile */
.input-sm {
    max-width: 260px;
}

@media (max-width: 1024px) {
    .form-line {
        grid-template-columns: 1fr;
        align-items: start;
    }

    .input-sm {
        max-width: 100%;
    }
}


.input {
    padding: 10px 12px;
    border: 1px solid var(--header-border-color);
    border-radius: 8px;
    background: var(--main-bg-color);
    color: var(--main-text-color);
}

.input-sm {
    max-width: 220px;
}

/* <-- ammonia compact width */
.hint {
    font-size: 12px;
    opacity: 0.8;
}

.error {
    margin-top: 4px;
    color: #ff6b6b;
    font-size: 12px;
}

.form-actions {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.save-status {
    opacity: 0.8;
}

/* Switch */
.switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
}

.switch input {
    display: none;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #aaa;
    transition: .2s;
    border-radius: 999px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background: white;
    transition: .2s;
    border-radius: 50%;
}

.switch input:checked+.slider {
    background: var(--header-icon-hover-color);
}

.switch input:checked+.slider:before {
    transform: translateX(20px);
}

/* Table / History */
.table {
    width: 100%;
    border-collapse: collapse;
}

.table th,
.table td {
    padding: 10px;
    border-bottom: 1px solid var(--header-border-color);
    vertical-align: top;
}

.table th {
    text-align: left;
    font-weight: 700;
}

.table .num {
    text-align: right;
}

.toilet-name {
    font-weight: 700;
}

.small {
    font-size: 12px;
}

.wrap {
    word-break: break-word;
}

/* Pills & Status */
.pill {
    display: inline-block;
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.08);
}

.pill-occupancy {
    background: rgba(255, 165, 0, 0.18);
}

.status {
    text-transform: capitalize;
    font-weight: 700;
    font-size: 12px;
}

.status.sent {
    color: #24a148;
}

.status.failed {
    color: #da1e28;
}

.status.queued {
    color: #f1c21b;
}

/* Responsive */
@media (max-width: 1024px) {
    .form-line {
        grid-template-columns: 1fr;
        align-items: start;
    }

    .form-grid-3 {
        grid-template-columns: 1fr;
    }

    .input-sm {
        max-width: 100%;
    }
}

@media (max-width: 768px) {
    .thresholds-container {
        padding: 12px;
    }

    .page-title {
        font-size: 20px;
    }
}
</style>
