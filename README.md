<div align="center">

# 🏛️ Kenya County Government ERP

**Enterprise Resource Planning System for Kenyan County Governments**

[![Vue 3](https://img.shields.io/badge/Vue_3-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![DaisyUI](https://img.shields.io/badge/DaisyUI-5A0EF8?style=for-the-badge&logo=daisyui&logoColor=white)](https://daisyui.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 📋 Overview

A comprehensive ERP solution designed for Kenyan county governments. Manages content publishing, human resources, health services, community health programs, permits and licensing, and public-facing information — all through a unified admin dashboard.

---

## 🧩 Modules

| Module | Description |
|--------|-------------|
| 📰 **Content Management** | News, events, tenders, vacancies, departments, staff profiles with multi-locale support (English/Swahili/Pokot) |
| 👥 **Human Resources** | Employee lifecycle, leave management, attendance, performance reviews, disciplinary cases, recruitment pipeline |
| 🏥 **Health Management** | Patient records, appointments, campaigns, inventory tracking, ambulance requests |
| 👨‍👩‍👧‍👦 **Community Health** | Community units, volunteers, households, CHV management, supply requests, visit tracking |
| 📋 **Permits & Licensing** | Permit applications, assignments, transactions, citizen representations |
| 🌐 **Public Website** | Dynamic menus, hero slides, facts, contact forms, newsletter subscriptions |
| 🤖 **AI Assistant** | LLM-powered content summarization, grammar checking, translation, SEO suggestions |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vue 3, Vite, Pinia, Vue Router, DaisyUI (Tailwind CSS) |
| **Backend** | Node.js, Express.js, Sequelize ORM |
| **Database** | MySQL 8+ |
| **AI** | DeepSeek API |
| **Auth** | JWT + Role-Based Access Control |
| **Payments** | M-Pesa API integration |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+
- npm or yarn

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env` with your credentials:

```env
DB_NAME=county_erp
DB_USER=root
DB_PASS=your_password
JWT_SECRET=your_jwt_secret
DEEPSEEK_API_KEY=sk-xxxxx
```

### 3. Seed Database

```bash
cd backend
npm run seed
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```

---

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── models/           # Sequelize models (30+ entities)
│   │   ├── routes/           # Express route definitions
│   │   ├── services/         # Business logic layer
│   │   ├── middleware/       # Auth, authorization, error handling
│   │   └── index.js          # Application entry point
│   ├── scripts/              # Database migration scripts
│   └── seeders/              # Initial data seeders
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable Vue components
│   │   ├── views/            # Page components (admin + public)
│   │   ├── stores/           # Pinia state management
│   │   ├── router/           # Vue Router configuration
│   │   ├── api/              # API client modules
│   │   └── layouts/          # Admin & public layouts
│   └── tailwind.config.js    # Custom DaisyUI themes
└── plans/                    # Architecture & design documentation
```

---

## 🎨 Themes

The UI uses a custom DaisyUI theme with light and dark variants:

- **`county`** (light) — Warm off-white background (`#F9F7F4`) with accessible contrast ratios (WCAG AA)
- **`county-dark`** (dark) — Warm dark charcoal (`#232428`) for reduced eye strain

---

## 🔑 Default Roles

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full system access |
| **Content Manager** | CMS operations, media library |
| **HR Manager** | Employee management, recruitment |
| **Health Officer** | Health module management |
| **Community Health Worker** | CHV-specific operations |
| **Reviewer** | Content review and approval |

---

## 📄 License

MIT © Kenya County Government

---

<div align="center">
  <sub>Built with ❤️ for Kenyan counties</sub>
</div>
