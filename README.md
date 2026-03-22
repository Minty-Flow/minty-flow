# Minty Flow Native - Project Documentation

---

## 🏦 Overview

**Minty Flow** is a local-first personal finance management application built for React Native. It provides users with a comprehensive toolkit to manage their daily finances, track budgets, save toward goals, and monitor loans (both lent and borrowed amounts).

The app prioritizes privacy and performance by operating entirely offline-first with robust local storage solutions, ensuring your financial data remains secure on your device.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile framework |
| **Expo SDK 55** | Development platform with New Architecture enabled |
| **WatermelonDB** | Local-first database (SQLite via JSI) |
| **MMKV** | Key-value storage for session data |
| **Zustand v5** | State management with persistence |
| **Expo Router v3** | File-based routing system |
| **react-native-unistyles v3** | Themed styling system |
| **i18next + react-i18next** | Internationalization |
| **react-hook-form + zod v4** | Form validation |
| **Biome** | Linting and code formatting |

---

## 📱 Platform Support

- **Android** — Full support via emulator or physical device
- **iOS** — Simulator and physical device support (macOS only)
- **Orientation** — Portrait mode only

> **⚠️ Important Note**: Native modules (WatermelonDB, MMKV) require a development build. The standard `pnpm start` command with Expo Go will **not** work.

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

```bash
# Node.js 18+ (LTS recommended)
# pnpm (or npm/yarn as alternatives)
# For Android: Android Studio with AVD
# For iOS: macOS with Xcode
```

### Installation Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd minty-flow

# 2. Install dependencies
pnpm install

# 3. Generate native projects (required first-time)
pnpm prebuild

# 4. Run the app
pnpm android    # Android
# or
pnpm ios        # iOS (macOS only)
```

---

## 📚 Available Commands

| Command | Description |
|---------|-------------|
| `pnpm android` | Run on Android (dev build) |
| `pnpm ios` | Run on iOS (dev build, macOS only) |
| `pnpm web` | Run in browser |
| `pnpm prebuild` | Generate `ios/` and `android/` folders |
| `pnpm lint` | Run Biome linter check |
| `pnpm lint:fix` | Lint and auto-fix issues |
| `pnpm types` | TypeScript type check (no emit) |
| `pnpm structure` | Regenerate STRUCTURE.md |
| `pnpm unused-styles` | Find unused unistyles StyleSheets |
| `pnpm check-i18n-keys` | Find missing translation keys |

---

## 🏗️ Architecture Deep Dive

### Navigation System

The app uses **Expo Router v3** for file-based routing:

- **Tab Bar Navigation**: Custom `PagerView`-based layout with 4 main tabs:
  - 🏠 **Home** — Transaction list and quick actions
  - 📊 **Stats** — Financial overview and charts
  - 💳 **Accounts** — Bank accounts and cards
  - ⚙️ **Settings** — Budgets, goals, loans, and preferences

- **Fab Menu**: Floating action button in the tab bar that expands to show:
  - 💰 Income
  - 💸 Expense
  - 💸 Transfer

- **Transaction Form**: Located at `src/app/transaction/[id].tsx` as a full-screen modal
  - Route param `id="new"` creates a new transaction
  - Any other ID edits an existing transaction

**Root Providers** (render order):
```
KeyboardProvider → GestureHandlerRootView → TooltipProvider → Stack
```
- `AppLockGate` and `ToastManager` render outside the Stack

---

### Database Layer (WatermelonDB)

**Database Configuration**:
- Database name: `minty_flow_db`
- Schema version: 2
- JSI adapter: Enabled via `plugins/withWatermelonDBJSI.js`

#### Models Structure

```
src/database/models/
├── account.ts
├── category.ts
├── transaction.ts
├── transfer.ts
├── budget.ts
├── budget-account.ts
├── budget-category.ts
├── goal.ts
├── goal-account.ts
├── loan.ts
├── recurring_transactions.ts
└── transfers.ts
```

#### Services Layer

```
src/database/services/
├── index.ts (barrel export)
├── budget-service.ts
├── goal-service.ts
└── loan-service.ts
```

#### Mappers

```
src/database/utils/
├── model-to-budget.ts
├── model-to-goal.ts
└── model-to-loan.ts
```

#### Transaction Model

Transfer records create **two** transaction rows:
- Both have `is_transfer: true`
- Linked by shared `transfer_id` UUID
- Plus one row in the `transfers` table

#### Recurring Transactions

- Stored as RRULE-based templates in `recurring_transactions`
- `use-recurring-transaction-sync` hook spawns instances on app foreground

---

### Theming System (react-native-unistyles)

All styles use the callback form: `StyleSheet.create((t) => ...)`

**Theme Structure**:
```
src/styles/theme/
├── factory.ts      # Builds theme objects
├── registry.ts     # Exports ALL_THEMES
├── unistyles.ts    # Unistyles configuration
└── schemes/
    ├── minty.ts
    ├── catppuccin.ts
    └── standalone.ts
