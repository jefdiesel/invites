"use client";

import { useState } from "react";
import { setupBusiness } from "@/lib/restaurant-actions";
import { useRouter } from "next/navigation";

export function SetupForm({
  businessId, slug, accent, radius, heroBg, heroText, heroTextMuted,
}: {
  businessId: string; slug: string; accent: string; radius: string;
  heroBg: string; heroText: string; heroTextMuted: string;
}) {
  const [step, setStep] = useState(1);
  const [adminEmail, setAdminEmail] = useState("");
  const [staffPin, setStaffPin] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  const btnStyle: React.CSSProperties = {
    width: "100%",
    fontSize: "1.125rem",
    fontWeight: 700,
    padding: "1rem",
    background: accent,
    color: "#fff",
    borderRadius: radius,
    border: "none",
    cursor: "pointer",
  };

  const skipStyle: React.CSSProperties = {
    color: heroTextMuted,
    fontSize: "0.875rem",
    cursor: "pointer",
    background: "none",
    border: "none",
    marginTop: "1rem",
  };

  async function handleFinish() {
    if (!adminEmail) { setError("Admin email is required"); return; }
    setLoading(true);
    setError("");
    try {
      await setupBusiness(businessId, slug, {
        adminEmail,
        staffPin: staffPin || "1234",
        adminPassword: adminPassword || "admin",
      });
      setStep(4);
      // Auto-login: call the login API with the admin password
      const res = await fetch(`/api/r/${slug}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword || "admin" }),
      });
      const data = await res.json();
      if (data.role) {
        setTimeout(() => router.push(`/r/${slug}/admin`), 1500);
      }
    } catch {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  }

  // Step 4: Done
  if (step === 4) {
    return (
      <div>
        <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: accent }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">You're all set</h2>
        <p className="text-sm mb-4" style={{ color: heroTextMuted }}>
          Redirecting to your admin dashboard...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="w-2 h-2 rounded-full transition-all"
            style={{ background: s <= step ? accent : "rgba(255,255,255,0.2)" }} />
        ))}
      </div>

      {/* Step 1: Admin Email */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold mb-2">Admin email</h2>
          <p className="text-sm mb-6" style={{ color: heroTextMuted }}>
            This is where login links will be sent. You can add more admins later.
          </p>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="you@restaurant.com"
            autoFocus
            style={inputStyle}
            className="mb-4"
          />
          {error && <p className="text-sm font-medium mb-4" style={{ color: "#f87171" }}>{error}</p>}
          <button
            onClick={() => {
              if (!adminEmail || !adminEmail.includes("@")) { setError("Enter a valid email"); return; }
              setError(""); setStep(2);
            }}
            style={btnStyle}
          >
            Next
          </button>
        </div>
      )}

      {/* Step 2: Staff PIN */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold mb-2">Staff PIN</h2>
          <p className="text-sm mb-6" style={{ color: heroTextMuted }}>
            Your host stand team will use this to access the floor view. Keep it simple.
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={staffPin}
            onChange={(e) => setStaffPin(e.target.value)}
            placeholder="1234"
            autoFocus
            style={inputStyle}
            className="mb-4"
          />
          <button onClick={() => setStep(3)} style={btnStyle}>
            {staffPin ? "Next" : "Use default (1234)"}
          </button>
          <button onClick={() => setStep(1)} style={skipStyle}>&larr; Back</button>
        </div>
      )}

      {/* Step 3: Admin Password */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-bold mb-2">Admin password</h2>
          <p className="text-sm mb-6" style={{ color: heroTextMuted }}>
            For quick login without email. You can also use magic links in production.
          </p>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Set a password"
            autoFocus
            style={inputStyle}
            className="mb-4"
          />
          {error && <p className="text-sm font-medium mb-4" style={{ color: "#f87171" }}>{error}</p>}
          <button onClick={handleFinish} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.5 : 1 }}>
            {loading ? "Setting up..." : adminPassword ? "Finish Setup" : "Use default (admin)"}
          </button>
          <button onClick={() => setStep(2)} style={skipStyle}>&larr; Back</button>
        </div>
      )}
    </div>
  );
}
