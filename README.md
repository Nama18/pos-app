# POS (Point of Sale) System

A modern, production-ready POS web application built with Next.js 15 and NestJS.

## Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI:** shadcn/ui primitives
- **State:** Zustand
- **Data Fetching:** TanStack Query
- **Forms:** react-hook-form + zod
- **Charts:** Recharts
- **Icons:** Lucide React
- **Design:** Dark-first "war-room / blueprint desk" aesthetic

### Backend
- **Framework:** NestJS
- **Language:** TypeScript
- **ORM:** TypeORM
- **Database:** PostgreSQL
- **Auth:** JWT (Passport) + bcrypt
- **API Docs:** Swagger / OpenAPI
- **Validation:** class-validator + class-transformer

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx

## Project Structure

```
pos-app/
├── backend/          # NestJS API (10 modules)
│   ├── src/
│   │   ├── auth/         # JWT authentication
│   │   ├── users/        # User management (Admin/Cashier)
│   │   ├── categories/   # Product categories
│   │   ├── products/     # Product CRUD
│   │   ├── customers/    # Customer management
│   │   ├── pos/          # POS transaction processing
│   │   ├── transactions/ # Transaction history
│   │   ├── inventory/    # Stock in/out/adjustment
│   │   ├── reports/      # Sales & inventory reports
│   │   └── dashboard/    # Dashboard statistics
│   └── seed/             # Database seed data
│
├── frontend/         # Next.js 15 App Router
│   ├── src/
│   │   ├── app/          # 17 route pages
│   │   ├── components/   # UI, layout, POS, shared components
│   │   ├── stores/       # Zustand state management
│   │   ├── lib/          # API client, utilities
│   │   └── types/        # TypeScript interfaces
│   └── public/           # Static assets
│
├── docker-compose.yml     # Production
├── docker-compose.dev.yml # Development
└── plan.md                # Implementation plan
```

## Features

- **Authentication** — JWT-based login with Admin & Cashier roles
- **Dashboard** — Sales statistics, charts, recent transactions, low stock alerts
- **Product Management** — CRUD with SKU, barcode, stock tracking, categories
- **Category Management** — Organize products into categories
- **Customer Management** — Track customers with loyalty points
- **POS Terminal** — Product grid, cart, barcode scanning, discount/tax, multiple payment methods
- **Transaction History** — Filterable, paginated transaction records
- **Inventory Management** — Stock in/out/adjustment with audit logs
- **Reports** — Sales reports, inventory value, top products
- **Receipt Printing** — 58mm & 80mm receipt formats
- **Responsive UI** — Desktop-first with mobile support
- **Dark Mode** — Dark-first design with light mode support
- **RBAC** — Role-based access control (Admin, Cashier)

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout` |
| Users | `GET/POST /users`, `GET/PATCH/DELETE /users/:id` |
| Categories | `GET/POST /categories`, `GET/PATCH/DELETE /categories/:id` |
| Products | `GET/POST /products`, `GET/PATCH/DELETE /products/:id`, `GET /products/barcode/:barcode` |
| Customers | `GET/POST /customers`, `GET/PATCH/DELETE /customers/:id` |
| POS | `POST /pos/transactions`, `GET /pos/transactions`, `GET /pos/transactions/:id`, `GET /pos/transactions/:id/receipt`, `GET /pos/products` |
| Inventory | `POST /inventory/stock-in`, `/stock-out`, `/adjust`, `GET /inventory`, `GET /inventory/low-stock` |
| Reports | `GET /reports/sales`, `/sales/summary`, `/inventory`, `/top-products` |
| Dashboard | `GET /dashboard/stats`, `/sales-chart`, `/recent-transactions`, `/low-stock` |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 16+
- Docker (optional)

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pos-app.git
   cd pos-app
   ```

2. Set up the backend:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   npm run migration:run
   npm run seed
   npm run start:dev
   ```
   The API will be available at `http://localhost:4000/api/v1`
   Swagger docs at `http://localhost:4000/api`

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

### Docker Setup

Start all services:
```bash
docker compose -f docker-compose.dev.yml up -d
```

Production build:
```bash
docker compose up -d
```

### Seed Data

After running migrations:
```bash
cd backend
npm run seed
```

**Demo Accounts:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pos.com | admin123 |
| Cashier | cashier1@pos.com | cashier123 |
| Cashier | cashier2@pos.com | cashier123 |

## Database

Run migrations:
```bash
cd backend
npm run migration:generate -- src/migrations/InitialSchema
npm run migration:run
```

## Default Admin Credentials

After seeding, log in with:
- **Email:** admin@pos.com
- **Password:** admin123

## API Documentation

When the backend is running, visit `http://localhost:4000/api` for Swagger UI.

## License

MIT
