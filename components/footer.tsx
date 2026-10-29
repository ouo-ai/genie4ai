import Link from "next/link";
export function Footer() {
  return (
    <footer className="site-footer shell">
      <div>
        <Link className="wordmark" href="/">
          GENIE<span>4</span>
          <small>AI</small>
        </Link>
        <p>Imagine a place. Give it another dimension.</p>
        <p className="fine">
          Independent studio powered by World Labs Marble.
          <br />
          Not affiliated with Google, DeepMind or World Labs.
        </p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/studio">Open studio</Link>
        <Link href="/account">Account & billing</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/refunds">Refund policy</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <p className="copyright">
        © {new Date().getFullYear()} Genie 4 AI · genie4ai.ai
      </p>
    </footer>
  );
}