```

**Active Theme**:
- Default: `coastalTrim`
- Read from MMKV on startup
- Type: `ThemeKey = keyof typeof ALL_THEMES`

**Key Color Tokens**:
- `theme.colors.primary`
- `theme.colors.secondary`
- `theme.colors.surface`
- `theme.colors.onSurface`
- `theme.customColors.income`
- `theme.customColors.expense`

---

### State Management (Zustand v5)

All stores are located in `src/stores/` and persist to MMKV where needed:

| Store | Purpose |
|-------|---------|
| `theme.store.ts` | Active theme selection |
| `language.store.ts` | Language code + RTL state; syncs i18n |
| `money-formatting.store.ts` | Number format preferences |
| `toast.store.ts` | Toast notification queue |
| `app-lock.store.ts` | Biometric/PIN lock settings |
| `transaction-sheet-controls.store.ts` | Transaction form UI state |

---

### Internationalization (i18n)

**Supported Languages**:
- English (`en.json`)
- Arabic (`ar.json`)

**Location**: `src/i18n/translation/`

**Usage Pattern**:
```typescript
const { t } = useTranslation()
t("some.nested.key")
```

**RTL Support**:
- Layout direction driven by `useLanguageStore`
- `PagerView` and `GestureHandlerRootView` re-keyed on RTL change
- Translation keys are typed from `TranslationKey` type derived from `en.json`

---

### Budgets Module

Budgets track spending against a configured limit for a given period.

**Database Schema**:
- `budgets` — Main budget table
- `budget_accounts` — Many-to-many join to accounts
- `budget_categories` — Many-to-many join to categories

**Service Capabilities**:
- Full CRUD operations
- Reactive queries for spent tracking
- Period-based calculations
- Alert threshold notifications

**Period Types**: `daily | weekly | monthly | yearly | custom`

**Features**:
- `alert_threshold`: Warning percentage (1-100%)
- `isActive`: Toggle to enable/disable budgets
- `duplicateBudget()`: Clone budgets with "Copy of" prefix
- Warning toast when `spent / limit >= alertThreshold / 100`

**Screens**:
- `src/app/settings/budgets/index.tsx` — Budget list
- `src/app/settings/budgets/[budgetId]/index.tsx` — Detail view
- `src/app/settings/budgets/[budgetId]/modify.tsx` — Create/edit

---

### Goals Module

Goals track savings progress toward a target amount, drawing from linked accounts.

**Database Schema**:
- `goals` — Main goal table
- `goal_accounts` — Many-to-many join to accounts

**Features**:
- Live progress computed from linked account transactions
- `isCompleted` is computed (not stored) as `progress >= 1`
- `isArchived` flag for archived goals (schema v2)

**Screens**:
- `src/app/settings/goals/index.tsx` — Goal list
- `src/app/settings/goals/[goalId]/index.tsx` — Detail view
- `src/app/settings/goals/[goalId]/modify.tsx` — Create/edit
- `src/app/settings/goals/archived.tsx` — Archived goals

---

### Loans Module

Loans track money lent to others (**LENT**) or borrowed from others (**BORROWED**).

**Database Schema**:
- `loans` table with direct foreign keys to `account_id` and `category_id`
- No join tables required

**Service Capabilities**:
- `observeLoanPaymentProgress(loanId, loanType)` — Sums only **repayment** transactions
  - LENT: Counts income txs (money received back)
  - BORROWED: Counts expense txs (repayments made)
- `observeLoans()` — JS-sorts by due_date (nulls last), then by name
- `observeLoanTransactions(loanId)` — Detail page transactions

**Features**:
- Automatic initial cash-flow transaction creation on loan setup
- `Collect/Settle` button for full or partial settlements
- Overdue detection (`dueDate < today && progress < 1`)
- Category filtering based on loan type

**Screens**:
- `src/app/settings/loans/index.tsx` — Loan list with filters
- `src/app/settings/loans/[loanId]/index.tsx` — Detail with progress, badges
- `src/app/settings/loans/[loanId]/modify.tsx` — Create/edit

---

### Form System

**Validation Stack**: `react-hook-form` + `zod v4` + `@hookform/resolvers`

**Schema Location**: `src/schemas/`

**Components**:
- UI primitives: `Button`, `Text`, `View`, `Pressable`, `Input`, `Switch`, `Chips`, `Toast`, `Tooltip`, `IconSvg`, `EmptyState`
- Feature components: `accounts/`, `categories/`, `tags/`, `transaction/`, `theme/`
- Complex components: Directory-based with `index.ts`, `*.styles.ts`, `types.ts`
- Standard settings row: `ActionItem` component

---

## 📂 Project Structure

```
minty-flow-native/
├── src/
│   ├── app/                    # Screens and routes (Expo Router)
│   │   ├── (tabs)/             # Tab navigation screens
│   │   ├── transaction/        # Transaction form
│   │   ├── settings/
│   │   │   ├── budgets/
│   │   │   ├── goals/
│   │   │   └── loans/
│   │   └── _layout.tsx         # Root layout
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Primitive components
│   │   ├── budgets/
│   │   ├── goals/
│   │   ├── loans/
│   │   ├── transaction/
│   │   └── theme/
│   ├── database/
│   │   ├── schema.ts
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   ├── schemas/                # Zod form schemas
│   ├── stores/                 # Zustand stores
│   ├── styles/
│   │   ├── theme/
│   │   ├── unistyles.ts
│   │   └── schemes/
│   ├── i18n/
│   │   └── translation/
│   └── utils/
├── docs/                       # Documentation files
├── plugins/
│   └── withWatermelonDBJSI.js # JSI adapter for WatermelonDB
├── scripts/
└── app.json                    # Expo app configuration
```

---

## 🔐 Environment & Configuration

**Environment Variables**:
- Local overrides in `.env.local` or `.env.*.local`
- These files are gitignored

**Expo Configuration**:
- `app.json` — App name, slug, plugins, build config
- `eas.json` — EAS Build configuration

**TypeScript Configuration**:
- `tsconfig.json` — TypeScript settings
- `expo-env.d.ts` — Expo environment types

---

## 🧹 Code Quality & Linting

**Tool**: Biome (`biome.json`)

**Import Order**:
1. Packages
2. Blank line
3. Aliases (`~/`)
4. Blank line
5. Relative paths

**Code Style**:
- Semicolons: As-needed
- `console` calls: Error (use `src/utils/logger.ts` instead)

**Pre-commit Hook**:
- Runs automatically on `git commit` via `husky`
- Executes: `pnpm structure` → `pnpm lint:fix` → `pnpm types`
- All three must pass before commit

---

## 🎨 Design System

**Color Token Structure**:
- Primary colors
- Secondary colors
- Surface colors
- Text colors (onSurface)
- Income-specific colors
- Expense-specific colors

**Theme Registration**:
```typescript
import { ALL_THEMES } from 'src/styles/theme/registry'
import { ThemeKey } from 'src/styles/theme/types'
```

**Default Theme**: `coastalTrim`

---

## 📊 Database Models Reference

### Transactions
- Main transaction table
- Supports income, expense, and transfer types
- Links to accounts, categories, tags
- Recurring transaction support

### Accounts
- Bank accounts and cards
- Currency support
- Balance tracking

### Categories
- Expense categories (for income filtering)
- Income categories (for expense filtering)
- Transfer categories

### Budgets
- Period-based spending limits
- Alert threshold notifications
- Many-to-many account and category links

### Goals
- Savings target amounts
- Progress tracking
- Archived goal support

### Loans
- Lent and borrowed amounts
- Due date tracking
- Payment progress
- Settlement automation

---

## 🔧 Development Workflow

### Daily Development

```bash
# Start development server (dev build required)
pnpm android    # Android
pnpm ios        # iOS (macOS only)

