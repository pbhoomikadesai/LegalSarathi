# LegalSarthi — Build Plan

A premium, mobile-first legal assistance web app for India. Trustworthy government-service feel meets modern consumer polish. Built as a single React (Vite + TypeScript) app with React Router, Tailwind, and a global LanguageContext powering instant 8-language switching across every UI string.

---

## Brand & Design Foundation

- **Colors** (HSL tokens in `index.css`): Deep Teal `#0F6E56`, Warm Amber `#BA7517`, Background `#F8F7F2`, Card `#FFFFFF`, Text `#1A1A18` / `#5F5E5A`, Border `#E8E6DF`, Error `#A32D2D`, Success `#3B6D11`, plus `#1F4E79` and `#0D5C63` for auth.
- **Typography**: Plus Jakarta Sans (headings) + Inter (body), loaded from Google Fonts in `index.html`.
- **Radii**: 16px cards / 12px buttons / 8px chips. **Shadow**: `0 4px 12px rgba(0,0,0,0.08)`.
- **Background pattern**: faint mandala/lotus SVG at 3–4% opacity as a body-level layer.
- **Mobile-first**: optimized at 390px, fluid 375–430px, no horizontal overflow.

All tokens defined as semantic CSS variables in `src/index.css` and mapped in `tailwind.config.ts` (e.g. `bg-brand`, `text-accent`, `border-line`). No hardcoded hex values in components.

---

## App Architecture

```text
src/
├── contexts/
│   ├── LanguageContext.tsx     // current lang + setLang + t()
│   └── AuthContext.tsx         // isAuthenticated, login(), logout()
├── i18n/
│   ├── translations.ts         // { key: { kn, hi, en, mr, tu, kk, te, ta } }
│   └── languages.ts            // 8-language metadata
├── components/
│   ├── ui/                     // primitives (existing shadcn + custom)
│   ├── layout/                 // StickyHeader, BottomNav, ScreenShell
│   ├── language/               // LanguageSwitcherPill, LanguageSwitcherSheet
│   ├── chat/                   // ChatBubble, VoiceInputOverlay
│   ├── lawyer/                 // LawyerCard, VideoCallModal
│   ├── document/               // DocumentCard, StepProgressBar
│   └── common/                 // PrimaryButton, OTPInput, PhoneInput, Toast, EmptyState, SkeletonCard, ErrorBoundary, BottomSheet
├── pages/
│   ├── Splash.tsx
│   ├── Onboarding.tsx
│   ├── LanguageSelect.tsx
│   ├── Login.tsx
│   ├── OtpVerify.tsx
│   ├── Home.tsx
│   ├── Chat.tsx
│   ├── Documents.tsx
│   ├── DocumentWizard.tsx
│   ├── Lawyers.tsx
│   ├── LawyerProfile.tsx
│   ├── RtiWizard.tsx
│   ├── Community.tsx
│   ├── Notifications.tsx
│   ├── Profile.tsx
│   └── EditProfile.tsx
├── data/
│   ├── lawyers.ts              // 10 sample lawyers, fees ₹30–₹100
│   ├── documents.ts            // doc templates
│   ├── community.ts            // sample posts
│   └── notifications.ts
└── App.tsx                     // Router + Providers + ErrorBoundary
```

---

## Language System (the spine)

- **`LanguageContext`** holds `lang` (one of `kn | hi | en | mr | tu | kk | te | ta`) and `t(key)`. Persisted in `localStorage["lang"]`.
- **`translations.ts`**: every UI string keyed once, with all 8 translations. Includes nav labels, headings, placeholders, button text, errors, chips, toasts, doc/lawyer category names, greetings, dates (formatted via `Intl.DateTimeFormat` with proper locale).
- **`LanguageSwitcherSheet`**: reusable bottom sheet with a 2-column grid of 8 cards. **Native script only** — no English subtitle, no secondary label, ever. Active card = teal fill + white text + checkmark. Apply triggers a 300ms full-screen shimmer overlay, then re-renders.
- Used from: header pill (shows 2-letter code KN/HI/EN/MR/TU/KK/TE/TA), Settings → Language, Edit Profile → Language.

