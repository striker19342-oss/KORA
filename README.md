# KORA — Private Auction Exchange

KORA is an Afrofuturist, bidder-first sealed-bid auction experience for Midnight. It keeps bid values and witnesses local while publishing only a rule outcome, replay-protection nullifier, and real finalized receipt.

## Run
`npm install && npm run dev` • `npm test` • `npm run lint` • `npm run build`

Backend: `uv venv .venv --python 3.11 && uv pip install --python .venv/Scripts/python.exe -r backend/requirements.txt`, then `uvicorn app.main:app --app-dir backend --reload`. Run tests with `PYTHONPATH=backend .venv/Scripts/python.exe -m pytest backend/tests`.

## Privacy and services
The frontend discovers UUID-keyed providers in `window.midnight`, prefers 1AM, and resets the session on Preview/Preprod changes. Gemini receives only redacted public auction policy text and returns a validated proof-plan fallback. Neon normal traffic uses `DATABASE_URL` (pooled); Alembic migrations use `DATABASE_URL_UNPOOLED` (direct). Never place a witness, secret, bid, or document in the database.

The auction console connects through 1AM's DApp Connector v4 on the selected network. Each connected wallet can deploy its own auction from the browser. The app stores the returned contract address and deployment transaction hash in local storage, scoped to the wallet address and network. Deployment records stay in that browser profile and are not synced between devices.

Contract deployment requires generated Compact browser artifacts to be bundled with the frontend and to expose `window.koraCompact.deployAuctionContract({ network, walletAddress, wallet })`. That function must use the generated contract and the connected wallet to deploy on Midnight, then return `{ contractAddress, transactionHash }` from the real deployment receipt. The UI rejects missing or incomplete receipts; it does not generate placeholder addresses or hashes. Until the generated contract binding is built into the frontend, the deploy action reports that setup is incomplete.

## Deploy: Netlify frontend + Render API
Deploy the Vite frontend as a Netlify site from the repository root. `netlify.toml` builds `dist`, supplies SPA fallback routing, and applies static-site security headers. It deliberately has no serverless API route.

Deploy the FastAPI service as a Render web service from the same repository using the included `render.yaml`. The Blueprint builds `backend/Dockerfile`, exposes `/health` as the health check, and lets Render assign `PORT`. After Render first deploys, copy its public URL, for example `https://kora-api.onrender.com`.

In **Netlify**, set only `VITE_API_BASE_URL=https://kora-api.onrender.com` (the exact Render URL, no trailing slash). It is bundled into the browser build, so redeploy Netlify after changing it. Never put database or Gemini secrets in Netlify, or use a `VITE_` prefix for a secret.

In **Render**, set `DATABASE_URL` (pooled Neon URL), `DATABASE_URL_UNPOOLED` (direct Neon URL for migrations), `GEMINI_API_KEY` (optional), `GEMINI_MODEL` (optional, defaults to `gemini-2.5-flash`), and `CORS_ORIGINS=https://YOUR-NETLIFY-SITE.netlify.app`. Include `http://localhost:5173` in `CORS_ORIGINS` while developing locally. Never use `*` for CORS.

Before enabling receipts and metrics, apply the Alembic migration with `DATABASE_URL_UNPOOLED`; migrations require Neon's direct, non-pooler connection. Verify the Render service at `https://YOUR-RENDER-SERVICE.onrender.com/health`, then verify the Netlify site’s `/auction` route and the proof-plan interaction.

Create Neon `production` and `development` branches, use the pooled URL for Render API traffic and `DATABASE_URL_UNPOOLED` for Alembic. `docker compose up --build` runs the API; add `--profile proof` after replacing the proof-server scaffold with the official network image and generated Compact artifacts.

## Privacy boundary
Gemini is invoked only when `GEMINI_API_KEY` is set and receives redacted public requirement text. The database persists only transaction IDs, proof outcome, scope, and aggregate counts. No bid amount, witness, secret, identity, or raw credential is accepted by the receipt schema. KORA does not simulate success. See `docs/` for the product, privacy model, and demo.
