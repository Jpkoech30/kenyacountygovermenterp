# West Pokot County Public Website — Implementation Plan

## Overview

Build a complete public-facing website for West Pokot County Government using Vue 3 Composition API, DaisyUI, and the existing backend API. The website will be a **separate SPA** within the same frontend project, with its own layout, routing, and components — all under public routes (no authentication required).

## Architecture

```
frontend/src/
├── api/
│   └── public.js              # NEW: Public API client (no auth)
├── stores/
│   └── locale.js              # NEW: Locale store (en/sw/pok)
├── layouts/
│   └── PublicLayout.vue       # NEW: Public website layout (header + footer)
├── components/
│   ├── public/
│   │   ├── AppHeader.vue      # NEW: Navbar, language switcher, accessibility
│   │   ├── AppFooter.vue      # NEW: Footer with contact, social, newsletter
│   │   ├── AccessibilityToolbar.vue  # NEW: Font size, contrast, skip-to-content
│   │   ├── HeroCarousel.vue   # NEW: DaisyUI carousel for hero slides
│   │   ├── WeatherWidget.vue  # NEW: OpenWeatherMap widget for Kapenguria
│   │   ├── FactRotator.vue    # NEW: Cycling facts every 10s
│   │   ├── NewsCard.vue       # NEW: News article card
│   │   ├── EventCard.vue      # NEW: Event card
│   │   ├── DepartmentCard.vue # NEW: Department card
│   │   ├── TenderTable.vue    # NEW: Tenders list table
│   │   ├── VacancyTable.vue   # NEW: Vacancies list table
│   │   └── ContactForm.vue    # NEW: Contact form with validation
│   └── QRCodeDisplay.vue      # EXISTING (already used by VerifyPermitPage)
├── views/
│   ├── public/
│   │   ├── HomePage.vue       # NEW: Homepage with all sections
│   │   ├── AboutPage.vue      # NEW: About the county
│   │   ├── DepartmentsPage.vue        # NEW: Department grid
│   │   ├── DepartmentDetailPage.vue   # NEW: Single department detail
│   │   ├── NewsListPage.vue           # NEW: Paginated news list
│   │   ├── NewsDetailPage.vue         # NEW: Full news article
│   │   ├── EventsPage.vue             # NEW: Upcoming events
│   │   ├── EventDetailPage.vue        # NEW: Single event detail
│   │   ├── TendersPage.vue            # NEW: Open tenders table
│   │   ├── VacanciesPage.vue          # NEW: Open vacancies table
│   │   ├── ContactPage.vue            # NEW: Contact form + map
│   │   └── PermitVerificationPage.vue # NEW: Wrapper for /verify/:permit_id
│   ├── VerifyPermitPage.vue   # EXISTING (keep as-is)
│   └── ApplyPermitPage.vue    # EXISTING (keep as-is)
├── router/
│   └── index.js               # MODIFY: Add public routes
└── App.vue                    # MODIFY: Handle public vs admin layout
```

## Backend — No Changes Needed

All required API endpoints already exist at `/api/public/*`:
- `GET /api/public/hero-slides` — Hero carousel
- `GET /api/public/facts` — Fact rotator
- `GET /api/public/content?type=news&limit=3` — Latest news
- `GET /api/public/content/:slug` — Content detail by slug
- `GET /api/public/events?upcoming=true&limit=3` — Upcoming events
- `GET /api/public/tenders` — Open tenders
- `GET /api/public/vacancies` — Open vacancies
- `GET /api/public/departments` — Department list
- `GET /api/public/persons?title=governor` — Governor profile
- `GET /api/public/persons?title=deputy` — Deputy profile
- `GET /api/public/categories` — News categories
- `GET /api/verify/:permit_id` — Permit verification (already exists)

**One addition needed**: Contact form and newsletter endpoints.
- `POST /api/public/contact` — Submit contact form
- `POST /api/public/subscribe` — Newsletter signup

## Implementation Steps

### Step 1: Install new dependency
- Add `@unhead/vue` for SEO meta tags (or use `vue-meta`)

### Step 2: Create `frontend/src/api/public.js`
- Axios instance with `baseURL: '/api/public'` (no auth interceptor)
- Functions: `fetchHeroSlides()`, `fetchFacts()`, `fetchContent(params)`, `fetchContentBySlug(slug)`, `fetchEvents(params)`, `fetchTenders(params)`, `fetchVacancies(params)`, `fetchDepartments()`, `fetchCategories()`, `fetchPersons(params)`, `submitContact(data)`, `subscribeEmail(email)`

### Step 3: Create `frontend/src/stores/locale.js`
- Pinia store with `locale` ref (`'en'` default)
- Persist to `localStorage`
- `setLocale(locale)` action
- Translation object with common UI strings in EN, SW, POK

