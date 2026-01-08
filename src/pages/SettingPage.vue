<template>
  <q-page class="settings-page q-pa-md" :style="{ '--settings-accent': form.accentColor }">
    <div class="settings-hero q-mb-md">
      <div class="text-h5 text-weight-bold">Settings</div>
      <div class="text-subtitle2 text-grey-3">Tune your tarot experience</div>
      <div v-if="lastSaved" class="text-caption text-grey-5 q-mt-xs">
        Last saved {{ lastSaved }}
      </div>
    </div>

    <q-tabs v-model="activeTab" class="settings-tabs" align="justify" no-caps>
      <q-tab name="appearance" icon="palette" label="Appearance" />
      <q-tab name="accessibility" icon="accessible" label="Access" />
      <q-tab name="status" icon="schedule" label="Status" />
      <q-tab name="reminder" icon="notifications" label="Reminder" />
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated class="settings-panels">
      <q-tab-panel name="appearance">
        <q-card class="settings-card">
          <q-card-section class="text-subtitle1 text-weight-bold">Appearance</q-card-section>
          <q-separator />
          <q-card-section class="q-gutter-md">
            <q-item class="settings-item">
              <q-item-section>
                <q-item-label>Dark mode</q-item-label>
                <q-item-label caption>Match your mood for night readings</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle v-model="form.darkMode" color="amber-6" />
              </q-item-section>
            </q-item>

            <q-item class="settings-item">
              <q-item-section>
                <q-item-label>Accent color</q-item-label>
                <q-item-label caption>Highlight cards and buttons</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-select
                  v-model="form.accentColor"
                  :options="accentOptions"
                  dense
                  outlined
                  emit-value
                  map-options
                  options-dense
                />
              </q-item-section>
            </q-item>

            <q-item class="settings-item">
              <q-item-section>
                <q-item-label>Font scale</q-item-label>
                <q-item-label caption>{{ form.fontScale }}%</q-item-label>
              </q-item-section>
              <q-item-section>
                <q-slider
                  v-model="form.fontScale"
                  :min="85"
                  :max="120"
                  :step="5"
                  label
                  label-always
                  color="amber-6"
                />
              </q-item-section>
            </q-item>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <q-tab-panel name="accessibility">
        <q-card class="settings-card">
          <q-card-section class="text-subtitle1 text-weight-bold">Accessibility</q-card-section>
          <q-separator />
          <q-card-section class="q-gutter-md">
            <q-item class="settings-item">
              <q-item-section>
                <q-item-label>Reduce motion</q-item-label>
                <q-item-label caption>Calmer transitions and animations</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle v-model="form.reduceMotion" color="amber-6" />
              </q-item-section>
            </q-item>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <q-tab-panel name="status">
        <q-card class="settings-card">
          <q-card-section class="text-subtitle1 text-weight-bold">Status Bar</q-card-section>
          <q-separator />
          <q-card-section class="q-gutter-md">
            <q-item class="settings-item">
              <q-item-section>
                <q-item-label>Show time</q-item-label>
                <q-item-label caption>Display time in the header</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle v-model="form.showTime" color="amber-6" />
              </q-item-section>
            </q-item>

            <q-item class="settings-item">
              <q-item-section>
                <q-item-label>Show weather</q-item-label>
                <q-item-label caption>Display the current weather</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle v-model="form.showWeather" color="amber-6" />
              </q-item-section>
            </q-item>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <q-tab-panel name="reminder">
        <q-card class="settings-card">
          <q-card-section class="text-subtitle1 text-weight-bold">Daily Reminder</q-card-section>
          <q-separator />
          <q-card-section class="q-gutter-md">
            <q-item class="settings-item">
              <q-item-section>
                <q-item-label>Enable reminder</q-item-label>
                <q-item-label caption>Keep a consistent tarot habit</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle v-model="form.dailyReminderEnabled" color="amber-6" />
              </q-item-section>
            </q-item>
            <q-item class="settings-item">
              <q-item-section>
                <q-item-label>Reminder time</q-item-label>
                <q-item-label caption>Choose when to check in</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model="form.dailyReminderTime"
                  type="time"
                  dense
                  outlined
                  :disable="!form.dailyReminderEnabled"
                />
              </q-item-section>
            </q-item>
          </q-card-section>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const SETTINGS_KEY = 'app:settings'

const accentOptions = [
  { label: 'Solar', value: '#f4a261' },
  { label: 'Ocean', value: '#2a9d8f' },
  { label: 'Rose', value: '#e76f51' },
  { label: 'Indigo', value: '#577590' },
]

const form = reactive({
  darkMode: $q.dark.isActive,
  accentColor: '#f4a261',
  fontScale: 100,
  reduceMotion: false,
  showTime: true,
  showWeather: true,
  dailyReminderEnabled: false,
  dailyReminderTime: '08:00',
})

const lastSaved = ref('')
const activeTab = ref('appearance')
let ready = false

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch (error) {
    console.error('Settings load failed', error)
    return {}
  }
}

const applySettings = (settings) => {
  $q.dark.set(!!settings.darkMode)
  const scale = Number(settings.fontScale) || 100
  document.documentElement.style.fontSize = `${scale}%`
  document.body.classList.toggle('reduce-motion', !!settings.reduceMotion)
}

const saveSettings = () => {
  const snapshot = { ...form }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(snapshot))
  lastSaved.value = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
  window.dispatchEvent(new CustomEvent('settings:updated', { detail: { settings: snapshot } }))
}

onMounted(() => {
  const stored = loadSettings()
  Object.assign(form, stored)
  applySettings(form)
  ready = true
})

watch(
  form,
  () => {
    if (!ready) return
    applySettings(form)
    saveSettings()
  },
  { deep: true },
)
</script>

<style scoped>
.settings-page {
  min-height: 100%;
  background:
    radial-gradient(circle at top right, rgba(255, 200, 120, 0.15), transparent 45%),
    radial-gradient(circle at 10% 20%, rgba(86, 150, 255, 0.15), transparent 50%),
    linear-gradient(180deg, #1f1b24 0%, #120f14 100%);
  color: #f7f3e9;
}

.settings-hero {
  padding: 16px 18px;
  border-radius: 16px;
  background: rgba(18, 15, 20, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.settings-tabs {
  background: rgba(15, 13, 18, 0.55);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.settings-panels {
  margin-top: 12px;
  background: transparent;
}

.settings-card {
  background: rgba(15, 13, 18, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 0 0 1px var(--settings-accent),
    0 18px 30px rgba(0, 0, 0, 0.35);
  border-radius: 16px;
}

.settings-item {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
}

.settings-item :deep(.q-item__label) {
  color: #f7f3e9;
}

.settings-item :deep(.q-item__label--caption) {
  color: rgba(247, 243, 233, 0.6);
}

@media (max-width: 600px) {
  .settings-hero {
    padding: 14px;
  }
}
</style>
