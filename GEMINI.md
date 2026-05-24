# Finance SaaS - Project Instructions

## Architecture & Frameworks
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **State & Logic:** Server Actions located in `src/features/`
- **Database:** [Prisma](https://www.prisma.io/) with LibSQL (SQLite/Turso)
- **Authentication:** [NextAuth.js v5](https://authjs.dev/)
- **Validation:** [Zod](https://zod.dev/) schemas in `src/lib/validations/`
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Charts:** [Recharts](https://recharts.org/)

## Directory Structure
- `src/app/`: Routes, layouts, and API endpoints.
- `src/features/`: Core business logic and server actions, organized by domain (e.g., `transactions`, `budgets`).
- `src/components/ui/`: Reusable primitive UI components.
- `src/lib/`: Shared utilities, Prisma client, and validation schemas.
- `src/hooks/`: Custom React hooks.
- `src/types/`: Global TypeScript definitions.
- `prisma/`: Database schema and migrations.

## Development Workflows
- **Prisma:** Always update `prisma/schema.prisma` first when changing the data model. Run `npx prisma migrate dev` to apply changes.
- **Server Actions:** Keep logic in `src/features/` and use them directly in components or through forms.
- **Validation:** Use Zod schemas for both client-side form validation and server-side action validation.
- **AI Scanning:** OpenAI logic is handled in `src/lib/ai-scanner.ts`.
- **PWA:** PWA configuration is in `public/manifest.json` and `src/components/pwa-register.tsx`.

## Coding Standards
- Use `use server` for server-side logic in feature files.
- Prefer functional components and React Hooks.
- Follow the established pattern of using `clsx` and `tailwind-merge` for dynamic classes.
- Ensure all database operations are wrapped in proper ownership checks (e.g., `ensureOwnership` helper).
- Maintain type safety by using generated Prisma types and custom types in `src/types/`.
