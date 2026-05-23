# Finanzas

Gestor de finanzas personales con scanner de IA, soporte multidivisa y PWA.

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Recharts, Lucide
- **Backend:** Server Actions, NextAuth v5 (Credentials), Prisma 7 + SQLite
- **AI:** Z.AI GLM-4.6V-Flash (vision) — OpenAI-compatible SDK
- **PWA:** Service worker, manifiesto, prompt de instalación

## Funcionalidades

- Dashboard con KPIs, gráficos mensuales y por categoría
- CRUD de transacciones con paginación y filtros por fecha
- CRUD de suscripciones recurrentes
- Presupuestos mensuales con tracking de gasto
- Cuentas (efectivo, banco, tarjeta, billetera)
- Reportes con breakdown por categoría y exportación CSV
- Scanner de recibos/suscripciones con IA:
  - Clasifica automáticamente (gasto, suscripción, ingreso)
  - Detecta moneda de la imagen y convierte a la moneda del usuario
  - Safety net para servicios SaaS internacionales (USD)
- Autenticación (login, registro)
- PWA instalable en móvil y desktop
- Barra de navegación inferior en móvil

## Requisitos

- Node.js 20+
- Z.AI API key ([z.ai](https://z.ai)) para el scanner de IA

## Instalación

```bash
npm install
cp .env.example .env.local
# Editar .env.local con tus keys
npx prisma migrate dev
npx prisma generate
npm run dev
```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de la base de datos (`file:./dev.db` para desarrollo) |
| `AUTH_SECRET` | Secreto de NextAuth (`openssl rand -hex 32`) |
| `NEXTAUTH_URL` | URL base (`http://localhost:3000`) |
| `ZAI_API_KEY` | API key de Z.AI para el scanner |
| `AI_VISION_MODEL` | Modelo de visión (`glm-4.6v-flash` por defecto) |
| `AI_VISION_BASE_URL` | URL base de la API de visión |
| `STRIPE_WEBHOOK_SECRET` | Secreto de webhook de Stripe (opcional) |

## Estructura

```
src/
├── app/
│   ├── (public)/          # Landing, login, registro
│   └── (dashboard)/       # Panel, transacciones, presupuestos, etc.
├── components/
│   ├── dashboard/         # Sidebar, charts, cards, tab bar
│   └── ui/                # Input, Modal, Button, Toast, etc.
├── features/              # Server actions por dominio
├── hooks/                 # useCurrency, useFetch
├── lib/                   # Auth, validations, AI scanner, exchange rates
└── types/                 # Tipos compartidos
```
