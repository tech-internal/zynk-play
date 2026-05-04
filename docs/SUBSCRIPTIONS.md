# Subscriptions (AFN) — model, APIs, and frontend

This document describes the end-to-end subscription system: catalog plans, purchases tied to the user’s mobile account, entitlements for games vs streaming, and how the React app enforces access.

## Concepts

- **Account identity**: Users authenticate with OTP; the canonical identifier is `phone_number` on `User`. Each `UserSubscription` stores `purchase_phone_number` at purchase time for audit and receipts.
- **Billing periods** (default catalog, AFN):
  - **Daily pass**: 10 AFN, 24 hours
  - **Weekly**: 59 AFN, 7 days
  - **Season**: ~230 AFN, 90 days (2160 hours)
- **Entitlements** (what the pass unlocks):
  - `game_only` — games API and dashboard play
  - `streaming_only` — paid stream access (`POST /streams/{id}/access` without consuming the one-time trial when a paid sub exists)
  - `game_and_streaming` — both

Multiple overlapping subscriptions are allowed; effective access is the **union** of active entitlements.

## Data model (Django)

| Model | Purpose |
|--------|---------|
| `SubscriptionPlan` | Catalog row: `billing_period`, `entitlement_type`, `duration_hours`, `price_afn`, `status`, etc. |
| `UserSubscription` | Purchased pass: FK `plan`, snapshot fields (`entitlement_type`, `billing_period`, `price_paid_afn`, `plan_name_snapshot`, `purchase_phone_number`), `start_at` / `end_at`, `status`. |
| `Transaction` | Checkout row: `plan` FK, `transaction_ref`, `amount`, `status`; links to `UserSubscription` after success. |

Staff operators can set `User.role = 'staff'` (Django admin on `users`) to call plan management APIs.

## Seeding default plans

From the project root with the virtual environment active:

```powershell
.\venv\Scripts\activate
python manage.py seed_subscription_plans
```

This creates or updates **nine** active plans (3 periods × 3 entitlements).

## API summary

Public:

- `GET /api/v1/subscriptions/plans` — optional query `billing_period`, `entitlement_type`

Authenticated user:

- `GET /api/v1/subscriptions/status` — `has_game_entitlement`, `has_streaming_entitlement`, `active_subscriptions[]`
- `GET /api/v1/subscriptions/me` — full subscription history
- `PATCH /api/v1/subscriptions/me/{id}` — body `{ "status": "cancelled" }` (self-service)
- `POST /api/v1/subscriptions/purchase` — body `{ "plan_id": "<uuid>" }` → pending `Transaction`
- `POST /api/v1/payments/demo-confirm` — body `{ "transaction_ref": "..." }` — **only when `DEBUG=True`**; marks paid and creates `UserSubscription`
- `GET /api/v1/payments/history`

Staff (`role=staff`):

- `GET|POST /api/v1/subscriptions/plans/manage` — list all plans / create
- `PATCH /api/v1/subscriptions/plans/manage/{plan_id}` — update catalog

Games (require game entitlement):

- `GET /api/v1/games`, `GET /api/v1/games/{id}`, `POST /api/v1/games/{id}/launch` — 403 with `code: NEED_GAME_SUBSCRIPTION` if no `game_only` or `game_and_streaming` active sub.

Streaming:

- `POST /api/v1/streams/{id}/access` — paid session if an active sub includes streaming; else one-off **trial** if still available.

Payments webhook:

- `POST /api/v1/payments/webhook` — when `PAYMENT_WEBHOOK_SECRET` is unset and `DEBUG=True`, signature validation is skipped for local testing. Uses `transaction.plan` to create the subscription.

## JWT and the platform `User`

JWTs are minted with claim `user_id` = platform `User` UUID. `PlatformUserJWTAuthentication` resolves `request.user` to `entertainment_platform.User` (not `django.contrib.auth.User`). Mock login (`POST /api/v1/mock/auth/verify-otp` with `123456`) returns `access`, `refresh`, and `user` like production `verify-otp`.

## Frontend

- `REACT_APP_API_URL` (default `http://127.0.0.1:8000`) — API base.
- After login, `sessionStorage` holds `access_token` (required for protected routes).
- **Profile** (`/profile`): view entitlements, pick a plan, run purchase + demo confirm in DEBUG.
- **Dashboard**: loads `GET /subscriptions/status`; if `has_game_entitlement` is false, the game iframe stays blank and a **Subscription required** overlay blocks play until the user subscribes from Profile.

## Production notes

- Disable `payments/demo-confirm` usage (it already returns 403 when `DEBUG=False`).
- Configure `PAYMENT_WEBHOOK_SECRET` and provider signing for `/payments/webhook`.
- Integrate a real PSP: keep `Transaction` as source of truth and activate subscriptions only after provider success.
