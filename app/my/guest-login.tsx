"use client";

import { useState } from "react";
import { requestGuestMagicLink } from "@/lib/guest-auth";

export function GuestLogin() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const result = await requestGuestMagicLink(email.trim());
    if (result.ok) {
      setSent(true);
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#171717" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 7l-10 6L2 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Check your email</h2>
        <p className="text-sm text-neutral-500 mb-1">
          We sent a login link to <strong className="text-neutral-900">{email}</strong>
        </p>
        <p className="text-xs text-neutral-400">The link expires in 15 minutes.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
          placeholder="The email you booked with"
          className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-base bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10" />
      </div>
      {error && <p className="text-sm text-rose-600 font-medium mb-4">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-neutral-900 text-white py-3.5 text-base font-bold hover:bg-neutral-700 disabled:opacity-50 transition-colors">
        {loading ? "Sending..." : "Send Login Link"}
      </button>
    </form>
  );
}
