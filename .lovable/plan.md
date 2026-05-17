# Firmus Admin Expansion — Implementation Plan

Build in **4 sequential batches**. Each batch ends in a working, deployable state. You approve, I ship the next.

## Batch 1 — Clients + Client Portal
**Database**
- `clients` table: name, email, phone, company, country, status (active/paused/churned), notes, created_at
- Link `clients.user_id` (nullable) → `auth.users` so a client can log in and only see their own data
- RLS: admins full access; clients read only their own row

**Admin pages**
- `/admin/clients` — list, search, filter by status
- `/admin/clients/$id` — detail view: profile, orders, invoices, notes timeline

**Client portal**
- `/portal/login` — separate login (same auth, role check redirects)
- `/portal` — dashboard: my orders, invoices, progress timeline, documents
- Layout `_portal.tsx` with auth guard

## Batch 2 — Orders + Service Status Timeline
**Database**
- `orders`: client_id, service_id, package_name, price, status, started_at, due_at
- `order_stages`: order_id, name, order_index, status (pending/in_progress/done/blocked), completed_at, notes
- Default stages template per service (LLC → EIN → Seller Central → Listing → Launched)
- `lead_notes` + `lead_status` enum upgrade for the existing leads table (CRM upgrade)

**Admin pages**
- `/admin/orders` — pipeline / kanban view by stage
- `/admin/orders/$id` — stage timeline with check-off, assignee, due dates
- Convert lead → client → order action

**Portal**
- Client sees their order timeline read-only with progress %

## Batch 3 — Invoices + Payments + Coupons
**Database**
- `invoices`: client_id, order_id, number (auto), amount, currency, status (draft/sent/paid/refunded/overdue), issued_at, due_at, paid_at, line_items (jsonb)
- `payments`: invoice_id, amount, method (manual/bank/stripe), reference, paid_at
- `coupons`: code, type (percent/fixed), value, max_uses, used_count, expires_at, active

**Admin pages**
- `/admin/invoices` — list, filter, mark paid, record refund
- `/admin/invoices/$id` — printable invoice (PDF-ready HTML)
- `/admin/coupons` — CRUD

**Portal**
- Client sees their invoices, can download/print

**Note:** No Stripe yet — manual payment recording only. Stripe layer added later if you want.

## Batch 4 — Team Roles + Audit Logs + Analytics
**Database**
- Extend `app_role` enum: `admin`, `manager`, `staff`
- Add granular permission checks in `AdminShell` (hide sections by role)
- `audit_logs`: actor_id, action, entity_type, entity_id, metadata (jsonb), ip, created_at
- DB trigger writes audit rows on insert/update/delete for key tables

**Admin pages**
- `/admin/team` — list users, change role (admin only)
- `/admin/audit` — searchable activity log
- `/admin/analytics` — revenue chart, leads/month, conversion funnel (lead → client → paid), top services

## What I'm explicitly leaving out (for later rounds)
Live chat, support tickets, appointments, notifications (email/SMS/WA), backups, multi-language, SEO/CMS beyond what exists, encrypted document storage, file access ACLs, API integrations, spam protection, login monitoring with alerts, DB optimization tools. These are real but each is its own batch — let's do them after the core is solid.

## Tech notes
- All admin pages use existing `AdminShell` pattern
- Portal gets its own `PortalShell` with similar nav
- RLS on every table; admin role bypass via `has_role()`
- Auto-incrementing invoice numbers via sequence
- Audit triggers in plpgsql

---

**Confirm and I'll start Batch 1** (clients table + portal). Each batch is roughly one round of work.
