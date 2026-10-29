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

Production is https://genie4ai.ai. The GitHub-linked Vercel deployment passed the team-member/author preflight and serves public HTTPS. Cloudflare delegation and its Universal SSL certificate are active; the apex is proxied with Full (strict) SSL. No www alias was added. Dodo's live webhook is enabled at /api/dodo/webhook; unsigned requests return 401. A live Creator monthly checkout session was created successfully without submitting a card charge.

The user-provided replacement World Labs key was stored only in the ignored local environment and encrypted Vercel production environment. It authenticated successfully with 69,500 API credits before the launch verification generation; that request completed with four SPZ assets, panorama and collider mesh, and consumed 1,580 upstream credits. The app reserved exactly $5, leaving the temporary Creator verification account with $95 / 19 generations. No automatic refill was enabled. This verification used an internal test entitlement, not a real paid customer receipt.

Search Console domain ownership was verified through the user's Chrome session using a DNS TXT record. On 2026-10-29, https://genie4ai.ai/sitemap.xml was submitted to sc-domain:genie4ai.ai; Google reported it successfully processed and discovered five pages. The original service account remains invalid (invalid_grant/account not found), so future automated submissions through the shipweb script require a restored or replacement account with property access. The completed browser submission does not depend on that credential.
