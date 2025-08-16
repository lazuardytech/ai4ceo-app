# Billing & Subscriptions (Xendit)

This app supports a simple subscription via Xendit invoices.

## Environment
- `XENDIT_SECRET_KEY`: Xendit secret API key (Basic Auth).
- `XENDIT_CALLBACK_TOKEN`: Secret token to verify webhooks (`X-Callback-Token`).
- `APP_BASE_URL`: Public base URL used for redirect URLs.

## Endpoints
- `POST /api/billing/subscribe` → returns `{ invoice_url, external_id, subscriptionId }`.
- `POST /api/billing/webhook` → Xendit invoice callback (server-to-server).

## Subscribe (cURL)
```
curl -X POST \
  -H "Content-Type: application/json" \
  -b "<paste your session cookie>" \
  -d '{"planId":"premium_monthly"}' \
  http://localhost:3000/api/billing/subscribe
```
Response contains `invoice_url`; redirect your browser to it to pay.

## Webhook (cURL test)
```
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Callback-Token: $XENDIT_CALLBACK_TOKEN" \
  -d '{
    "id": "inv_test_123",
    "external_id": "sub_abc-123",
    "status": "PAID"
  }' \
  http://localhost:3000/api/billing/webhook
```
Accepted statuses: `PAID|SETTLED` (activates), `EXPIRED|CANCELED` (expires).

## UI
- Billing page: `/billing` – shows current status and a Subscribe button.
- Redirects: `/billing/success` and `/billing/failed`.

## Notes
- Plans are defined in `app/(chat)/api/billing/subscribe/route.ts`.
- Active status is computed from the database (`Subscription` table`).
