<script setup>
/**
 * Public website footer — contact info, quick links, newsletter signup.
 */
import { ref } from 'vue'
import { useLocaleStore } from '../../stores/locale'
import { useToast } from '../../composables/useToast'
import { subscribeEmail } from '../../api/public'
import { MapPin, Phone, Mail, Send } from '@lucide/vue'

const localeStore = useLocaleStore()
const { addToast } = useToast()

const newsletterEmail = ref('')
const subscribing = ref(false)

async function handleSubscribe() {
  if (!newsletterEmail.value) return
  subscribing.value = true
  try {
    await subscribeEmail(newsletterEmail.value)
    addToast(
      localeStore.locale === 'en' ? 'Subscribed successfully!' : localeStore.locale === 'sw' ? 'Umejiandikisha kwa mafanikio!' : 'Ikiyokwa!',
      'success'
    )
    newsletterEmail.value = ''
  } catch {
    addToast(
      localeStore.locale === 'en' ? 'Subscription failed. Try again.' : localeStore.locale === 'sw' ? 'Uandikishaji umeshindwa. Jaribu tena.' : 'Kiyaan.',
      'error'
    )
  } finally {
    subscribing.value = false
  }
}

const quickLinks = [
  { label: { en: 'Home', sw: 'Nyumbani', pok: 'Kokwo' }, to: '/' },
  { label: { en: 'About Us', sw: 'Kuhusu Sisi', pok: 'Kokiloe' }, to: '/about' },
  { label: { en: 'Departments', sw: 'Idara', pok: 'Ng\'alekta' }, to: '/departments' },
  { label: { en: 'News', sw: 'Habari', pok: 'Ng\'alek' }, to: '/news' },
  { label: { en: 'Tenders', sw: 'Zabuni', pok: 'Zabuni' }, to: '/tenders' },
  { label: { en: 'Contact', sw: 'Wasiliana', pok: 'Nyikwa' }, to: '/contact' },
]

function t(label) {
  return label[localeStore.locale] || label.en
}
</script>

<template>
  <footer class="bg-neutral text-neutral-content">
    <div class="max-w-7xl mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Contact Info -->
        <div>
          <h3 class="text-lg font-bold mb-4">
            {{ t({ en: 'Contact Us', sw: 'Wasiliana Nasi', pok: 'Nyikwa' }) }}
          </h3>
          <ul class="space-y-3 text-sm">
            <li class="flex items-start gap-2">
              <MapPin class="w-4 h-4 mt-0.5 shrink-0" />
              <span>P.O. Box 1-30600, Kapenguria, West Pokot County</span>
            </li>
            <li class="flex items-center gap-2">
              <Phone class="w-4 h-4 shrink-0" />
              <span>+254 721 000 000</span>
            </li>
            <li class="flex items-center gap-2">
              <Mail class="w-4 h-4 shrink-0" />
              <span>info@westpokot.go.ke</span>
            </li>
          </ul>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="text-lg font-bold mb-4">
            {{ t({ en: 'Quick Links', sw: 'Viungo vya Haraka', pok: 'Ng\'alekta' }) }}
          </h3>
          <ul class="space-y-2 text-sm">
            <li v-for="link in quickLinks" :key="link.to">
              <router-link :to="link.to" class="link link-hover">{{ t(link.label) }}</router-link>
            </li>
          </ul>
        </div>

        <!-- Newsletter -->
        <div>
          <h3 class="text-lg font-bold mb-4">
            {{ t({ en: 'Newsletter', sw: 'Jarida', pok: 'Ng\'alek' }) }}
          </h3>
          <p class="text-sm mb-3">
            {{ t({ en: 'Subscribe to receive county updates.', sw: 'Jiandikishe kupata taarifa za kaunti.', pok: 'Ikiyokwa.' }) }}
          </p>
          <form @submit.prevent="handleSubscribe" class="flex gap-2">
            <input
              v-model="newsletterEmail"
              type="email"
              :placeholder="t({ en: 'Your email', sw: 'Barua pepe yako', pok: 'Email' })"
              class="input input-bordered input-sm flex-1 bg-base-100 text-base-content"
              required
            />
            <button type="submit" class="btn btn-primary btn-sm" :disabled="subscribing">
              <Send v-if="!subscribing" class="w-4 h-4" />
              <span v-else class="loading loading-spinner loading-xs"></span>
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Copyright -->
    <div class="border-t border-neutral-focus py-4 text-center text-xs text-neutral-content/60">
      &copy; {{ new Date().getFullYear() }} West Pokot County Government. All rights reserved.
    </div>
  </footer>
</template>
