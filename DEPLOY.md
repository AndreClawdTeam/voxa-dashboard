# DEPLOY.md — voxa-dashboard

## Stack

- **Framework**: Next.js 15 (App Router, Server Actions, Server Components)
- **Hosting**: Vercel (auto-deploy on push to `main`)
- **API**: voxa-api on `http://138.197.19.184:3000` (VPS — HTTP, port 3000)

---

## Environment Variables (Vercel)

Set these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Value | Required |
|---|---|---|
| `NEXT_PUBLIC_VOXA_API_URL` | `http://138.197.19.184:3000` | ✅ Yes |
| `NEXT_PUBLIC_APP_URL` | `https://voxa-dashboard.vercel.app` | Recommended |

> **Note:** `NEXT_PUBLIC_*` prefix exposes the variable to the browser bundle. However,
> all API calls in this project are made **server-side** (Server Actions / Server Components),
> so the value is never sent to the client unless explicitly used in a client component.

---

## Deploying

### Automatic (recommended)

Push or merge to `main` — Vercel deploys automatically.

### Manual

```bash
# From the project root
vercel --prod
```

---

## Architecture: Server-side vs Client-side Requests

This dashboard makes **all API calls server-side** (via Server Actions and Server Components).
This means:

- ✅ **No CORS issues for API calls** — requests go from Vercel's servers to voxa-api, not from the browser
- ✅ **No mixed content warnings** — Vercel (HTTPS) calls the API (HTTP) server-to-server
- ✅ **Tokens are never exposed to the browser** — cookies are HttpOnly

**Important**: Never add `fetch()` calls to the voxa-api from **Client Components** (`'use client'`).
Client-side requests would:
1. Trigger CORS (the browser enforces it, the server-to-server doesn't)
2. Expose the API URL and potentially tokens to the browser
3. Fail on mixed content (HTTPS page → HTTP API) in some browsers

---

## CORS Configuration

Since all API calls are server-side, CORS is not strictly required for the dashboard to work.
However, the voxa-api must allow the Vercel domain as a precaution and for any future
client-side requests.

**Make sure `https://voxa-dashboard.vercel.app` is in `ALLOWED_ORIGINS` in voxa-api's `.env`:**

```env
ALLOWED_ORIGINS=http://138.197.19.184:3001,http://138.197.19.184:3002,http://localhost:3001,https://voxa-dashboard.vercel.app
```

After changing the `.env`, restart the API service:

```bash
sudo systemctl restart voxa-api
# Verify
curl -s http://localhost:3000/health
```

---

## API Endpoints Used

| Dashboard endpoint | API endpoint |
|---|---|
| Login | `POST /api/v1/auth/login` |
| Register | `POST /api/v1/auth/register` |
| Logout | `POST /api/v1/auth/logout` |
| Current user | `GET /api/v1/dashboard/profile` |
| Usage stats | `GET /api/v1/dashboard/usage` |
| Transcription history | `GET /api/v1/dashboard/transcriptions` |
| Profile (read/update) | `GET/PATCH /api/v1/dashboard/profile` |
| API keys | `GET/POST/DELETE /api/v1/api-keys` |
| Subscription | `GET /api/v1/subscriptions/current` |

> **Note:** `GET /api/v1/auth/me` returns only `{ userId, role }` (JWT payload).
> The dashboard uses `/api/v1/dashboard/profile` for full user info (name, email, etc).

---

## Vercel Logs

To debug API errors:
1. Go to **Vercel → Project → Functions** tab
2. Look for `console.error` entries from `[voxaFetch]`, `[loginAction]`, `[registerAction]`

Logged fields (no sensitive data):
- `endpoint` — API endpoint path
- `method` — HTTP method
- `status` — HTTP status code
- `code` — API error code
- `message` — Public error message
- `fieldErrors` / `formErrors` — Zod validation failures (schema mismatches)

---

## Common Issues

### "Resposta inesperada da API. Contate o suporte."

This error means a Zod schema validation failed — the API response shape doesn't match
what the dashboard expects. Check Vercel Function logs for `[voxaFetch] Schema validation failed`
to see which endpoint and what fields are mismatched.

### Login/Register fails silently

1. Check Vercel logs for `[loginAction]` or `[registerAction]` entries
2. Test the API directly: `curl -X POST http://138.197.19.184:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"...","password":"..."}'`
3. Verify `NEXT_PUBLIC_VOXA_API_URL` is set in Vercel env vars

### Cookies not being set

The refresh token is set as an HttpOnly cookie **by the API** (not the dashboard).
The API cookie path is `/api/v1/auth` — so it's only sent for auth routes.
If cookies disappear, check: sameSite, secure, and domain settings in voxa-api's `auth.controller.ts`.