### Step 4: Create `frontend/src/layouts/PublicLayout.vue`
- Wraps all public pages
- Includes `AppHeader` at top, `<slot/>` for content, `AppFooter` at bottom
- Accessibility toolbar floating button

### Step 5: Create global public components

#### 5a. `AppHeader.vue`
- Logo (West Pokot County crest/name) on left
- Nav links: Home, About, Departments, News, Events, Tenders, Contact
- Language switcher: 3 flag buttons (EN, SW, POK) using Lucide `Languages` icon
- Accessibility toolbar toggle button
- Mobile: DaisyUI drawer with hamburger
- Sticky top with `navbar` class

#### 5b. `AppFooter.vue`
- 3-column grid: Contact info, Quick Links, Newsletter signup
- Social media icons (Lucide: `Globe`, `Mail`, `Phone`, `MapPin`)
- Copyright line
- DaisyUI `footer` class

#### 5c. `AccessibilityToolbar.vue`
- DaisyUI modal or dropdown panel
- Font size: A- / A+ buttons (adds `text-sm`/`text-lg`/`text-xl` class to `<html>`)
- High contrast toggle (adds `data-theme="dark"` or custom `.high-contrast` class)
- "Skip to content" link (visually hidden, focusable)

#### 5d. `HeroCarousel.vue`
- DaisyUI carousel with `carousel` and `carousel-item` classes
- Fetches slides from `/api/public/hero-slides`
- Each slide: full-width image with overlay text (title + subtitle)
- Auto-advance every 5 seconds
- Navigation dots/arrows

#### 5e. `WeatherWidget.vue`
- Fetches from OpenWeatherMap API for Kapenguria (lat=1.245, lon=35.112)
- Shows: current temperature, condition icon, "Feels like"
- 3-day forecast below
- Uses `VITE_WEATHER_API_KEY` env var
- Graceful fallback if API key missing

#### 5f. `FactRotator.vue`
- Fetches facts from `/api/public/facts`
- Cycles through facts every 10 seconds with fade transition
- Shows fact text in current locale (text_en/text_sw/text_pok)

#### 5g. `NewsCard.vue`
- Card with image (featured image), title, date, excerpt
- Links to `/news/:slug`
- DaisyUI `card` class with `card-body`

#### 5h. `EventCard.vue`
- Card with date badge, title, location, description excerpt
- Links to `/events/:slug`

#### 5i. `DepartmentCard.vue`
- Card with department name, description snippet
- Links to `/departments/:slug`

#### 5j. `TenderTable.vue`
- DaisyUI `table` with columns: Title, Closing Date, Download
- Download links to tender document (if available in media)

#### 5k. `VacancyTable.vue`
- DaisyUI `table` with columns: Title, Closing Date, Requirements

#### 5l. `ContactForm.vue`
- Fields: Name, Email, Department (dropdown), Message
- VeeValidate + Yup validation
- POST to `/api/public/contact`
- Toast notification on success/error

### Step 6: Create public view pages

#### 6a. `HomePage.vue`
- Hero carousel (full width)
- Quick service cards: 4-6 cards in a grid (eCitizen, Business Permits, Health, Education, Tenders)
- Fact rotator section
- Latest news (3 cards in a row)
- Upcoming events (3 cards)
- Governor & Deputy profiles with photos

#### 6b. `AboutPage.vue`
- Static content sections: History, Geography & Demography, Economy
- Or fetch from CMS page with slug `about` via `/api/public/content/about`

#### 6c. `DepartmentsPage.vue`
- Grid of department cards fetched from `/api/public/departments`
- Search/filter input

#### 6d. `DepartmentDetailPage.vue`
- Fetches department by slug from `/api/public/content/:slug`
- Shows full description, contact info from meta, service charter link

#### 6e. `NewsListPage.vue`
- Paginated list (10 per page) from `/api/public/content?type=news`
- Category filter dropdown from `/api/public/categories`
- News cards grid

#### 6f. `NewsDetailPage.vue`
- Fetches by slug from `/api/public/content/:slug`
- Featured image, full HTML body (sanitized with `v-html`), tags, share buttons
- Dynamic meta title/description via `useHead`

#### 6g. `EventsPage.vue`
- Grid of upcoming events from `/api/public/events?upcoming=true`

#### 6h. `EventDetailPage.vue`
- Fetches by slug, shows date range, location, description

#### 6i. `TendersPage.vue`
- Table of open tenders from `/api/public/tenders`

#### 6j. `VacanciesPage.vue`
- Table of open vacancies from `/api/public/vacancies`

#### 6k. `ContactPage.vue`
- Contact info (address, phone, email)
- Google Maps iframe
- Contact form component
- Newsletter signup

