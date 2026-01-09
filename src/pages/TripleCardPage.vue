<template>
  <q-page class="q-pa-md bg-grey-10 text-white triple-page">
    <div class="row items-start q-col-gutter-md">
      <div class="col-12">
        <q-card class="bg-grey-9 text-white">
          <q-card-section>
            <div class="text-h5 text-weight-bold">{{ $t('triple.title') }}</div>
            <div class="text-caption text-grey-4">
              {{ $t('triple.subtitle') }}
            </div>
          </q-card-section>

          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-btn color="orange" :label="$t('triple.nextSpread')" @click="drawSpread" />
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="text-subtitle2 text-grey-4 q-mb-sm">{{ $t('triple.currentSpread') }}</div>
            <div class="row q-col-gutter-md justify-center spread-grid">
              <div
                v-for="(card, index) in currentSpread"
                :key="card.name_short"
                class="col-12 col-sm-4"
              >
                <div class="text-caption text-grey-4 text-center q-mb-xs">
                  {{ $t(`triple.roles.${spreadRoles[index]}`) }}
                </div>
                <q-card class="bg-grey-10 tarot-card" clickable @click="openCard(card)">
                  <q-img
                    :src="cardImage(card.name_short)"
                    :ratio="2 / 3"
                    fit="cover"
                    class="tarot-img"
                  />
                  <div class="q-pa-xs text-caption text-center text-grey-3">
                    {{ card.name }}
                  </div>
                </q-card>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="text-subtitle2 text-grey-4 q-mb-sm">{{ $t('triple.combinedTitle') }}</div>
            <div class="text-body2 text-grey-2 q-mb-sm">
              {{ $t('triple.combinedSubtitle') }}
            </div>
            <div v-if="combinedLines.length" class="combined-reading">
              <div v-for="(line, index) in combinedLines" :key="index" class="q-mb-xs">
                {{ line }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-dialog
      v-model="isDialogOpen"
      :maximized="$q.screen.lt.sm"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="bg-grey-9 text-white card-dialog">
        <q-card-section class="row items-start">
          <div class="col-12 col-sm-5">
            <q-img
              v-if="selectedCard"
              :src="cardImage(selectedCard.name_short)"
              :ratio="2 / 3"
              fit="cover"
              class="rounded-borders"
            />
          </div>
          <div class="col-12 col-sm-7">
            <div class="text-h6 text-weight-bold q-mb-xs">{{ selectedCard?.name }}</div>
            <div class="text-caption text-grey-4 q-mb-md">
              {{ selectedCard?.type }} · {{ selectedCard?.value }}
            </div>
            <div class="text-body2 q-mb-sm">
              <span class="text-grey-4">Upright:</span> {{ selectedCard?.meaning_up }}
            </div>
            <div class="text-body2 q-mb-sm">
              <span class="text-grey-4">Reversed:</span> {{ selectedCard?.meaning_rev }}
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="text-body2">
          {{ selectedCard?.desc }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="grey-4" label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

const cards = ref([])
const currentSpread = ref([])
const selectedCard = ref(null)
const isDialogOpen = ref(false)
const spreadRoles = ['past', 'present', 'future']

const $q = useQuasar()
const { t } = useI18n()

const CARDS_CACHE_KEY = 'tarot_cards_v1'

const cardImage = (nameShort) => `https://www.sacred-texts.com/tarot/pkt/img/${nameShort}.jpg`

const loadCards = async () => {
  try {
    const res = await fetch('/data/cards.json')
    if (!res.ok) throw new Error('Cards fetch failed')
    const data = await res.json()
    cards.value = data.cards || []
    localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify(cards.value))
  } catch (error) {
    const cached = localStorage.getItem(CARDS_CACHE_KEY)
    cards.value = cached ? JSON.parse(cached) : []
    console.log(error)
  }
}

const drawSpread = () => {
  if (cards.value.length < 3) return
  const pool = [...cards.value]
  const pick = []
  for (let i = 0; i < 3; i += 1) {
    const index = Math.floor(Math.random() * pool.length)
    pick.push(pool.splice(index, 1)[0])
  }
  currentSpread.value = pick
}

const openCard = (card) => {
  selectedCard.value = card
  isDialogOpen.value = true
}

const combinedLines = computed(() => {
  if (currentSpread.value.length < 3) return []
  const [past, present, future] = currentSpread.value
  return [
    t('triple.combined.pastLine', { card: past.name, meaning: past.meaning_up }),
    t('triple.combined.presentLine', { card: present.name, meaning: present.meaning_up }),
    t('triple.combined.futureLine', { card: future.name, meaning: future.meaning_up }),
    t('triple.combined.summary', {
      pastCard: past.name,
      presentCard: present.name,
      futureCard: future.name,
    }),
  ]
})

onMounted(async () => {
  await loadCards()
  drawSpread()
})
</script>

<style scoped>
.q-page {
  min-height: 100%;
}

.spread-grid {
  align-items: stretch;
}

.tarot-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.tarot-img {
  border-radius: 12px 12px 0 0;
}

.tarot-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.45);
}

.card-dialog {
  width: min(900px, 92vw);
  max-height: 86vh;
  overflow: auto;
}

.combined-reading {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 14px;
}

@media (max-width: 600px) {
  .triple-page {
    padding: 12px;
  }

  .spread-grid {
    row-gap: 16px;
  }

  .tarot-card {
    max-width: 320px;
    margin: 0 auto;
  }

  .card-dialog {
    width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
