import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Privacy policy",
  alternates: { canonical: "/privacy" },
};
export default function Page() {
  return (
    <main id="main" className="app-shell shell legal">
      <p className="eyebrow">LAST UPDATED 29 OCTOBER 2026</p>
      <h1>Privacy policy</h1>
      <p>
        Genie 4 AI uses account and generation data to operate the studio,
        administer subscriptions, provide world history, prevent abuse and
        respond to support requests.
      </p>
      <h2>Data we process</h2>
      <p>
        We store your email, salted password hash, hashed session token,
        subscription and payment identifiers, generation request hashes, job
        status, returned asset URLs and submitted support requests. We do not
        store your plaintext password or payment card numbers. Images and
        prompts are forwarded to World Labs for generation; our job records
        retain a request hash rather than the submitted image or prompt.
      </p>
      <h2>Service providers</h2>
      <p>
        World Labs processes generation inputs and outputs under its own
        policies. Dodo Payments processes billing and transaction records.
        Supabase hosts application records, Vercel hosts the application, and
        Cloudflare provides domain and network services. These providers may
        process data outside your country. Consult their policies for their own
        retention and processing practices.
      </p>
      <h2>Cookies and security</h2>
      <p>
        An essential HTTP-only session cookie keeps you signed in for up to 30
        days. No advertising cookies are configured by this application. We use
        HTTPS, server-side credentials and access checks; no security measure
        guarantees complete protection. Avoid uploading sensitive personal
        information.
      </p>
      <h2>Retention and your choices</h2>
      <p>
        Records are retained while needed to provide the service, resolve
        issues, prevent fraud and meet legal obligations. Provider asset links
        may expire separately. Request access, correction or deletion through{" "}
        <a href="/contact">support</a>. Requests may require account
        verification, and transaction records may require legal retention. Sign
        out to remove your browser session.
      </p>
    </main>
  );
}
