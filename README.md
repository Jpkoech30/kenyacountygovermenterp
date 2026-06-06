# Kenya County Government ERP

A comprehensive enterprise resource planning system for Kenyan county governments. Built with Vue 3, Express.js, and MySQL.

## Modules

- **Content Management System** — Create, manage, and publish public content (news, events, tenders, vacancies, departments, staff profiles)
- **Human Resources** — Employee lifecycle, leave management, attendance tracking, performance reviews, disciplinary cases, recruitment
- **Health Management** — Patient records, appointments, campaigns, inventory, ambulance requests
- **Community Health** — Community units, volunteers, households, visits, supplies, CHV management
- **Permits & Licensing** — Permit applications, assignments, transactions, citizen representations
- **Public Website** — Dynamic menus, hero slides, facts, contact forms, newsletter subscriptions
- **AI Content Assistant** — LLM-powered content summarization, grammar checking, translation, SEO suggestions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3, Vite, Pinia, Vue Router, DaisyUI (Tailwind CSS) |
| Backend | Node.js, Express.js, Sequelize ORM |
| Database | MySQL |
| AI | DeepSeek API integration |
| Auth | JWT-based authentication with role-based access control |

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # Configure database credentials and API keys
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Database

```bash
cd backend
npm run seed   # Seed initial data (roles, admin user, sample content)
```

## Environment Variables

Key variables for `backend/.env`:

| Variable | Description |
|----------|-------------|
| `DB_NAME` | MySQL database name |
| `DB_USER` | MySQL user |
| `DB_PASS` | MySQL password |
| `JWT_SECRET` | JWT signing secret |
| `DEEPSEEK_API_KEY` | API key for AI content assistant |
| `MPESA_CONSUMER_KEY` | M-Pesa API consumer key |
| `MPESA_CONSUMER_SECRET` | M-Pesa API consumer secret |

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, error handling
│   │   └── index.js        # App entry point
│   ├── scripts/            # Migration scripts
│   └── seeders/            # Database seeders
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable Vue components
│   │   ├── views/          # Page components
│   │   ├── stores/         # Pinia stores
│   │   ├── router/         # Vue Router config
│   │   ├── api/            # API client modules
│   │   └── layouts/        # Layout components
│   └── tailwind.config.js  # Theme configuration
└── plans/                  # Architecture and design docs
```

## Themes

The UI uses a custom DaisyUI theme with two variants:

- **`county`** (light) — Warm off-white background with accessible contrast ratios
- **`county-dark`** (dark) — Warm dark charcoal for reduced eye strain

## License

MIT
