<script setup>
/**
 * AboutPage — static content about West Pokot County.
 */
import { useHead } from '@unhead/vue'
import { useLocaleStore } from '../../stores/locale'

const localeStore = useLocaleStore()

useHead({
  title: 'About — West Pokot County',
  meta: [
    { name: 'description', content: 'Learn about West Pokot County — history, geography, demography, and economy.' },
  ],
})

const sections = {
  en: [
    {
      title: 'History',
      content: 'West Pokot County is located in the Rift Valley region of Kenya. It was established in 2013 following the promulgation of the Kenyan Constitution in 2010. The county is named after the Pokot people, who are the predominant ethnic group. The county headquarters is Kapenguria, a town with historical significance as the site where Kapenguria Six — including Jomo Kenyatta — were detained during the colonial era.',
    },
    {
      title: 'Geography & Demography',
      content: 'The county covers an area of approximately 9,169 km² and borders Turkana County to the north, Baringo County to the east, Elgeyo-Marakwet County to the south, and Trans-Nzoia County to the southwest. It also shares an international border with Uganda to the west. The population is estimated at over 650,000 people, with the majority residing in rural areas. The county is divided into four sub-counties: Kapenguria, Pokot South, Pokot Central, and Pokot North.',
    },
    {
      title: 'Economy',
      content: 'The economy of West Pokot County is primarily based on agriculture and livestock keeping. The main crops include maize, beans, sorghum, and millet. Livestock farming — cattle, goats, sheep, and camels — is a major economic activity, especially in the drier northern areas. The county also has potential in tourism, with attractions such as the Nasolot National Reserve, the Cherangany Hills, and the Turkwel Gorge. Cross-border trade with Uganda is also significant.',
    },
  ],
  sw: [
    {
      title: 'Historia',
      content: 'Kaunti ya West Pokot iko katika mkoa wa Bonde la Ufa nchini Kenya. Ilianzishwa mwaka 2013 kufuatia kutangazwa kwa Katiba ya Kenya mwaka 2010. Kaunti hiyo imepewa jina la Wapokot, ambao ndio kabila kubwa. Makao makuu ya kaunti ni Kapenguria, mji wenye umuhimu wa kihistoria kama eneo ambalo Sita wa Kapenguria — akiwemo Jomo Kenyatta — walizuiliwa wakati wa ukoloni.',
    },
    {
      title: 'Jiografia na Demografia',
      content: 'Kaunti ina eneo la takriban 9,169 km² na inapakana na Kaunti ya Turkana kaskazini, Kaunti ya Baringo mashariki, Kaunti ya Elgeyo-Marakwet kusini, na Kaunti ya Trans-Nzoia kusini-magharibi. Pia inapakana na Uganda upande wa magharibi. Idadi ya wakazi inakadiriwa kuwa zaidi ya 650,000, wengi wao wakiishi maeneo ya vijijini. Kaunti imegawanywa katika sub-kaunti nne: Kapenguria, Pokot Kusini, Pokot Kati, na Pokot Kaskazini.',
    },
    {
      title: 'Uchumi',
      content: 'Uchumi wa Kaunti ya West Pokot unategemea kilimo na ufugaji. Mazao makuu ni pamoja na mahindi, maharagwe, mtama, na ulezi. Ufugaji — ng\'ombe, mbuzi, kondoo, na ngamia — ni shughuli kubwa ya kiuchumi, haswa katika maeneo kavu ya kaskazini. Kaunti pia ina uwezo katika utalii, na vivutio kama Hifadhi ya Nasolot, Milima ya Cherangany, na Korongo la Turkwel. Biashara ya mpakani na Uganda pia ni muhimu.',
    },
  ],
  pok: [
    {
      title: 'Ng\'alekta',
      content: 'West Pokot County kiwo Rift Valley region Kenya. Kiwo 2013 kopor Konstitushyon Kenya 2010. Kaunti kiwo nyo Pokot, nyo kalo. Kapenguria kiwo county headquarters, town kiwo nyo Kapenguria Six — kopor Jomo Kenyatta — kiwo detained colonial era.',
    },
    {
      title: 'Geography & Demography',
      content: 'County kiwo area 9,169 km², kiwo Turkana County north, Baringo County east, Elgeyo-Marakwet County south, Trans-Nzoia County southwest. Kiwo Uganda west. Population kiwo 650,000+, nyo rural areas. County kiwo sub-counties: Kapenguria, Pokot South, Pokot Central, Pokot North.',
    },
    {
      title: 'Economy',
      content: 'Economy kiwo agriculture and livestock. Crops: maize, beans, sorghum, millet. Livestock — cattle, goats, sheep, camels — kiwo major economic activity, nyo northern areas. County kiwo tourism potential: Nasolot National Reserve, Cherangany Hills, Turkwel Gorge. Cross-border trade Uganda kiwo significant.',
    },
  ],
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-12">
    <h1 class="text-3xl md:text-4xl font-bold mb-8 text-center">
      {{ localeStore.locale === 'en' ? 'About West Pokot County' : localeStore.locale === 'sw' ? 'Kuhusu Kaunti ya West Pokot' : 'Kokiloe West Pokot County' }}
    </h1>

    <div class="space-y-8">
      <article v-for="(section, idx) in sections[localeStore.locale] || sections.en" :key="idx" class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body">
          <h2 class="card-title text-xl">{{ section.title }}</h2>
          <p class="text-base-content/80 leading-relaxed">{{ section.content }}</p>
        </div>
      </article>
    </div>
  </div>
</template>
