<template>
  <div class="q-pa-md no-scroll" :class="$q.dark.isActive ? 'bg-grey-10 text-white' : 'bg-grey-2'" style="overflow-y: hidden;">
    <!-- Search and Filter Section -->
    <div class="row justify-center q-mb-md">
      <div class="col-12 col-md-12 q-px-sm" style="width: 100%">
        <q-input
          v-model="searchQuery"
          outlined
          dense
          clearable
          label="Search cards"
          placeholder="Search cards..."
          :dark="$q.dark.isActive"
          :color="$q.dark.isActive ? 'orange' : 'primary'"
          :label-color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
          :bg-color="$q.dark.isActive ? 'grey-10' : 'white'"
          class="q-mb-md"
          :input-class="$q.dark.isActive ? 'text-white' : 'text-dark'"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <div class="col-12">
        <q-btn-toggle
          v-model="categoryFilter"
          toggle-color="primary"
          :options="[
            { label: 'All Cards', value: 'all' },
            { label: 'Major Arcana', value: 'major' },
            { label: 'Minor Arcana', value: 'minor' },
          ]"
          class="q-mb-md"
          spread
        />
      </div>
    </div>

    <!-- Cards Section -->
    <div class="row justify-end q-mb-md">
      <q-badge color="primary" text-color="white">{{ coc }}</q-badge>
    </div>

    <div v-if="loading" class="text-center">
      <q-spinner-orbit color="primary" size="3em" />
      <div class="text-grey q-mt-sm">Reading the stars...</div>
    </div>

    <div
      v-else
      class="row no-wrap scroll-x q-gutter-md q-pa-sm items-stretch"
      style="width: 100%; min-height: 80vh"
    >
      <div
        v-for="card in filteredCards"
        :key="card.name_short"
        class="card-container"
        style="min-width: 300px; max-width: 300px"
      >
        <q-card class="my-card column no-shadow shadow-hover full-height">
          <q-img
            :src="getCardImage(card.name_short)"
            :ratio="2 / 3"
            class="rounded-borders"
            :img-attrs="{ loading: 'lazy', decoding: 'async' }"
          >
            <div
              class="absolute-bottom text-center bg-grey-9 text-white q-py-xs"
              style="opacity: 0.9"
            >
              <div class="text-subtitle1 text-weight-bold">{{ card.name }}</div>
            </div>

            <div class="absolute-top-right q-pa-xs">
              <q-chip
                dense
                color="yellow-9"
                text-color="black"
                icon="star"
                class="text-weight-bold"
              >
                {{ card.type }}
              </q-chip>
            </div>
          </q-img>

          <q-card-section class="q-pt-md">
            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-12">
                <div class="text-caption text-grey-7 text-uppercase text-weight-bold">Upright</div>
                <div class="text-body2 text-primary">{{ card.meaning_up }}</div>
              </div>
              <div class="col-12">
                <div class="text-caption text-grey-7 text-uppercase text-weight-bold">Reversed</div>
                <div class="text-body2 text-negative">{{ card.meaning_rev }}</div>
              </div>
            </div>
          </q-card-section>

          <q-expansion-item
            icon="menu_book"
            label="Read Description"
            header-class="text-primary text-weight-bold"
            expand-icon-class="text-primary"
            dense
          >
            <q-card-section class="text-grey-8 text-justify q-pt-none">
              {{ card.desc }}
            </q-card-section>
          </q-expansion-item>

          <q-space />

          <q-separator />

          <!-- <q-card-actions align="right" class="bg-grey-1">
            <q-btn flat round color="primary" icon="visibility" />
            <q-btn flat round color="pink" icon="favorite_border" />
          </q-card-actions> -->
        </q-card>
      </div>
    </div>
  </div>

  <!-- Floating Action Button -->
  <q-page-sticky position="bottom-right" :offset="[18, 18]">
    <q-fab
      v-model="fab"
      square
      vertical-actions-align="right"
      color="primary"
      icon="share"
      direction="left"
      :class="{ 'text-white': $q.dark.isActive }"
    >
      <q-fab-action
        square
        color="green"
        icon="phone"
        @click="makeCall('+959xxxxxxxx')"
        label="Call Us"
        label-position="left"
      />
      <q-fab-action
        square
        color="purple"
        icon="phone"
        @click="openViber('+959xxxxxxxx')"
        label="Viber"
        label-position="left"
      />
      <q-fab-action
        square
        color="blue"
        icon="facebook"
        @click="openFacebook('your-facebook-page')"
        label="Facebook"
        label-position="left"
      />
    </q-fab>
  </q-page-sticky>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import axios from 'axios'

