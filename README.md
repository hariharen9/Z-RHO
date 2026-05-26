# Z-RHO — Personal Debt Lifecycle Manager

A sleek, robust, full-stack personal debt tracking Progressive Web App (PWA). Built specifically to track loans and credit card debts, it automates derived financial values, provides visual progress updates, and empowers users with powerful prepayment simulators.

**Built with 💜 by [Hariharen](https://hariharen.site).**

---

## ✨ Features

### 📈 Smart Dashboard
- **Aggregated Live Metrics:** Track total outstanding debt, monthly obligations, and credit limit utilization in real-time.
- **Interactive Data Visualizations:** Beautiful, responsive charts built with Recharts, including:
  - *Debt Reduction Curve:* Track the 12-month trajectory of your active debts.
  - *Monthly Outflow Stacked Chart:* View your monthly obligations split between EMIs and credit card statements.
- **Upcoming Payments Calendar:** A unified 30-day timeline showing upcoming payments, color-coded by urgency.

### 🏠 Loan Management
- **Full Support:** Track home, personal, auto, education, or business loans with granular tracking of principal, interest, and tenure.
- **Live Interactive Math:** Instantly calculates EMIs, total interest, and total payable *as you type*.
- **Amortization Schedules:** Generates comprehensive month-by-month breakdowns of your principal vs. interest split.
- **Prepayment Simulator:** Interactively test how extra principal prepayments shave months off your tenure and save interest *before* submitting.

### 💳 Credit Card Management
- **Sleek Mock Cards:** Beautiful gradient-based card representations.
- **Statement & Due Dates:** Automatic billing cycle tracking and upcoming statement generations based on custom card parameters.
- **Transaction Ledger:** Record both debits and credits with categorical tracking.
- **Bill Status Management:** Seamlessly track generated, paid, upcoming, or overdue credit card bills.

### 🎨 Custom Component Suite & Visual Aesthetics
- **Dynamic Vector Branding:** Dynamically parses and renders pixel-perfect SVGs for major bank systems (Chase, SBI, HDFC, ICICI, Citi, HSBC) and card network processors (Visa, Mastercard, Amex, RuPay) inside floating glass panels.
- **Interactive Preset Swatches:** Completely replaced standard color-pickers with a beautiful grid of **10 curated preset gradient swatches** (Indigo Royale, Sunset Amber, Carbon Obsidian, Midnight Cyber, etc.) that let users instantly color cards, automatically styling the dynamic submit buttons in real-time.
- **Bespoke UI Components:**
  - *`<Dropdown>`:* Uses Framer Motion for a custom, glassmorphic select list with responsive spring animations and active state highlights.
  - *`<DatePicker>`:* A fully bespoke datepicker featuring month-over-month chevron navigation, active select styling, today indicators, and click-outside self-closers.
  - *`<ConfirmModal>`:* Unified all deletion and freezing dialogues into sleek, semantic custom modals, discarding raw browser `confirm()` prompts.
- **Frictionless Grid Re-ordering:** Cards and loans filter transitions slide and align with smooth Framer Motion layout animations, completely eliminating layout jitter.

### ⚙️ Settings & Core
- **Multi-Currency System:** Choose a default currency (INR, USD, EUR, etc.) and watch all dashboard metrics auto-convert.
- **Dynamic Theme System:** Smooth transitions between Light, Dark, and System modes.

---

## 🛠️ Technology Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 (native CSS configuration) + Framer Motion
- **State Management:** Zustand (Auth & UI) + TanStack React Query v5 (Data syncing)
- **Forms & Validation:** React Hook Form + Zod
- **Charts:** Recharts
- **Database & Auth:** Supabase (PostgreSQL with strict Row-Level Security policies)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- A Supabase Project

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd zrho
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory (you can copy `.env.example` as a template):
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key
   ```

4. **Initialize Supabase Database Schema:**
   Go to your **Supabase Project -> SQL Editor**, open the SQL files in `supabase/migrations/` in numerical order, and execute them to create the tables, triggers, and Row-Level Security policies:
   - [001_profiles.sql](supabase/migrations/001_profiles.sql)
   - [002_loans.sql](supabase/migrations/002_loans.sql)
   - [003_loan_payments.sql](supabase/migrations/003_loan_payments.sql)
   - [004_credit_cards.sql](supabase/migrations/004_credit_cards.sql)
   - [005_cc_transactions.sql](supabase/migrations/005_cc_transactions.sql)
   - [006_cc_bills.sql](supabase/migrations/006_cc_bills.sql)

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
