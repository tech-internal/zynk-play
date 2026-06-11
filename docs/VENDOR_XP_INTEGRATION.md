# Zynk Play — Vendor Integration Guide (XP Management)

**Version:** 1.0  
**Audience:** Third-party vendors integrating server-to-server with Zynk Play  
**Last updated:** June 2026

This document describes how your backend should authenticate, resolve platform users, award XP, and read wallet data. All examples use the production API base URL placeholder `{BASE_URL}` (for example `https://api.zynkplay.example.com`).

---

## Table of contents

1. [Overview](#1-overview)
2. [What you receive from Zynk Play](#2-what-you-receive-from-zynk-play)
3. [Integration flow](#3-integration-flow)
4. [Authentication](#4-authentication)
5. [Get or create user](#5-get-or-create-user)
6. [XP management overview](#6-xp-management-overview)
7. [Award XP](#7-award-xp)
8. [Get XP balance](#8-get-xp-balance)
9. [Get XP transactions](#9-get-xp-transactions)
10. [List XP rules (read-only)](#10-list-xp-rules-read-only)
11. [Response format](#11-response-format)
12. [Error codes](#12-error-codes)
13. [Idempotency](#13-idempotency)
14. [Event codes reference](#14-event-codes-reference)
15. [End-to-end example](#15-end-to-end-example)
16. [Production checklist](#16-production-checklist)

---

## 1. Overview

Zynk Play exposes a **server-to-server integration API**. Your backend:

1. Exchanges **client credentials** for a short-lived **bearer token**.
2. Resolves a **platform user** by phone number (creates the user if they do not exist yet).
3. Calls the **XP event pipeline** to award XP when the user completes an action in your product.
4. Optionally reads **balance** and **transaction history** for that user.

**Important rules:**

- XP is never set directly. You must call `POST /api/v1/xp/trigger-event` with a registered `event_code`.
- Every award request must include a unique **`idempotency_key`** so retries are safe.
- All integration calls use the same bearer token in the `Authorization` header.
- Call these APIs **from your server only**. Do not embed `client_secret` in mobile or web apps.

---

## 2. What you receive from Zynk Play

Before integration, Zynk Play provides:

| Item | Description |
|------|-------------|
| `BASE_URL` | API hostname (no trailing slash) |
| `client_id` | Integration client identifier |
| `client_secret` | Integration secret (store securely) |
| Event catalog | Which `event_code` values your integration may use |

Token lifetime defaults to **24 hours** (`expires_in` in seconds). Request a new token before expiry or when you receive `401 Unauthorized`.

---

## 3. Integration flow

```
┌─────────────┐     1. POST /auth/token          ┌──────────────┐
│ Your server │ ──────────────────────────────► │  Zynk Play   │
│             │ ◄────────────────────────────── │     API      │
└─────────────┘     access_token (bearer)       └──────────────┘
       │
       │  2. POST /users/by-phone  { phone_number }
       │ ─────────────────────────────────────────►
       │ ◄─────────────────────────────────────────
       │     user.id (UUID), user profile
       │
       │  3. POST /xp/trigger-event  { user_id, event_code, ... }
       │ ─────────────────────────────────────────►
       │ ◄─────────────────────────────────────────
       │     xp_awarded, new_balance, transaction_id
       │
       │  4. GET /xp/balance?user_id=...
       │  5. GET /xp/transactions?user_id=...
       └────────────────────────────────────────►
```

**Typical sequence per user action:**

1. Obtain or refresh bearer token (cache until near expiry).
2. When you need a `user_id`, call **get or create user by phone** once per session or cache the mapping.
3. When the user earns XP (match win, purchase, milestone, etc.), call **trigger-event**.
4. Optionally refresh UI with **balance** or show history with **transactions**.

---

## 4. Authentication

### `POST /api/v1/auth/token`

Exchange integration credentials for a bearer token.

**Auth required:** None (public endpoint; credentials are in the body).

**Request headers:**

```http
Content-Type: application/json
```

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `client_id` | string | yes | Integration client ID issued by Zynk Play |
| `client_secret` | string | yes | Integration client secret |

**Example request:**

```bash
curl -s -X POST "{BASE_URL}/api/v1/auth/token" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "your-client-id",
    "client_secret": "your-client-secret"
  }'
```

**Success response (`200 OK`):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

| Field | Description |
|-------|-------------|
| `access_token` | Use as `Authorization: Bearer <access_token>` on all subsequent calls |
| `token_type` | Always `bearer` |
| `expires_in` | Token lifetime in seconds |

**Error responses:**

| HTTP | Body | Meaning |
|------|------|---------|
| `400` | Field validation errors | Missing or invalid `client_id` / `client_secret` |
| `401` | `{"error": "Invalid client credentials"}` | Wrong credentials |
| `503` | `{"error": "Integration API credentials are not configured"}` | Server not configured for integration |

### Using the token

On every integration request after step 1:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Optional trace header (recommended):

```http
X-Request-Id: <your-unique-request-id>
```

If sent, the same value is echoed in the response `meta.requestId`.

---

## 5. Get or create user

### `POST /api/v1/users/by-phone`

Look up a platform user by mobile number. If no user exists for that number, one is created automatically.

**Auth required:** Integration bearer token.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone_number` | string | yes | E.164-style number, e.g. `+93700123456` (9–15 digits, optional leading `+`) |

**Example request:**

```bash
curl -s -X POST "{BASE_URL}/api/v1/users/by-phone" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+93700123456"}'
```

**Success response (`200 OK`):**

```json
{
  "user_created": false,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone_number": "+93700123456",
    "username": null,
    "full_name": "",
    "email": "",
    "country": "",
    "languages": "",
    "status": "active",
    "role": "user",
    "free_trial_used": false,
    "last_login_at": null,
    "has_active_subscription": false,
    "has_game_entitlement": false,
    "has_streaming_entitlement": false,
    "can_use_free_trial": true,
    "profile_complete": false,
    "created_at": "2026-06-01T10:00:00Z"
  }
}
```

| Field | Description |
|-------|-------------|
| `user_created` | `true` if a new user was created; `false` if an existing user was returned |
| `user.id` | **Platform user UUID** — use this as `user_id` in all XP APIs |
| `user.phone_number` | Normalized phone number stored on the platform |

**Error responses:**

| HTTP | Meaning |
|------|---------|
| `400` | Invalid phone number format |
| `401` | Missing, expired, or invalid bearer token |

Store `user.id` in your system keyed by phone number so you do not call this endpoint on every XP award.

---

## 6. XP management overview

### How XP works

Zynk Play maintains:

- **Events** — registered action types identified by `event_code` (e.g. `WIN_MATCH_CASUAL`).
- **Rules** — how much XP each event awards, plus caps, cooldowns, and expiry.
- **Wallet** — one balance per user (`available_xp`, tier, lifetime totals).
- **Transactions** — immutable ledger of every credit, debit, and expiry.

Your integration **only awards XP** through the event pipeline. You cannot POST a raw XP amount or edit balances directly.

### APIs covered in this guide

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/xp/trigger-event` | Award XP for a user action |
| `GET` | `/api/v1/xp/balance` | Read wallet balance and tier |
| `GET` | `/api/v1/xp/transactions` | Paginated transaction history |
| `GET` | `/api/v1/xp/rules` | Read active rules and event codes (optional) |

**Auth for all XP endpoints:** Integration bearer token (same token from section 4).

### When to call each API

| Your event | API to call |
|------------|-------------|
| User completes an action that should earn XP | `POST /api/v1/xp/trigger-event` |
| Display current XP in your app | `GET /api/v1/xp/balance` |
| Show XP history or support tickets | `GET /api/v1/xp/transactions` |
| Discover which `event_code` values and caps apply | `GET /api/v1/xp/rules` |

---

## 7. Award XP

### `POST /api/v1/xp/trigger-event`

Credit XP to a user when they complete a qualifying action. This is the **only** supported way to add XP.

**Auth required:** Integration bearer token.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_code` | string | yes | Registered event code (see [section 14](#14-event-codes-reference) or `GET /rules`) |
| `user_id` | UUID | yes | Platform user ID from `POST /users/by-phone` |
| `idempotency_key` | string | yes | Unique key per logical action (max 200 chars). See [section 13](#13-idempotency) |
| `occurred_at` | ISO 8601 datetime | yes | When the action happened in UTC, e.g. `2026-06-11T14:30:00Z` |
| `source_metadata` | object | no | Free-form context (match ID, order ID, score, amount, etc.) |
| `unit_count` | integer | no | Default `1`. Used for `per_unit` rules (e.g. top-up amount units) |

**Example — match win:**

```bash
curl -s -X POST "{BASE_URL}/api/v1/xp/trigger-event" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: match-abc123-award" \
  -d '{
    "event_code": "WIN_MATCH_CASUAL",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "idempotency_key": "vendor-match-abc123-user-550e8400",
    "occurred_at": "2026-06-11T14:30:00Z",
    "source_metadata": {
      "match_id": "abc123",
      "game_mode": "casual",
      "vendor": "your-product-name"
    },
    "unit_count": 1
  }'
```

**Example — payment-based XP (`per_unit` / amount rules):**

```json
{
  "event_code": "PAY_TOPUP",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "idempotency_key": "vendor-order-ORD-998877",
  "occurred_at": "2026-06-11T15:00:00Z",
  "source_metadata": {
    "amount": 500,
    "currency": "AFN",
    "order_id": "ORD-998877"
  },
  "unit_count": 50
}
```

**Success response (`200 OK`):**

```json
{
  "success": true,
  "data": {
    "transaction_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "xp_awarded": 50,
    "base_xp": 50,
    "multiplier": 1.0,
    "new_balance": 1250,
    "expires_at": "2026-09-11T14:30:00Z",
    "tier_updated": false,
    "current_tier": "BRONZE"
  },
  "meta": {
    "requestId": "match-abc123-award",
    "timestamp": "2026-06-11T14:30:01Z"
  }
}
```

| Field | Description |
|-------|-------------|
| `transaction_id` | Ledger entry UUID for this award |
| `xp_awarded` | XP credited after tier/campaign multipliers and daily cap trimming |
| `base_xp` | XP from the rule before multipliers |
| `multiplier` | Combined tier and campaign multiplier applied |
| `new_balance` | User `available_xp` after this credit |
| `expires_at` | When this credit expires, if the rule defines `expiry_days`; otherwise `null` |
| `tier_updated` | `true` if the user crossed into a new tier |
| `current_tier` | `BRONZE`, `SILVER`, `GOLD`, `PLATINUM`, or `DIAMOND` |

**Common error cases:** See [section 12](#12-error-codes). Notable: `429` when daily cap or cooldown is hit; `404` when `event_code` is unknown or has no active rule.

---

## 8. Get XP balance

### `GET /api/v1/xp/balance`

Read a user's wallet summary.

**Auth required:** Integration bearer token.

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | UUID | yes | Platform user ID |

**Example request:**

```bash
curl -s "{BASE_URL}/api/v1/xp/balance?user_id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Success response (`200 OK`):**

```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "available_xp": 1250,
    "total_xp_earned": 5000,
    "redeemed_xp": 0,
    "expired_xp": 0,
    "current_tier": "BRONZE",
    "next_tier": "SILVER",
    "xp_to_next_tier": 3750,
    "expiring_soon": [
      {
        "xp_amount": 50,
        "expires_at": "2026-09-11T14:30:00Z"
      }
    ]
  },
  "meta": {
    "requestId": "...",
    "timestamp": "2026-06-11T14:35:00Z"
  }
}
```

| Field | Description |
|-------|-------------|
| `available_xp` | Spendable balance |
| `total_xp_earned` | Lifetime XP earned (used for tier calculation) |
| `redeemed_xp` | Total XP spent via redemptions |
| `expired_xp` | Total XP that expired |
| `current_tier` / `next_tier` | Tier names |
| `xp_to_next_tier` | XP still needed to reach `next_tier`; `null` at max tier |
| `expiring_soon` | Credits expiring within the next 30 days |

---

## 9. Get XP transactions

### `GET /api/v1/xp/transactions`

Paginated ledger history for a user.

**Auth required:** Integration bearer token.

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | UUID | yes | Platform user ID |
| `page` | integer | no | Page number (default `1`) |
| `per_page` | integer | no | Page size (default `20`, max `100`) |
| `transaction_type` | string | no | Filter: `credit`, `debit`, `expire`, `bonus`, `reversal` |
| `category` | string | no | Filter by event category: `watch`, `pay`, `win`, `share`, `platform` |
| `from_date` | ISO datetime | no | Include transactions on or after this time |
| `to_date` | ISO datetime | no | Include transactions on or before this time |

**Example request:**

```bash
curl -s "{BASE_URL}/api/v1/xp/transactions?user_id=550e8400-e29b-41d4-a716-446655440000&per_page=20&page=1" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Success response (`200 OK`):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "idempotency_key": "vendor-match-abc123-user-550e8400",
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "event_code": "WIN_MATCH_CASUAL",
        "category": "win",
        "transaction_type": "credit",
        "xp_amount": 50,
        "base_xp": 50,
        "multiplier_applied": "1.00",
        "balance_before": 1200,
        "balance_after": 1250,
        "status": "confirmed",
        "source_metadata": {
          "match_id": "abc123",
          "game_mode": "casual",
          "vendor": "your-product-name"
        },
        "expires_at": "2026-09-11T14:30:00Z",
        "is_expired": false,
        "occurred_at": "2026-06-11T14:30:00Z",
        "created_at": "2026-06-11T14:30:01Z"
      }
    ],
    "page": 1,
    "per_page": 20,
    "total": 1
  },
  "meta": {
    "requestId": "...",
    "timestamp": "2026-06-11T14:36:00Z"
  }
}
```

---

## 10. List XP rules (read-only)

### `GET /api/v1/xp/rules`

Returns active and inactive rules so you can see which `event_code` values exist, base XP, caps, and cooldowns. **This endpoint is read-only** for vendors.

**Auth required:** Integration bearer token.

**Query parameters (optional):**

| Param | Description |
|-------|-------------|
| `category` | `watch`, `pay`, `win`, `share`, `platform` |
| `is_active` | `true` or `false` |

**Example:**

```bash
curl -s "{BASE_URL}/api/v1/xp/rules?category=win&is_active=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Success response (`200 OK`):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "event": "...",
        "event_code": "WIN_MATCH_CASUAL",
        "category": "win",
        "rule_name": "Casual match win",
        "base_xp": 50,
        "xp_formula_type": "flat",
        "xp_formula_param": {},
        "daily_cap_xp": 500,
        "global_daily_cap": null,
        "cooldown_seconds": 0,
        "max_per_lifetime": null,
        "expiry_days": 90,
        "is_active": true,
        "valid_from": null,
        "valid_until": null,
        "created_at": "...",
        "updated_at": "..."
      }
    ],
    "count": 1
  },
  "meta": { "...": "..." }
}
```

Use only `event_code` values that Zynk Play has approved for your integration.

---

## 11. Response format

XP endpoints wrap payloads in a standard envelope.

**Success:**

```json
{
  "success": true,
  "data": { },
  "meta": {
    "requestId": "uuid-or-your-header-value",
    "timestamp": "2026-06-11T12:00:00Z"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": {
    "code": "XP_DAILY_CAP_REACHED",
    "message": "Daily cap reached for this event",
    "details": { "daily_cap_xp": 500, "earned_today": 500 }
  },
  "meta": {
    "requestId": "...",
    "timestamp": "2026-06-11T12:00:00Z"
  }
}
```

Auth and user endpoints (`/auth/token`, `/users/by-phone`) use plain JSON without this envelope.

---

## 12. Error codes

| Code | HTTP | When |
|------|------|------|
| `XP_VALIDATION_ERROR` | 400 | Invalid or missing fields |
| `XP_EVENT_NOT_FOUND` | 404 | Unknown or inactive `event_code`, or user not found |
| `XP_RULE_NOT_FOUND` | 404 | No active rule for the event at `occurred_at` |
| `XP_FORBIDDEN` | 403 | Token cannot act on the given `user_id` |
| `XP_DAILY_CAP_REACHED` | 429 | User hit the daily XP cap for this rule |
| `XP_COOLDOWN_ACTIVE` | 429 | Same event triggered too soon; retry after cooldown |
| `XP_LIFETIME_CAP_REACHED` | 429 | One-time or lifetime cap already claimed |
| `XP_DUPLICATE_REQUEST` | 200 | Same `idempotency_key` already processed — response contains original award data |

**Recommended handling:**

- **`200` + duplicate** — Treat as success; do not award twice in your UI.
- **`429` daily cap / cooldown** — Do not retry immediately; inform the user or skip the award.
- **`401` on any call** — Refresh the bearer token and retry once.

---

## 13. Idempotency

Every `trigger-event` call **must** include `idempotency_key`.

**Rules:**

- One unique key per logical business event (e.g. one match, one order).
- Reusing the same key returns **HTTP 200** with the original transaction (safe retry after network failure).
- Include stable IDs in the key: `vendor-order-{orderId}`, `vendor-match-{matchId}-user-{userId}`.

**Good examples:**

```
vendor-match-abc123-user-550e8400-e29b-41d4-a716-446655440000
vendor-order-ORD-998877
vendor-daily-login-2026-06-11-user-550e8400
```

**Bad examples:**

```
random-uuid-each-retry          # retries would double-award
award-xp                        # not unique across users or events
```

---

## 14. Event codes reference

Zynk Play groups events into categories. Your integration will use a subset agreed with the platform team.

### Watch (`watch`)

| event_code | Typical use |
|------------|-------------|
| `WATCH_STREAM_5MIN` | 5 minutes of live stream |
| `WATCH_STREAM_15MIN` | 15 minutes of live stream |
| `WATCH_STREAM_30MIN` | 30 minutes of live stream |
| `WATCH_STREAM_60MIN` | 60 minutes of live stream |
| `WATCH_VOD_COMPLETE` | Finished watching VOD |
| `WATCH_FIRST_STREAM_DAY` | First stream of the day |

### Pay (`pay`)

| event_code | Typical use |
|------------|-------------|
| `PAY_TOPUP` | Wallet top-up (`source_metadata.amount`, `unit_count`) |
| `PAY_SUBSCRIPTION_MONTHLY` | Monthly subscription |
| `PAY_FIRST_PURCHASE` | First purchase (often lifetime cap of 1) |

### Win (`win`)

| event_code | Typical use |
|------------|-------------|
| `WIN_MATCH_CASUAL` | Casual match victory |
| `WIN_MATCH_RANKED` | Ranked match victory |
| `WIN_TOURNAMENT_CHAMPION` | Tournament win |
| `WIN_FIRST_MATCH` | First match win (lifetime cap) |

### Share (`share`)

| event_code | Typical use |
|------------|-------------|
| `SHARE_CLIP_TWITTER` | Shared clip to Twitter |
| `SHARE_CLIP_YOUTUBE` | Shared clip to YouTube |

### Platform (`platform`)

| event_code | Typical use |
|------------|-------------|
| `LOGIN_DAILY` | Daily login |
| `LOGIN_STREAK_7D` | 7-day login streak |
| `PROFILE_COMPLETE` | Completed profile (lifetime cap) |

Confirm the exact codes enabled for your product with Zynk Play. Live values and caps are available via `GET /api/v1/xp/rules`.

### Tier multipliers

Lifetime `total_xp_earned` determines tier; higher tiers earn more XP on each credit:

| Tier | Lifetime XP | Multiplier |
|------|-------------|------------|
| BRONZE | 0 – 4,999 | 1.0× |
| SILVER | 5,000 – 14,999 | 1.25× |
| GOLD | 15,000 – 49,999 | 1.5× |
| PLATINUM | 50,000 – 149,999 | 1.75× |
| DIAMOND | 150,000+ | 2.0× |

---

## 15. End-to-end example

Below is a complete shell script flow for one user winning a casual match.

```bash
BASE_URL="https://api.zynkplay.example.com"
PHONE="+93700123456"

# 1 — Get bearer token
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"YOUR_CLIENT_ID","client_secret":"YOUR_CLIENT_SECRET"}')
ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

# 2 — Get or create user
USER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/users/by-phone" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"phone_number\":\"$PHONE\"}")
USER_ID=$(echo "$USER_RESPONSE" | jq -r '.user.id')

# 3 — Award XP for match win
curl -s -X POST "$BASE_URL/api/v1/xp/trigger-event" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"event_code\": \"WIN_MATCH_CASUAL\",
    \"user_id\": \"$USER_ID\",
    \"idempotency_key\": \"vendor-match-demo-001-user-$USER_ID\",
    \"occurred_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"source_metadata\": {\"match_id\": \"demo-001\"}
  }"

# 4 — Read balance
curl -s "$BASE_URL/api/v1/xp/balance?user_id=$USER_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 5 — Read recent transactions
curl -s "$BASE_URL/api/v1/xp/transactions?user_id=$USER_ID&per_page=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 16. Production checklist

- [ ] Store `client_secret` only on your server (secrets manager or env vars).
- [ ] Cache `access_token` and refresh before `expires_in`.
- [ ] Map your users to `user.id` via `POST /users/by-phone` (do not call on every XP award).
- [ ] Use stable `idempotency_key` values tied to business IDs.
- [ ] Call `trigger-event` server-side when the action is verified — never trust client-only claims.
- [ ] Handle `429` caps and cooldowns without tight retry loops.
- [ ] Send `X-Request-Id` for support correlation.
- [ ] Use only `event_code` values approved for your integration.

---

## Support

For integration credentials, enabled event codes, or API issues, contact your Zynk Play integration contact.

Technical reference: OpenAPI schema at `{BASE_URL}/api/schema/` (when enabled on the deployment).
