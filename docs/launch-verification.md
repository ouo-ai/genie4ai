# Launch verification — 2026-10-29

- Production: https://genie4ai.ai
- GitHub: https://github.com/ouo-ai/genie4ai, production branch main.
- Local project: /Users/danke/dankeProjects/web/agent-main/genie4ai.
- Code source: v0 Neural Link template elEH8xwTpSh, followed by user-authorized local customization after the v0 customization/resume failures. The template's black/red visual direction was retained.
- Domain purchased for US$199.98; privacy enabled, registrar auto-renew verified off; expiry 2028-10-29. Cloudflare nameservers are active. Only the apex is bound to Vercel; Cloudflare proxy and Full (strict) SSL are enabled and its Universal SSL certificate is active.
- Vercel project genie4ai is linked to ouo-ai/genie4ai. Production deployment reached READY after the approved author/team-member preflight. Public home page and sitemap returned HTTPS 200 with certificate validation enabled.

## Product and billing

| Plan | Monthly price | Annual price | Allocation each month |
|---|---:|---:|---:|
| Creator | $100 | $960 | $100 credits / 20 generations |
| Pro | $200 | $1,920 | $200 credits / 40 generations |

Each generation consumes $5 app credits. Annual billing saves 20%; credits still allocate monthly and unused credits expire. There is no separate $5 purchase plan.

Dodo live products match all four prices. A production Creator monthly checkout session returned a valid checkout.dodopayments.com URL. The live webhook is enabled and rejects unsigned requests with 401. Signature validation, replay, receipt ownership, annual monthly allocation, concurrent debit and refund behavior passed automated checks. No real card charge was submitted, so a card-payment/settlement cycle is not claimed as tested.

## Real generation

The replacement World Labs API key authenticated with 69,500 credits. One production text-to-world request using Marble 1.1 completed successfully, returning SPZ assets at 100k, 150k, 500k and full resolution, plus panorama, collider mesh and thumbnail. It consumed 1,580 upstream credits, leaving 67,920 at the post-request check. The app debited exactly $5, leaving $95 / 19 generations on an internal temporary Creator entitlement. The temporary entitlement was created for launch verification; it does not represent a real customer payment.

The site's browser history reopened the completed job, and its interactive 3D viewer loaded successfully. Download endpoints were checked independently. Temporary verification accounts, sessions and billing fixtures are removed after verification. Provider-side generated assets remain subject to the provider's retention policy.

The site openly describes its actual World Labs provider. It does not claim affiliation with Google/DeepMind or access to Google's Genie model.

## SEO and Google Search Console

Primary keyword: **Genie 4 AI**. Secondary terms: Genie 4 AI world generator, image to 3D world, text to 3D world, World Labs Marble studio. No search-volume or ranking estimates are claimed.

SEO implementation includes app/layout.tsx metadata, app/page.tsx visible definition/FAQ/JSON-LD, app/robots.ts, app/sitemap.ts and app/opengraph-image.tsx. Canonical, Open Graph, Twitter, robots and sitemap share https://genie4ai.ai. Schema includes WebSite, SoftwareApplication with the four visible billing offers, and FAQPage; no fabricated ratings or testimonials. Account and studio routes are noindex.

The user-authorized Chrome session verified sc-domain:genie4ai.ai by DNS TXT and submitted https://genie4ai.ai/sitemap.xml. Search Console reported **successfully processed** with **five discovered pages** on 2026-10-29. This confirms sitemap processing, not page indexing or search ranking. The old service-account credential remains invalid and would need replacement for future script-based submissions; browser submission is complete.

## Validation

- pnpm lint and pnpm build passed with type checking enabled.
- Four automated test cases, nine HTTP smoke checks and three webhook-signature checks passed.
- Desktop and 390px mobile layouts were inspected; no horizontal overflow was observed.
- Production account login, job history, real world result, live checkout-session creation, public HTTPS and sitemap XML were verified.
- Staged sources were inspected and scanned for known credentials/private-key markers before publishing.
- Content review and its limits are recorded in memory/audits/2026-10-29-genie4ai-prelaunch.md. New-brand authority and long-term usage evidence remain limited; no such evidence was fabricated.
