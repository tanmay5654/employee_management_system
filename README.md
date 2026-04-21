# 🍕 PizzaCo Staff — Workforce Management System

A full-stack employee management system built for pizza shop businesses. Manages staff onboarding, shift scheduling, time tracking, payroll analytics, and more — all in one place.

---

## 📸 Features

- **Role-Based Access** — Admin, Manager, and Employee roles with different permissions
- **Employee Management** — Add, edit, and remove staff with department and position tracking
- **Time Tracking** — Clock in / clock out with break tracking and time entry history
- **Shift Scheduling** — Create and manage shifts (Opening, Lunch Rush, Dinner Rush, Closing, etc.)
- **Payroll Analytics** — Weekly hours, overtime trends, department summary, and payroll forecast charts
- **AI Query Assistant** — Ask natural language questions about your workforce data
- **Auto Email Onboarding** — New employees automatically receive their login credentials by email
- **JWT Authentication** — Secure login with 8-hour session tokens
- **Security** — BCrypt password hashing, rate limiting, security headers, audit logging

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 21, Spring Boot 3.5, Spring Security |
| Database | PostgreSQL 16 |
| Frontend | React 19, TypeScript, Recharts |
| Auth | JWT (JSON Web Tokens), BCrypt |
| Email | Spring Mail + Gmail SMTP |
| AI | Groq API (llama-3.3-70b-versatile) |
| Containerization | Docker, Docker Compose |
| Web Server | Nginx (serves React app + proxies API) |

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git

### 1. Clone the repository

```bash
git clone https://github.com/tanmay5654/employee_management_system.git
cd employee_management_system
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
DB_PASSWORD=your_database_password
JWT_SECRET=your_jwt_secret_key

# Gmail SMTP (use an App Password, not your real password)
MAIL_USERNAME=your_email@gmail.com
MAIL_APP_PASSWORD=your_gmail_app_password

# Groq API (free at console.groq.com)
GROQ_API_KEY=your_groq_api_key
```

### 3. Start the application

```bash
docker-compose up --build
```

This starts 3 containers:
- **PostgreSQL** on port `5432`
- **Spring Boot backend** on port `8080`
- **React frontend** on port `80`

### 4. Open the app

```
http://localhost
```

---

## 👤 Default Admin Account

After first run, create an admin account via the Register page or using the API:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234","role":"ADMIN","fullName":"Admin User"}'
```

---

## 📁 Project Structure

```
employee_management_system/
├── docker-compose.yml               # Orchestrates all services
├── .env.example                     # Environment variable template
├── aws/                             # AWS deployment scripts (EC2, S3)
├── .github/workflows/               # GitHub Actions CI/CD pipeline
│
├── employee-payroll-system/         # Spring Boot Backend
│   ├── src/main/java/.../
│   │   ├── controller/              # REST API endpoints
│   │   ├── model/                   # JPA entities (Employee, User, etc.)
│   │   ├── repository/              # Spring Data JPA repositories
│   │   ├── security/                # JWT, filters, rate limiting
│   │   └── service/                 # Business logic, email, AI
│   └── Dockerfile
│
└── employee-payroll-frontend/       # React TypeScript Frontend
    ├── src/
    │   ├── components/              # Login, EmployeeList, Roster, etc.
    │   ├── services/api.ts          # Axios API calls
    │   └── types.ts                 # TypeScript interfaces
    ├── nginx.conf                   # Nginx config with API proxy
    └── Dockerfile
```

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and get JWT token |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/employees` | Get all employees |
| POST | `/api/employees` | Create employee (Manager+) |
| PUT | `/api/employees/{id}` | Update employee (Manager+) |
| DELETE | `/api/employees/{id}` | Delete employee (Manager+) |
| POST | `/api/timesheet/clock-in` | Clock in |
| POST | `/api/timesheet/clock-out` | Clock out |
| GET | `/api/roster` | Get scheduled shifts |
| POST | `/api/roster` | Create shift (Manager+) |
| GET | `/api/analytics/weekly-hours` | Weekly hours chart data |
| POST | `/api/ai/query` | Natural language data query |

---

## 🔒 Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_PASSWORD` | PostgreSQL database password |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `MAIL_USERNAME` | Gmail address for sending emails |
| `MAIL_APP_PASSWORD` | Gmail App Password (not your login password) |
| `GROQ_API_KEY` | Groq API key for AI queries (free tier available) |

> **Never commit your `.env` file.** It is gitignored by default.

---

## 📊 Database Tables

| Table | Description |
|-------|-------------|
| `employees` | Staff records with department, position, hourly rate |
| `users` | Login accounts linked to employees |
| `time_entries` | Clock in/out records with hours worked |
| `rosters` | Scheduled shifts |
| `audit_logs` | Security audit trail of all API requests |

---

## 🛡️ Security Features

- JWT tokens expire after **8 hours**
- Passwords hashed with **BCrypt**
- **Rate limiting** — 60 requests/min globally, 10/min for auth endpoints
- **Security headers** — HSTS, X-Frame-Options, Content-Security-Policy
- All requests logged to audit trail

---

## 📧 Email Setup (Gmail)

1. Enable 2-Factor Authentication on your Google account
2. Go to **Google Account → Security → App Passwords**
3. Generate a new App Password for "Mail"
4. Use that 16-character password as `MAIL_APP_PASSWORD` in `.env`

---

## 🤖 AI Assistant Setup

1. Sign up for a free account at [console.groq.com](https://console.groq.com)
2. Create an API key
3. Add it as `GROQ_API_KEY` in `.env`

Example queries:
- *"How many employees are in the kitchen?"*
- *"Who worked the most hours this week?"*
- *"Show me all delivery drivers"*

---

## 📄 License

This project is for educational and portfolio purposes.
