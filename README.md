# Genie 4 AI

Independent image/text-to-world studio using World Labs Marble 1.1. This is not a Google/DeepMind product and does not use Google's Genie model.

Initial source: v0 Neural Link template `elEH8xwTpSh`. The template was exported successfully; v0 customization/resume requests stalled and v2 rejected the required v0-auto model with HTTP 422. The user explicitly approved local completion while retaining the template design.

## Develop

Node 22 and pnpm 9.15.4. Set local credentials in an ignored `.env.local`. Never commit credentials. Required server variables are listed by name in `docs/operations.md`.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm build
node --env-file=.env.local --conditions=react-server --import tsx --test tests/*.test.ts
```

Integration tests create isolated temporary users/receipts, mock external billing responses, test financial concurrency, and remove their fixtures. They never charge a card or generate a real world.

## Pricing

| Plan | Monthly | Annual (20% off) | Monthly allocation |
|---|---:|---:|---:|
| Creator | $100 | $960 | $100 credits / 20 generations |
| Pro | $200 | $1,920 | $200 credits / 40 generations |

One generation reserves $5 credits. Monthly credits expire without rollover. Annual subscriptions receive monthly allocations. Dodo verified paid service periods grant credits; checkout redirects and subscription activation alone do not.

See `docs/operations.md` and `docs/seo-brief.md`. The reused 3D viewer carries the MIT notice in `docs/REFERENCE-LICENSE.md`.
