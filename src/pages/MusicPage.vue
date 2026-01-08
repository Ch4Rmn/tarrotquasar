<template>
  <q-page class="bg-grey-10 text-white" style="padding-bottom: 150px">
    <div class="q-pa-md bg-gradient">
      <div class="text-h4 text-weight-bold q-mb-sm">My Playlist</div>
      <div class="row items-center q-mb-md">
        <div class="col-12 col-md-6">
          <q-input
            v-model="searchQuery"
            outlined
            dense
            dark
            color="orange"
            placeholder="Search Internet Archive..."
            clearable
            class="q-mb-sm"
            @keyup.enter="searchArchive"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
            <template v-slot:append>
              <q-btn
                flat
                dense
                round
                icon="search"
                color="orange"
                :loading="isSearching"
                @click="searchArchive"
              />
            </template>
          </q-input>
        </div>
      </div>
      <div class="text-subtitle2 text-grey-4">
        {{ filteredPlaylist.length }} results
      </div>
      <div class="q-mt-sm">
        <q-chip
          v-for="singer in famousSingers"
          :key="singer"
          clickable
          color="grey-9"
          text-color="orange"
          class="q-mr-xs q-mb-xs"
          @click="searchFromSinger(singer)"
        >
          {{ singer }}
        </q-chip>
      </div>
      <div v-if="searchError" class="text-negative text-caption q-mt-xs">
        {{ searchError }}
      </div>
    </div>

    <q-list dark separator>
      <q-item
        v-for="(song, index) in filteredPlaylist"
        :key="index"
        clickable
        v-ripple
        @click="playTrack(song)"
        :active="currentSong?.id === song.id"
        active-class="bg-grey-9 text-orange"
      >
        <q-item-section avatar>
          <q-avatar square size="50px">
            <img :src="song.cover" @error="onCoverError(song)" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-bold">{{ song.title }}</q-item-label>
          <q-item-label caption class="text-grey-5">
            {{ song.artist }}
            <span class="q-ml-sm text-grey-6">• {{ formatDuration(song.duration) }}</span>
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <div v-if="currentSong?.id === song.id">
            <q-spinner-bars color="orange" size="1.5em" v-if="isBuffering || isPlaying" />
            <q-icon name="pause" color="orange" v-else />
          </div>
          <q-icon name="play_arrow" color="grey" v-else />
        </q-item-section>
      </q-item>
    </q-list>

    <div
      class="fixed-bottom bg-grey-10 text-white q-pa-sm shadow-up-10"
      style="bottom: 50px; z-index: 2000; border-top: 1px solid #333"
    >
      <div class="relative-position">
        <div
          v-if="isBuffering"
          class="absolute-full flex flex-center bg-grey-10"
          style="z-index: 10; opacity: 0.8"
        >
          <q-spinner color="orange" size="2em" />
          <span class="q-ml-sm text-caption">Loading...</span>
        </div>

        <div
          id="waveform"
          class="q-mb-sm"
          style="width: 100%; height: 60px"
          v-show="currentSong"
        ></div>
      </div>

      <div class="row items-center no-wrap q-gutter-x-md" v-if="currentSong">
        <q-avatar square size="48px" class="shadow-2">
          <img :src="currentSong.cover" @error="onCoverError(currentSong)" />
        </q-avatar>

        <q-btn
          flat
          round
          color="grey-6"
          icon="skip_previous"
          @click="prevTrack"
          :disable="!currentSong"
        />

        <q-btn
          round
          flat
          color="orange"
          :icon="isPlaying ? 'pause_circle' : 'play_circle'"
          size="lg"
          @click="togglePlay"
          :disable="!currentSong || isBuffering"
        />

        <q-btn
          flat
          round
          color="grey-6"
          icon="skip_next"
          @click="nextTrack"
          :disable="!currentSong"
        />

        <div class="volume-control q-ml-md q-mr-md gt-xs" style="width: 100px">
          <q-slider
            v-model="volume"
            :min="0"
            :max="1"
            :step="0.01"
            @update:model-value="updateVolume"
            color="orange"
            label
            :label-value="Math.round(volume * 100) + '%'"
          >
            <template v-slot:prepend>
              <q-icon
                :name="isMuted ? 'volume_off' : 'volume_up'"
                @click="toggleMute"
                class="cursor-pointer"
                size="xs"
              />
            </template>
          </q-slider>
        </div>

        <div class="col overflow-hidden q-ml-md">
          <div class="text-subtitle1 text-weight-bold ellipsis">{{ currentSong.title }}</div>
          <div class="text-caption text-grey-5 ellipsis">{{ currentSong.artist }}</div>
        </div>

        <div class="text-caption text-grey font-mono q-mr-sm">
          {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
        </div>
      </div>

      <div v-else class="text-center text-grey q-py-md">
        <q-icon name="music_note" /> သီချင်းရွေးချယ်ပါ
      </div>
    </div>
  </q-page>
</template>

<script setup>
defineOptions({ name: 'MusicPage' })

import { ref, onUnmounted, onMounted, nextTick, computed, watch } from 'vue'
import WaveSurfer from 'wavesurfer.js'

// --- State Variables ---
const wavesurfer = ref(null)
const isPlaying = ref(false)
const isBuffering = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const currentSong = ref(null)
const volume = ref(0.7)
const isMuted = ref(false)
const lastVolume = ref(0.7)
const searchQuery = ref('')
const shouldAutoPlay = ref(false)
const isSearching = ref(false)
const searchError = ref('')
const searchToken = ref(0)
const waveformToken = ref(0)
const famousSingers = [
  'Adele',
  'Taylor Swift',
  'Ed Sheeran',
  'Beyonce',
  'Bruno Mars',
  'Rihanna',
  'The Weeknd',
  'Billie Eilish',
  'Alicia Keys',
  'Lady Gaga',
  'Justin Bieber',
  'Shawn Mendes',
]

const FALLBACK_COVER = 'https://via.placeholder.com/200x200?text=No+Cover'
const metadataCache = new Map()

const STORAGE_KEYS = {
  lastSong: 'music:lastSong',
  volume: 'music:volume',
}

// --- Safe Playlist ---
const playlist = ref([])

// Computed property for filtered playlist
const filteredPlaylist = computed(() => playlist.value)

// --- 1. Initialize WaveSurfer (Create ONCE) ---
const initWaveSurfer = () => {
  // ရှိပြီးသားဆိုရင် ထပ်မဆောက်တော့ဘူး (Return)
  if (wavesurfer.value) return

  wavesurfer.value = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#666',
    progressColor: '#ff9800',
    cursorColor: '#ff9800',
    barWidth: 2,
    barRadius: 2,
    cursorWidth: 1,
    height: 60,
    barGap: 2,
    responsive: true,
    backend: 'MediaElement',
    volume: volume.value, // Set initial volume
  })

  const media = wavesurfer.value.getMediaElement()
  media.preload = 'auto'
  media.setAttribute('preload', 'auto')
  media.setAttribute('crossorigin', 'anonymous')

  media.addEventListener('loadedmetadata', () => {
    duration.value = media.duration || wavesurfer.value.getDuration()
  })

  media.addEventListener('canplay', () => {
    isBuffering.value = false
    if (shouldAutoPlay.value && !isPlaying.value) {
      wavesurfer.value.play()
    }
  })

  media.addEventListener('playing', () => {
    isBuffering.value = false
  })

  media.addEventListener('waiting', () => {
    isBuffering.value = true
  })

  // Events Listeners
  wavesurfer.value.on('audioprocess', () => {
    currentTime.value = wavesurfer.value.getCurrentTime()
  })

  wavesurfer.value.on('ready', () => {
    duration.value = wavesurfer.value.getDuration()

    // Ensure volume is set correctly after load
    wavesurfer.value.setVolume(isMuted.value ? 0 : volume.value)
  })

  wavesurfer.value.on('play', () => {
    isPlaying.value = true
  })

  wavesurfer.value.on('pause', () => {
    isPlaying.value = false
  })

  wavesurfer.value.on('finish', () => {
    isPlaying.value = false
    // Only auto-play next track if we have a current song
    if (currentSong.value) {
      nextTrack()
    }
  })

  wavesurfer.value.on('error', (err) => {
    console.error('WaveSurfer Error:', err)
    isBuffering.value = false
  })
}

