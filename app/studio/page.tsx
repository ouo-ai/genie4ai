import type { Metadata } from "next";
import { Studio } from "@/components/studio/studio";
export const metadata: Metadata = {
  title: "World creation studio",
  alternates: { canonical: "/studio" },
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main id="main" className="app-shell shell">
      <Studio />
    </main>
  );
}
