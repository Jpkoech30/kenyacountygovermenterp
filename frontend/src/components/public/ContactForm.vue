<script setup>
/**
 * ContactForm — validated contact form with name, email, department, message.
 */
import { ref } from 'vue'
import { useLocaleStore } from '../../stores/locale'
import { useToast } from '../../composables/useToast'
import { submitContact } from '../../api/public'
import { Send } from '@lucide/vue'

const localeStore = useLocaleStore()
const { addToast } = useToast()

const form = ref({ name: '', email: '', department: '', message: '' })
const errors = ref({})
const submitting = ref(false)

function validate() {
  const errs = {}
  if (!form.value.name.trim()) errs.name = localeStore.locale === 'en' ? 'Name is required' : 'Jina linahitajika'
  if (!form.value.email.trim()) errs.email = localeStore.locale === 'en' ? 'Email is required' : 'Barua pepe inahitajika'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) errs.email = localeStore.locale === 'en' ? 'Invalid email' : 'Barua pepe si sahihi'
  if (!form.value.message.trim()) errs.message = localeStore.locale === 'en' ? 'Message is required' : 'Ujumbe unahitajika'
  errors.value = errs
  return Object.keys(errs).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    await submitContact(form.value)
    addToast(
      localeStore.locale === 'en' ? 'Message sent successfully!' : localeStore.locale === 'sw' ? 'Ujumbe umetumwa kwa mafanikio!' : 'Ikiyokwa!',
      'success'
    )
    form.value = { name: '', email: '', department: '', message: '' }
  } catch {
    addToast(
      localeStore.locale === 'en' ? 'Failed to send. Please try again.' : localeStore.locale === 'sw' ? 'Imeshindwa kutuma. Tafadhali jaribu tena.' : 'Kiyaan.',
      'error'
    )
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-control">
        <label class="label label-text">
          {{ localeStore.locale === 'en' ? 'Name' : localeStore.locale === 'sw' ? 'Jina' : 'Ng\'alek' }}
        </label>
        <input v-model="form.name" type="text" class="input input-bordered input-sm" :class="{ 'input-error': errors.name }" />
        <label v-if="errors.name" class="label label-text-alt text-error">{{ errors.name }}</label>
      </div>
      <div class="form-control">
        <label class="label label-text">Email</label>
        <input v-model="form.email" type="email" class="input input-bordered input-sm" :class="{ 'input-error': errors.email }" />
        <label v-if="errors.email" class="label label-text-alt text-error">{{ errors.email }}</label>
      </div>
    </div>
    <div class="form-control">
      <label class="label label-text">
        {{ localeStore.locale === 'en' ? 'Department' : localeStore.locale === 'sw' ? 'Idara' : 'Ng\'alekta' }}
      </label>
      <input v-model="form.department" type="text" class="input input-bordered input-sm" />
    </div>
    <div class="form-control">
      <label class="label label-text">
        {{ localeStore.locale === 'en' ? 'Message' : localeStore.locale === 'sw' ? 'Ujumbe' : 'Ng\'alek' }}
      </label>
      <textarea v-model="form.message" rows="4" class="textarea textarea-bordered" :class="{ 'textarea-error': errors.message }"></textarea>
      <label v-if="errors.message" class="label label-text-alt text-error">{{ errors.message }}</label>
    </div>

    <button type="submit" class="btn btn-primary" :disabled="submitting">
      <Send v-if="!submitting" class="w-4 h-4" />
      <span v-else class="loading loading-spinner loading-sm"></span>
      {{ localeStore.locale === 'en' ? 'Send Message' : localeStore.locale === 'sw' ? 'Tuma Ujumbe' : 'Nyikwa' }}
    </button>
  </form>
</template>
