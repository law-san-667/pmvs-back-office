---
name: backend-no-bids-endpoint
description: The PMVS backend exposes tenders but has no bids/soumissions endpoints
metadata:
  type: reference
---

The PMVS backend (Scalar API spec at `https://pmvs-backend-production.up.railway.app/v1/specs`, dev `http://localhost:8080/v1`) exposes tenders only: `GET/POST /v1/tenders` and `GET/PATCH/DELETE /v1/tenders/:id`. There are **no bids / soumissions / proposal endpoints at all** as of 2026-07.

Tender create requires: `publisherUserId`, `categoryId`, `subCategoryId`, `title`, `type` (SUPPLY|SERVICE|WORKS|INTELLECTUAL_SERVICE), `countryCode`, `submissionDeadline`. List filters by `publisherBusinessId` (no business-scoped path like `/listings/business`).

**How to apply:** The dashboard "Appels d'offres" page (`app/[locale]/dashboard/tenders/`) shows tenders; its "Mes soumissions" panel is an empty-state placeholder until the backend adds a bids resource. To inspect the backend API, fetch the Scalar spec JSON at `/v1/specs`.
