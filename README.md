# Sello de Turismo de Salud — Digital Certification Platform

A web platform that digitizes Mexico's **Sello de Turismo de Salud** (Health Tourism Seal)
certification process for **SECTUR** (Secretaría de Turismo) / **Segmentos Especializados**.
Establishments fill out the official forms online, a consultant reviews and approves them,
the platform generates the official documents, and when a seal is granted the certification
is recorded **on-chain (Ethereum Sepolia)** — immutable, verifiable, and gas-sponsored by the
platform.

> Built with Next.js 16 (App Router) + TypeScript. Plain CSS (no Tailwind).

---

## Table of contents

- [What it does](#what-it-does)
- [Roles & flow](#roles--flow)
- [Official documents](#official-documents)
- [Blockchain registry](#blockchain-registry)
- [AI assistant "Pregúntale a Cynthia"](#ai-assistant-pregúntale-a-cynthia)
- [Email notifications](#email-notifications)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Environment variables](#environment-variables)
- [Local development](#local-development)
- [Deploying the smart contract](#deploying-the-smart-contract)
- [Deploying to Vercel](#deploying-to-vercel)
- [Scripts](#scripts)

---

## What it does

- **Registration (MSE-FO-28):** the establishment captures its legal/contact data, giro
  (Hotel, Clínica, Hospital, Spa, Restaurante, etc.), documents and a digital signature.
- **Verification checklist (MSE-FO-55):** 39 indicators across 5 families. Which indicators
  apply is derived from the giro (with a restaurant sub-question). Each indicator is answered
  "Sí cumple" (with an evidence description + photos) or "No cumple" (with an action plan).
- **Improvement plans (MSE-FO-57 / 3W):** one plan per family that has any "No cumple".
- **Letters (MSE-FO-29 Intención, MSE-FO-32 Adhesión):** filled from registration data,
  downloaded as PDF over the official template, reusing the registration signature.
- **Seal Calculator (MSE-FO-59):** consultant-only Excel export. The establishment's answers
  fill the "Lista de Verificación" sheet and the workbook's own formulas recompute the
  "Reporte de Evaluación" sheet on open (`fullCalcOnLoad`).
- **Official document generation** as **PDF overlays** on the official templates (never
  regenerated from scratch), plus **Word (.docx)** and **Excel (.xlsx)** exports.
- **On-chain registry** of the seal when the service is finalized.

## Roles & flow

- **Establishment (empresa):** logs in with email + access code, fills forms, uploads
  evidence, downloads documents.
- **Consultant (consultor):** manages access codes, reviews each registration/verification
  field-by-field (approve or request corrections), downloads all documents, and **finalizes
  the service** (which triggers the on-chain registration + a notification email).

Access model: there is **no self-registration**. The consultant creates each access (email +
random access code) and shares it; the establishment only logs in. First login requires
accepting **Terms & Conditions, Privacy Notice and Intellectual Property**.

## Official documents

| Code | Document | Formats |
| --- | --- | --- |
| MSE-FO-28 | Formato de Registro | PDF (overlay), Excel |
| MSE-FO-55 | Lista de Verificación | PDF (overlay), Word |
| MSE-FO-57 | Plan 3W (per family) | PDF (overlay), Excel |
| MSE-FO-29 | Carta de Intención | PDF (overlay) |
| MSE-FO-32 | Carta de Adhesión | PDF (overlay) |
| MSE-FO-59 | Calculadora de Sello | Excel (formulas preserved) — consultant only |

PDFs are produced with **pdf-lib** by overlaying text onto the official template PDFs
(coordinates measured with PyMuPDF). Word uses **docxtemplater**; Excel uses **exceljs**.

## Blockchain registry

When the consultant **finalizes a service**, the platform records the seal on **Ethereum
Sepolia** via the `SelloRegistry` contract (`contracts/SelloRegistry.sol`).

- Gas is **sponsored by the platform's relayer wallet** — the establishment needs no wallet.
- Each record stores the company name, giro, consultant, timestamp and an integrity hash of
  the file, and emits a `SelloRegistrado` event.
- The transaction hash is stored on the registration and shown as an **Etherscan link** on
  both the consultant and establishment dashboards.
- The integration is **best-effort**: if the chain env vars are absent it is skipped and the
  rest of the flow is unaffected.

Relevant files: `contracts/SelloRegistry.sol`, `lib/blockchain.ts`,
`scripts/compile-sello.mjs`, `scripts/deploy-sello.mjs`.

## AI assistant "Pregúntale a Cynthia"

Per verification indicator, the establishment can generate a detailed, ready-to-edit draft of
the evidence description (with example URLs and bracketed placeholders to customize). It runs
through **UsePod** (OpenAI-compatible proxy) and the draft is inserted directly into the
editable field. See `app/api/cynthia/route.ts`.

## Email notifications

Transactional emails via **Resend** (`lib/email.ts`), best-effort:

- Access code delivery (sent by the consultant with the "Enviar al correo" button).
- New request started / submitted for review (to the consultant).
- Submission received (to the establishment).
- Review result: approved or corrections (to the establishment).
- Service finalized (to the establishment).

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript.
- **Styling:** plain CSS in `app/globals.css` (tokens: `--rojo`, `--azul`, etc.).
- **Database:** MongoDB (`usuarios`, `registros`). Sessions via signed HMAC cookie; scrypt
  password/access-code hashing.
- **Storage:** Cloudflare R2 (evidence photos) via the AWS S3 SDK.
- **Documents:** pdf-lib, docxtemplater, exceljs.
- **Email:** Resend.
- **AI:** UsePod (OpenAI-compatible).
- **Blockchain:** ethers v6, Solidity `^0.8.20`, Ethereum Sepolia.

## Project structure

```
app/
  page.tsx                     Landing
  login/                       Login (email + access code)
  consentimiento/              First-login legal acceptance
  legal/[doc]/                 Terms / Privacy / IP
  dashboard/                   Establishment panel
  registro/                    MSE-FO-28 form
  verificacion/                MSE-FO-55 form (+ Cynthia)
  documentos/                  MSE-FO-29 / MSE-FO-32 letters
  consultor/                   Consultant panel, review, user management
  api/                         Route handlers (registro, verificacion, cartas,
                               calculadora, cynthia, consultor/*, legal, auth, ...)
lib/                           auth, mongodb, r2, email, blockchain, legal, *Pdf, *Xlsx, *Docx
contracts/                     SelloRegistry.sol + compiled SelloRegistry.json
scripts/                       compile-sello.mjs, deploy-sello.mjs
templates/                     Official PDF/DOCX/XLSX templates
```

## Environment variables

Create `.env.local` (git-ignored). All of these must also be set in Vercel
(**Project → Settings → Environment Variables**, for Production, Preview and Development).

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB` | Database name (e.g. `sello_turismo`) |
| `AUTH_SECRET` | Secret used to sign session cookies |
| `R2_ENDPOINT` | Cloudflare R2 S3 endpoint |
| `R2_BUCKET` | R2 bucket name |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `POD_API_KEY` | UsePod token (used in the proxy URL) |
| `POD_MODEL` | Model id (e.g. `gpt-4o-mini`) |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | From address on a verified domain |
| `APP_URL` | Public site URL, used in email buttons (e.g. `https://www.directivanegocios.com`) |
| `SEPOLIA_RPC_URL` | Sepolia RPC endpoint |
| `RELAYER_PRIVATE_KEY` | Private key of the gas-sponsoring relayer wallet |
| `SELLO_CONTRACT_ADDRESS` | Deployed `SelloRegistry` address |

Also set MongoDB Atlas **Network Access** to allow Vercel (e.g. `0.0.0.0/0`).

> Security: never commit `.env.local`. Rotate any credentials that were shared in plaintext
> before going to production.

## Local development

```bash
npm install
# create .env.local with the variables above
npm run dev            # http://localhost:3000 (or the configured port)
npx tsc --noEmit       # type-check
```

## Deploying the smart contract

```bash
# needs SEPOLIA_RPC_URL and RELAYER_PRIVATE_KEY in the environment,
# and the relayer wallet funded with Sepolia ETH (from a faucet)
node scripts/compile-sello.mjs      # -> contracts/SelloRegistry.json
node scripts/deploy-sello.mjs       # prints the contract address
# copy the address into SELLO_CONTRACT_ADDRESS (.env.local + Vercel)
```

## Deploying to Vercel

1. Push to the connected GitHub repo.
2. Add every variable from [Environment variables](#environment-variables).
3. Redeploy so the new variables take effect.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `node scripts/compile-sello.mjs` | Compile the Solidity contract |
| `node scripts/deploy-sello.mjs` | Deploy `SelloRegistry` to Sepolia |

---

© 2026 Segmentos Especializados · Secretaría de Turismo de México. A project by Directiva.
