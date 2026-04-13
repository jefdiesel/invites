"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ slug, accent, radius, heroBg, heroText, heroTextMuted }: {
  slug: string; accent: string; radius: string; heroBg: string; heroText: string; heroTextMuted: string;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
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
        setError("Wrong password");
        setPassword("");
      }
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
        autoFocus
        className="w-full text-center text-xl py-4 px-6 mb-4 outline-none"
        style={{
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: radius,
          color: heroText,
        }}
      />

      {error && (
        <p className="text-sm font-medium mb-4" style={{ color: "#f87171" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="w-full text-lg font-bold py-4 transition-opacity disabled:opacity-40"
        style={{ background: accent, color: "#fff", borderRadius: radius }}
      >
        {loading ? "..." : "Sign In"}
      </button>
    </form>
  );
}
