<div align="center">

# 💰 SmartTracker Enterprise

### AI-Powered Personal Finance & Budget Management Platform

[![Django](https://img.shields.io/badge/Django-6.0-092E20?style=flat&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![Celery](https://img.shields.io/badge/Celery-5.6-37814A?style=flat&logo=celery&logoColor=white)](https://docs.celeryq.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start (Docker)](#quick-start-docker)
- [Local Development Setup](#local-development-setup)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Deployment](#deployment)

---

## Overview

**SmartTracker Enterprise** is a full-stack, production-grade personal finance management platform with AI-powered spending analysis, multi-currency support, smart budget alerts, savings goal tracking, recurring expense management, and comprehensive financial reporting.

It is built with a **Django REST Framework** backend, a **React + Vite** frontend, and runs fully containerized using **Docker Compose** with **Celery** for background task processing.

---

## Features

| Module | Description |
|--------|-------------|
| 🔐 **JWT Authentication** | Secure login, registration, password reset with email OTP verification |
| 📊 **Dashboard** | Real-time financial overview with budget alerts and spending trends |
| 💸 **Income & Expenses** | Full CRUD with categories, recurring transactions, and payee tracking |
| 🎯 **Budget Management** | Monthly budgets with 4-level smart warnings (Safe/Warning/Alert/Exceeded) |
| 🏆 **Savings Goals** | Visual progress tracking for multiple savings milestones |
| 🔄 **Recurring Expenses** | Automatic generation of periodic transactions (daily/weekly/monthly/yearly) |
| 🤖 **AI Spending Analysis** | 5-module financial health score with personalized recommendations |
| 📈 **Reports** | Export to CSV & professionally styled Excel with summary sheets |
| 🌍 **Multi-Currency** | Live exchange rates with per-user currency preferences |
| 📧 **Email Notifications** | HTML email alerts for budget warnings, reports, and welcome messages |
| 📱 **Push Notifications** | Firebase Cloud Messaging (FCM) integration for mobile alerts |
| 🔔 **Celery Tasks** | Async background processing with Celery Beat scheduled jobs |
| 🛡️ **Admin Portal** | Customized Django Admin with full data management |
| 🧪 **Validation Suite** | End-to-end demo data loader + service validation command |

---

## Tech Stack

### Backend
- **Python 3.11** + **Django 6.0**
- **Django REST Framework 3.17** — API layer
- **SimpleJWT** — JWT authentication with token blacklisting
- **Celery 5.6** + **Redis 7** — Async tasks & scheduling
- **PostgreSQL 16** — Primary database
- **Gunicorn** — Production WSGI server
- **OpenPyXL** — Excel report generation

### Frontend
- **React 18** + **Vite 8** — SPA with fast HMR
- **React Router v7** — Client-side routing
- **Axios** — HTTP client with auto JWT refresh interceptor
- **Lucide React** — Icon library
- **TailwindCSS** — Utility-first styling
- **Recharts** — Data visualization

### Infrastructure
- **Docker** + **Docker Compose** — Full containerization
- **Nginx** — Reverse proxy + static file serving
- **Redis** — Celery broker + result backend

---

## Project Structure

```
enterprise-tracker/
├── backend/                    # Django Application
│   ├── accounts/               # User model, JWT auth, OTP
│   ├── ai_engine/              # AI spending analysis service
│   ├── budgets/                # Budget & CategoryBudget models
│   ├── categories/             # Income/Expense category model
│   ├── core/                   # Django settings, URLs, Celery config
│   │   └── management/
│   │       └── commands/
│   │           └── load_demo_data.py   # E2E validation command
│   ├── dashboard/              # Dashboard summary service
│   ├── expenses/               # Expense model, recurring logic
│   ├── goals/                  # Savings goal tracking
│   ├── income/                 # Income model & repository
│   ├── notifications/          # Celery notification tasks (Email/Push/SMS)
│   ├── reports/                # CSV & Excel report generation
│   ├── Dockerfile              # Multi-stage production Dockerfile
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React Application
│   ├── src/
│   │   ├── context/            # Auth, Theme, Currency React contexts
│   │   ├── pages/              # Dashboard, Expenses, Goals, Reports, etc.
│   │   ├── components/         # Layout, Sidebar, Navbar
│   │   ├── services/           # api.js (Axios + JWT interceptors)
│   │   └── hooks/              # Custom React hooks
│   ├── nginx.conf              # Production Nginx config
│   └── Dockerfile              # Multi-stage production Dockerfile
│
├── docker-compose.yml          # Full orchestration (DB, Redis, API, Worker, UI)
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

---

## Quick Start (Docker)

The fastest way to run the full application stack.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/smarttracker-enterprise.git
cd smarttracker-enterprise
```

**2. Configure environment**
```bash
cp .env.example .env
# Edit .env with your values (at minimum set a SECRET_KEY and DB_PASSWORD)
```

**3. Build and start all services**
```bash
docker compose up --build -d
```

**4. Load demo data (optional but recommended)**
```bash
docker compose exec backend python manage.py load_demo_data
```

**5. Create a superuser for admin access**
```bash
docker compose exec backend python manage.py createsuperuser
```

**6. Open in browser**

| Service | URL |
|---------|-----|
| 🌐 App | http://localhost |
| 🔧 Django Admin | http://localhost/admin |
| 🔌 API | http://localhost/api |

> **Demo credentials:** `demo@smarttracker.com` / `Password123!`

---

## Local Development Setup

### Backend

**Prerequisites:** Python 3.11+, PostgreSQL 16, Redis 7

```bash
# 1. Navigate to backend
cd backend

# 2. Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your local DB credentials

# 5. Run migrations
python manage.py migrate

# 6. Create superuser
python manage.py createsuperuser

# 7. Start development server
python manage.py runserver
```

**Start Celery Worker (in a new terminal):**
```bash
cd backend && venv\Scripts\activate
celery -A core worker --loglevel=info
```

**Start Celery Beat Scheduler (in a new terminal):**
```bash
cd backend && venv\Scripts\activate
celery -A core beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### Frontend

**Prerequisites:** Node.js 20+

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The frontend dev server runs at `http://localhost:5173` and proxies API calls to `http://localhost:8000`.

---

## API Documentation

The API base URL is `/api/`. All protected endpoints require a `Bearer` JWT token in the `Authorization` header.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/accounts/register/` | Register new user |
| `POST` | `/api/accounts/login/` | Login and receive JWT tokens |
| `POST` | `/api/accounts/token/refresh/` | Refresh access token |
| `POST` | `/api/accounts/logout/` | Blacklist refresh token |
| `POST` | `/api/accounts/forgot-password/` | Send OTP for password reset |
| `POST` | `/api/accounts/reset-password/` | Reset password with OTP |

### Core Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/expenses/` | List / Create expenses |
| `GET/PUT/DELETE` | `/api/expenses/{id}/` | Retrieve / Update / Delete expense |
| `GET/POST` | `/api/income/` | List / Create income entries |
| `GET/POST` | `/api/budgets/` | List / Create budgets |
| `GET/POST` | `/api/goals/` | List / Create savings goals |
| `GET` | `/api/categories/` | List all categories |
| `GET` | `/api/dashboard/` | Dashboard summary with alerts |
| `GET` | `/api/ai-engine/advice/` | AI spending analysis |
| `GET` | `/api/reports/csv/` | Download CSV report |
| `GET` | `/api/reports/excel/` | Download Excel report |

---

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | Django secret key (generate a long random string) | ✅ Yes |
| `DEBUG` | `True` for dev, `False` for production | ✅ Yes |
| `DB_NAME` | PostgreSQL database name | ✅ Yes |
| `DB_USER` | PostgreSQL username | ✅ Yes |
| `DB_PASSWORD` | PostgreSQL password | ✅ Yes |
| `DB_HOST` | Database host (`localhost` or `db` for Docker) | ✅ Yes |
| `REDIS_URL` | Redis connection URL | ✅ Yes |
| `EMAIL_HOST_USER` | SMTP email address | ⚠️ For emails |
| `EMAIL_HOST_PASSWORD` | SMTP app password | ⚠️ For emails |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging key | ⚠️ For push |

---

## Running Tests

### Backend Validation
```bash
# Full E2E service validation (DB, AI Engine, Email, Push, Budget Alerts)
python manage.py load_demo_data

# Django system check
python manage.py check
```

### Frontend
```bash
# Lint check
npm run lint

# Production build verification
npm run build
```

---

## Deployment

### Docker Production Deployment

**1. Configure production `.env`**
```bash
# Essential production settings
SECRET_KEY=your-very-long-random-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOW_ALL_ORIGINS=False
DB_PASSWORD=your-strong-database-password
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST_USER=your@email.com
EMAIL_HOST_PASSWORD=your-app-password
```

**2. Deploy**
```bash
docker compose up --build -d
```

**3. Verify all services are healthy**
```bash
docker compose ps
```

All 6 services should show `healthy` status:

| Service | Role |
|---------|------|
| `db` | PostgreSQL 16 |
| `redis` | Redis 7 |
| `backend` | Django + Gunicorn |
| `celery_worker` | Async task processor |
| `celery_beat` | Scheduled job runner |
| `frontend` | Nginx + React SPA |

---

<div align="center">

Built with ❤️ using Django, React, and Docker

</div>
