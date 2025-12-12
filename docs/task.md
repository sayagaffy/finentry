# FinTrack MVP - Task Checklist

## Planning & Architecture
- [/] Create PRD document
- [x] Design database schema (Prisma)
- [/] Design API route structure
- [/] Design folder structure & naming convention
- [ ] Get user approval on architecture

## Implementation - Foundation
- [ ] Initialize Next.js project with TypeScript
- [x] Setup Prisma with PostgreSQL
- [x] Create database schema
- [ ] Setup authentication (if needed)
- [ ] Create base layout with sidebar

## Implementation - Master Data
- [x] Customer CRUD (UI + API)
- [x] Vendor/Transporter CRUD (UI + API)
- [x] Item/Goods CRUD (UI + API)
- [ ] Vehicle CRUD (optional)
- [ ] COA basic setup

## Implementation - Transaction Module
- [x] Transaction form UI
- [x] Transaction API (create, read, update, delete)
- [x] Transaction list with filters
- [x] Auto-calculation logic (revenue, costs, margin)

## Implementation - Financial Report
- [x] Profit & Loss report API
- [x] P&L report UI (daily/monthly view)
- [x] Drill-down to transaction detail
- [x] Export to Excel
- [x] Export to PDF

## Implementation - AI Finance Assistant
- [x] Chat UI page
- [x] Preset questions UI
- [x] AI Assistant API endpoint
- [x] LLM integration (BYO AI provider)
- [x] Query processing logic

## Testing & Deployment
- [x] Local testing
- [x] Deploy to Vercel/Railway
- [x] Database migration
- [x] Production testing

## Implementation - Auth & Multi-tenancy (New)
- [x] Design Multi-tenant Schema (Company, User, Relations)
- [x] Setup NextAuth.js (v5)
- [x] Create Login Page
- [x] Implement RBAC Middleware (Protect Routes)
- [x] Refactor APIs to enforce Company Isolation
- [x] Owner Dashboard (Multi-company view)
