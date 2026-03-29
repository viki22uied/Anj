# Anaj-Arth

Anaj-Arth is an offline-first, mobile-style learning game that helps Indian farmers practice better post-harvest decisions through short, repeatable simulations.

The idea is simple.

- Real life has high-stakes choices after harvest: sell now, store, negotiate, take a loan, enroll in insurance, repay debt.
- Many farmers learn these choices only after a costly mistake.
- Anaj-Arth lets players experience the consequences in a safe simulation and build intuition for better outcomes.

### Who this is for

- Farmers and families who want a simpler way to understand post-harvest money decisions
- Trainers and NGOs running financial literacy programs
- Product and research teams prototyping behavior-change flows for agriculture finance

### What the player does

The game progresses in weekly turns and seasons.

- Start with a farmer profile and crop
- Manage cash, debt, grain, and stress
- Make choices that affect outcomes:
  - Negotiate at the mandi against an arhatiya
  - Compare formal vs informal credit (KCC vs moneylender)
  - Enroll in crop insurance (PMFBY style) and handle claims
  - Store in a certified godown (eNWR) and optionally take a pledge loan
  - Decide when to sell and how to handle shocks and emergencies

### What the player learns

- Why distress selling is costly and when storage helps
- How interest compounds and why informal debt becomes a trap
- How MSP reference and negotiation tactics change bargaining power
- What insurance is good for (protection against shocks, not guaranteed profit)
- How small repeated choices compound into long-term financial stability

### Key features

- **Offline-first**: designed to work with poor connectivity
- **PWA installable**: can be installed like an app
- **Bilingual UI**: English and Hindi resources are included
- **Emotional layer**: stress and “emotion states” influence UI feedback
- **Mini-games**: short activities for learning by doing
- **Accessible mobile UI**: large tap targets, clear cards, motion transitions

### Tech stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + custom theme in `src/index.css`
- **Animation**: Framer Motion
- **State**: Zustand with persistence
- **Localization**: i18next + react-i18next
- **PWA**: `vite-plugin-pwa` and Workbox caching

### Run locally

Install dependencies

```bash
npm install
```

Start the dev server

```bash
npm run dev
```

Build

```bash
npm run build
```

Preview production build

```bash
npm run preview
```

Lint

```bash
npm run lint
```

### How the app is structured (developer overview)

Entry points

- **`src/main.tsx`** mounts `<App />`
- **`src/App.tsx`** is the app shell and screen switcher

Navigation model

- The app uses an internal string state called `screen` inside `src/App.tsx`
- Screens change navigation by calling callbacks like `onBack` and `onNavigate`
- React Router is not used for navigation at runtime in this codebase

State and simulation

- **`src/store/gameStore.ts`** is the main game store:
  - farmer profile
  - current game state
  - season history
  - core actions like `tick`, loans, insurance, storage, negotiation, and recap
- **`src/store/settingsStore.ts`** stores settings:
  - language
  - voice preferences
  - display preferences
  - notifications

Domain logic modules

- `src/domain/negotiationEngine.ts`: negotiation dialogue tree and voice-intent matching
- `src/domain/insuranceModule.ts`: insurance math utilities
- `src/domain/samriddhiCycleMachine.ts`: season-cycle state machine utilities

Screens

- Onboarding: `src/screens/Onboarding/OnboardingFlow.tsx`
- Dashboard: `src/screens/Dashboard/FarmDashboard.tsx`
- Core flows:
  - Negotiation: `src/screens/NegotiationBattle/MandiArena.tsx`
  - Credit: `src/screens/CreditEngine/LoanComparison.tsx`
  - Insurance: `src/screens/InsuranceShield/InsuranceShield.tsx`
  - Godown and eNWR: `src/screens/GoldenGodown/GoldenGodown.tsx`
- Season recap and finale: `src/screens/SeasonRecap/*`
- Extra feature screens:
  - Settings: `src/screens/Settings.tsx`
  - Profile: `src/screens/ProfileEdit.tsx`
  - Schemes: `src/screens/SchemeCenter.tsx`
  - Price alerts: `src/screens/PriceAlerts.tsx`
  - Season comparison: `src/screens/SeasonComparison.tsx`
  - Export report: `src/screens/DataExport.tsx`
  - Group play: `src/screens/GroupPlay.tsx`
- Mini-games: `src/screens/mini-games/*`

### Offline and PWA

- PWA setup lives in `vite.config.ts` using `vite-plugin-pwa`
- Online or offline detection lives in `src/hooks/useOffline.ts`

### Localization (i18n)

- English translations are defined in `src/locales/i18n.ts` as a fallback object
- Hindi translations are defined in `src/locales/hi.json`
- i18n is initialized in `src/locales/i18n.ts`

If a translation key is missing, the UI may show the raw key string.
Keep keys in sync across English and Hindi to avoid that.

### Recent updates made in this workspace

- Removed crashes caused by `useNavigate()` being used without a Router by switching screens to use `onBack` and `onNavigate`
- Reduced hardcoded Hindi defaults so the English experience stays English
- Added missing translation keys so the UI does not show raw keys like `common.start` and `schemes.learnMore`
- Kept the permanent “Next Week” button while ensuring the bottom navigation remains accessible
- Improved Weather Risk screen content so it shows a real scenario flow instead of placeholders
- Made Season Comparison resilient when season history is empty, avoiding `NaN` metrics

### Troubleshooting

If you see raw translation keys on the screen

- Add the missing key to English in `src/locales/i18n.ts`
- Add the same key to Hindi in `src/locales/hi.json`

If you see an error about `useNavigate()` and Router

- There is still a screen importing React Router navigation
- Fix by using `onBack` or `onNavigate` instead

### Note on duplicate folder

There is also an `anj/` directory that appears to contain another copy of `src/`.
The app runs from the root `src/` folder.
