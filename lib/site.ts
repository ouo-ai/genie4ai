export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://genie4ai.ai";
export const FAQ = [
  {
    q: "What is Genie 4 AI?",
    a: "Genie 4 AI is an independent 3D world creation studio. It sends your image or text prompt to World Labs Marble 1.1, then provides a browser preview and the world assets returned by that model. It is not a Google DeepMind product.",
  },
  {
    q: "Does this use Google's Genie 4 model?",
    a: "No. This website is not affiliated with Google or DeepMind and does not provide access to Google's Genie model. The connected generation provider is World Labs, using Marble 1.1. The 3D viewer explores a generated scene; it does not run a real-time game simulation.",
  },
  {
    q: "How does the $5 generation cost work?",
    a: "Each generation uses $5 of your plan's generation credits. Creator includes $100 in credits for 20 generations per month; Pro includes $200 for 40. There is no separate $5 purchase plan. Credits are service usage units, not cash, and cannot be withdrawn.",
  },
  {
    q: "How much do annual subscriptions cost?",
    a: "Creator costs $960 per year and Pro costs $1,920 per year, billed upfront. Both are 20% less than 12 monthly payments. Annual subscriptions still allocate 20 or 40 generations each month. Unused monthly credits expire and do not roll over.",
  },
  {
    q: "What can I upload and download?",
    a: "Upload a JPG, PNG or WebP image up to 3 MB, or start with a text prompt. Depending on the provider's result, you can preview a 3D Gaussian splat, view a panorama, and download available SPZ splats and a collider mesh. Some results may not include every asset type.",
  },
  {
    q: "What happens if a generation fails?",
    a: "A confirmed generation failure restores the $5 credit debit once. If submission cannot be confirmed, the job is marked for review rather than retried automatically. Keep the job ID and contact support. New checkouts and generations pause when the provider is unavailable.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes. Sign in, open Account & billing, and cancel renewal. Your already paid period remains available until its scheduled end, unless access is suspended for a refund, dispute or policy breach. Taxes may be added at checkout.",
  },
];
