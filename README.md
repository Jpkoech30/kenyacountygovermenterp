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

The database connection is configured in [`backend/src/config/database.js`](backend/src/config/database.js) — it reads `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` from environment variables.

### 3. Setup Database

```bash
# Create the database in MySQL
sudo mysql -u root -p -e "CREATE DATABASE county_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Seed initial data
cd backend
npm run seed
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (http://localhost:3000)
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

## 🚀 Production Deployment

Deploy to an Ubuntu server with Apache reverse proxy, PM2 process manager, and Let's Encrypt SSL.

### Architecture

```
Visitor Browser
       │
       ▼
  Apache (Port 443 — HTTPS)
       │
       ├── /api/*  ──► Node.js API (Port 3000) ──► MySQL
       ├── /media/* ──► Node.js API (static files)
       └── /*       ──► Vue SPA (frontend/dist/index.html)
```

### Prerequisites

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL, Apache, PM2
sudo apt install -y mysql-server apache2
sudo npm install -g pm2

# Enable Apache modules
sudo a2enmod proxy proxy_http rewrite ssl headers
```

### Quick Start

```bash
# 1. Clone the repo
sudo mkdir -p /var/www/county-erp
sudo chown -R $USER:$USER /var/www/county-erp
git clone https://github.com/Jpkoech30/kenyacountygovermenterp.git /var/www/county-erp
cd /var/www/county-erp

# 2. Configure backend
cd backend
cp .env.example .env
# Edit .env with your database credentials and secrets
npm install --production

# 3. Build frontend
cd ../frontend
npm install
npm run build

# 4. Setup database
sudo mysql -u root -p -e "CREATE DATABASE county_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
cd ../backend
npm run seed

# 5. Start with PM2
cd ..
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 6. Configure Apache
sudo nano /etc/apache2/sites-available/county-erp.conf
# Use the template below, replacing your-domain.com

sudo a2ensite county-erp.conf
sudo a2dissite 000-default.conf
sudo systemctl reload apache2

# 7. Get SSL certificate
sudo certbot --apache -d your-domain.com -d www.your-domain.com
```

### Apache Virtual Host Template

Save as `/etc/apache2/sites-available/county-erp.conf`:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    ServerAlias www.your-domain.com

    DocumentRoot /var/www/county-erp/frontend/dist

    <Directory /var/www/county-erp/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        FallbackResource /index.html
    </Directory>

    ProxyPreserveHost On
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
    ProxyPass /media http://localhost:3000/media
    ProxyPassReverse /media http://localhost:3000/media

    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"

    ErrorLog ${APACHE_LOG_DIR}/county-erp-error.log
    CustomLog ${APACHE_LOG_DIR}/county-erp-access.log combined

    Include /etc/letsencrypt/options-ssl-apache.conf
    SSLCertificateFile /etc/letsencrypt/live/your-domain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/your-domain.com/privkey.pem
</VirtualHost>
```

### Updating

```bash
cd /var/www/county-erp
git pull origin master
cd backend && npm install --production && pm2 restart west-pokot-erp-backend
cd ../frontend && npm install && npm run build
```

> **Full deployment guide**: See [`plans/production-deployment-plan.md`](plans/production-deployment-plan.md) for detailed steps, troubleshooting, and maintenance instructions.

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
