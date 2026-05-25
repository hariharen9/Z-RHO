# DebtWise — Master Product Specification
> Version 1.0 | Status: Ready for Development

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Tech Stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Database Schema](#5-database-schema)
6. [Authentication & Security](#6-authentication--security)
7. [Application Structure](#7-application-structure)
8. [Feature Specifications](#8-feature-specifications)
   - 8.1 [Dashboard](#81-dashboard)
   - 8.2 [Loans Module](#82-loans-module)
   - 8.3 [Credit Cards Module](#83-credit-cards-module)
   - 8.4 [Settings](#84-settings)
9. [UI/UX Design System](#9-uiux-design-system)
10. [PWA Specification](#10-pwa-specification)
11. [Multi-Currency](#11-multi-currency)
12. [Calculations & Business Logic](#12-calculations--business-logic)
13. [Build Phases](#13-build-phases)
14. [Folder Structure](#14-folder-structure)
15. [Non-Functional Requirements](#15-non-functional-requirements)

---

## 1. Product Overview

**DebtWise** is a dedicated, full-stack personal debt management Progressive Web App (PWA). It is purpose-built to track loans and credit cards — not general spending. The core purpose is giving users complete clarity over their debt: what they owe, to whom, when payments are due, how much interest they are paying, and how their debt is reducing over time.

This is not a general finance tracker. It is laser-focused on debt lifecycle management.

### Who is it for?
Individuals managing one or more active loans (home, personal, car, education) and/or credit cards who want a single, reliable, beautiful place to track everything related to their debt obligations.

### Core Value Proposition
- One place for all debt
- Perfect EMI and billing cycle tracking
- Intelligent auto-calculation (no manual math)
- Visual progress that motivates payoff
- Native app experience on any device via PWA

---

## 2. Goals & Non-Goals

### Goals
- Track loans with full amortization schedules
- Track credit card spending per transaction and per billing cycle
- Manage bill payments and EMIs with payment history
- Auto-calculate all derived financial values (EMI, interest, payoff date, utilization, etc.)
- Support multiple currencies with INR as default
- Deliver a world-class UI/UX — fluid, fast, modern, mobile-first
- Work as an installable PWA with offline capability
- Secure per-user data isolation via Supabase Row Level Security

### Non-Goals (v1)
- No bank integrations or automatic transaction import
- No AI or ML features
- No investment or asset tracking
- No shared/family accounts
- No push notification infrastructure (can be Phase 2)
- No export to PDF/CSV (can be Phase 2)
- No budgeting or savings features

---

## 3. Tech Stack

### Frontend
| Layer | Technology | Reason |
|---|---|---|
| Framework | React 18 + TypeScript | Component model, type safety |
| Build Tool | Vite | Fast dev + optimized builds |
| Styling | Tailwind CSS | Utility-first, consistent design |
| Animations | Framer Motion | Fluid, native-feel transitions |
| Charts | Recharts | Composable, responsive charts |
| Forms | React Hook Form + Zod | Performant forms + schema validation |
| Data Fetching | TanStack Query (React Query v5) | Caching, sync, background refetch |
| Routing | React Router v6 | Client-side navigation |
| Global State | Zustand | Minimal, fast global state |
| Date Utilities | date-fns | Lightweight, tree-shakeable |
| PWA | Vite PWA Plugin (Workbox) | Service worker, offline, installable |
| Icons | Lucide React | Clean, consistent icon set |

### Backend
| Layer | Technology | Reason |
|---|---|---|
| Platform | Supabase | Managed PostgreSQL + Auth + Realtime |
| Database | PostgreSQL | Relational, perfect for financial data |
| Auth | Supabase Auth | Email/password + Google OAuth |
| Security | Row Level Security (RLS) | Per-user data isolation at DB level |
| Realtime | Supabase Realtime (optional) | Live balance updates |

### Hosting & DevOps
| Layer | Technology |
|---|---|
| Frontend Hosting | Vercel or Netlify |
| Backend | Supabase Cloud (free tier to start) |
| CI/CD | GitHub Actions or Vercel auto-deploy on push |
| Environment Config | .env files (never committed), Vercel/Netlify env vars |

---

## 4. Architecture

```
┌─────────────────────────────────────────────────┐
│                  USER DEVICE                    │
│                                                 │
│   ┌─────────────────────────────────────────┐   │
│   │         React PWA (Vite)                │   │
│   │                                         │   │
│   │  Pages → Features → Components          │   │
│   │  TanStack Query (cache + sync)          │   │
│   │  Zustand (UI state)                     │   │
│   │  Service Worker (offline + cache)       │   │
│   └────────────────┬────────────────────────┘   │
└────────────────────┼────────────────────────────┘
                     │ HTTPS (Supabase JS SDK)
┌────────────────────▼────────────────────────────┐
│                  SUPABASE                       │
│                                                 │
│   ┌──────────┐  ┌───────────┐  ┌─────────────┐ │
│   │   Auth   │  │ PostgreSQL│  │  Realtime   │ │
│   │          │  │  + RLS    │  │ (WebSocket) │ │
│   └──────────┘  └───────────┘  └─────────────┘ │
└─────────────────────────────────────────────────┘
```

### Data Flow
1. User authenticates via Supabase Auth → receives JWT
2. All DB queries include JWT → RLS enforces user isolation
3. TanStack Query caches responses → fast navigation, fewer round trips
4. On mutations (add/edit/delete), query cache is invalidated and refetched
5. Service worker caches static assets and last-fetched data for offline viewing

---

## 5. Database Schema

All tables include `created_at` (timestamptz, default now()) and `updated_at` (timestamptz, updated via trigger).

---

### 5.1 `profiles`
Extends Supabase auth.users. Created automatically on signup via DB trigger.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | References auth.users(id) |
| full_name | text | |
| avatar_url | text | nullable |
| default_currency | text | Default: 'INR' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### 5.2 `loans`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid FK | → auth.users(id), NOT NULL |
| name | text | e.g. "Home Loan - SBI" |
| lender | text | Bank/NBFC name |
| loan_type | text | ENUM: home, personal, car, education, business, other |
| currency | text | Default: 'INR' |
| principal_amount | numeric(15,2) | Original loan amount |
| current_outstanding | numeric(15,2) | Remaining principal (updated on each EMI) |
| interest_rate | numeric(6,4) | Annual rate in % e.g. 8.5 |
| tenure_months | integer | Total EMI count |
| emi_amount | numeric(15,2) | Auto-calculated (can be overridden) |
| emi_day | integer | Day of month EMI is due (1–31) |
| start_date | date | Disbursement/first EMI date |
| end_date | date | Auto-calculated from start + tenure |
| total_interest_payable | numeric(15,2) | Auto-calculated at origination |
| total_amount_payable | numeric(15,2) | principal + total interest |
| notes | text | nullable |
| status | text | ENUM: active, closed, paused |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### 5.3 `loan_payments`
One row per EMI payment or prepayment made.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| loan_id | uuid FK | → loans(id), CASCADE DELETE |
| user_id | uuid FK | → auth.users(id) |
| payment_date | date | Actual date paid |
| emi_month | date | Which EMI month this covers (first day of month) |
| amount_paid | numeric(15,2) | Total paid |
| principal_component | numeric(15,2) | Toward principal |
| interest_component | numeric(15,2) | Toward interest |
| is_prepayment | boolean | Default false |
| prepayment_type | text | ENUM: part_prepayment, full_closure, null |
| outstanding_after | numeric(15,2) | Principal remaining after this payment |
| notes | text | nullable |
| created_at | timestamptz | |

---

### 5.4 `credit_cards`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | → auth.users(id) |
| name | text | e.g. "HDFC Regalia" |
| bank | text | Issuing bank name |
| last_four | char(4) | Last 4 digits of card |
| card_network | text | ENUM: visa, mastercard, amex, rupay, other |
| currency | text | Default: 'INR' |
| credit_limit | numeric(15,2) | Total credit limit |
| statement_day | integer | Day of month statement is generated (1–28) |
| due_day | integer | Day of month payment is due (1–28) |
| color | text | Hex color for card UI display |
| notes | text | nullable |
| status | text | ENUM: active, closed |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### 5.5 `cc_transactions`
Every individual spend or credit on a card.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| card_id | uuid FK | → credit_cards(id), CASCADE DELETE |
| user_id | uuid FK | → auth.users(id) |
| amount | numeric(15,2) | Always positive |
| transaction_type | text | ENUM: debit (spend), credit (refund/cashback/payment) |
| category | text | See category list in Section 8.3 |
| merchant | text | nullable |
| note | text | nullable |
| transaction_date | date | |
| billing_month | date | First day of billing cycle this belongs to |
| created_at | timestamptz | |

---

### 5.6 `cc_bills`
One row per billing cycle per card.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| card_id | uuid FK | → credit_cards(id), CASCADE DELETE |
| user_id | uuid FK | → auth.users(id) |
| billing_month | date | First day of billing cycle |
| statement_date | date | When statement was/will be generated |
| due_date | date | Payment due date |
| opening_balance | numeric(15,2) | Balance carried from previous cycle |
| total_spends | numeric(15,2) | Sum of debits in this cycle |
| total_credits | numeric(15,2) | Sum of refunds/credits in this cycle |
| statement_amount | numeric(15,2) | Final bill amount (can be manually set) |
| minimum_due | numeric(15,2) | Minimum payment required |
| paid_amount | numeric(15,2) | nullable until paid |
| paid_date | date | nullable until paid |
| status | text | ENUM: upcoming, generated, paid, overdue, partially_paid |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### 5.7 Row Level Security Policies

Every table must have RLS enabled. Policy pattern for all tables:

- **SELECT**: `auth.uid() = user_id`
- **INSERT**: `auth.uid() = user_id`
- **UPDATE**: `auth.uid() = user_id`
- **DELETE**: `auth.uid() = user_id`

For `profiles`, the select policy allows `auth.uid() = id`.

---

### 5.8 Database Triggers

- **on `auth.users` insert** → create row in `profiles`
- **on `updated_at`** → trigger function sets `updated_at = now()` on every update for all tables
- **on `loan_payments` insert** → update `loans.current_outstanding` accordingly

---

## 6. Authentication & Security

### Auth Methods
- Email + Password (Supabase Auth)
- Google OAuth (Supabase Auth provider)

### Auth Flow
1. User lands on `/login` or `/signup`
2. On successful auth, Supabase returns a session (JWT + refresh token)
3. Supabase JS client stores session in localStorage automatically
4. All API calls include the JWT — RLS handles data isolation automatically
5. Session auto-refresh handled by Supabase client
6. On logout, session is cleared

### Protected Routes
All routes except `/login`, `/signup`, `/forgot-password` require an active session. Unauthenticated users are redirected to `/login`.

### Security Principles
- No sensitive data in client-side state beyond what's needed to render
- RLS enforces that users can never access other users' data, even with a valid JWT
- API keys (Supabase anon key) are public by design — RLS is the security layer
- Service role key is never used in frontend
- `.env` variables never committed to version control

---

## 7. Application Structure

### Routes

| Route | Page | Description |
|---|---|---|
| `/` | Redirect | → `/dashboard` if logged in, else `/login` |
| `/login` | Login | Email/password + Google OAuth |
| `/signup` | Signup | Registration form |
| `/forgot-password` | ForgotPassword | Reset link via email |
| `/dashboard` | Dashboard | Overview of all debt |
| `/loans` | Loans List | All loans |
| `/loans/new` | Add Loan | Form to add a new loan |
| `/loans/:id` | Loan Detail | Full loan info, amortization, history |
| `/loans/:id/edit` | Edit Loan | Edit loan details |
| `/cards` | Cards List | All credit cards |
| `/cards/new` | Add Card | Form to add a new card |
| `/cards/:id` | Card Detail | Spending, bills, utilization |
| `/cards/:id/transactions/new` | Add Transaction | Log a new spend |
| `/cards/:id/bill/:billId` | Bill Detail | Specific bill with payment action |
| `/settings` | Settings | Profile, currency, preferences |

---

### Layout

**Authenticated Layout:**
- Sidebar navigation on desktop (collapsible)
- Bottom tab bar on mobile (5 tabs: Dashboard, Loans, Cards, -, Settings)
- Top header with page title + user avatar on mobile
- All pages wrapped in a content area with max-width constraint

**Unauthenticated Layout:**
- Centered card layout
- Brand logo at top
- Clean, minimal auth pages

---

## 8. Feature Specifications

---

### 8.1 Dashboard

The dashboard is the home screen. It must answer at a glance: *"What do I owe, what's due soon, and how am I doing?"*

#### Summary Cards (top row)
- **Total Outstanding Debt** — sum of all active loan outstanding amounts + current CC balances, in default currency
- **This Month's Obligations** — sum of all EMIs due + CC bills due this calendar month
- **Total Credit Limit** — sum of all active card limits
- **Total Available Credit** — credit limit minus current balances

#### Upcoming Payments Section
- List of all payments due in the next 30 days
- Each item shows: name, type (loan/card), amount, due date, days remaining
- Color coded: green (>7 days), yellow (3–7 days), red (<3 days)
- Click/tap → navigates to respective detail page

#### Loans Overview
- List of all active loans as compact cards
- Each card: loan name, lender, outstanding amount, next EMI date, % paid progress bar
- Quick "Mark EMI Paid" button directly from dashboard

#### Credit Cards Overview
- All active cards in a horizontal scroll (mobile) or grid (desktop)
- Each card: card name, current balance, limit, utilization ring, next due date

#### Debt Reduction Chart
- Line chart showing total outstanding debt over time (last 12 months)
- Pulling from payment history to plot the reduction curve

#### Monthly Outflow Chart
- Bar chart: total debt payments per month (last 6 months)
- Split by EMIs vs CC payments (stacked bars)

---

### 8.2 Loans Module

#### Loans List Page (`/loans`)
- All active loans in card/list view
- Each loan card shows:
  - Loan name + lender
  - Outstanding amount / original principal
  - Progress bar (% paid)
  - Next EMI date + amount
  - Status badge (active/paused/closed)
  - Interest rate
- Toggle: Active / Closed loans
- Sort: by name, by due date, by outstanding amount
- FAB (floating action button): + Add Loan

#### Add / Edit Loan Form
Fields:
- Loan Name (text, required) — e.g. "Home Loan - SBI"
- Lender (text, required)
- Loan Type (select: Home, Personal, Car, Education, Business, Other)
- Currency (select, default INR)
- Principal Amount (number, required)
- Annual Interest Rate % (number, required)
- Tenure in Months (number, required)
- EMI Amount — **auto-calculated** from above 3 fields using standard EMI formula. User can override manually if bank EMI differs slightly.
- EMI Day of Month (number 1–28, required) — which day the EMI is debited
- Start Date (date, required) — disbursement date or date of first EMI
- End Date — **auto-calculated** (start date + tenure months), display only
- Total Interest Payable — **auto-calculated**, display only
- Total Amount Payable — **auto-calculated**, display only
- Notes (textarea, optional)

On Save: amortization schedule is generated and stored (or computed on the fly from payment history).

#### Loan Detail Page (`/loans/:id`)

**Header section:**
- Loan name, lender, type badge
- Outstanding amount (large, prominent)
- Original principal
- Progress bar with % paid label
- Interest rate + tenure

**Stats row:**
- EMIs Paid / Total EMIs
- Total Interest Paid so far
- Total Interest Remaining
- Projected Payoff Date (recalculated based on actual payments)
- Interest Saved (if any prepayments made)

**Next EMI Card:**
- Amount, due date, days remaining countdown
- "Mark as Paid" button → opens payment confirmation modal

**Amortization Schedule Table:**
- Columns: Month, EMI Amount, Principal Component, Interest Component, Outstanding Balance, Status (Paid / Due / Upcoming)
- Paid rows: green tint, show actual paid date
- Current month: highlighted
- Future months: default style
- Paginated or virtual scroll for long tenures

**Payment History:**
- List of all payments made (date, amount, principal/interest split, any notes)
- Prepayments clearly marked
- Each entry: expandable for full details

**Prepayment Section:**
- Button: "Add Prepayment"
- Form: amount, date, type (part-prepayment or full closure), notes
- On submission: recalculate outstanding, regenerate projected schedule, show interest saved

**Edit / Close Loan Actions:**
- Edit button → Edit Loan form pre-filled
- Close Loan → confirmation dialog → marks as closed

---

### 8.3 Credit Cards Module

#### CC Spend Categories
```
Food & Dining
Travel & Transport
Shopping & Retail
Fuel
Bills & Utilities
Entertainment & Leisure
Health & Medical
Subscriptions & Services
Education
Home & Living
Electronics & Gadgets
Gifts & Donations
Transfer & Payment
Other
```

#### Cards List Page (`/cards`)
- Visual card representation (like a physical card) for each credit card
- Card shows: bank name, last four digits, card network logo, current balance, credit limit
- Utilization ring (colored donut showing balance / limit %)
- Next due date + amount due
- Toggle: Active / Closed
- FAB: + Add Card

#### Add / Edit Card Form
Fields:
- Card Name (text, required) — e.g. "HDFC Regalia"
- Bank (text, required)
- Last 4 Digits (4-char number)
- Card Network (select: Visa, Mastercard, Amex, RuPay, Other)
- Currency (select, default INR)
- Credit Limit (number, required)
- Statement Day (number 1–28, required) — day the statement is generated
- Due Day (number 1–28, required) — day payment is due
- Card Color (color picker) — for visual distinction in UI
- Notes (optional)

Auto-calculated on form: "Your next statement will be on [date] and payment due on [date]"

#### Card Detail Page (`/cards/:id`)

**Card Visual:**
- Stylized card graphic at top with bank name, last four, network logo, user name
- Color based on card color setting

**Stats Row:**
- Current Balance (sum of unbilled transactions)
- Available Limit
- Credit Utilization % with color-coded indicator
- Next Statement Date
- Next Due Date (with days countdown)

**Current Cycle Section:**
- Transactions logged this billing cycle
- Running total spend
- Category-wise breakdown (donut/pie chart)
- Button: + Add Transaction

**Transactions Tab:**
- Full transaction history across all cycles
- Filter: by date range, by category, by billing month
- Search: by merchant or note
- Each row: date, merchant, category icon, note, amount (debit in red, credit in green)
- Tap to expand/edit/delete

**Bills Tab:**
- List of all past and current billing cycles
- Each bill row: month, statement amount, minimum due, status badge, paid date
- Current/upcoming bill highlighted
- Tap a bill → Bill Detail page

**Spending Analysis:**
- Bar chart: spending per month (last 6 months)
- Donut chart: category breakdown (current cycle or selectable range)

#### Bill Detail Page (`/cards/:id/bill/:billId`)
- Billing period dates
- Opening balance (from previous cycle)
- All transactions in this cycle (list)
- Subtotals: total spends, total credits/refunds
- Statement Amount
- Minimum Due
- Due Date with countdown
- Status badge
- "Mark as Paid" button → modal: enter paid amount + paid date
  - If paid amount < statement amount: status = partially_paid
  - If paid amount >= statement amount: status = paid
- Payment history for this bill (if multiple partial payments)

#### Add Transaction Form (modal or page)
Fields:
- Card (pre-selected if accessed from card detail)
- Transaction Type (Debit / Credit)
- Amount (number, required)
- Category (select from category list, required)
- Merchant (text, optional)
- Note (text, optional)
- Date (date picker, default today)
- Billing Month — **auto-detected** from date + card statement day, but user can override

---

### 8.4 Settings

- **Profile:** Full name, avatar (upload or initial-based avatar), email (display only)
- **Default Currency:** Select from currency list (INR default)
- **Theme:** Light / Dark / System (default: dark)
- **Account:** Change password, connected OAuth accounts
- **Danger Zone:** Delete account (with confirmation — deletes all user data)

---

## 9. UI/UX Design System

### Visual Language
- **Dark mode first** — deep dark backgrounds, not pure black (e.g. #0F0F14, #1A1A24)
- **Glassmorphism** for cards — semi-transparent surfaces with backdrop blur
- **Accent color** — one primary accent (e.g. electric indigo or emerald), used sparingly for CTAs and highlights
- **Micro-animations** — every interactive element has a subtle response (hover, press, transition)
- **Typography** — clean sans-serif (Inter or Geist), clear hierarchy: large numbers for amounts, smaller labels
- **Color coding:**
  - Green: paid, healthy, low utilization (<30%)
  - Yellow/Amber: due soon, medium utilization (30–60%)
  - Red: overdue, high utilization (>60%)
  - Blue/Indigo: informational, loans
  - Purple: credit cards

### Component Library (to be built)
- `Button` — primary, secondary, ghost, danger variants + sizes
- `Card` — standard container with optional glass effect
- `Badge` — status indicators (paid, active, overdue, etc.)
- `ProgressBar` — animated, color-aware
- `UtilizationRing` — SVG donut for CC utilization
- `StatCard` — icon + label + value
- `AmountDisplay` — formatted currency with currency symbol
- `DateCountdown` — "in X days" / "X days ago" with color coding
- `EmptyState` — illustrated empty states for each module
- `Modal` — accessible overlay with animation
- `BottomSheet` — mobile-friendly modal alternative for actions
- `Toast/Notification` — success, error, info feedback
- `Skeleton` — loading placeholders for all content areas
- `FAB` — floating action button for primary actions on list pages
- `TabBar` — bottom navigation for mobile
- `Sidebar` — collapsible navigation for desktop

### Animations (Framer Motion)
- Page transitions: slide + fade between routes
- Card entrance: stagger animate-in on list pages
- Progress bars: animate from 0 to value on mount
- Modal: scale + fade in/out
- Number changes: animated count-up for large values
- Swipe gestures on mobile: swipe cards for quick actions

### Responsive Breakpoints
- Mobile: < 768px → bottom tab bar, full-width cards, stacked layout
- Tablet: 768px–1024px → hybrid layout
- Desktop: > 1024px → sidebar, multi-column layout, table views

---

## 10. PWA Specification

### Installability
- `manifest.json` with:
  - `name`: "DebtWise"
  - `short_name`: "DebtWise"
  - `start_url`: "/"
  - `display`: "standalone"
  - `background_color`: matches dark theme
  - `theme_color`: accent color
  - Icons: 192x192, 512x512 (PNG), maskable variants
- Meets all Lighthouse PWA installability criteria

### Service Worker (Workbox via Vite PWA Plugin)
- **Cache strategy — Static assets:** Cache First (JS, CSS, fonts, icons)
- **Cache strategy — API calls:** Network First with fallback to cache
- **Offline behavior:** App shell loads from cache; data shown from last cached state; mutations queue for when online (or show clear offline message)
- **Background sync:** On reconnect, retry any failed mutations (optional v1)

### Mobile Native Feel
- `meta viewport` properly configured, no zoom on input focus
- `apple-mobile-web-app-capable` meta tag
- `apple-mobile-web-app-status-bar-style` set to match theme
- iOS splash screens configured
- Touch targets minimum 44x44px
- No hover-only interactions
- Swipe-able carousels/lists where appropriate
- Pull-to-refresh on list pages

---

## 11. Multi-Currency

### Supported Currencies (at minimum)
INR (₹), USD ($), EUR (€), GBP (£), AED (د.إ), SGD (S$), CAD (C$), AUD (A$), JPY (¥), CHF (CHF)

### Implementation
- Each loan and credit card stores its own `currency` field
- User profile has `default_currency` field
- Dashboard totals: convert all values to `default_currency` for aggregation
- Exchange rates: either hardcode approximate rates as constants (v1 simplicity), or fetch from a free open API like exchangerate-api.com or frankfurter.app on app load and cache
- Display: always show native currency on detail pages; converted amount shown as secondary on dashboard
- Currency symbol and formatting: use `Intl.NumberFormat` browser API for locale-aware formatting

---

## 12. Calculations & Business Logic

### EMI Calculation (Standard Reducing Balance)
```
EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)

Where:
  P = principal amount
  r = monthly interest rate = annual_rate / 12 / 100
  n = tenure in months
```

### Amortization Schedule Generation
For each month 1 to n:
```
interest_component = outstanding_balance × r
principal_component = EMI - interest_component
outstanding_balance = outstanding_balance - principal_component
```

### Loan Progress
```
percent_paid = ((principal - current_outstanding) / principal) × 100
emis_paid = count of loan_payments where is_prepayment = false
emis_remaining = tenure_months - emis_paid
projected_payoff_date = today + emis_remaining months
total_interest_paid = sum of interest_component from all payments
interest_saved = (original total_interest_payable) - (total_interest_paid + projected remaining interest)
```

### Prepayment Impact Recalculation
After a prepayment:
- New outstanding = current_outstanding - prepayment_amount
- Regenerate amortization from new outstanding, same rate, recalculated tenure or same EMI (user chooses: reduce tenure or reduce EMI)

### CC Utilization
```
utilization_percent = (current_balance / credit_limit) × 100
current_balance = sum of debit transactions - sum of credit transactions (current unbilled cycle)
```

### Billing Cycle Logic
- Statement date: `statement_day` of current month
- Due date: `due_day` of next month (or same month if due_day > statement_day)
- A transaction belongs to billing_month: if transaction_date <= statement_date of that cycle, else it belongs to next cycle
- Auto-create next `cc_bills` row when a new billing cycle starts (or on first transaction after statement date)

### Days Until Due
```
days_remaining = due_date - today
```
Display logic:
- > 7 days: green, "Due in X days"
- 3–7 days: amber, "Due in X days"
- < 3 days: red, "Due in X days" / "Due Tomorrow" / "Due Today"
- Past due: red, "X days overdue"

---

## 13. Build Phases

### Phase 1 — Supabase Setup
- Create Supabase project
- Write and run all SQL migrations (tables, indexes, RLS policies, triggers)
- Set up Google OAuth in Supabase Auth dashboard
- Verify RLS policies with test users
- Set up `profiles` auto-creation trigger

### Phase 2 — Frontend Scaffold + Auth
- Initialize Vite + React + TypeScript project
- Install and configure all dependencies
- Set up Tailwind CSS with custom theme (colors, fonts, spacing)
- Build auth pages: Login, Signup, Forgot Password
- Implement protected route wrapper
- Supabase client setup with session management
- Zustand store for auth state
- Basic layout shell: sidebar (desktop) + bottom tab bar (mobile)

### Phase 3 — Design System + Core Components
- Build all shared components (Button, Card, Badge, Modal, etc.)
- Establish typography scale, spacing, color tokens
- Implement dark/light theme toggle
- Build skeleton loaders
- Build empty states
- Set up Framer Motion page transitions
- Build the AmountDisplay and DateCountdown components

### Phase 4 — Loans Module
- Loans list page
- Add/Edit loan form with auto-calculation (live EMI preview as user types)
- Loan detail page with all sections
- Amortization table (full schedule)
- Mark EMI as paid flow
- Prepayment flow with schedule recalculation
- Close loan flow
- All TanStack Query hooks for loans and loan_payments

### Phase 5 — Credit Cards Module
- Cards list page with card visual component
- Add/Edit card form
- Card detail page with all sections
- Add transaction modal
- Transaction list with filter and search
- Bills tab with all billing cycles
- Bill detail page with mark-as-paid flow
- Spending charts (bar + donut)
- All TanStack Query hooks for cards, transactions, bills

### Phase 6 — Dashboard
- Summary stat cards
- Upcoming payments section (pulls from loans + bills)
- Loans overview with quick pay button
- Cards overview
- Debt reduction line chart
- Monthly outflow bar chart
- Wire up all data from Phase 4 + 5

### Phase 7 — Settings
- Profile edit form (name, avatar)
- Default currency selector
- Theme toggle
- Change password
- Delete account with confirmation and data wipe

### Phase 8 — PWA + Polish
- Configure Vite PWA plugin
- Generate manifest.json and icons
- Test install on Android + iOS
- Configure service worker caching strategies
- Offline fallback UI
- Performance audit (Lighthouse)
- Accessibility review (keyboard nav, focus management, ARIA labels)
- Cross-browser testing
- Final animation polish and timing tweaks

---

## 14. Folder Structure

```
debtwise/
├── public/
│   ├── icons/               PWA icons (192, 512, maskable)
│   ├── splash/              iOS splash screens
│   └── manifest.json        PWA manifest (auto-generated by Vite PWA)
│
├── src/
│   ├── main.tsx             App entry point
│   ├── App.tsx              Root component, router setup
│   │
│   ├── lib/
│   │   ├── supabase.ts      Supabase client init
│   │   ├── calculations.ts  EMI, amortization, utilization math
│   │   ├── currency.ts      Currency formatting, conversion
│   │   ├── dates.ts         Date helpers using date-fns
│   │   └── constants.ts     Categories, currencies, enums
│   │
│   ├── types/
│   │   ├── database.types.ts  Auto-generated Supabase types
│   │   ├── loan.types.ts
│   │   ├── card.types.ts
│   │   └── common.types.ts
│   │
│   ├── store/
│   │   ├── authStore.ts     Auth state (user, session)
│   │   └── uiStore.ts       Theme, sidebar open/close, etc.
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useLoans.ts
│   │   ├── useLoanPayments.ts
│   │   ├── useCards.ts
│   │   ├── useTransactions.ts
│   │   └── useBills.ts
│   │
│   ├── components/          Shared/generic UI components
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── UtilizationRing.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomTabBar.tsx
│   │   │   ├── TopHeader.tsx
│   │   │   └── AuthLayout.tsx
│   │   └── shared/
│   │       ├── AmountDisplay.tsx
│   │       ├── DateCountdown.tsx
│   │       ├── CurrencySelector.tsx
│   │       └── PageTransition.tsx
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── SummaryCards.tsx
│   │   │   ├── UpcomingPayments.tsx
│   │   │   ├── LoansOverview.tsx
│   │   │   ├── CardsOverview.tsx
│   │   │   ├── DebtReductionChart.tsx
│   │   │   └── MonthlyOutflowChart.tsx
│   │   │
│   │   ├── loans/
│   │   │   ├── LoansPage.tsx
│   │   │   ├── LoanCard.tsx
│   │   │   ├── LoanForm.tsx
│   │   │   ├── LoanDetailPage.tsx
│   │   │   ├── AmortizationTable.tsx
│   │   │   ├── LoanPaymentHistory.tsx
│   │   │   ├── MarkEmiPaidModal.tsx
│   │   │   └── PrepaymentModal.tsx
│   │   │
│   │   ├── cards/
│   │   │   ├── CardsPage.tsx
│   │   │   ├── CreditCardVisual.tsx
│   │   │   ├── CardForm.tsx
│   │   │   ├── CardDetailPage.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   ├── AddTransactionModal.tsx
│   │   │   ├── BillsList.tsx
│   │   │   ├── BillDetailPage.tsx
│   │   │   ├── MarkBillPaidModal.tsx
│   │   │   ├── SpendingCategoryChart.tsx
│   │   │   └── MonthlySpendChart.tsx
│   │   │
│   │   └── settings/
│   │       ├── SettingsPage.tsx
│   │       ├── ProfileSection.tsx
│   │       ├── CurrencySection.tsx
│   │       ├── ThemeSection.tsx
│   │       └── DangerZone.tsx
│   │
│   └── styles/
│       ├── globals.css      Tailwind directives + CSS resets
│       └── theme.css        CSS custom properties for theme
│
├── supabase/
│   └── migrations/          SQL migration files
│       ├── 001_profiles.sql
│       ├── 002_loans.sql
│       ├── 003_credit_cards.sql
│       ├── 004_rls_policies.sql
│       └── 005_triggers.sql
│
├── .env.example             Template for required env vars
├── .env.local               Local env (gitignored)
├── vite.config.ts           Vite config with PWA plugin
├── tailwind.config.ts       Tailwind with custom theme
├── tsconfig.json
└── package.json
```

---

## 15. Non-Functional Requirements

### Performance
- Initial page load (LCP) < 2.5 seconds on 4G
- Lighthouse Performance score > 90
- All list views virtualized if >50 items (react-virtual or similar)
- Images lazy-loaded
- Code-split by route (React lazy + Suspense)

### Accessibility
- WCAG 2.1 AA compliance
- All interactive elements keyboard navigable
- Focus management in modals and sheets
- ARIA labels on icon-only buttons
- Sufficient color contrast ratios
- Screen reader support for charts (data tables as fallback)

### Reliability
- All forms have validation with clear error messages
- All mutations have loading, success, and error states
- Optimistic UI updates where appropriate
- No data loss on failed mutations (retry or clear error messaging)

### Offline
- App shell loads from cache
- Last-fetched data visible offline
- Clear "You are offline" indicator when no connection
- No silent failures when offline

### Browser Support
- Chrome (latest 2 versions)
- Safari (latest 2 versions, including iOS)
- Firefox (latest 2 versions)
- Edge (latest 2 versions)

### Environment Variables Required
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_EXCHANGE_RATE_API_KEY=   (optional, for live currency rates)
```

---

*End of DebtWise Master Specification v1.0*
*This document covers the complete product design, architecture, data model, feature set, and build plan. All implementation decisions (specific syntax, library APIs, file contents) are left to the development agent.*
