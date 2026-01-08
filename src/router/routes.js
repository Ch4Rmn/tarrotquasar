import MainLayout from 'layouts/MainLayout.vue'
import IndexPage from 'pages/IndexPage.vue'
import MapPage from 'pages/MapPage.vue'
import DailyPage from 'pages/DailyPage.vue'
import MusicPage from 'pages/MusicPage.vue'
import TripleCardPage from 'pages/TripleCardPage.vue'
import ErrorNotFound from 'pages/ErrorNotFound.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: IndexPage },
      { path: 'map', component: MapPage },
      { path: 'daily', component: DailyPage },
      { path: 'music', component: MusicPage },
      { path: 'triple', component: TripleCardPage },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: ErrorNotFound,
  },
]

export default routes