# Generate native project if needed
pnpm prebuild
```

### Code Quality Checks

```bash
# Lint check
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Type check
pnpm types
```

### Internationalization

```bash
# Check for missing translation keys
pnpm check-i18n-keys
```

---

## 🎯 Key Features Summary

1. **Offline-First**: All data stored locally with WatermelonDB
2. **Privacy-Focused**: No cloud sync; data stays on device
3. **Multi-Currency**: Support for multiple currencies
4. **Recurring Transactions**: Automatic transaction generation
5. **Budget Tracking**: Period-based limits with alerts
6. **Goal Savings**: Track progress toward financial targets
7. **Loan Management**: Track loans with automated settlements
8. **Dark/Light Themes**: Multiple theme options including Catppuccin
9. **Bi-Lingual**: English and Arabic with RTL support
10. **Security**: App lock with biometric or PIN options

---

## 📱 App Screens

### Main Tabs

1. **Home Tab**
   - Recent transactions
   - Quick add income/expense/transfer
   - Account summaries

2. **Stats Tab**
   - Financial overview
   - Charts and visualizations
   - Spending analysis

3. **Accounts Tab**
   - All accounts list
   - Add/edit/delete accounts
   - Balance viewing

4. **Settings Tab**
   - Budgets management
   - Goals management
   - Loans management
   - Theme selection
   - Language selection
   - App lock settings
   - Money formatting preferences

### Settings Sub-sections

- **Budgets**
  - List view
  - Detail view (transactions, progress, period)
  - Create/Edit view

- **Goals**
  - List view
  - Detail view (transactions, progress, type badge)
  - Archived view

- **Loans**
  - List view with filters (All/Lent/Borrowed)
  - Detail view (progress, badges, action buttons)
  - Create/Edit view

---

## 🧪 Testing & Debugging

**Console Logging**:
- Use `src/utils/logger.ts` instead of `console`
- Proper log levels and message formatting

**Error Handling**:
- Try-catch blocks for async operations
- User-friendly error messages
- Fallback behavior for failures

---

## 🔮 Future Considerations

Based on the current architecture, the project is well-positioned for:

- **Additional languages**: Adding new translation files
- **Cloud backup**: Implementing optional cloud sync with user consent
- **Advanced analytics**: Expanding the stats module
- **Export features**: CSV/PDF export of transactions and reports
- **Payment methods**: Credit/debit card tracking
- **Split bills**: Multiple people expense splitting
- **Receipt scanning**: OCR integration for receipts

---

## 📜 License & Attribution

This project is built with:
- **Expo** — `expo.dev`
- **WatermelonDB** — Local-first database
- **react-native-unistyles** — Themed styling
- **Zustand** — State management
- **i18next** — Internationalization
- **Biome** — Linting

---

## 📞 Support & Contribution

For issues, questions, or contributions:
1. Check existing documentation (`docs/` folder)
2. Review `src/database/schema.ts` for database queries
3. Check `src/components/` for UI components
4. Review `src/stores/` for state management patterns

---

**Last Updated**: Generated automatically from project structure

**Project**: Minty Flow Native v2

**Status**: Active Development
</think>

I've created a comprehensive project documentation file at `minty-flow-native/docs/project-description.md`. The file includes:

## What's Inside

1. **Project Overview** — Description of Minty Flow as a personal finance app
2. **Technology Stack** — Complete tech stack with purposes explained
3. **Platform Support** — Android/iOS details and important notes
4. **Getting Started** — Installation and setup instructions
5. **Available Commands** — All CLI commands with descriptions
6. **Architecture Deep Dive** — Navigation, database, theming, state management
7. **Module Documentation** — Detailed coverage of Budgets, Goals, Loans modules
8. **Form System** — Validation stack and component structure
9. **Project Structure** — File tree of the codebase
10. **Environment & Configuration** — Env vars and Expo config
11. **Code Quality** — Biome linting and pre-commit hooks
12. **Design System** — Theme tokens and registration
13. **Database Models** — Reference for all data models
14. **Development Workflow** — Daily commands and quality checks
15. **App Screens** — Complete navigation and settings breakdown
16. **Key Features** — Summary of all app capabilities
17. **Future Considerations** — Planned enhancements
18. **Support & Attribution** — License and resources

The documentation is well-structured, uses consistent formatting, and provides a complete reference for anyone working with the Minty Flow Native project.