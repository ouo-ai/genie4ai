import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Refund and cancellation policy",
  alternates: { canonical: "/refunds" },
};
export default function Page() {
  return (
    <main id="main" className="app-shell shell legal">
      <p className="eyebrow">BILLING, WITHOUT SURPRISES</p>
      <h1>Refunds & cancellation</h1>
      <h2>Cancel a renewal</h2>
      <p>
        Open <a href="/account#billing">Account & billing</a>, choose Cancel
        renewal and confirm. Cancellation takes effect at the end of your paid
        period. Annual subscriptions are billed upfront; cancellation does not
        automatically refund remaining months.
      </p>
      <h2>Failed generations</h2>
      <p>
        A confirmed generation failure restores the $5 credit debit once. If
        submission could not be confirmed, the job stays under review rather
        than being submitted again. Send the full job ID through{" "}
        <a href="/contact">support</a>. A credit restoration is not a cash
        refund.
      </p>
      <h2>Payment refunds</h2>
      <p>
        For duplicate charges, technical problems or an unused purchase made in
        error, submit a support request with your payment ID and a description.
        Requests are reviewed individually; a refund is not guaranteed except
        where required by applicable law. Used credits and partially used
        billing periods are not automatically refundable. Statutory consumer
        rights remain unaffected.
      </p>
      <p>
        Approved refunds return through the original payment method according to
        the provider’s processing times. A refunded or disputed payment may
        revoke the associated credits.
      </p>
      <h2>Monthly allocations</h2>
      <p>
        Unused credits expire at the next monthly reset and do not roll over,
        including with annual billing. They have no cash value and cannot be
        withdrawn or transferred.
      </p>
    </main>
  );
}