const onCoverError = (song) => {
  if (!song || song.cover === FALLBACK_COVER) return
  song.cover = FALLBACK_COVER
}

const parseDuration = (value) => {
  if (value == null) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed)
  if (!trimmed.includes(':')) return null

  const parts = trimmed.split(':').map((part) => Number(part))
  if (parts.some((part) => Number.isNaN(part))) return null
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return null
}

const buildPeaks = (audioBuffer, maxLength = 2000) => {
  const channels = Math.min(2, audioBuffer.numberOfChannels || 1)
  const peaks = []
  const length = audioBuffer.length
  const sampleSize = Math.max(1, Math.floor(length / maxLength))

  for (let ch = 0; ch < channels; ch += 1) {
    const data = audioBuffer.getChannelData(ch)
    const channelPeaks = new Float32Array(maxLength)

    for (let i = 0; i < maxLength; i += 1) {
      const start = i * sampleSize
      const end = Math.min(start + sampleSize, length)
      let max = 0
      for (let j = start; j < end; j += 1) {
        const value = Math.abs(data[j])
        if (value > max) max = value
      }
      channelPeaks[i] = max
    }

    peaks.push(channelPeaks)
  }

  return peaks
}

const getArchiveMetadata = (id) => {
  if (metadataCache.has(id)) return metadataCache.get(id)
  const promise = fetch(`https://archive.org/metadata/${id}`).then((res) => {
    if (!res.ok) throw new Error(`Metadata failed: ${res.status}`)
    return res.json()
  })
  metadataCache.set(id, promise)
  return promise
}

