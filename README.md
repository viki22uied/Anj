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

### Tech Stack & Dependencies

The project is built using a modern, performant web stack designed for offline-first capabilities:

- **Core Framework**: React 19.2.4
- **Language**: TypeScript (v5.9.3)
- **Build Tool**: Vite 8.0.1
- **Styling**: Tailwind CSS 3.4.19 (with Autoprefixer and PostCSS)
- **State Management**: 
  - Zustand 5.0.12 (Global state with persistence)
  - XState 5.29.0 (Complex game logic and state machines)
- **Animations**: Framer Motion 12.38.0
- **Database (Offline)**: PouchDB 9.0.0
- **Localization**: i18next 25.10.10 + react-i18next 16.6.6
- **PWA Support**: vite-plugin-pwa (via Workbox 7.4.0)
- **Charts**: Recharts 3.8.1

### Local Setup Instructions

Follow these steps to get the environment running on your machine:

**Step 1: Clone the repository**
```bash
git clone https://github.com/viki22uied/Anj.git
cd Anj
```

**Step 2: Install dependencies**
Make sure you have Node.js installed on your system.
```bash
npm install
```

**Step 3: Run the development server**
This will start the app locally with hot-reloading.
```bash
npm run dev
```
By default, the app will be available at `http://localhost:5173`.

**Step 4: Build for production (Optional)**
To create a production-ready bundle in the `dist/` folder:
```bash
npm run build
```

**Step 5: Preview the build (Optional)**
To test the production build locally:
```bash
npm run preview
```

### Testing Credentials

**Login Required**: No.

Anaj-Arth is designed to be accessible and focuses on simulation. There is no traditional login or authentication system. 

- **How to Start**: Simply open the application and choose your preferred language (English or Hindi) to start the onboarding flow. 
- **Data Persistence**: The app uses `PouchDB` and `Zustand` persistence to save your game progress locally in your browser's indexedDB. Clearing your browser data will reset the simulation.

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
