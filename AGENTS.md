# Architecture rules
- Standalone Next.js 16 App Router + TypeScript app for local VS Code development and Vercel; it is never run or published on Lovable.
- Styling is pure CSS only (globals.css with `gt-` utility classes + CSS modules in src/styles); no Tailwind or UI kits, to match the original design.
- External API keys are read only in server code (src/lib/providers.ts, guarded by `server-only`); the browser calls /api/discover/* instead.
- The browser talks to Supabase with the anon key; data isolation and quotas (trips, alerts) are enforced by RLS policies and triggers in sql/01_schema.sql, not by UI code.
- Price alerts are created only through the `create_route_alert` RPC so routes stay deduplicated and the alert limit cannot be bypassed.
- The Python pipeline is the only writer of monitored_routes base rows, dim_calendar and price_history, using the service_role key from GitHub Secrets.
- Pages that read URL params are server components that await `searchParams` and pass values to client components (avoids Suspense requirements of useSearchParams).
