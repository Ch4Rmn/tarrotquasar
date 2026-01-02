<template>
  <q-page class="window-height window-width relative-position">
    <div id="map" class="map-container"></div>

    <q-inner-loading
      :showing="loading"
      label="Locating your position..."
      label-class="text-primary"
      label-style="font-size: 1.1em"
    />

    <div
      ref="routingContainerRef"
      class="custom-routing-container bg-white shadow-5 overflow-auto"
      :class="
        $q.screen.lt.sm
          ? 'fixed-bottom full-width q-pb-md rounded-borders-top'
          : 'absolute-top-right q-ma-md rounded-borders'
      "
      :style="$q.screen.lt.sm ? 'max-height: 50vh;' : 'max-height: 80vh; width: 320px;'"
    ></div>

    <transition
      appear
      enter-active-class="animated slideInUp"
      leave-active-class="animated slideOutDown"
    >
      <q-card
        v-if="routeInfo"
        class="route-info-card bg-white text-dark shadow-10"
        :class="
          $q.screen.lt.sm
            ? 'fixed-bottom full-width q-pb-md rounded-borders-top'
            : 'absolute-top-left q-ma-lg '
        "
        :style="$q.screen.gt.xs ? 'width: 320px' : ''"
      >
        <q-card-section
          class="row items-center no-wrap"
          :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'"
        >
          <q-avatar
            icon="directions_car"
            color="primary"
            text-color="white"
            :size="$q.screen.lt.sm ? 'md' : 'lg'"
            class="q-mr-md"
          />
          <div class="column">
            <div class="text-weight-bold">{{ routeInfo.distance }} km</div>
            <div class="text-caption">{{ routeInfo.time }} min</div>
          </div>
          <q-space />
          <q-btn
            flat
            round
            dense
            icon="close"
            color="grey-7"
            v-if="$q.screen.lt.sm"
            @click="routeInfo = null"
          />
        </q-card-section>
      </q-card>
    </transition>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

// Icons Import
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

const $q = useQuasar()
const routeInfo = ref(null)
const loading = ref(true) // Loading State ထည့်ထားသည်
const routingContainerRef = ref(null)

// Destination (သွားမည့်နေရာ - ဥပမာ ရွှေတိဂုံ)
const destination = L.latLng(16.7983, 96.1497)

onMounted(() => {
  // Leaflet Icon Fix
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

  // 1. Initialize Map
  const map = L.map('map', { zoomControl: false }).setView([16.8409, 96.1735], 13)
  L.control.zoom({ position: 'bottomright' }).addTo(map)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map)

  // 2. Get User Location & Create Route
  // Location ရှာပြီးမှ Routing Control ကို ဆောက်ပါမယ်
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success: User Location ရရင်
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude
        const startPoint = L.latLng(userLat, userLng)

        // Map ကို User နေရာ ရွှေ့မယ်
        map.setView(startPoint, 15)

        // Route ဆွဲမယ်
        createRoutingControl(map, startPoint, destination)
        loading.value = false
      },
      (error) => {
        // Error: Location ပိတ်ထားရင် Default (Yangon) ကနေဆွဲမယ်
        console.error('GPS Error: ', error)
        $q.notify({ type: 'warning', message: 'GPS ပိတ်ထားပါသည်၊ Default နေရာမှ စပါမည်။' })

        const defaultStart = L.latLng(16.8409, 96.1735)
        createRoutingControl(map, defaultStart, destination)
        loading.value = false
      },
    )
  } else {
    // Browser doesn't support geolocation
    const defaultStart = L.latLng(16.8409, 96.1735)
    createRoutingControl(map, defaultStart, destination)
    loading.value = false
  }
})

// Function to create Routing Control
function createRoutingControl(map, startLatLng, endLatLng) {
  const routingControl = L.Routing.control({
    waypoints: [
      startLatLng, // *** ဒီနေရာမှာ User Location ဝင်လာပါမယ် ***
      endLatLng,
    ],
    routeWhileDragging: true,
    showAlternatives: true,
    collapsible: true,
    lineOptions: {
      styles: [{ color: '#1976D2', opacity: 0.7, weight: 6 }],
    },

    // အစ်ကို့ Code ထဲကအတိုင်း Container ထဲထည့်ချင်ရင် ဒါကိုသုံးပါ
    // container: routingContainerRef.value,

    createMarker: function (i, waypoint) {
      const markerIcon = L.icon({
        iconUrl:
          i === 0
            ? 'https://cdn-icons-png.flaticon.com/512/3603/3603850.png' // User Icon (Man/GPS)
            : 'https://cdn-icons-png.flaticon.com/512/3448/3448564.png', // Destination
        iconSize: [35, 35],
        iconAnchor: [17, 35],
        popupAnchor: [0, -35],
      })
      return L.marker(waypoint.latLng, {
        draggable: true,
        icon: markerIcon,
      })
    },
    addWaypoints: false,
    fitSelectedRoutes: true,
  }).addTo(map)

  // Auto-close logic on first load
  let isFirstLoad = true
  routingControl.on('routesfound', function (e) {
    const routes = e.routes
    const summary = routes[0].summary
    routeInfo.value = {
      distance: (summary.totalDistance / 1000).toFixed(1),
      time: Math.round(summary.totalTime / 60),
    }

    // Default Box Auto Close Logic
    if (isFirstLoad) {
      const container = document.querySelector('.leaflet-routing-container')
      if (container) container.classList.add('leaflet-routing-container-hide')
      isFirstLoad = false
    }
  })
}
</script>

<style>
/* CSS styles same as before... */
.map-container {
  width: 100%;
  height: 100%;
  z-index: 1;
}
.route-info-card {
  z-index: 2000;
}
.rounded-borders-top {
  border-radius: 20px 20px 0 0 !important;
}
.rounded-borders {
  border-radius: 12px !important;
}

/* Auto Close Styles */
.leaflet-routing-container-hide {
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  overflow: hidden !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>
