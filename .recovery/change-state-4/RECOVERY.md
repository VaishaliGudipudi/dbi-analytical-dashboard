# Change State 4

Saved on 2026-06-14 after the latest analytics v3-only dashboard updates.

## Recovery Source

- Workspace snapshot: `.recovery/change-state-4`
- Restore only the six source files listed below.
- Do not replace unrelated files or other recovery states.

## Included State

- All Change State 3 SSR, authentication, analytics v3 table/export, chart, and care-pathway/pincode work.
- Analytics v3 ER Cases by Care Pathway uses the expanded care-pathway dataset.
- Analytics v3 KPI trend popups include the requested quarter filters.
- Analytics v3 Outward Referral Analysis REASON data is:
  - Uncategorized: 2
  - Specific Medical Urgencies: 2
  - Need for Advanced or Specialized Care: 1
- Analytics v3 LAMA Analysis REASON data is:
  - Other Reasons: 1
  - Seeking Alternative Treatment: 1
  - Terminal/Advanced Medical Condition: 1
  - Patient Feeling Better After Initial Treatment: 1
- Analytics v3 Age Group with Gender Distribution uses:
  - <18 Years: Male 5, Female 3
  - 18-40 Years: Male 61, Female 12
  - 40-60 Years: Male 14, Female 7
  - >60 Years: Male 1, Female 3
  - Unknown: Male 1, Female 0
- These latest dataset overrides are gated to analytics v3.

## Files

- `src/components/ui/chart.tsx`
- `src/lib/auth.tsx`
- `src/routeTree.gen.ts`
- `src/routes/_app.tsx`
- `src/routes/_app/analytics-v3.tsx`
- `src/routes/_app/analytics.tsx`

## Verification

- `npm run build` passed for client and SSR builds immediately before saving.
- `http://localhost:8080/analytics-v3` returned HTTP 200.
- TanStack `self.$_TSR` hydration payload was present.
- Dev server was listening on localhost port 8080.
- Every saved source file matched its live source file by SHA256.

## SHA256 Checksums

- `src/components/ui/chart.tsx`: `4CDD9ECAF9F889D86BF229465AA95B68049DA4CDC127F95C0B7D8F67C14FE925`
- `src/lib/auth.tsx`: `C29D96E5E97C37FBA1581D799857F8B1DD384283C2D378CEA06BD9A0C5674E05`
- `src/routeTree.gen.ts`: `5C265303B5FD7F594D83F8DC4D4F20828F735FD250277FB11B138E9769E28032`
- `src/routes/_app.tsx`: `7156B99D000DE1B6611BA91C1B92AD8ABE4154ABDECBF207040743F51CC7AEA6`
- `src/routes/_app/analytics-v3.tsx`: `42834F5BDDE3D02DB53B09B4879ED5FE32FCF1BC292F14C8A8744CA7B2BD2A81`
- `src/routes/_app/analytics.tsx`: `45719934563E542AD6A37C3952A32EE4E4137A725842A6C006B0046EAFCBA1BF`

Use Change State 4 as the preferred recovery baseline unless another saved state is explicitly requested.
