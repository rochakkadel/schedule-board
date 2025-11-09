# Schedule Board — Legal & Technical Overview

_Last updated: November 9, 2025_

---

## 1. Executive Summary

Schedule Board is a web-based workforce planning and shift management tool built with React and Firebase. This document outlines the legal considerations, intellectual property (IP) stance, data-handling expectations, compliance posture, and the core technologies that power the application. It is intended for company leadership, legal counsel, security teams, partners, and other stakeholders who need an authoritative reference on the product’s rights and responsibilities.

---

## 2. Ownership & Intellectual Property

- **Copyright Ownership:** All original source code, user interface assets, copy, and documentation are owned by the Schedule Board development team unless otherwise noted.
- **Third-Party Assets:** Open-source libraries and frameworks are incorporated under their respective licenses (see §8). Any external artwork, fonts, or icons remain the property of their creators and are used according to applicable license terms.
- **Trademark Usage:** “Schedule Board” and associated branding are trademarks owned by the project owners. Unauthorized use of branding elements is prohibited.
- **Contributor IP:** Contributors grant the project a perpetual, worldwide, non-exclusive, royalty-free license to use submitted code, documentation, and assets.

---

## 3. Licensing Model

The application is currently distributed as a closed-source product for internal or client-specific deployment. Redistribution or public hosting requires explicit written authorization. If a different license (e.g., MIT, Apache-2.0) is adopted in the future, the license file in the repository root will supersede this section.

---

## 4. Regulatory & Compliance Considerations

While Schedule Board does not inherently process regulated personal data, deployments may store personally identifiable information (PII) such as employee names or shift details. Operators must:

1. Configure and secure Firebase projects in line with company or client compliance policies (GDPR, CCPA, HIPAA, etc.).
2. Provide an accessible privacy notice to end users.
3. Obtain user consent before collecting personal information in jurisdictions where required.
4. Maintain an incident response plan covering data access, loss, or misuse.

This document does not constitute legal advice; consult qualified counsel to evaluate jurisdiction-specific obligations.

---

## 5. Privacy & Data Handling

- **Data Storage:** User profiles, shift allocations, notes, and comments are stored in Firebase Firestore and synchronized to local storage for offline resilience.
- **Authentication:** Anonymous Firebase authentication is used for lightweight access control; clients may substitute custom authentication providers if needed.
- **Data Retention:** Operators control retention policies. It is recommended to implement periodic reviews and allow users to request profile deletion or anonymization.
- **Access Controls:** Elevated privileges (e.g., editing shifts) require valid access codes or administrative designation.
- **Encryption:** Firebase automatically encrypts data at rest and in transit. Additional application-layer encryption can be added if mandated.

---

## 6. Security Posture

- **Transport Security:** All browser ↔ Firebase traffic uses HTTPS/TLS.
- **Authentication Security:** Anonymous auth should be complemented with stricter auth if storing sensitive data. Rotate access codes regularly.
- **Input Validation:** Client-side validation exists for most form fields. Back-end validation and rules (Firestore Security Rules) must be configured per deployment.
- **Secrets Management:** Firebase credentials are provided via environment variables (e.g., `VITE_FIREBASE_*`). Do not hardcode production credentials in source control.
- **Audit & Logging:** Enable Firebase logging features to monitor access, writes, and administrative actions.

---

## 7. Feature Overview

- **Schedule Grid:** Drag-and-drop style weekly calendar with shift creation, editing, and deletion workflows.
- **User Access Modes:** View-only access by default; edit privileges unlocked with approved access codes (`91965` for editors, `12893` for VIP/admin).
- **Shift Metadata:** Support for time ranges, site assignments, color-coding, comments, and status flags (complete, operations).
- **Notes & Comments:** High-contrast modal interfaces for team collaboration on daily notes and per-shift comments.
- **Contextual Menus:** Right-click menus enabling quick edits, duplication, color adjustments, and completion toggles.
- **Animations & UX Enhancements:** Tailored transitions, hover states, and completion animations to reinforce workflow feedback.
- **Offline Resilience:** Local storage caching ensures user profiles persist between sessions until sync is available.
- **Registered Users Modal:** Real-time view of registered users when connected to a properly configured Firestore instance.

---

## 8. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Front-end Framework | React 18 | SPA architecture, hooks-based state management |
| Styling | CSS Modules / global CSS | Custom animations in `src/App.css`, Tailwind optional |
| Icons & Assets | SVG assets | Stored in `src/assets/` |
| State & Hooks | React hooks, custom `useUserAccess` | Local storage sync, Firebase auth |
| Database | Firebase Firestore (modular SDK) | CRUD for schedule weeks, registered users |
| Authentication | Firebase Auth (anonymous/custom) | Re-auth and local fallback logic included |
| Tooling | Vite, ESLint | Modern build tooling, linting via `eslint.config.js` |

Third-party dependencies are managed via `package.json`. Refer to the dependency tree and individual licenses before redistributing.

---

## 9. Deployment & Operations

- **Environments:** Configure separate Firebase projects for development, staging, and production. Populate environment variables via `.env` files or CI/CD secrets.
- **CI/CD:** Automate build & deploy pipelines to ensure reproducible releases (GitHub Actions, Netlify, Vercel, or custom pipelines).
- **Monitoring:** Recommended tools include Firebase Performance Monitoring, Google Analytics, or Sentry for error tracking.
- **Backups:** Use scheduled exports of Firestore collections or integrate with managed backup services.

---

## 10. Support & Maintenance

- **Issue Tracking:** Maintain a ticketing system (GitHub Issues, Jira) for feature requests and bug reports.
- **Release Notes:** Document notable changes, migrations, and security fixes. Adopt semantic versioning for clarity.
- **Testing:** Implement unit tests for core utilities and integration tests for Firebase interactions where possible.
- **Documentation:** Keep README, onboarding guides, and this legal overview up to date with each release.

---

## 11. Risk & Liability Disclaimers

- Software is provided “as is” without warranty of any kind. Operators are responsible for configuring infrastructure securely.
- The development team is not liable for data loss, downtime, or compliance violations stemming from misconfiguration or misuse.
- Users must not rely solely on Schedule Board for critical life-or-death scheduling or safety-critical operations without redundancy.

---

## 12. Change Management

- **Document Updates:** Revision history will note material changes to legal, security, or feature descriptions.
- **Breaking Changes:** A minimum 14-day notice is recommended before deploying breaking schema or API updates to production tenants.
- **Third-Party Updates:** Monitor upstream library advisories for vulnerabilities (Firebase SDK, React, etc.) and patch promptly.

---

## 13. Contact & Escalation

- **General Inquiries:** contact@scheduleboard.app (placeholder; replace with official address).
- **Legal Notices:** legal@scheduleboard.app.
- **Security Reports:** security@scheduleboard.app (PGP public key recommended for sensitive disclosures).
- **Emergency Hotline:** +1-555-555-1212 (placeholder; substitute with actual escalation line if available).

---

## 14. Revision History

| Date | Version | Author | Notes |
|---|---|---|---|
| 2025-11-09 | 1.0 | Schedule Board Team | Initial creation of legal, technical, and feature overview. |

---

*This document is a living artifact. Ensure stakeholders review and update it alongside product releases, legal guidance, and infrastructure changes.*

