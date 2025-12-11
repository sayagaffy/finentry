# FinTrack - API Route Structure

## Overview
All API routes reside in `/app/api/` using Next.js App Router Route Handlers.

## 1. Master Data Endpoints

### Customers
- `GET /api/customers` - List customers (search, limit, offset)
- `POST /api/customers` - Create customer `{ name, contact, address }`
- `GET /api/customers/[id]` - Get details
- `PUT /api/customers/[id]` - Update
- `DELETE /api/customers/[id]` - Delete

### Vendors
- `GET /api/vendors` - List vendors (filter by type: vendor/transporter)
- `POST /api/vendors` - Create vendor
- `GET/PUT/DELETE /api/vendors/[id]`

### Items
- `GET /api/items` - List items
- `POST /api/items` - Create item `{ name, unit, category }`
- `GET/PUT/DELETE /api/items/[id]`

### Chart of Accounts (COA)
- `GET /api/coa` - List accounts
- `POST /api/coa` - Create account `{ code, name, type, category }`
- `GET/PUT/DELETE /api/coa/[id]`

## 2. Transaction Endpoints

### `GET /api/transactions`
List transactions with comprehensive filtering.
**Query Params**:
- `startDate`, `endDate`
- `type` (sale/purchase)
- `customerId`, `vendorId`, `itemId`
- `limit`, `offset`, `sortBy`

### `POST /api/transactions`
Create new transaction with auto-calculation.
**Body**:
```typescript
{
  date: string,
  type: "sale" | "purchase",
  customerId?: string,
  vendorId?: string,
  itemId: string,
  volume: number,
  basePrice: number, // Cost per unit
  sellPrice: number, // Revenue per unit
  transportCost?: number,
  unexpectedCost?: number,
  otherCost?: number
}
```
**Server Logic**:
- Validates required IDs (Customer for Sale, Vendor for Purchase).
- Calculates:
  - `revenue = sellPrice * volume`
  - `cogs = basePrice * volume`
  - `totalExpenses = transport + unexpected + other`
  - `margin = revenue - cogs - totalExpenses`

### `GET/PUT/DELETE /api/transactions/[id]`
- `PUT`: Recalculates all fields based on new input.
- `DELETE`: Performs soft delete (`deleted: true`).

### `GET /api/transactions/stats`
Aggregated stats for dashboard.
**Returns**: `totalRevenue`, `totalMargin`, `totalExpenses`, `transactionCount`.

## 3. Reporting Endpoints

### `GET /api/reports/profit-loss`
Generates P&L data for a specific period.
**Query**: `startDate`, `endDate`
**Response**:
```json
{
  "period": { "start": "...", "end": "..." },
  "revenue": { "total": 1000 },
  "cogs": { "total": 600 },
  "grossProfit": { "amount": 400, "percent": 40.0 },
  "operatingExpenses": { "total": 100, "breakdown": { "transport": 50, ... } },
  "netProfit": { "amount": 300, "percent": 30.0 }
}
```

### `POST /api/reports/export`
Generates downloadable files.
**Body**: `{ format: "excel" | "pdf", startDate, endDate }`
**Response**: Binary file stream.

## 4. AI Assistant Endpoint

### `POST /api/ai-assistant`
**Body**: `{ query: string, context?: { startDate, endDate } }`

**Process**:
1. **Intent Detection**: Analyzes if user asks for Profit, Revenue, specific Expense, or Top Customers.
2. **Data Fetching**: Queries `prisma.transaction.aggregate` or `groupBy` based on intent and period.
3. **LLM Generation**: Sends financial summary + user query to LLM to generate narrative response.

**Response**:
```json
{
  "answer": "Laba bersih bulan ini adalah Rp 15jt...",
  "rawData": { ... } // For UI charts/drilldown if needed
}
```

## Standard Response Format
```typescript
// Success
{ "data": T, "meta"?: any }

// Error
{ "error": string, "code": string }
```