const findAudioFile = (files) =>
  files.find((file) => {
    const name = (file?.name || '').toLowerCase()
    const format = (file?.format || '').toLowerCase()
    const isAudioFormat =
      format.includes('mp3') ||
      format.includes('ogg') ||
      format.includes('wav') ||
      format.includes('flac')
    const isAudioExt =
      name.endsWith('.mp3') ||
      name.endsWith('.ogg') ||
      name.endsWith('.wav') ||
      name.endsWith('.flac')
    return isAudioFormat || isAudioExt
  })

const searchArchive = async () => {
  const query = searchQuery.value.trim()
  if (!query) return

  isSearching.value = true
  searchError.value = ''
  searchToken.value += 1
  const token = searchToken.value

  const params = new URLSearchParams({
    q: `(${query}) AND mediatype:audio`,
    'fl[]': ['identifier', 'title', 'creator'],
    'sort[]': 'downloads desc',
    rows: '25',
    page: '1',
    output: 'json',
  })

  try {
    const res = await fetch(`https://archive.org/advancedsearch.php?${params.toString()}`)
    if (!res.ok) throw new Error(`Search failed: ${res.status}`)
    const data = await res.json()
    const docs = data?.response?.docs || []

    playlist.value = docs.map((doc) => ({
      id: doc.identifier,
      title: doc.title || doc.identifier,
      artist: doc.creator || 'Internet Archive',
      url: null,
      cover: `https://archive.org/services/img/${doc.identifier}`,
      duration: null,
    }))

    hydrateDurations(token)
  } catch (error) {
    console.error('Search Error:', error)
    searchError.value = 'Search failed. Please try again.'
  } finally {
    isSearching.value = false
  }
}

const searchFromSinger = (name) => {
  searchQuery.value = name
  searchArchive()
}

const hydrateDurations = async (token) => {
  for (const song of playlist.value) {
    if (token !== searchToken.value) return
    try {
      await resolveArchiveDuration(song)
    } catch (error) {
      console.error('Duration Failed:', error)
    }
  }
}

