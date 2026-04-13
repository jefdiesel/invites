"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ slug, accent, radius, heroBg, heroText, heroTextMuted }: {
  slug: string; accent: string; radius: string; heroBg: string; heroText: string; heroTextMuted: string;
}) {
  const [mode, setMode] = useState<"pin" | "email">("pin");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [devLink, setDevLink] = useState("");
  const router = useRouter();

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/r/${slug}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.role === "admin") {
        router.push(`/r/${slug}/admin`);
      } else if (data.role === "staff") {
        router.push(`/r/${slug}/manage`);
      } else {
        setError("Wrong PIN");
        setPassword("");
      }
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/r/${slug}/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.ok) {
        setMagicLinkSent(true);
        // DEV MODE: show the link directly
        if (data.devToken) {
          setDevLink(`/r/${slug}/login/verify?token=${data.devToken}`);
        }
      } else {
        setError(data.error || "Email not authorized");
      }
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    textAlign: "center",
    fontSize: "1.25rem",
    padding: "1rem 1.5rem",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: radius,
    color: heroText,
    outline: "none",
  };

  if (magicLinkSent) {
    return (
      <div>
        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: accent }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Check your email</h2>
        <p className="text-sm mb-6" style={{ color: heroTextMuted }}>
          We sent a login link to <strong>{email}</strong>
        </p>

        {/* DEV MODE: show link directly */}
        {devLink && (
          <div className="mb-6 p-4 text-left text-sm" style={{ background: "rgba(255,255,255,0.1)", borderRadius: radius }}>
            <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: accent }}>Dev Mode</div>
            <a href={devLink} className="underline break-all" style={{ color: heroText }}>
              Click to login &rarr;
            </a>
          </div>
        )}

        <button onClick={() => { setMagicLinkSent(false); setEmail(""); setDevLink(""); }}
          className="text-sm transition-opacity opacity-50 hover:opacity-80">
          Try a different email
        </button>
      </div>
    );
  }

  return (
    <div>
      {mode === "pin" ? (
        <>
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              style={inputStyle}
              className="mb-4"
            />
            {error && <p className="text-sm font-medium mb-4" style={{ color: "#f87171" }}>{error}</p>}
            <button type="submit" disabled={loading || !password}
              className="w-full text-lg font-bold py-4 transition-opacity disabled:opacity-40"
              style={{ background: accent, color: "#fff", borderRadius: radius }}>
              {loading ? "..." : "Sign In"}
            </button>
          </form>
          <button onClick={() => { setMode("email"); setError(""); }}
            className="mt-6 text-sm transition-opacity opacity-50 hover:opacity-80">
            Use email login instead
          </button>
        </>
      ) : (
        <>
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoFocus
              style={inputStyle}
              className="mb-4"
            />
            {error && <p className="text-sm font-medium mb-4" style={{ color: "#f87171" }}>{error}</p>}
            <button type="submit" disabled={loading || !email}
              className="w-full text-lg font-bold py-4 transition-opacity disabled:opacity-40"
              style={{ background: accent, color: "#fff", borderRadius: radius }}>
              {loading ? "Sending..." : "Send Login Link"}
            </button>
          </form>
          <button onClick={() => { setMode("pin"); setError(""); }}
            className="mt-6 text-sm transition-opacity opacity-50 hover:opacity-80">
            Use password instead
          </button>
        </>
      )}
    </div>
  );
}
