import { Suspense } from "react";
import type { Metadata } from "next";
import { AccountPanel } from "@/components/account-panel";
export const metadata: Metadata = {
  title: "Account & billing",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main id="main" className="app-shell shell">
      <Suspense fallback={<p>Loading account…</p>}>
        <AccountPanel />
      </Suspense>
    </main>
  );
}