const resolveArchiveDuration = async (song) => {
  if (!song || song.duration != null) return song?.duration
  const data = await getArchiveMetadata(song.id)
  const files = data?.files || []
  const audioFile = findAudioFile(files)
  const raw =
    audioFile?.length ||
    audioFile?.duration ||
    audioFile?.metadata?.length ||
    audioFile?.metadata?.duration
  song.duration = parseDuration(raw)
  return song.duration
}

const renderWaveformInBackground = async (song) => {
  if (!song?.url || !wavesurfer.value) return
  if (song.waveformPeaks && song.duration) {
    wavesurfer.value.setOptions({ peaks: song.waveformPeaks, duration: song.duration })
    const decoded = wavesurfer.value.getDecodedData()
    if (decoded) wavesurfer.value.getRenderer().render(decoded)
    return
  }

  waveformToken.value += 1
  const token = waveformToken.value

  try {
    const res = await fetch(song.url)
    if (!res.ok) throw new Error(`Waveform fetch failed: ${res.status}`)
    const arrayBuffer = await res.arrayBuffer()
    if (token !== waveformToken.value) return

    const audioContext = new AudioContext()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    await audioContext.close()
    if (token !== waveformToken.value || currentSong.value?.id !== song.id) return

    const peaks = buildPeaks(audioBuffer)
    song.waveformPeaks = peaks
    song.duration = audioBuffer.duration

    wavesurfer.value.setOptions({ peaks, duration: audioBuffer.duration })
    const decoded = wavesurfer.value.getDecodedData()
    if (decoded) wavesurfer.value.getRenderer().render(decoded)
  } catch (error) {
    console.error('Waveform decode failed:', error)
  }
}

const resolveArchiveUrl = async (song) => {
  if (!song || song.url) return song?.url

  const data = await getArchiveMetadata(song.id)
  const audioFile = findAudioFile(data?.files || [])

  if (!audioFile?.name) throw new Error('No playable audio file found')

  const fileName = encodeURIComponent(audioFile.name)
  song.url = `https://archive.org/download/${song.id}/${fileName}`
  return song.url
}

const loadWithStreaming = async (song) => {
  if (!song?.url) await resolveArchiveUrl(song)
  const duration = await resolveArchiveDuration(song)

  if (duration && Number.isFinite(duration) && duration > 0) {
    const placeholderPeaks = [new Float32Array(1)]
    return wavesurfer.value.load(song.url, placeholderPeaks, duration)
  }

  return wavesurfer.value.load(song.url)
}

// --- 2. Play Track Logic (REUSE Instance) ---
const playTrack = async (song) => {
  // Same song click -> Toggle Play/Pause
  if (currentSong.value?.id === song.id) {
    togglePlay()
    return
  }

  // အသံထပ်မထွက်အောင် ရှိပြီးသား Player ကို Stop လုပ်မယ်
  if (wavesurfer.value) {
    wavesurfer.value.stop()
  }

  // UI Reset
  currentSong.value = song
  isPlaying.value = false
  currentTime.value = 0
  isBuffering.value = true // Show Loading
  shouldAutoPlay.value = true

  // DOM Update ဖြစ်အောင် စောင့်မယ်
  await nextTick()

  // Player မရှိသေးမှ အသစ်ဆောက်မယ် (First time only)
  if (!wavesurfer.value) {
    initWaveSurfer()
  }

  // Load URL (WaveSurfer handles stopping previous audio automatically here too)
  try {
    await resolveArchiveUrl(song)
    const loadPromise = loadWithStreaming(song)
    if (loadPromise?.catch) {
      loadPromise.catch((error) => {
        console.error('Load Failed:', error)
        isBuffering.value = false
      })
    }
    renderWaveformInBackground(song)
  } catch (error) {
    console.error('Load Failed:', error)
    isBuffering.value = false
  }
}

