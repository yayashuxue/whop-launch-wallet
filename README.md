# Launch Wallet

Launch Wallet is a Whop Wallet MVP for internet entrepreneurs launching a new offer.

It turns Whop Wallet into a lightweight launch treasury:

1. Create a launch wallet/account.
2. Request a crypto deposit address for launch float.
3. Issue a virtual vendor card with a KPI guardrail.
4. Track Whop checkout revenue.
5. Sweep surplus profit into cbBTC while keeping a reserve.

The product is intentionally not another trading bot. The business wedge is spend and profit control for Whop sellers who already make money on the internet and need launch-specific treasury rails.

## Why this should exist

Whop sellers spend money before revenue clears: ads, AI tools, editors, Discord mods, fulfillment, and short experiments. Today that spend usually lives on personal cards and disconnected spreadsheets.

Launch Wallet gives each launch its own money system:

- one account per launch
- virtual cards per workstream
- KPI copy tied to each card
- ledger of deposits, sales, and profit sweeps
- server-side Whop API trace for trust and debugging

## Business model

Initial ICP: Whop sellers running paid communities, courses, signals, AI products, or service offers.

Monetization path:

- free treasury dashboard for every Whop seller
- $29/mo for higher card limits, approvals, and launch history
- 1% of managed virtual-card spend for power sellers
- future take-rate on swaps / profit automation where allowed

Key metric: net revenue retained per launch, combining card spend, deposits, sales captured, and profit swept without leaving Whop.

## Whop API surface

The sample bot proved the core flow:

- `POST /accounts`
- `POST /deposits`
- `GET /accounts/:id`
- `POST /swaps/quote`
- `POST /swaps`
- `GET /swaps/:id`

Launch Wallet uses the same server-side pattern: the API key is only read inside Next.js route handlers.

The virtual-card endpoint is represented as `POST /cards` because the prompt states that Whop Wallet can spawn virtual Visa cards, but the public sample repo does not include a concrete card endpoint. In demo mode, this call records a guarded API trace instead of failing the user journey. With a real `WHOP_API_KEY` and eligible Whop Wallet business account, the route handler is the integration point for the exact card endpoint shape.

KYC/KYB assumption: real bank/card deposits and virtual Visa issuance should depend on Whop's upstream business eligibility/compliance state. The MVP is built for already-eligible Whop sellers and does not pretend to bypass verification.

## Local development

This project uses Next.js 16, which requires Node >=20.9.

```bash
pnpm install
pnpm dev
```

On this machine the default Node is 18, so verification used:

```bash
npx -y node@22 node_modules/next/dist/bin/next dev -p 3017
npx -y node@22 node_modules/next/dist/bin/next build
```

Optional env:

```bash
WHOP_API_KEY=...
WHOP_API_BASE=https://api.whop.com/api/v1
```

Without `WHOP_API_KEY`, the app runs in demo-safe mode and records each intended Whop call in the API trace.

On Julie's laptop, the default `/usr/local/bin/node` is v18 and will fail with Next 16. Use the local nvm Node:

```bash
PATH=/Users/jingyushi/.local/share/nvm/v23.11.0/bin:$PATH node_modules/next/dist/bin/next dev -p 3017
```

## Verification

Completed locally:

- Production build passes with Node 22.
- API flow passes in demo-safe mode:
  - create wallet
  - request deposit
  - issue card
  - record sale
  - sweep profit
- Desktop and mobile screenshots captured:
  - `smoke-desktop.png`
  - `smoke-mobile.png`

## Demo script

Open the app and click through the orange flow:

1. Create launch wallet.
2. Fund with USDC.
3. Issue spend card.
4. Record first sales.
5. Sweep profit.

The pitch: every internet entrepreneur on Whop needs a launch treasury. Whop Wallet has the primitives; Launch Wallet turns them into a product.