const $q = useQuasar()

const cards = ref([])
const loading = ref(true)
const categoryFilter = ref('all')
const searchQuery = ref('')
const fab = ref(false)
const CACHE_KEY = 'tarot_cards_v1' // Cache နာမည်

// Filter Logic
const filteredCards = computed(() => {
  let result = [...cards.value]

  // 1. Apply category filter
  if (categoryFilter.value !== 'all') {
    result = result.filter((card) => card.type?.toLowerCase() === categoryFilter.value)
  }

  // 2. Apply search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (card) =>
        card.name.toLowerCase().includes(query) ||
        (card.desc || '').toLowerCase().includes(query) ||
        (card.meaning_up || '').toLowerCase().includes(query),
    )
  }

  return result
})

const coc = computed(() => filteredCards.value.length)

// Notification ပြသည့် Function
const showNotify = (message, color, icon) => {
  $q.notify({
    message: message,
    color: color,
    icon: icon,
    position: 'top',
    timeout: 2000,
  })
}

const getCardImage = (shortName) => {
  if (!shortName) return ''

  const suitMap = {
    ar: 'm',
    cu: 'c',
    wa: 'w',
    sw: 's',
    pe: 'p',
  }
  const faceMap = {
    ac: '01',
    pa: '11',
    kn: '12',
    qu: '13',
    ki: '14',
  }

  const code = shortName.toLowerCase()
  const suit = code.substring(0, 2)
  const tail = code.substring(2)
  const prefix = suitMap[suit] || suit

  if (/^\d+$/.test(tail)) {
    return `/cards/${prefix}${tail.padStart(2, '0')}.jpg`
  }
  if (faceMap[tail]) {
    return `/cards/${prefix}${faceMap[tail]}.jpg`
  }
  return ''
}

const fetchTarotCards = async () => {
  loading.value = true

  try {
    // ၁။ Cache ထဲမှာ Data ရှိမရှိ အရင်စစ်မယ် (Quasar LocalStorage)
    if ($q.localStorage.has(CACHE_KEY)) {
      console.log('Loading from Cache...')

      // Quasar က JSON parse ကို အလိုအလျောက် လုပ်ပေးပါတယ်
      cards.value = $q.localStorage.getItem(CACHE_KEY)

      showNotify('Data loaded from Cache', 'green', 'cloud_done')
      console.log(cards.value._rawValue)

      loading.value = false
      return // Cache ရှိရင် ဒီမှာတင် ရပ်လိုက်မယ် (API ဆက်မခေါ်တော့ဘူး)
    }

    // ၂။ Cache မရှိမှ API ကို လှမ်းခေါ်မယ်
    console.log('Fetching from API...')
    const response = await axios.get('/data/cards.json', { baseURL: '' })
    cards.value = response.data.cards
    // console.log(cards)

    // ၃။ ရလာတဲ့ Data ကို Cache ထဲ သိမ်းမယ်
    $q.localStorage.set(CACHE_KEY, cards.value)

    showNotify('Data fetched from Server', 'blue', 'download')
  } catch (error) {
    console.error('Error:', error)
    showNotify('Failed to load cards', 'negative', 'warning')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTarotCards()
})

// Social media functions
const makeCall = (number) => {
  window.location.href = `tel:${number}`
}

const openViber = (number) => {
  window.open(`viber://chat?number=${encodeURIComponent(number)}`, '_blank')
}

const openFacebook = (page) => {
  window.open(`https://facebook.com/${page}`, '_blank')
}
</script>

<style scoped>
/* Modern Scrollbar */
.scroll-x::-webkit-scrollbar {
  height: 8px;
  display: none;
}
.scroll-x::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
.scroll-x::-webkit-scrollbar-thumb {
  background: var(--q-primary);
  border-radius: 4px;
}
.scroll-x::-webkit-scrollbar-thumb:hover {
  background: #555;
}
/* Hide scrollbar but keep horizontal scroll */
.scroll-x {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* Card Container and Height */
.card-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.my-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Card Hover Effect */
.shadow-hover {
  transition: all 0.3s ease;
  border: 1px solid #eee;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.shadow-hover:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

/* Ensure q-card-section takes available space */
.q-card__section {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
</style>
