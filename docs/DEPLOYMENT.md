# Frontend API connection

Vercel deploys `rohithakumar/scamurai`, branch `main`. The matching local
checkout is `D:\SCAMurai\vercel-frontend`.

Set `NEXT_PUBLIC_API_URL` to the HTTPS backend base URL in Vercel, and enable
`NEXT_PUBLIC_YOKAI_API_ENABLED=true`, `NEXT_PUBLIC_KAGAMI_API_ENABLED=true`,
and `NEXT_PUBLIC_DEMO_MODE=false`. Redeploy after changing build variables.

Production requests use the same-origin `/api/service` prefix. Next.js rewrites
`/api/service/health` and `/api/service/api/v1/...` to the fixed configured
backend. This includes GET, POST, cancellation requests, and screenshot URLs;
the browser does not need to contact the Render hostname directly. Responses
are marked `Cache-Control: no-store`. Development clients use the backend URL
directly. Keep backend CORS configured for any direct clients.

If a browser reports `net::ERR_BLOCKED_BY_CLIENT` for the Render hostname,
confirm the deployed frontend contains this proxy change and reload the page.
Check `/api/service/health` on the frontend domain: it should return the live
SCAMurai backend health JSON. An upstream error remains an error; no demo data
is substituted. Backend target allowlists and RPC configuration still apply.
