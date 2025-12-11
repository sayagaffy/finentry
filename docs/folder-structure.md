# FinTrack - Folder Structure & Naming Convention

## Folder Structure (Next.js App Router)

```
.
├── app/
│   ├── api/                    # API Route Handlers
│   │   ├── customers/          # /api/customers
│   │   ├── transactions/       # /api/transactions
│   │   └── reports/            # /api/reports
│   ├── (dashboard)/            # Route Group for Dashboard Layout
│   │   ├── layout.tsx          # Main Dashboard Layout (Sidebar + Header)
│   │   ├── page.tsx            # Dashboard Home
│   │   ├── transactions/       # Transactions Page
│   │   ├── master-data/        # Master Data Pages
│   │   │   ├── customers/
│   │   │   └── vendors/
│   │   ├── reports/            # Financial Reports Page
│   │   └── assistant/          # AI Finance Assistant Page
│   ├── login/                  # Login Page
│   └── layout.tsx              # Root Layout
├── components/
│   ├── ui/                     # Reusable UI primitives (Buttons, Inputs - shadcn/ui)
│   ├── layout/                 # Sidebar, Header, PageShell
│   ├── features/               # Feature-specific components
│   │   ├── transactions/       # TransactionForm, TransactionTable
│   │   ├── reports/            # ProfitLossCard, ExpenseChart
│   │   └── assistant/          # ChatInterface, MessageBubble
│   └── shared/                 # Shared functional components (DateRangePicker)
├── lib/
│   ├── prisma.ts               # Prisma Client instance
│   ├── utils.ts                # General helpers (cn, formatCurrency)
│   ├── api-client.ts           # Fetch wrappers / Axios instance
│   ├── constants.ts            # App-wide constants (menu items)
│   ├── hooks/                  # Custom React Hooks
│   │   └── use-transactions.ts
│   └── types/                  # TypeScript interfaces (if not automatic from Prisma)
├── prisma/
│   ├── schema.prisma           # Database Schema
│   └── seed.ts                 # Seed script
├── public/                     # Static assets
└── styles/                     # Global styles
```

## Naming Conventions

### Files & Directories
- **Directories**: `kebab-case` (e.g., `master-data`, `profit-loss`)
- **Components**: `PascalCase` (e.g., `TransactionForm.tsx`, `Sidebar.tsx`)
- **Utilities/Hooks**: `camelCase` (e.g., `formatCurrency.ts`, `useAuth.ts`)
- **Route Handlers**: Always `route.ts` (Next.js standard)

### Code
- **React Components**: `PascalCase`
  ```tsx
  export function TransactionTable() { ... }
  ```
- **Functions/Variables**: `camelCase`
  ```ts
  const totalRevenue = 5000;
  function calculateMargin() { ... }
  ```
- **Type/Interfaces**: `PascalCase`
  ```ts
  interface TransactionDetail { ... }
  ```
- **Constants**: `UPPER_SNAKE_CASE`
  ```ts
  const MAX_UPLOAD_SIZE = 1024 * 1024;
  ```

## Component Organization Pattern
Prefer **colocation** for feature-specific logic.

```
features/transactions/
├── components/
│   ├── TransactionForm.tsx
│   └── TransactionList.tsx
├── hooks/
│   └── useTransactionCalculations.ts
└── types.ts
```

For MVP, a flatter structure in `components/features/` is acceptable until complexity grows.
