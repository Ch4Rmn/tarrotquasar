<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <!-- <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" /> -->

        <q-toolbar-title>MP tarot </q-toolbar-title>

        <q-space />

        <q-btn
          flat
          dense
          :icon="theme === 'dark' ? 'dark_mode' : 'light_mode'"
          @click="toggleDarkMode"
        >
          <q-tooltip>Toggle Dark Mode</q-tooltip>
        </q-btn>
        <div class="row items-center q-gutter-sm">
          <div class="column items-end">
            <div class="text-caption">{{ timeText }}</div>
            <div class="text-caption text-grey-4" v-if="weatherText">{{ weatherText }}</div>
            <div class="text-caption text-grey-5" v-else-if="weatherError">Weather unavailable</div>
          </div>
          <q-avatar v-if="weatherIcon" size="28px">
            <img :src="weatherIcon" alt="Weather" />
          </q-avatar>
          <!-- <q-select
            v-model="selectedCity"
            :options="cityOptions"
            dense
            outlined
            options-dense
            emit-value
            map-options
            class="city-select"
            :dark="$q.dark.isActive"
            color="orange"
            label="City"
          /> -->
        </div>
        <!-- <div class="q-ml-md">App Version {{ $q.version }}</div> -->
      </q-toolbar>
    </q-header>

    <!-- <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Essential Links </q-item-label>

        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer> -->

    <q-page-container>
      <MusicPage v-show="$route.path === '/music'" />
      <router-view v-slot="{ Component, route }">
        <component v-if="route.path !== '/music'" :is="Component" />
      </router-view>
    </q-page-container>
    <FooterPage />
  </q-layout>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
// import EssentialLink from 'components/EssentialLink.vue'
import FooterPage from 'layouts/FooterPageTwo.vue'
import MusicPage from 'pages/MusicPage.vue'

const $q = useQuasar()

// dark mode
const theme = ref($q.dark.isActive ? 'dark' : 'light')

const toggleDarkMode = () => {
  $q.dark.toggle()
  theme.value = $q.dark.isActive ? 'dark' : 'light'
}
// end

const WEATHER_API_KEY = '09f82d5ccd23f8c1471bd35fc02996a5'
const WEATHER_LOCATION_KEY = 'weather:city'
// const cityOptions = [
//   { label: 'Yangon', value: 'Yangon' },
//   { label: 'Mandalay', value: 'Mandalay' },
//   { label: 'Naypyitaw', value: 'Naypyitaw' },
// ]
const selectedCity = ref('Yangon')
const cityCoords = {
  Yangon: { lat: 16.8409, lon: 96.1735 },
  Mandalay: { lat: 21.9588, lon: 96.0891 },
  Naypyitaw: { lat: 19.7633, lon: 96.0785 },
}
const now = ref(new Date())
const weatherText = ref('')
const weatherIcon = ref('')
const weatherError = ref(false)
let timeTimerId = null
let weatherTimerId = null

const timeText = computed(() =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now.value),
)

const weatherCodeText = (code) => {
  const map = {
    0: 'Clear',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    81: 'Rain showers',
    82: 'Heavy showers',
    95: 'Thunderstorm',
  }
  return map[code] || 'Weather'
}

const fetchOpenMeteo = async () => {
  const coords = cityCoords[selectedCity.value] || cityCoords.Yangon
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`,
  )
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`)
  const data = await res.json()
  const tempC = data?.current_weather?.temperature
  const code = data?.current_weather?.weathercode

  weatherText.value =
    tempC != null ? `${tempC}°C · ${weatherCodeText(code)} · ${selectedCity.value}` : ''
  weatherIcon.value = ''
}

const fetchWeather = async () => {
  weatherError.value = false
  try {
    const res = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
        selectedCity.value,
      )}`,
    )
    if (!res.ok) throw new Error(`Weather error: ${res.status}`)
    const data = await res.json()
    const tempC = data?.current?.temp_c
    const condition = data?.current?.condition?.text
    const location = data?.location?.name
    const icon = data?.current?.condition?.icon

    weatherText.value =
      tempC != null && condition
        ? `${tempC}°C · ${condition}${location ? ` · ${location}` : ''}`
        : ''
    weatherIcon.value = icon ? `https:${icon}` : ''
  } catch (error) {
    try {
      await fetchOpenMeteo()
      weatherError.value = false
    } catch (fallbackError) {
      console.error(error)
      console.error(fallbackError)
      weatherError.value = true
      weatherText.value = ''
      weatherIcon.value = ''
    }
  }
}

onMounted(() => {
  const savedCity = localStorage.getItem(WEATHER_LOCATION_KEY)
  if (savedCity) selectedCity.value = savedCity

  timeTimerId = setInterval(() => {
    now.value = new Date()
  }, 60 * 1000)
  fetchWeather()
  weatherTimerId = setInterval(fetchWeather, 15 * 60 * 1000)
})

onUnmounted(() => {
  if (timeTimerId) clearInterval(timeTimerId)
  if (weatherTimerId) clearInterval(weatherTimerId)
})

watch(selectedCity, (value) => {
  localStorage.setItem(WEATHER_LOCATION_KEY, value)
  fetchWeather()
})

// const linksList = [
//   {
//     title: 'Docs',
//     caption: 'quasar.dev',
//     icon: 'school',
//     link: 'https://quasar.dev',
//   },
//   {
//     title: 'Github',
//     caption: 'github.com/quasarframework',
//     icon: 'code',
//     link: 'https://github.com/quasarframework',
//   },
//   {
//     title: 'Discord Chat Channel',
//     caption: 'chat.quasar.dev',
//     icon: 'chat',
//     link: 'https://chat.quasar.dev',
//   },
//   {
//     title: 'Forum',
//     caption: 'forum.quasar.dev',
//     icon: 'record_voice_over',
//     link: 'https://forum.quasar.dev',
//   },
//   {
//     title: 'Twitter',
//     caption: '@quasarframework',
//     icon: 'rss_feed',
//     link: 'https://twitter.quasar.dev',
//   },
//   {
//     title: 'Facebook',
//     caption: '@QuasarFramework',
//     icon: 'public',
//     link: 'https://facebook.quasar.dev',
//   },
//   {
//     title: 'Quasar Awesome',
//     caption: 'Community Quasar projects',
//     icon: 'favorite',
//     link: 'https://awesome.quasar.dev',
//   },
// ]

// const leftDrawerOpen = ref(false)

// function toggleLeftDrawer() {
//   leftDrawerOpen.value = !leftDrawerOpen.value
// }
</script>
