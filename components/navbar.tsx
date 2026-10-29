"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useAccount } from "./site-provider";
export function Navbar() {
  const [open, setOpen] = useState(false),
    { account } = useAccount();
  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link href="/" className="wordmark" aria-label="Genie 4 AI home">
          GENIE<span>4</span>
          <small>AI</small>
        </Link>
        <nav
          aria-label="Main navigation"
          className={open ? "nav-links open" : "nav-links"}
        >
          {[
            ["The process", "/#process"],
            ["Pricing", "/#pricing"],
            ["FAQ", "/#faq"],
            ["Studio", "/studio"],
          ].map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <Link
            className="nav-account"
            href="/account"
            onClick={() => setOpen(false)}
          >
            {account?.user ? "My account" : "Sign in"}
            <ArrowUpRight size={14} />
          </Link>
        </nav>
        <button
          className="menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