---

## Auth Flow (OTP)

State machine: `LOGIN → OTP_VERIFY → HOME`, persisted via `localStorage["isAuthenticated"]`.

- **Login**: minimal header (menu + "LegalSarthi"), centered teal gavel SVG logo, tagline "Apna Kanoon, Apni Bhasha", `+91` fixed prefix pill + 10-digit input, Send OTP disabled until 10 digits, terms text below. Faint mandala bg.
- **OTP Verify**: back arrow, masked phone `+91 ******1234`, **6 separate boxes** (48×56, auto-advance, backspace-back, paste-fill-all, aria-labels "OTP digit 1–6"). Verify button shows spinner. Mock OTP `123456` → success: slide-up to Home and set `isAuthenticated = "true"`. Wrong → red inline error + horizontal shake. **Resend**: 30s countdown then teal active link; resets boxes & focus.
- **Route guard**: `<ProtectedRoute>` redirects to `/login` if not authenticated. Bottom nav hidden on splash, onboarding, language-select, login, OTP screens.

---

## Screens (12)

1. **Splash** — full teal screen, white logo, 1.5s, advances to Onboarding.
2. **Onboarding** — 3 swipeable slides with custom SVG illustrations, dots, Skip, Next/Get Started, "I already have an account — Sign In".
3. **Language Select** — multi-script heading, 2×4 grid of 8 native-script-only cards, Continue button.
4. **Login** & **5. OTP Verify** — as above.
5. **Home** — sticky header (menu + LegalSarthi | language pill + bell with red badge + avatar "PD"), localized "Namaste, Priya" + today's date, search bar with mic + 3 quick chips, 2×2 quick action grid (Chatbot teal / Document amber / Lawyer blue-gray / Complaint warm green), "Know Your Rights" horizontal scroll strip (5 cards), Recent Queries with View all.
6. **AI Chatbot** — back + "LegalSarthi AI" + lang pill, subtitle, sample tenant-eviction conversation, AI bubble (white, teal left border) with law section chip "Section 106, Transfer of Property Act" + amber "View full law" + teal "Generate document for this", "Translated from …" toggle, input bar (attach | text | mic | send), 3 suggestion chips, voice overlay (pulsing teal circle).
7. **Document Generator** — filter chips (All, Affidavit, RTI, Rent Agreement, Consumer Complaint, FIR Draft, Bail Application, Will, Power of Attorney), document cards with Free/Court Accepted/12-languages tags, time estimate, Generate button. Featured RTI card with amber border + "5,200+ generated this month".
8. **Document Creation Wizard** — 4-step progress bar, Step 2 form (Full Name, Address, Aadhaar optional with amber info tooltip, Phone, Document Language dropdown), lock-icon privacy line, Back ghost + Continue teal.
9. **Lawyer Directory** — header with "Bengaluru, KA" location pill, search/filter/sort, category chips, **10 lawyer cards** exactly as specified — every card carries **two buttons: "Book Consultation" (teal filled) + "Video Call" (teal outline + camera icon)**. All fees strictly ₹30–₹100.
10. **Lawyer Profile** — full sheet with Overview / Reviews / Availability tabs, weekly calendar + slot buttons, two sticky bottom buttons. Video Call → **`VideoCallModal`** confirming "You will receive a link on your registered mobile number 10 minutes before the session" with Confirm + Cancel.
11. **RTI / Complaint Filing Wizard** — chat-style guided UI, "Step 3 of 6", completed Q&A bubbles ("First RTI?" → Yes; "Which state?" → Karnataka), active Q with searchable department dropdown.
12. **Community Forum** — header with amber "Ask a Question", tabs (Trending/Recent/Answered/My Questions), category chips, post cards with verified-answer badge + lawyer attribution, pinned amber-bordered post by LegalSarthi Team.
13. **Notifications** — grouped Today/Yesterday, 5 notification types, unread = teal left border + off-white bg, "Mark all read".
14. **Profile / Settings** — avatar "PD" + camera overlay, stats row (3/12/2), Preferences (Language opens sheet, Dark Mode, Notifications), Legal Profile, Privacy & Security, Help & Support, red Logout.
15. **Edit Profile** — back + Save (gray→teal when dirty), avatar action sheet (Take Photo/Gallery/Remove), sections: Personal / Contact / Language & Accessibility (with text-size slider) / Legal Identity (Aadhaar toggle + conditional Bar Council ID), Save + Cancel, success toast 2.5s.

