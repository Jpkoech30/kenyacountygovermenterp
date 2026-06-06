<script setup>
/**
 * ContactPage — contact form, info, map, newsletter.
 */
import { useHead } from '@unhead/vue'
import { useLocaleStore } from '../../stores/locale'
import ContactForm from '../../components/public/ContactForm.vue'
import { MapPin, Phone, Mail, Clock } from '@lucide/vue'

const localeStore = useLocaleStore()

useHead({
  title: 'Contact — West Pokot County',
  meta: [{ name: 'description', content: 'Get in touch with West Pokot County Government. Contact form, address, phone, and email.' }],
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-12">
    <h1 class="text-3xl md:text-4xl font-bold mb-2">
      {{ localeStore.locale === 'en' ? 'Contact Us' : localeStore.locale === 'sw' ? 'Wasiliana Nasi' : 'Nyikwa' }}
    </h1>
    <p class="text-base-content/60 mb-8">
      {{ localeStore.locale === 'en' ? 'We\'d love to hear from you. Get in touch with us.' : localeStore.locale === 'sw' ? 'Tungependa kusikia kutoka kwako. Wasiliana nasi.' : 'Ng\'alekta.' }}
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Contact Info -->
      <div class="space-y-6">
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body">
            <h2 class="font-bold text-lg mb-4">
              {{ localeStore.locale === 'en' ? 'Our Office' : localeStore.locale === 'sw' ? 'Ofisi Yetu' : 'Ng\'alekta' }}
            </h2>
            <div class="space-y-4 text-sm">
              <p class="flex items-start gap-3">
                <MapPin class="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>P.O. Box 1-30600, Kapenguria, West Pokot County</span>
              </p>
              <p class="flex items-center gap-3">
                <Phone class="w-5 h-5 text-primary shrink-0" />
                <span>+254 721 000 000</span>
              </p>
              <p class="flex items-center gap-3">
                <Mail class="w-5 h-5 text-primary shrink-0" />
                <span>info@westpokot.go.ke</span>
              </p>
              <p class="flex items-start gap-3">
                <Clock class="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>{{ localeStore.locale === 'en' ? 'Mon-Fri: 8:00 AM - 5:00 PM' : localeStore.locale === 'sw' ? 'Jumatatu-Ijumaa: 8:00 AM - 5:00 PM' : 'Ng\'alekta.' }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Map -->
        <div class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.5!2d35.112!3d1.245!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwMTQnNDIuMCJOIDM1wrAwNic0My4yIkU!5e0!3m2!1sen!2ske!4v1"
            width="100%"
            height="250"
            style="border:0;"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="West Pokot County Government Offices"
          ></iframe>
        </div>
      </div>

      <!-- Contact Form -->
      <div class="lg:col-span-2">
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body">
            <h2 class="font-bold text-lg mb-4">
              {{ localeStore.locale === 'en' ? 'Send us a Message' : localeStore.locale === 'sw' ? 'Tuma Ujumbe' : 'Nyikwa' }}
            </h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
