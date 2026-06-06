/**
 * Public API client — no authentication required.
 * Used by the public-facing website pages.
 */
import axios from 'axios'

const publicClient = axios.create({
  baseURL: '/api/public',
  timeout: 15000,
})

/**
 * Fetch hero slides for the carousel.
 */
export async function fetchHeroSlides() {
  const { data } = await publicClient.get('/hero-slides')
  return data.slides
}

/**
 * Fetch facts for the fact rotator.
 */
export async function fetchFacts() {
  const { data } = await publicClient.get('/facts')
  return data.facts
}

/**
 * Fetch published content (news, departments, etc.).
 * @param {Object} params - { type, limit, offset, locale, category }
 */
export async function fetchContent(params = {}) {
  const { data } = await publicClient.get('/content', { params })
  return data
}

/**
 * Fetch a single content item by slug.
 * @param {string} slug
 */
export async function fetchContentBySlug(slug) {
  const { data } = await publicClient.get(`/content/${slug}`)
  return data.content
}

/**
 * Fetch events.
 * @param {Object} params - { upcoming, limit, offset, locale }
 */
export async function fetchEvents(params = {}) {
  const { data } = await publicClient.get('/events', { params })
  return data
}

/**
 * Fetch tenders.
 * @param {Object} params - { limit, offset }
 */
export async function fetchTenders(params = {}) {
  const { data } = await publicClient.get('/tenders', { params })
  return data
}

/**
 * Fetch vacancies.
 * @param {Object} params - { limit, offset }
 */
export async function fetchVacancies(params = {}) {
  const { data } = await publicClient.get('/vacancies', { params })
  return data
}

/**
 * Fetch departments.
 */
export async function fetchDepartments() {
  const { data } = await publicClient.get('/departments')
  return data.departments
}

/**
 * Fetch categories (for news filtering).
 */
export async function fetchCategories() {
  const { data } = await publicClient.get('/categories')
  return data.categories
}

/**
 * Fetch persons (governor, deputy, etc.).
 * @param {Object} params - { title }
 */
export async function fetchPersons(params = {}) {
  const { data } = await publicClient.get('/persons', { params })
  return data.persons
}

/**
 * Submit a contact form message.
 * @param {Object} payload - { name, email, department, message }
 */
export async function submitContact(payload) {
  const { data } = await publicClient.post('/contact', payload)
  return data
}

/**
 * Subscribe an email to the newsletter.
 * @param {string} email
 */
export async function subscribeEmail(email) {
  const { data } = await publicClient.post('/subscribe', { email })
  return data
}

/**
 * Fetch a navigation menu by location (header/footer).
 * Returns a nested tree of menu items with localized titles.
 * @param {string} location - 'header' or 'footer'
 */
export async function fetchPublicMenus(location) {
  const { data } = await publicClient.get(`/menus/${location}`)
  // Attach items to the menu object for convenience
  if (data.menu) {
    data.menu.items = data.items || []
  }
  return data.menu
}
