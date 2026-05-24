# XP Management System — Integration Guide

**Version:** 1.0  
**Audience:** Third-party developers integrating with the Zynk Play platform  
**Base path:** `/api/v1/xp/`

---

## Table of contents

1. [Overview](#1-overview)
2. [Partner documentation portal (password protected)](#2-partner-documentation-portal-password-protected)
3. [Authentication](#3-authentication)
4. [Response envelope](#4-response-envelope)
5. [Core concepts](#5-core-concepts)
6. [Integration flow (start to end)](#6-integration-flow-start-to-end)
7. [API reference with cURL](#7-api-reference-with-curl)
8. [Event catalog](#8-event-catalog)
9. [Rule engine behavior](#9-rule-engine-behavior)
10. [XP tiers and multipliers](#10-xp-tiers-and-multipliers)
11. [Idempotency and error codes](#11-idempotency-and-error-codes)
12. [Staff / admin endpoints](#12-staff--admin-endpoints)
13. [Sandbox testing](#13-sandbox-testing)
14. [Production checklist](#14-production-checklist)

---

## 1. Overview

The XP Management module is a centralized reward engine. **All XP credits and debits must go through the event pipeline** — there is no supported API to set a user balance directly.

| Pillar | Category | Examples |
|--------|----------|----------|
| Watch | `watch` | Stream milestones, VOD complete |
| Pay | `pay` | Subscriptions, top-ups, gifts |
| Win | `win` | Match wins, tournaments, challenges |
| Share | `share` | Clips to social platforms |
| Platform | `platform` | Daily login, referrals, profile |

**Primary integration endpoint:** `POST /api/v1/xp/trigger-event`

---

## 2. Partner documentation portal (password protected)

An interactive documentation site is available for partners to explore rules, copy cURL commands, and test APIs in a browser.

| Item | Value |
|------|--------|
| **URL** | `{SITE_URL}/xp/integration/` |
| **Example (local)** | `http://localhost:8000/xp/integration/` |
| **Access** | Username + password (not public; credentials issued separately) |
| **Env vars** | `XP_DOCS_USERNAME`, `XP_DOCS_PASSWORD`, `XP_DOCS_ENABLED` |

The portal is **disabled** until `XP_DOCS_PASSWORD` is set in the server environment. Unauthenticated users cannot view rules or the API playground.

**What partners get from you:**

1. Portal URL (e.g. `https://api.yourplatform.com/xp/integration/`)
2. Portal username (`XP_DOCS_USERNAME`, default `xp-integration`)
3. Portal password (`XP_DOCS_PASSWORD`)
4. This document (`docs/XP_MANAGEMENT_INTEGRATION.md`)
5. Production API base URL and auth flow for real JWTs

---

## 3. Authentication

### 3.1 XP APIs (required)

Every `/api/v1/xp/*` request requires a platform JWT:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Tokens are issued after OTP verification via the entertainment platform auth API.

### 3.2 Obtain JWT (production)

```bash
# Step 1 — Request OTP
curl -s -X POST "$BASE/api/v1/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+93700123456"}'

# Step 2 — Verify OTP (user receives SMS code)
curl -s -X POST "$BASE/api/v1/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+93700123456", "otp_code": "123456"}'
```

Response includes `access` (use as Bearer token) and `user.id` (UUID for `user_id` fields).

### 3.3 Sandbox JWT (development only)

```bash
curl -s -X POST "$BASE/api/v1/mock/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+93700123456", "otp_code": "123456"}'
```

Mock auth accepts **any phone** when `otp_code` is exactly `123456`.

### 3.4 Authorization rules

| Action | Who can call |
|--------|----------------|
| `trigger-event`, `balance`, `transactions`, `redeem` | Authenticated user for **own** `user_id` |
| Same endpoints with another user's `user_id` | `role=staff` only |
| `POST /rules`, `PATCH/DELETE /rules/:id`, `admin/reverse` | `role=staff` only |

---

## 4. Response envelope

### Success

```json
{
  "success": true,
  "data": { },
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-05-21T12:00:00Z"
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "XP_DAILY_CAP_REACHED",
    "message": "Daily cap reached for this event",
    "details": { "daily_cap_xp": 200, "earned_today": 200 }
  },
  "meta": { "requestId": "...", "timestamp": "..." }
}
```

Optional header: `X-Request-Id` — echoed in `meta.requestId` when provided.

---

## 5. Core concepts

### 5.1 Data model

```
xp_events          → Registry of event_code values (must exist & be active)
xp_rules           → How much XP, caps, cooldown, formula, expiry
user_xp_wallet     → One row per user (available_xp, tiers, totals)
xp_transactions    → Immutable ledger (never delete; reverse instead)
```

### 5.2 Pipeline (mandatory)

```
Client                    XP API                 Rule engine              DB
  |                         |                        |                    |
  |-- POST trigger-event -->|                        |                    |
  |                         |-- validate event ---->|                    |
  |                         |-- idempotency check -->|                    |
  |                         |-- caps / cooldown --->|                    |
  |                         |-- compute XP -------->|                    |
  |                         |-- write txn + wallet -------------------->|
  |<-- 200 + xp_awarded ----|                        |                    |
```

**Do not** write to `user_xp_wallet` or `xp_transactions` outside this API.

### 5.3 Idempotency

Every `trigger-event` and `redeem` call **must** include a unique `idempotency_key` per logical action (e.g. `match-{matchId}-user-{userId}`).

If the same key is sent again, the API returns **HTTP 200** with the **original** transaction result (`XP_DUPLICATE_REQUEST` semantics in `data`).

---

## 6. Integration flow (start to end)

### Step 0 — Platform setup (once)

```bash
python manage.py migrate
python manage.py seed_xp_events
```

### Step 1 — User authenticates on your app

Your app uses platform OTP/JWT. Store `access` token and `user.id`.

### Step 2 — User performs an action

Examples: finishes a match, watches 5 minutes, completes purchase.

### Step 3 — Your backend calls trigger-event

```bash
curl -s -X POST "$BASE/api/v1/xp/trigger-event" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_code": "WIN_MATCH_CASUAL",
    "user_id": "'"$USER_ID"'",
    "idempotency_key": "match-abc123-user-'"$USER_ID"'",
    "occurred_at": "2026-05-21T14:30:00Z",
    "source_metadata": {
      "match_id": "abc123",
      "game_mode": "casual",
      "score": { "user": 21, "opponent": 18 }
    },
    "unit_count": 1
  }'
```

### Step 4 — Show updated balance (optional)

```bash
curl -s "$BASE/api/v1/xp/balance?user_id=$USER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Step 5 — Handle errors

- `429` + `XP_DAILY_CAP_REACHED` → stop awarding for that event today  
- `429` + `XP_COOLDOWN_ACTIVE` → retry after `details.seconds_remaining`  
- `200` duplicate idempotency → safe retry; use returned data  

---

## 7. API reference with cURL

Set variables:

```bash
export BASE="https://your-api.example.com"
export TOKEN="<access_jwt>"
export USER_ID="<user-uuid>"
```

### 7.1 POST `/api/v1/xp/trigger-event`

Award XP (only way to credit).

**Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_code` | string | yes | Registered code, e.g. `WIN_MATCH_RANKED` |
| `user_id` | UUID | yes | Platform user |
| `idempotency_key` | string | yes | Unique per logical event |
| `occurred_at` | ISO8601 | yes | When the action happened |
| `source_metadata` | object | no | Context (match_id, amount, etc.) |
| `unit_count` | int | no | Default 1; used for `per_unit` formulas |

```bash
curl -s -X POST "$BASE/api/v1/xp/trigger-event" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_code": "WIN_MATCH_RANKED",
    "user_id": "'"$USER_ID"'",
    "idempotency_key": "ranked-win-20260521-001",
    "occurred_at": "2026-05-21T14:30:00Z",
    "source_metadata": { "match_id": "m-001", "game_mode": "ranked" },
    "unit_count": 1
  }'
```

**Success `data`:**

```json
{
  "transaction_id": "uuid",
  "xp_awarded": 150,
  "base_xp": 100,
  "multiplier": 1.5,
  "new_balance": 4350,
  "expires_at": "2026-08-21T14:30:00Z",
  "tier_updated": false,
  "current_tier": "SILVER"
}
```

---

### 7.2 GET `/api/v1/xp/balance`

```bash
curl -s "$BASE/api/v1/xp/balance?user_id=$USER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Success `data`:**

```json
{
  "user_id": "uuid",
  "available_xp": 4350,
  "total_xp_earned": 12500,
  "redeemed_xp": 6000,
  "expired_xp": 2150,
  "current_tier": "SILVER",
  "next_tier": "GOLD",
  "xp_to_next_tier": 2650,
  "expiring_soon": [
    { "xp_amount": 500, "expires_at": "2026-06-01T00:00:00Z" }
  ]
}
```

---

### 7.3 GET `/api/v1/xp/transactions`

```bash
curl -s "$BASE/api/v1/xp/transactions?user_id=$USER_ID&per_page=20&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

**Query parameters:**

| Param | Description |
|-------|-------------|
| `user_id` | Required |
| `page`, `per_page` | Pagination (max 100) |
| `transaction_type` | `credit`, `debit`, `expire`, `bonus`, `reversal` |
| `category` | `watch`, `pay`, `win`, `share`, `platform` |
| `from_date`, `to_date` | ISO8601 filters |

---

### 7.4 POST `/api/v1/xp/redeem`

Spend XP against a catalog item.

```bash
curl -s -X POST "$BASE/api/v1/xp/redeem" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'"$USER_ID"'",
    "redemption_item_id": "<catalog-uuid>",
    "xp_cost": 1000,
    "idempotency_key": "redeem-'"$USER_ID"'-item-001"
  }'
```

---

### 7.5 GET `/api/v1/xp/rules`

```bash
# All rules
curl -s "$BASE/api/v1/xp/rules" -H "Authorization: Bearer $TOKEN"

# Filter by category
curl -s "$BASE/api/v1/xp/rules?category=win&is_active=true" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 7.6 GET `/api/v1/xp/leaderboard`

```bash
curl -s "$BASE/api/v1/xp/leaderboard?period=weekly&category=win&limit=50" \
  -H "Authorization: Bearer $TOKEN"

# Include caller rank even if outside top N
curl -s "$BASE/api/v1/xp/leaderboard?period=all_time&user_id=$USER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

| `period` | Values |
|----------|--------|
| | `daily`, `weekly`, `monthly`, `all_time` |

---

### 7.7 POST `/api/v1/xp/admin/reverse` (staff only)

```bash
curl -s -X POST "$BASE/api/v1/xp/admin/reverse" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "<original-txn-uuid>",
    "reason": "FRAUD",
    "admin_note": "Bot activity detected on match m-001"
  }'
```

`reason`: `FRAUD` | `DUPLICATE` | `SYSTEM_ERROR` | `ADMIN_CORRECTION`

---

## 8. Event catalog

Seeded by `python manage.py seed_xp_events`. Sample codes:

### Watch

| event_code | Base XP | Daily cap | Cooldown |
|------------|---------|-----------|----------|
| `WATCH_STREAM_5MIN` | 25 | 200 | 5 min |
| `WATCH_STREAM_15MIN` | 75 | 300 | 15 min |
| `WATCH_STREAM_30MIN` | 150 | 450 | 30 min |
| `WATCH_STREAM_60MIN` | 300 | 600 | 60 min |
| `WATCH_VOD_COMPLETE` | 50 | 500 | — |
| `WATCH_FIRST_STREAM_DAY` | 50 | 50 | 24 h |

### Pay

| event_code | Notes |
|------------|-------|
| `PAY_TOPUP` | `per_unit` — metadata should include amount |
| `PAY_SUBSCRIPTION_MONTHLY` | 500 XP, once per lifetime rule |
| `PAY_FIRST_PURCHASE` | 1000 XP one-time |

### Win

| event_code | Base XP |
|------------|---------|
| `WIN_MATCH_CASUAL` | 50 |
| `WIN_MATCH_RANKED` | 100 |
| `WIN_TOURNAMENT_CHAMPION` | 2000 |
| `WIN_FIRST_MATCH` | 200 (lifetime 1) |

### Share

| event_code | Base XP | Notes |
|------------|---------|-------|
| `SHARE_CLIP_TWITTER` | 75 | `requires_verification` |
| `SHARE_CLIP_YOUTUBE` | 150 | |

### Platform

| event_code | Base XP |
|------------|---------|
| `LOGIN_DAILY` | 100 |
| `LOGIN_STREAK_7D` | 500 |
| `PROFILE_COMPLETE` | 250 (lifetime 1) |

Full interactive list: partner portal → **Rules catalog** tab.

---

## 9. Rule engine behavior

### Resolution order

1. Load active `xp_events` row for `event_code`
2. Pick active `xp_rules` (respect `valid_from` / `valid_until`)
3. Reject if idempotency key already confirmed → return original
4. Check `max_per_lifetime`, `daily_cap_xp`, `cooldown_seconds`
5. Compute base XP from formula type
6. Apply tier multiplier from wallet
7. Optional `source_metadata.campaign_multiplier`
8. Insert `xp_transactions` + update `user_xp_wallet` atomically

### Formula types

| Type | Usage |
|------|--------|
| `flat` | Fixed `base_xp` each trigger |
| `per_unit` | `base_xp` or `rate` × `unit_count` |
| `percentage` | % of `source_metadata.amount` |
| `tiered` | Tier bands in `xp_formula_param.tiers` |

### Pay example with amount

```json
{
  "event_code": "PAY_TOPUP",
  "source_metadata": { "amount": 500, "currency": "INR" },
  "unit_count": 50
}
```

---

## 10. XP tiers and multipliers

Based on **lifetime** `total_xp_earned` (never decreases):

| Tier | XP range | Multiplier |
|------|----------|------------|
| BRONZE | 0 – 4,999 | 1.0× |
| SILVER | 5,000 – 14,999 | 1.25× |
| GOLD | 15,000 – 49,999 | 1.5× |
| PLATINUM | 50,000 – 149,999 | 1.75× |
| DIAMOND | 150,000+ | 2.0× |

Credits may have `expires_at` from rule `expiry_days`. A background job processes expiry every 15 minutes.

---

## 11. Idempotency and error codes

| Code | HTTP | When |
|------|------|------|
| `XP_EVENT_NOT_FOUND` | 404 | Unknown/inactive `event_code` |
| `XP_RULE_NOT_FOUND` | 404 | No active rule |
| `XP_DAILY_CAP_REACHED` | 429 | Daily cap hit |
| `XP_COOLDOWN_ACTIVE` | 429 | Cooldown not elapsed |
| `XP_LIFETIME_CAP_REACHED` | 429 | One-time already claimed |
| `XP_DUPLICATE_REQUEST` | 200 | Same idempotency key |
| `XP_INSUFFICIENT_BALANCE` | 400 | Redeem over balance |
| `XP_FORBIDDEN` | 403 | Wrong user / not staff |
| `XP_VALIDATION_ERROR` | 400 | Bad JSON/fields |

---

## 12. Staff / admin endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/xp/rules` | Create rule |
| PATCH | `/api/v1/xp/rules/:id` | Update rule |
| DELETE | `/api/v1/xp/rules/:id` | Soft-delete if has history |
| POST | `/api/v1/xp/admin/reverse` | Reverse fraudulent credit |

---

## 13. Sandbox testing

1. Start API: `python manage.py runserver`
2. Set in `.env`: `XP_DOCS_PASSWORD`, `SITE_URL=http://localhost:8000`
3. Open `http://localhost:8000/xp/integration/` → login
4. Portal → **API authentication** → Get JWT (mock OTP `123456`)
5. Portal → **API playground** → trigger `WIN_MATCH_CASUAL`
6. Confirm balance increases

---

## 14. Production checklist

- [ ] `XP_DOCS_PASSWORD` set to a strong unique password  
- [ ] Share portal URL + credentials only with integration partners  
- [ ] `SITE_URL` matches public API hostname  
- [ ] `seed_xp_events` run on deploy  
- [ ] Celery beat running for `process_xp_expiry`  
- [ ] Integrators use server-side `trigger-event` (never trust client-only XP claims)  
- [ ] Idempotency keys include stable business IDs (match_id, order_id)  
- [ ] OpenAPI schema available at `/api/schema/` if drf-spectacular enabled  

---

## Support

- **Interactive docs:** `{SITE_URL}/xp/integration/` (password required)  
- **Repository doc:** `docs/XP_MANAGEMENT_INTEGRATION.md`  
- **OpenAPI:** XP endpoints documented via `drf-spectacular` on the running server  
