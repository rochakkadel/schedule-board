# Schedule Board

High-performance workforce scheduling platform for teams that need live collaboration, granular access control, and audit-ready records. Built with React 19, Vite, and Firebase to deliver real-time updates, persistent storage, and zero-maintenance hosting.

---

## Contents
- [Product Overview](#product-overview)
- [Feature Matrix](#feature-matrix)
- [System Architecture](#system-architecture)
- [Local Development](#local-development)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Deployment](#deployment)
- [Operations & Maintenance](#operations--maintenance)
- [Tech Stack](#tech-stack)

---

## Product Overview
Schedule Board provides a single pane of glass for weekly operations. Supervisors can plan, adapt, and publish schedules in real time while collaborators consume the same data instantly—no page refresh, no version drift. Built-in analytics entry points, shift-level comments, and day notes keep institutional knowledge tied to the work surface.

Target buyers include operations managers, staffing agencies, concierge teams, and distributed facilities groups that need:
- Controlled access (viewer vs. editor vs. admin)
- Fine-grained shift editing with contextual metadata
- Always-on web delivery without installing native software
- GitHub Pages + Firebase hosting for low-cost, global reach

---

## Feature Matrix

**Scheduling Core**
- Weekly horizontal board with seven sticky columns and synchronized vertical scrolling
- Shift cards with site, time window, initials, and customizable colors
- Keyboard-friendly add/edit/delete flows with validation
- Bulk copy via context menu and quick paste targets

**Collaboration**
- Shift-level comment threads with timestamped audit trail
- Day-level notes panel for handoff narratives
- Real-time Firestore subscriptions for live multi-user updates

**Access Control**
- Anonymous Firebase Auth bootstrap with configurable onboarding flow
- Tiered permissions (viewer, editor, admin) driven by Firestore user records
- Persistent auth state for immediate reloads and kiosk deployment

**Insights & Integrations**
- Deep links to Analysis dashboard (`ANALYSIS_URL`)
- Site Manager launch shortcut for inventory or staffing satellite apps
- Export-ready data structure (Firestore `artifacts/{appId}/public/data/schedule-weeks`)

**UX Enhancements**
- Sticky headers, hidden scrollbars, and smooth transitions
- Context menus for actions (`Complete`, `OPS`, `Change Colors`, `Comment`, `Copy Shift`, `Delete`)
- Tailwind-inspired custom styling with high-contrast dark theme
- Responsive layout optimized for desktop ops centers (works on tablets down to 1024px)

---

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Client (React 19)                     │
│                                                          │
│  - Vite dev server / build pipeline                      │
│  - Contextual modals and menus (Shift, Notes, Users)     │
│  - State via hooks, refs, and memoized selectors         │
│  - Local caching: `localStorage` for user info & users   │
└───────────────┬──────────────────────────────────────────┘
                │ Real-time sync (Firebase SDK)
┌───────────────▼──────────────────────────────────────────┐
│                    Firebase Backend                      │
│                                                          │
│  Authentication        Firestore                         │
│  - Anonymous bootstrap  - Schedule weeks collection      │
│  - Custom token hook    - Day objects (shifts + notes)   │
│  - Auth code gating     - Registered users roster        │
│                                                          │
│                         Security                         │
│  - Rules enforce read/write by anonymous UID             │
│  - Access tier encoded per user document                 │
└──────────────────────────────────────────────────────────┘

Continuous delivery handled via GitHub Actions → GitHub Pages for the React bundle, while Firebase serves as the realtime data layer.

---

## Local Development

### Prerequisites
- Node.js ≥ 20
- npm (bundled with Node) or yarn
- Firebase project with Firestore + Authentication enabled
- GitHub account (for CI/CD integration)

### Installation
```bash
git clone https://github.com/<your-org>/schedule-board.git
cd schedule-board
npm install
```

### Environment Bootstrap
Create `.env.local` in the repository root. Minimum keys:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

Optional overrides (set only if you are extending the platform):
- `VITE_FIREBASE_EMULATOR_HOST`
- `VITE_ANALYSIS_URL`
- `VITE_SITE_MANAGER_URL`

### Run Dev Server (for contributors)
```bash
npm run dev
```
Open the printed URL (defaults to `http://localhost:5173`). Hot Module Replacement is enabled via Vite.

---

## Configuration

### Firebase Setup Checklist
1. Create a new Firebase project.
2. Enable **Authentication → Sign-in Method → Anonymous**.
3. Enable **Firestore** in production mode. Create the following collections:
   - `artifacts/{appId}/public/data/schedule-weeks`
   - `artifacts/{appId}/public/data/registered-users`
   - `artifacts/{appId}/public/data/site-directory` (optional for site lookup)
4. Add web app credentials and paste them into `.env.local`.
5. Configure security rules (sample):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /artifacts/{appId}/public/data/{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
   Adjust per your trust boundaries (e.g., role-specific claims).

---

## Usage Guide

### Sign-Up & Roles
1. On first load, anonymous auth provisions a UID.
2. Click `LOGIN` to open the sign-up modal.
3. Provide first/last name and (if supplied by your administrator) an access credential to unlock editor or admin capabilities.

User profile persists in browser storage and Firestore for reuse across sessions—ideal for kiosks or shared terminals.

### Navigating the Week
- `<` / `>` buttons jump weeks.
- `ts week` returns to the week containing today.
- Calendar icon opens a month picker for random access.
- Horizontal scrolling supports touchpads (scroll wheel converts to horizontal drag).

### Managing Shifts
- `+` button at bottom of each day opens the Add Shift modal (editor+).
- Right-click shift exposes context menu:
  - `✅ Complete` / `⚙️ OPS` toggles color presets.
  - `Change Colors` opens palette modal for custom font/background.
  - `Copy Shift` duplicates metadata into clipboard (with system copy fallback).
  - `Delete Shift` removes entry (requires confirmation via context menu).
  - `Comment` (or double-click) opens threaded discussion for the shift.

### Notes & Collaboration
- Day footer includes `📄` note button. Editors can append notes; viewers read history.
- Each comment/note tracks author, initials, and ISO timestamp via `formatTimestamp`.

### Admin Utilities
- Logged-in admins see a gear icon next to their avatar.
- Clicking gear opens **Registered Users** modal with sortable roster (name, initials, role, created date).
- `Analysis` and `Site Manager` quick links launch external dashboards in new tabs.

### Data Model
Each Firestore week document:
```json
{
  "days": [
    {
      "date": "2025-02-09",
      "shifts": [
        {
          "id": "uuid",
          "site": "500 Howard St",
          "startTime": "0700",
          "endTime": "1500",
          "initials": "RK",
          "bgColor": "#FFFFFF",
          "fontColor": "#000000",
          "comments": [{ "id": "...", "user": "...", "text": "...", "date": "..." }]
        }
      ],
      "notes": [{ "id": "...", "user": "...", "text": "...", "date": "..." }]
    }
  ]
}
```
This shape maps cleanly to BI tools or payroll exports.

---

## Deployment

Automated via GitHub Actions → GitHub Pages. See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for pipeline specifics.

**Quick start:**
1. Fork or mirror the repository.
2. In GitHub repository settings:
   - Configure `GitHub Pages` to use `GitHub Actions`.
   - Populate repository secrets:
     - `VITE_FIREBASE_*` variables (same as `.env.local`).
3. Push to `main`. The included workflow builds with `npm run build` and publishes `/dist` to Pages.

**Manual Build**
```bash
npm run build   # Generates production bundle under dist/
```
You can host the `dist` folder on any static hosting service (Netlify, Vercel, S3 + CloudFront, etc.). Ensure environment variables are injected at build time.

---

## Operations & Maintenance

- **Backups**: Firestore retains point-in-time recovery. Export weekly snapshots via Firebase scheduled exports if compliance requires.
- **Monitoring**: Enable Cloud Logging and Firestore usage dashboards to watch read/write quotas.
- **Scaling**: App is serverless; main scaling vector is Firestore document size (keep day payloads under 1 MiB by trimming notes/comments over time).
- **Customization**: Tailor constants in `src/App.jsx` (`DEFAULT_SITE_NAMES`, color palettes, URL endpoints) to match your brand or vertical.
- **Security Hardening**:
- **Customization**: Tailor constants in `src/App.jsx` (site directory, color palettes, destination URLs) to match your brand or vertical.
- **Security Hardening**:
  - Drive role assignment via Firestore or Firebase Custom Claims.
  - Restrict GitHub Pages domain with custom domain + HTTPS required.

---

## Tech Stack

- **Framework**: React 19 (function components + hooks)
- **Build Tooling**: Vite 5, ESBuild, PostCSS
- **UI Layer**: Tailwind CSS principles with handcrafted styles (no runtime dependency)
- **State/Data**: Firebase Firestore (real-time streaming) + Auth SDK
- **Tooling**: ESLint (flat config), GitHub Actions CI/CD, npm scripts

---

Ready to white-label, bundle with managed hosting, or upsell as a SaaS-ready scheduling portal. For enterprise pilots, pair with Firebase multi-tenant projects and extend the analytics integration endpoints. Let us know if you need architecture diagrams, SOC 2 starter policies, or sales battlecards.