---

## Component Library (reusable)

PrimaryButton · SecondaryButton · GhostButton · DestructiveButton · TextInput · OTPInput · PhoneInput · Dropdown · Checkbox · Radio · ToggleSwitch · StepProgressBar · Avatar · Badge/Chip · DocumentCard · LawyerCard · VideoCallModal · ChatBubble · BottomNav · StickyHeader · LanguageSwitcherPill · LanguageSwitcherSheet · NotificationItem · BottomSheet · Toast · SkeletonCard · EmptyState · ErrorBoundary.

All built mobile-first with min 44×44 tap targets, focus rings, aria labels, and keyboard support.

---

## Animations

CSS keyframes + Tailwind utilities (no heavy libs):
- Screen transitions: slide-from-right (forward), slide-from-left (back), fade for auth.
- OTP success: slide-up to Home. OTP wrong: horizontal shake.
- Bottom sheet: spring translate-y, 300ms.
- Language apply: 300ms shimmer sweep overlay.
- Chat bubbles: scale 0.9→1 200ms ease-out.
- Voice input: concentric teal pulse.
- Toast: translate-y-8 → 0, auto-dismiss 2.5s.
- Skeleton: shimmer sweep left→right.
- Button press: `active:scale-[0.97]`.

---

## Routing

`react-router-dom` with: `/splash`, `/onboarding`, `/language`, `/login`, `/otp`, and protected `/home`, `/chat`, `/documents`, `/documents/new`, `/lawyers`, `/lawyers/:id`, `/rti`, `/community`, `/notifications`, `/profile`, `/profile/edit`. Wrapped in `<ErrorBoundary>` per route with friendly localized fallback.

---

## Technical Notes

- **Stack**: Vite + React 18 + TypeScript + Tailwind v3 + React Router v6 (already in project). Uses existing shadcn/ui primitives where they fit; new bespoke components for OTP, PhoneInput, LanguageSwitcherSheet, LawyerCard, VideoCallModal, ChatBubble.
- **State**: React Context for Language + Auth. React Query already wired for any future async work.
- **Persistence**: `localStorage` keys `lang`, `isAuthenticated`, `onboarded`.
- **Icons**: `lucide-react` (already installed) for UI icons; custom inline SVGs for the gavel logo and onboarding illustrations.
- **No backend** in v1 — all data is local mock data; OTP is mocked to `123456`. Easy to swap to Supabase/Twilio later.
- **Quality gates**: zero console errors, no broken imports, no hardcoded URLs, no horizontal scroll at 375–430px, language switch updates 100% of visible strings.

---

## Build Order

1. Tokens, fonts, mandala bg, Tailwind theme.
2. LanguageContext + translations + AuthContext + ProtectedRoute.
3. Core primitives: PrimaryButton, TextInput, BottomSheet, Toast, StickyHeader, BottomNav, LanguageSwitcherPill + Sheet.
4. Auth flow: Splash → Onboarding → LanguageSelect → Login → OTP → Home.
5. Home + Chat + Documents + DocumentWizard.
6. Lawyers + LawyerProfile + VideoCallModal.
7. RTI Wizard + Community + Notifications.
8. Profile + EditProfile.
9. Polish: animations, skeletons, empty states, ErrorBoundary, a11y pass, 390px QA.

Once you approve, I'll implement end-to-end.