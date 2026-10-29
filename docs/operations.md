# Operations

## Secrets

Set only on the server: `DATABASE_URL`, `DATABASE_CA_CERT_BASE64`, `WORLD_LABS_API_KEY`, `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`, `DODO_CREATOR_MONTH_PRODUCT_ID`, `DODO_CREATOR_YEAR_PRODUCT_ID`, `DODO_PRO_MONTH_PRODUCT_ID`, `DODO_PRO_YEAR_PRODUCT_ID`. Public URL: `NEXT_PUBLIC_SITE_URL=https://genie4ai.ai`. No provider/payment credentials belong in browser code. The runtime DB role is isolated to the genie4ai schema; it cannot read the reference project's schema.

## Billing

Live Dodo checkout sessions use a server allowlist and one item/quantity. Only authenticated same-origin mutations are accepted. Webhooks verify the raw payload and standard timestamped signature. The server re-fetches payment and subscription records, validates product, currency, amount, customer, checkout ownership and full paid service period. Subscription active/renewed events alone never mint credits. Receipt replay is idempotent. Refunds/disputes revoke the associated period. Paid annual periods are split into monthly windows anchored to the original UTC date; unused credit expires. User-row locks and conditional debits prevent overspending. Confirmed provider failures refund once. Unknown submission outcomes retain a reviewable job and are never auto-submitted again.

Account cancellation is scoped to the authenticated user's recorded subscription. The app does not issue a merchant-wide customer portal URL based on an unverified email address. Password recovery is not configured; the sign-up UI discloses this.

## Provider readiness

World Labs API credits are distinct from Marble app credits. Fund the API account through https://platform.worldlabs.ai/billing. New purchases and generations require at least 1,580 API credits; health is cached for at most 15 seconds. The deployment does not enable automatic upstream refills. Existing world previews and cancellation remain available during a pause.

## Support and unresolved submissions

Requests submitted at /contact are stored in genie4ai.support_requests for manual review. No email notification or response-time SLA is promised. Review open requests using a privileged local DB session. Avoid exposing the runtime database or an unauthenticated admin route.

```sql
SELECT id, user_id, category, message, created_at
FROM genie4ai.support_requests WHERE status='open' ORDER BY created_at;
SELECT id,user_id,provider_id,status,created_at
FROM genie4ai.jobs WHERE status='uncertain' OR (status='pending' AND created_at<now()-interval '15 minutes');
```

For a submission with no operation ID, inspect the upstream request history before issuing a refund or resubmitting. Never blindly repeat the generate POST. For a known operation ID, GET status is safe. Preserve billing records during account deletion where legal retention requires it; review privacy requests manually.

## Publishing

GitHub: ouo-ai/genie4ai, main. Vercel must stay linked to this repository; use REST with the project's team context and approved deploy identity. Run the shipweb deploy-identity preflight before pushes that trigger production. No Vercel CLI. Only the apex is configured. Registrar auto-renew is off; expiry is 2028-10-29. Renew manually if the domain is to be retained.

Submit the sitemap only after public HTTPS and valid XML. Current GSC credential failed OAuth with invalid_grant/account not found; a restored or replacement service account with property access is required.
