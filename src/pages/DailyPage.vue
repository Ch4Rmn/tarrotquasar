<template>
  <q-page class="flex flex-center bg-grey-2 column q-mt-sm">
    <!-- <div class="text-center q-mb-lg fade-in-down q-mt-md">
      <div class="text-subtitle1 text-grey-7 q-mt-xs">
        {{ todayDate }}
      </div>
    </div> -->
    <!-- <div class="text-h6 text-weight-bold text-primary font-serif"> -->
    <!-- <q-btn
      style="z-index: 11111111"
      class="absolute-top-right q-ma-md"
      push
      color="white"
      text-color="primary"
      icon="event"
      label="နေ့စဉ် ကံကြမ္မာ"
    >
      <q-badge color="orange" floating transparent>
        {{ todayDate }}
      </q-badge>
    </q-btn> -->
    <!-- </div> -->

    <div v-if="loading">
      <q-spinner-grid color="primary" size="3em" />
    </div>

    <div v-else class="scene">
      <div
        class="card-object"
        :class="{ 'is-flipped': hasDrawnToday }"
        @click="!hasDrawnToday && drawCard()"
      >
        <div class="card-face card-face-front shadow-10">
          <div class="pattern-back absolute-full flex flex-center column">
            <q-icon name="auto_awesome" color="white" size="4em" class="animate-pulse" />
            <div class="text-white text-h6 q-mt-md font-serif">ကဒ်နှိုက်ရန် နှိပ်ပါ</div>
          </div>
        </div>

        <div class="card-face card-face-back shadow-10 bg-white column">
          <div class="col-8 relative-position overflow-hidden">
            <q-img :src="getCardImage(todaysCard?.name_short)" class="full-height" fit="cover">
              <template v-slot:error>
                <div class="absolute-full flex flex-center bg-grey-3 text-grey">
                  Image not found
                </div>
              </template>
            </q-img>

            <div class="absolute-bottom text-center bg-gradient text-white q-py-sm">
              <div class="text-subtitle1 text-weight-bold">
                {{ todaysCard?.name_mm || todaysCard?.name }}
              </div>
            </div>
          </div>

          <div class="col-4 q-pa-md scroll">
            <div class="text-center">
              <q-chip dense color="primary" text-color="white" icon="star">
                ဒီနေ့အတွက် နိမိတ် {{ todayDate }}
              </q-chip>
            </div>
            <div class="text-body2 text-grey-9 text-justify q-mt-sm" style="line-height: 1.6">
              {{ todaysCard?.meaning_up_mm || todaysCard?.meaning_up }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="text-center q-mt-md text-grey fade-in-up" v-if="hasDrawnToday">
      <q-icon name="info" /> မနက်ဖြန်မှ နောက်တစ်ကြိမ် နှိုက်နိုင်ပါမည်
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar, date } from 'quasar'
import axios from 'axios'

const $q = useQuasar()

// State
const allCards = ref([])
const todaysCard = ref(null)
const loading = ref(true)
const hasDrawnToday = ref(false)
const STORAGE_KEY = 'daily_tarot_record'

const todayDate = computed(() => {
  return date.formatDate(Date.now(), 'DD MMMM YYYY')
})

// ✅ Image Mapping Function (This fixes your image issue)
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

const fetchCards = async () => {
  try {
    const response = await axios.get('/data/cards.json', { baseURL: '' })
    allCards.value = response.data.cards
    checkDailyStatus()
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}

const checkDailyStatus = () => {
  if ($q.localStorage.has(STORAGE_KEY)) {
    const record = $q.localStorage.getItem(STORAGE_KEY)
    const todayStr = date.formatDate(Date.now(), 'YYYY-MM-DD')

    if (record.date === todayStr) {
      todaysCard.value = allCards.value.find((c) => c.name_short === record.cardId)
      // Animation ကောင်းကောင်းမြင်ရအောင် အချိန်နည်းနည်းဆွဲပြီးမှ လှန်မယ်
      setTimeout(() => {
        hasDrawnToday.value = true
      }, 300)
    } else {
      $q.localStorage.remove(STORAGE_KEY)
      hasDrawnToday.value = false
    }
  }
}

const drawCard = () => {
  // Random Logic
  const randomIndex = Math.floor(Math.random() * allCards.value.length)
  const selected = allCards.value[randomIndex]

  todaysCard.value = selected

  // Save Logic
  const todayStr = date.formatDate(Date.now(), 'YYYY-MM-DD')
  $q.localStorage.set(STORAGE_KEY, {
    date: todayStr,
    cardId: selected.name_short,
  })

  // Start Animation
  hasDrawnToday.value = true
}

onMounted(() => {
  fetchCards()
})
</script>

<style scoped>
/* --- 3D Flip Animation Styles --- */
.scene {
  width: 300px;
  height: 520px;
  perspective: 1000px; /* 3D အမြင်ရအောင် Perspective ထည့်ခြင်း */
}

.card-object {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 1s; /* လှန်တဲ့ကြာချိန် (1 စက္ကန့်) */
  transform-style: preserve-3d;
  cursor: pointer;
}

/* Flip Class: ဒါဝင်လာရင် ကဒ်က ၁၈၀ ဒီဂရီ လှည့်သွားမယ် */
.card-object.is-flipped {
  transform: rotateY(180deg);
  cursor: default;
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden; /* ကျောဘက်ကို ဖျောက်ထားမယ် */
  border-radius: 16px;
  overflow: hidden;
}

/* Front Face (Card Back Design) */
.card-face-front {
  background-color: #1a1a2e;
}

/* Beautiful Pattern for Card Back */
.pattern-back {
  background-image:
    radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #1a1a2e 1px);
  background-size: 20px 20px;
  background-position:
    0 0,
    10px 10px;
  opacity: 0.8;
  border: 4px solid #d4af37; /* Gold Border */
  border-radius: 16px;
}

/* Back Face (The Result) */
.card-face-back {
  transform: rotateY(180deg); /* မူလကတည်းက ပြောင်းပြန်လှည့်ထားမယ် */
}

/* Gradient Overlay for Text */
.bg-gradient {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0));
}

/* Animations */
.animate-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.fade-in-down {
  animation: fadeInDown 0.8s ease-out;
}
.fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