// --- 3. Controls ---
const togglePlay = () => {
  if (!wavesurfer.value) return

  if (isPlaying.value) {
    wavesurfer.value.pause()
  } else {
    wavesurfer.value.play()
  }
}

// Next track
const nextTrack = () => {
  if (!currentSong.value || filteredPlaylist.value.length === 0) return
  
  // Use filtered playlist for navigation
  const currentIndex = filteredPlaylist.value.findIndex(song => song.id === currentSong.value.id)
  
  if (currentIndex < filteredPlaylist.value.length - 1) {
    playTrack(filteredPlaylist.value[currentIndex + 1])
  } else if (filteredPlaylist.value.length > 0) {
    playTrack(filteredPlaylist.value[0]) // Loop back to start of filtered list
  }
}

// Previous track
const prevTrack = () => {
  if (!currentSong.value || filteredPlaylist.value.length === 0) return
  
  // Use filtered playlist for navigation
  const currentIndex = filteredPlaylist.value.findIndex(song => song.id === currentSong.value.id)
  
  if (currentIndex > 0) {
    playTrack(filteredPlaylist.value[currentIndex - 1])
  } else if (filteredPlaylist.value.length > 0) {
    playTrack(filteredPlaylist.value[filteredPlaylist.value.length - 1]) // Loop to end of filtered list
  }
}

// Volume Controls
const toggleMute = () => {
  if (!wavesurfer.value) return
  if (isMuted.value) {
    wavesurfer.value.setVolume(lastVolume.value)
    volume.value = lastVolume.value
  } else {
    lastVolume.value = volume.value
    wavesurfer.value.setVolume(0)
    volume.value = 0
  }
  isMuted.value = !isMuted.value
}

const updateVolume = (val) => {
  if (!wavesurfer.value) return
  wavesurfer.value.setVolume(val)
  if (val > 0) isMuted.value = false
}

// Format Time
const formatTime = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

const formatDuration = (seconds) => {
  if (seconds == null) return '--:--'
  return formatTime(seconds)
}

// --- Cleanup ---
onUnmounted(() => {
  if (wavesurfer.value) {
    wavesurfer.value.destroy()
  }
})

// --- Restore last played song and volume ---
onMounted(async () => {
  const savedVolume = localStorage.getItem(STORAGE_KEYS.volume)
  if (savedVolume !== null && !Number.isNaN(Number(savedVolume))) {
    volume.value = Number(savedVolume)
    lastVolume.value = volume.value
    isMuted.value = volume.value === 0
  }

  const savedSongRaw = localStorage.getItem(STORAGE_KEYS.lastSong)
  if (!savedSongRaw) return

  try {
    const savedSong = JSON.parse(savedSongRaw)
    if (!savedSong?.id) return
    if (!savedSong.cover) savedSong.cover = FALLBACK_COVER

    currentSong.value = savedSong
    currentTime.value = 0
    isBuffering.value = true
    shouldAutoPlay.value = false

    await nextTick()
    if (!wavesurfer.value) initWaveSurfer()

    await resolveArchiveUrl(currentSong.value)
    const loadPromise = loadWithStreaming(currentSong.value)
    if (loadPromise?.catch) {
      loadPromise.catch((error) => {
        console.error('Load Failed:', error)
        isBuffering.value = false
      })
    }
    renderWaveformInBackground(currentSong.value)
  } catch (error) {
    console.error('Load Failed:', error)
    isBuffering.value = false
  }
})

watch(volume, (val) => {
  localStorage.setItem(STORAGE_KEYS.volume, String(val))
})

watch(currentSong, (song) => {
  if (!song) return
  localStorage.setItem(
    STORAGE_KEYS.lastSong,
    JSON.stringify({
      id: song.id,
      title: song.title,
      artist: song.artist,
      cover: song.cover,
      url: song.url || null,
    })
  )
})
</script>

<style scoped>
.bg-gradient {
  background: linear-gradient(to bottom, #111, #333);
}
.shadow-up-10 {
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.5);
}
</style>