### Step 7: Update router (`frontend/src/router/index.js`)
- Add public routes under a new parent route with `PublicLayout` component (no `requiresAuth`)
- Routes:
  - `/` → `HomePage` (public homepage)
  - `/about` → `AboutPage`
  - `/departments` → `DepartmentsPage`
  - `/departments/:slug` → `DepartmentDetailPage`
  - `/news` → `NewsListPage`
  - `/news/:slug` → `NewsDetailPage`
  - `/events` → `EventsPage`
  - `/events/:slug` → `EventDetailPage`
  - `/tenders` → `TendersPage`
  - `/vacancies` → `VacanciesPage`
  - `/contact` → `ContactPage`
- Keep existing routes: `/login`, `/reset-password`, `/apply-permit`, `/verify/:permit_id`, and all admin routes

### Step 8: Update `App.vue`
- Currently likely uses `<router-view />` directly
- No changes needed if router handles layout via nested routes

### Step 9: Add backend endpoints for contact and newsletter

#### 9a. Add to `backend/src/controllers/publicController.js`
- `submitContact(req, res)` — validates name, email, department, message; stores in a `contact_messages` table or sends email
- `subscribeEmail(req, res)` — validates email; stores in a `newsletter_subscribers` table

#### 9b. Add to `backend/src/routes/publicRoutes.js`
- `router.post('/contact', publicController.submitContact)`
- `router.post('/subscribe', publicController.subscribeEmail)`

#### 9c. Create model `backend/src/models/ContactMessage.js`
- Fields: id, name, email, department, message, created_at

#### 9d. Create model `backend/src/models/NewsletterSubscriber.js`
- Fields: id, email, subscribed_at, is_active

#### 9e. Register models in `backend/src/models/index.js`

### Step 10: Add SEO support
- Install `@unhead/vue` in frontend
- Use `useHead()` in each page to set title and meta description
- For news detail, use `meta_description` from API response

## File Creation Order

1. `frontend/src/api/public.js`
2. `frontend/src/stores/locale.js`
3. `frontend/src/components/public/AppHeader.vue`
4. `frontend/src/components/public/AppFooter.vue`
5. `frontend/src/components/public/AccessibilityToolbar.vue`
6. `frontend/src/layouts/PublicLayout.vue`
7. `frontend/src/components/public/HeroCarousel.vue`
8. `frontend/src/components/public/WeatherWidget.vue`
9. `frontend/src/components/public/FactRotator.vue`
10. `frontend/src/components/public/NewsCard.vue`
11. `frontend/src/components/public/EventCard.vue`
12. `frontend/src/components/public/DepartmentCard.vue`
13. `frontend/src/components/public/TenderTable.vue`
14. `frontend/src/components/public/VacancyTable.vue`
15. `frontend/src/components/public/ContactForm.vue`
16. `frontend/src/views/public/HomePage.vue`
17. `frontend/src/views/public/AboutPage.vue`
18. `frontend/src/views/public/DepartmentsPage.vue`
19. `frontend/src/views/public/DepartmentDetailPage.vue`
20. `frontend/src/views/public/NewsListPage.vue`
21. `frontend/src/views/public/NewsDetailPage.vue`
22. `frontend/src/views/public/EventsPage.vue`
23. `frontend/src/views/public/EventDetailPage.vue`
24. `frontend/src/views/public/TendersPage.vue`
25. `frontend/src/views/public/VacanciesPage.vue`
26. `frontend/src/views/public/ContactPage.vue`
27. `frontend/src/router/index.js` (modify)
28. Backend: ContactMessage model + NewsletterSubscriber model
29. Backend: publicController additions
30. Backend: publicRoutes additions
31. Backend: models/index.js registration

## Data Flow

```
User visits / → PublicLayout renders
  → AppHeader shows nav + language switcher
  → HomePage loads:
    1. HeroCarousel → GET /api/public/hero-slides
    2. WeatherWidget → OpenWeatherMap API
    3. FactRotator → GET /api/public/facts
    4. Latest news → GET /api/public/content?type=news&limit=3&locale=en
    5. Events → GET /api/public/events?upcoming=true&limit=3&locale=en
    6. Persons → GET /api/public/persons?title=governor
    7. Persons → GET /api/public/persons?title=deputy
  → Language switch: locale store updates → components re-fetch with new locale
```

## Key Design Decisions

1. **Separate API client** (`api/public.js`) — no auth interceptor, so public pages don't redirect to login on 401
2. **Locale store** — persisted to localStorage, all API calls include `?locale=${locale}`
3. **No custom CSS** — 100% DaisyUI utility classes
4. **Lazy loading** — all images use `loading="lazy"`
5. **SEO** — `@unhead/vue` for per-page meta tags
6. **Sanitized HTML** — news body rendered with `v-html` (content is already sanitized by TipTap on input)
7. **Responsive** — DaisyUI handles mobile via `navbar` collapse, `grid` responsive columns
