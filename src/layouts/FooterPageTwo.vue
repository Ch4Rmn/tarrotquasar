<template>
  <!-- <q-layout view="lHh Lpr lFf"> -->
  <div>
    <q-footer class="text-white glass-footer">
      <q-tabs
        v-model="tab"
        no-caps
        inline-label
        outside-arrows
        narrow-indicator
        align="justify"
        active-color="black"
      >
        <q-route-tab class="text-white" name="home" icon="home" label="Home" to="/" />
        <q-route-tab
          class="text-white"
          name="daily"
          icon="event_repeat"
          label="Daily"
          to="/daily"
        />

        <q-route-tab class="text-white" name="map" icon="map" label="map" to="/map" />
        <q-route-tab
          class="text-white"
          name="settings"
          icon="settings"
          label="Setting"
          to="/daily"
        />
      </q-tabs>

      <!-- <q-tabs
        v-model="tab"
        indicator-color="transparent"
        active-color="yellow-4"
        class="text-grey-4"
        no-caps
        align="justify"
      >
        <q-route-tab name="daily" icon="auto_awesome" label="Daily" to="/daily" />

        <q-route-tab name="spreads" icon="grid_view" label="Spreads" to="/spreads" />

        <q-route-tab name="library" icon="menu_book" label="Library" to="/library" />

        <q-route-tab name="journal" icon="history_edu" label="Journal" to="/journal" />

        <q-route-tab name="profile" icon="person" label="Profile" to="/profile" />
      </q-tabs> -->
    </q-footer>
  </div>
  <!-- </q-layout> -->
</template>

<script setup>
import { ref } from 'vue'

const tab = ref('daily')
</script>

<style lang="scss" scoped>
/* နောက်ခံပုံ ပါမှ Glass Effect က ပေါ်မှာမို့လို့ နောက်ခံထည့်ထားတာပါ */
.my-background {
  background: linear-gradient(to bottom right, #2c3e50, #000000);
  /* သို့မဟုတ် ပုံထည့်မယ်ဆိုရင် */
  /* background-image: url('assets/starry-bg.jpg'); */
  background-size: cover;
}

/* iOS Glass Footer Style */
.glass-footer {
  /* နောက်ခံ အကြည် (Transparent) */
  background: rgba(20, 20, 30, 0.4) !important;

  /* နောက်က background ကို ဝါးသွားစေမယ့် Blur Effect */
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px); /* Safari/iOS အတွက် */

  /* အပေါ်အနားသတ်မျဉ်း ပါးပါးလေး (Glass look) */
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  /* အောက်ခြေကနေ နည်းနည်းကြွနေသလို ခံစားရအောင် Shadow ထည့်ခြင်း */
  box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.1);
}

/* Dark Mode အတွက် သီးသန့် ချိန်ချင်ရင် (Optional) */
.body--dark .glass-footer {
  background: rgba(0, 0, 0, 0.6) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* Tab Active ဖြစ်နေချိန် Icon ကြီးသွားအောင် (Animation) */
:deep(.q-tab--active .q-icon) {
  transform: scale(1.2);
  transition: transform 0.3s ease;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5); /* ရွှေရောင်အရောင်တောက် */
}
</style>
