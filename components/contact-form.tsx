"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { api, useAccount } from "./site-provider";
export function ContactForm() {
  const { account, loading } = useAccount(),
    [category, setCategory] = useState("generation"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [id, setId] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/support", { category, message });
      setId(data.id);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p>Loading…</p>;
  if (!account?.user)
    return (
      <p>
        <Link href="/account">Sign in or create an account</Link> to send a
        request. Account access issues can also be raised using a separate
        account. Do not include passwords or card details.
      </p>
    );
  return id ? (
    <div className="notice" role="status">
      Your request has been recorded for review.
      <br />
      Reference: {id}
      <br />
      Keep this reference. No response-time guarantee is offered.
    </div>
  ) : (
    <form className="form-panel" onSubmit={submit}>
      <label>
        Topic
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="generation">World generation</option>
          <option value="billing">Billing or refund</option>
          <option value="account">Account</option>
          <option value="privacy">Privacy or deletion request</option>
        </select>
      </label>
      <label>
        How can we help?
        <textarea
          required
          minLength={15}
          maxLength={4000}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Include the full job or payment ID if relevant. Do not include passwords or card details."
        />
      </label>
      <button disabled={busy} className="action">
        {busy ? "Submitting…" : "Submit request ↗"}
      </button>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </form>
  );
}
