# Bottlemoodi — Claude Code Instructions

## Branch workflow (REQUIRED)

**Never commit or push directly to `main`.** Always:

1. Create a feature branch before making any changes:
   ```
   git checkout -b feature/<short-description>
   ```
2. Commit changes on that branch.
3. Push and open a PR:
   ```
   git push -u origin feature/<short-description>
   gh pr create --base main
   ```

Branch naming:
- `feature/` — new features or pages
- `fix/` — bug fixes
- `chore/` — dependency updates, config changes
- `design/` — visual / UI-only changes

## Stack

- Next.js 15 + App Router + TypeScript
- Tailwind CSS (brand tokens in `tailwind.config.ts`)
- Zustand (`src/lib/store.ts`) for cart state
- Google Fonts via `next/font/google`: Bakbak One, Kaushan Script, Inter Tight, Anek Tamil

## Route structure

- `src/app/(site)/` — public storefront (Header + Footer via group layout)
- `src/app/minad/` — admin console (URL is `/minad`, not `/admin`)
- `src/app/api/upload/` — Cloudinary upload stub

## Key files

- `src/lib/data.ts` — product catalog, sizes, price upcharges
- `src/lib/store.ts` — cart Zustand store
- `src/app/globals.css` — bottle-clip shape, custom keyframes, scrollbar-hide

## Pending integrations (not yet wired)

- **Cloudinary**: uncomment `src/app/api/upload/route.ts` and add `CLOUDINARY_*` env vars
- **Razorpay**: UPI / card payments for Indian customers
- **PostgreSQL + Prisma**: replace in-memory seed data
- **Clerk**: replace the demo auth in `/minad`
