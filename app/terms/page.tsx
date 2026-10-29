import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Terms of service",
  alternates: { canonical: "/terms" },
};
export default function Page() {
  return (
    <main id="main" className="app-shell shell legal">
      <p className="eyebrow">LAST UPDATED 29 OCTOBER 2026</p>
      <h1>Terms of service</h1>
      <p>
        These terms govern use of Genie 4 AI at genie4ai.ai, an independent
        creative studio using the World Labs Marble API. It is not affiliated
        with Google, DeepMind or World Labs, and does not provide Google’s Genie
        model.
      </p>
      <h2>Your account and content</h2>
      <p>
        You must be at least 18 and entitled to submit each input. Keep your
        account password confidential. Do not upload unlawful content,
        non-consensual intimate imagery, child sexual content, or material that
        violates another person’s rights. Do not bypass account limits, access
        another user’s worlds, or disrupt the service.
      </p>
      <h2>Subscriptions and credits</h2>
      <p>
        Creator is $100 monthly or $960 annually. Pro is $200 monthly or $1,920
        annually. Applicable taxes may be added at checkout. Dodo Payments
        processes subscriptions. Subscriptions renew automatically at the
        selected interval unless cancelled from Account & billing before the
        next billing date.
      </p>
      <p>
        Creator allocates $100 in generation credits (20 generations) monthly.
        Pro allocates $200 (40 generations). Each generation reserves $5 in
        credits. Annual plans are paid upfront but allocate credits monthly.
        Unused credits expire at the next allocation reset, do not roll over,
        have no cash value, are not transferable and cannot be withdrawn.
      </p>
      <h2>Generation and availability</h2>
      <p>
        World generation is asynchronous and depends on World Labs. Confirmed
        failures restore the credit debit once. An unconfirmed submission stays
        under review to avoid duplicate charges. New purchases and generation
        requests pause while provider service is unavailable. Outputs can
        contain artifacts or incomplete geometry, and not every result includes
        every asset type. The viewer explores a generated scene, not a real-time
        game simulation.
      </p>
      <h2>Ownership and downloads</h2>
      <p>
        You retain any rights you hold in your input. Output use is subject to
        applicable law and the upstream provider’s terms. We do not promise
        copyright protection, exclusivity or suitability for a specific
        commercial use. Download assets you wish to keep; links may expire.
        Review the{" "}
        <a
          href="https://www.worldlabs.ai/terms-of-service"
          target="_blank"
          rel="noreferrer"
        >
          World Labs terms
        </a>{" "}
        before commercial use.
      </p>
      <h2>Cancellation and support</h2>
      <p>
        Cancellation stops future renewal and normally preserves the already
        paid period. Refunds and disputes may suspend the associated credits.
        See the <a href="/refunds">refund policy</a> and{" "}
        <a href="/contact">support</a>. No response-time guarantee is offered.
      </p>
      <h2>Service limits</h2>
      <p>
        The service and AI outputs are provided as available, without a
        guarantee of uninterrupted access or fitness for any purpose. Nothing
        here limits rights that cannot legally be excluded. We may restrict
        accounts for fraud, abuse, payment disputes or violations. Material
        pricing changes apply to future renewals after any legally required
        notice.
      </p>
    </main>
  );
}
