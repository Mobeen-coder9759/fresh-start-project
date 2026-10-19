# Dental CRM dashboard behind the sign-in page

The video intro and sign-in page stay exactly as they are. Clicking "Sign In" (and Google/SSO) signs in a demo admin and opens the new dashboard. Everything runs on sample data; no real accounts.

## What you will get
- **Simulated sign-in & roles**: demo user (admin by default) kept in app memory. Admin sees everything; staff sees Dashboard, Appointments, Patients; HR sees only the KPI cards. Blocked pages send you back to the Dashboard. Signing out returns to the sign-in page. Top right shows name, role and a Log out button (plus a role switcher in the menu so you can try each role).
- **Layout**: left sidebar (Dashboard, Appointments, Patients, Settings for admin), active item in purple, folds into a menu on phones. Top bar with page title, today's date, profile menu.
- **Dashboard**: 5 KPI cards (today, next 7 days, new this week, cancellations + reschedules with cancel rate, Estimated time/money saved with info tooltip). Two charts only: purple bookings area chart with 7/30/90-day toggle, and reasons donut (top 6 + Other). "Today's schedule" list of next 5 appointments.
- **Appointments**: table with Time, Patient, Reason, Insurance (masked), Booking type, Status badge (Cancelled / Rescheduled / Completed / Upcoming in purple). Filters: date range, reason, booking type, search, sort Time/Name, Clear filters, 20 per page, empty state. Clicking a row opens a side panel with full details (unmasked DOB and insurance).
- **Patients**: grouped from appointments by name + DOB (fallback phone/email). Name, Phone, Email, Total visits, Last visit, Next appointment; search and A-Z/Z-A. Clicking opens their appointment history.
- **Settings (admin)**: user list with add user, change role, active toggle; clinic settings (appointment value, hourly cost, minutes per booking, timezone) that feed the savings KPI live; formula text shown.
- **Look**: background #C9C9C9, cards #D6D6D8 rounded with purple hover glow, purple #9F7AEA accent, navy #0F172A text, dark grey #77777A inputs with white placeholder and purple glow, Inter. Skeleton loaders on first render.

## Note
Your brief says React Router; this project uses TanStack Router (fixed), which does the same job. The old "Vellum" sales demo at /dashboard will be replaced by this dental dashboard.

## Technical details
- Add `recharts`; shadcn sheet/table/select/tooltip/skeleton/switch as needed.
- `src/lib/mockData.ts` with the exact `AppUser` / `Appointment` types, ~150 appointments spread over -90..+14 days relative to today, ~6 users.
- `src/lib/auth.tsx` AuthContext (provider in `__root`), persisted to sessionStorage so refresh keeps you signed in; `src/lib/settings.tsx` clinic settings context.
- Routes: `_app/route.tsx` layout (sidebar + topbar, redirects to `/` when signed out), `_app/dashboard.tsx`, `_app/appointments.tsx`, `_app/patients.tsx`, `_app/settings.tsx`; role checks per route redirect to `/dashboard`. Remove old `src/routes/dashboard.tsx` and `crm-data.ts`/avatar usage.
- `src/hooks/`: `useKpis`, `useBookingsSeries`, `useReasonBreakdown`, `useAppointmentFilters`, `usePatients`; status/masking helpers in `src/lib/appointments.ts` with unit tests (status rules, masking, patient grouping, savings formula, role access).
- Design tokens added to `src/styles.css`; no hardcoded colors in components. Sign-in button handler in `index.tsx` calls `login()` then navigates — no styling change there.
- Per-route head() titles/descriptions.
