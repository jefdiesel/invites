"use client";

import { useState } from "react";
import { addToWaitlist, checkinBooking, lookupReservationForCheckin } from "@/lib/restaurant-actions";

type ThemeProps = {
  accent: string; text: string; textMuted: string; bg: string;
  surface: string; border: string; displayFont: string;
};

type GuestRes = { id: string; time: string; partySize: number; name: string } | null;

export function CheckinPage({ businessId, businessName, slug, waitlistEnabled, checkinEnabled, guestReservation, theme: t }: {
  businessId: string; businessName: string; slug: string;
  waitlistEnabled: boolean; checkinEnabled: boolean;
  guestReservation: GuestRes;
  theme: ThemeProps;
}) {
  const [mode, setMode] = useState<"choose" | "waitlist" | "checkin" | "done">(
    guestReservation ? "checkin" : "choose"
  );
  const [form, setForm] = useState({ name: "", phone: "", party_size: "2" });
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [foundBookings, setFoundBookings] = useState<Array<{
    id: string; booking_time: string; party_size: number; status: string;
    clients?: unknown;
  }>>([]);
  const [doneMessage, setDoneMessage] = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%", border: `1px solid ${t.border}`, background: t.surface,
    color: t.text, padding: "0.75rem 1rem", fontSize: "1rem", borderRadius: "0.75rem", outline: "none",
  };

  // Join waitlist
  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setLoading(true);
    setError("");
    try {
      await addToWaitlist(businessId, {
        name: form.name, phone: form.phone,
        party_size: parseInt(form.party_size) || 2,
        notes: "", quoted_wait_minutes: 0,
      });
      setDoneMessage("You're on the waitlist! We'll text you when your table is ready.");
      setMode("done");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  // Lookup reservation
  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.trim()) return;
    setLoading(true);
    setError("");
    try {
      const results = await lookupReservationForCheckin(businessId, contact.trim());
      if (results.length === 0) {
        setError("No reservation found for today. Check your email or phone number.");
      } else {
        setFoundBookings(results);
      }
    } catch {
      setError("Something went wrong.");
    }
    setLoading(false);
  }

  // Check in
  async function handleCheckin(bookingId: string) {
    setLoading(true);
    await checkinBooking(bookingId);
    setDoneMessage("You're checked in! The host will seat you shortly.");
    setMode("done");
    setLoading(false);
  }

  // Auto-detected reservation
  if (guestReservation && mode === "checkin" && foundBookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-sm text-center">
          <h1 style={{ fontFamily: t.displayFont }} className="text-3xl font-bold mb-2" >{businessName}</h1>
          <p className="text-base mb-6" style={{ color: t.textMuted }}>Welcome back, {guestReservation.name}</p>

          <div className="rounded-xl p-5 mb-6 text-left" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
            <div className="text-base font-bold" style={{ color: t.text }}>Your reservation</div>
            <div className="text-sm mt-1" style={{ color: t.textMuted }}>
              {fmtTime(guestReservation.time)} · {guestReservation.partySize} {guestReservation.partySize === 1 ? "guest" : "guests"}
            </div>
          </div>

          <button onClick={() => handleCheckin(guestReservation.id)} disabled={loading}
            className="w-full py-4 text-lg font-bold text-white rounded-xl disabled:opacity-50 transition-colors"
            style={{ background: t.accent }}>
            {loading ? "Checking in..." : "Check In"}
          </button>
        </div>
      </div>
    );
  }

  // Done state
  if (mode === "done") {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "#dcfce7" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: t.text }}>{doneMessage.split("!")[0]}!</h2>
          <p className="text-base" style={{ color: t.textMuted }}>{doneMessage.split("!").slice(1).join("!").trim()}</p>
        </div>
      </div>
    );
  }

  // Choose mode
  if (mode === "choose") {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-sm text-center">
          <h1 style={{ fontFamily: t.displayFont }} className="text-3xl font-bold mb-2">{businessName}</h1>
          <p className="text-base mb-8" style={{ color: t.textMuted }}>Welcome</p>

          <div className="space-y-3">
            {checkinEnabled && (
              <button onClick={() => setMode("checkin")}
                className="w-full py-4 text-base font-bold text-white rounded-xl transition-colors"
                style={{ background: t.accent }}>
                Check In for Reservation
              </button>
            )}
            {waitlistEnabled && (
              <button onClick={() => setMode("waitlist")}
                className="w-full py-4 text-base font-bold rounded-xl transition-colors"
                style={{ background: t.surface, border: `2px solid ${t.border}`, color: t.text }}>
                Join the Waitlist
              </button>
            )}
          </div>

          <a href={`/r/${slug}/book`} className="block text-sm mt-6 font-medium" style={{ color: t.textMuted }}>
            Make a reservation instead
          </a>
        </div>
      </div>
    );
  }

  // Waitlist form
  if (mode === "waitlist") {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-sm">
          <button onClick={() => setMode("choose")} className="text-sm mb-4" style={{ color: t.textMuted }}>&larr; Back</button>
          <h2 style={{ fontFamily: t.displayFont }} className="text-2xl font-bold mb-1">{businessName}</h2>
          <p className="text-base mb-6" style={{ color: t.textMuted }}>Join the waitlist. We'll text you when your table is ready.</p>

          <form onSubmit={handleWaitlist} className="space-y-4">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Your name" required style={inputStyle} autoFocus />
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone number" required style={inputStyle} />
            <select value={form.party_size} onChange={e => setForm({ ...form, party_size: e.target.value })} style={inputStyle}>
              {[1,2,3,4,5,6,7,8,10,12].map(n => <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}
            </select>
            {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-4 text-base font-bold text-white rounded-xl disabled:opacity-50 transition-colors"
              style={{ background: t.accent }}>
              {loading ? "Joining..." : "Join Waitlist"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Check-in flow: lookup or show results
  return (
    <div className="flex items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-sm">
        <button onClick={() => { setMode("choose"); setFoundBookings([]); setError(""); }}
          className="text-sm mb-4" style={{ color: t.textMuted }}>&larr; Back</button>
        <h2 style={{ fontFamily: t.displayFont }} className="text-2xl font-bold mb-1">{businessName}</h2>
        <p className="text-base mb-6" style={{ color: t.textMuted }}>Find your reservation</p>

        {foundBookings.length === 0 ? (
          <form onSubmit={handleLookup} className="space-y-4">
            <input value={contact} onChange={e => setContact(e.target.value)}
              placeholder="Email or phone number" required style={inputStyle} autoFocus />
            {error && (
              <div>
                <p className="text-sm text-rose-600 font-medium mb-2">{error}</p>
                {waitlistEnabled && (
                  <button type="button" onClick={() => setMode("waitlist")}
                    className="text-sm font-medium" style={{ color: t.accent }}>
                    Join the waitlist instead
                  </button>
                )}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-4 text-base font-bold text-white rounded-xl disabled:opacity-50 transition-colors"
              style={{ background: t.accent }}>
              {loading ? "Looking up..." : "Find Reservation"}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            {foundBookings.map(b => {
              const c = b.clients as { name: string; email: string } | null;
              return (
                <div key={b.id} className="rounded-xl p-4" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-base font-bold" style={{ color: t.text }}>{c?.name ?? "Guest"}</div>
                      <div className="text-sm" style={{ color: t.textMuted }}>
                        {fmtTime(b.booking_time)} · {b.party_size} {b.party_size === 1 ? "guest" : "guests"}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleCheckin(b.id)} disabled={loading}
                    className="w-full py-3 text-base font-bold text-white rounded-lg disabled:opacity-50 transition-colors"
                    style={{ background: t.accent }}>
                    {loading ? "Checking in..." : "Check In"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function fmtTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}
