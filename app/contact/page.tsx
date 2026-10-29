import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
export const metadata: Metadata = {
  title: "Contact support",
  alternates: { canonical: "/contact" },
};
export default function Page() {
  return (
    <main id="main" className="app-shell shell legal">
      <p className="eyebrow">HERE TO HELP</p>
      <h1>Contact support</h1>
      <p>
        For generation reviews, billing, refunds or privacy requests, send a
        request below. Include your job or payment ID to help us locate the
        issue. Requests are stored for review; no response-time guarantee is
        offered.
      </p>
      <ContactForm />
    </main>
  );
}
