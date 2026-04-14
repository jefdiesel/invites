"use client";

import { useState } from "react";
import { createBooking } from "@/lib/restaurant-actions";

type Slot = { time: string; available: boolean };

type ThemeProps = {
  accent: string;
  accentHover: string;
  text: string;
  textMuted: string;
  textLight: string;
  bg: string;
  surface: string;
  border: string;
  radius: string;
  displayFont: string;
};

export function BookingForm({
  businessId, slug, minParty, maxParty, windowDays, theme,
}: {
  businessId: string; slug: string; minParty: number; maxParty: number; windowDays: number;
  theme?: ThemeProps;
}) {
  const [step, setStep] = useState<"select" | "details" | "confirmed">("select");
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Theme tokens with fallbacks
  const t = theme ?? {
    accent: "#c4703c", accentHover: "#d4884f", text: "#1f1a14",
    textMuted: "#7a6a54", textLight: "#96836a", bg: "#f7f3ed",
    surface: "#ffffff", border: "#e8e0d4", radius: "0.375rem",
    displayFont: "var(--font-geist-sans)",
  };

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + windowDays * 86400000).toISOString().split("T")[0];

  async function loadSlots(d: string, ps: number) {
    setLoadingSlots(true);
    setSelectedTime("");
    try {
      const res = await fetch(`/api/r/${businessId}/slots?date=${d}&partySize=${ps}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots);
      }
    } catch {
      setSlots([]);
    }
    setLoadingSlots(false);
  }

  function handleDateChange(d: string) {
    setDate(d);
    if (d) loadSlots(d, partySize);
  }

  function handlePartySizeChange(ps: number) {
    setPartySize(ps);
    if (date) loadSlots(date, ps);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !selectedTime || !date) return;
    setSubmitting(true);
    setError("");
    try {
      await createBooking(businessId, {
        name, email, phone, date, time: selectedTime, partySize, notes,
      });
      setStep("confirmed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setSubmitting(false);
  }

  const availableSlots = slots.filter((s) => s.available);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: `1px solid ${t.border}`,
    background: t.surface,
    color: t.text,
    padding: "0.625rem 1rem",
    fontSize: "0.875rem",
    borderRadius: t.radius,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: t.textMuted,
    marginBottom: "0.375rem",
  };

  // Confirmed state with delight
  if (step === "confirmed") {
    const dateStr = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    });

    return (
      <div className="text-center py-8">
        {/* Animated checkmark */}
        <div
          className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{
            background: t.accent,
            animation: "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" className="checkmark-draw" />
          </svg>
        </div>

        <h2 style={{ fontFamily: t.displayFont, color: t.text }} className="text-2xl mb-2">
          You're all set
        </h2>
        <p className="text-base mb-1" style={{ color: t.text }}>
          <strong>{name}</strong>, party of {partySize}
        </p>
        <p className="text-base mb-6" style={{ color: t.textMuted }}>
          {dateStr} at {formatTime(selectedTime)}
        </p>

        <div
          className="inline-block px-5 py-3 text-sm mb-8"
          style={{ background: `${t.accent}10`, borderRadius: t.radius, color: t.text }}
        >
          Booked under <strong>{email}</strong>
        </div>

        <div>
          <a href={`/r/${slug}`} className="text-sm font-medium transition-colors" style={{ color: t.accent }}>
            &larr; Back to {slug}
          </a>
        </div>

        <style>{`
          @keyframes scaleIn {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .checkmark-draw {
            stroke-dasharray: 24;
            stroke-dashoffset: 24;
            animation: draw 0.4s 0.3s ease forwards;
          }
          @keyframes draw {
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Step 1: Date + Party Size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            min={today}
            max={maxDate}
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Guests</label>
          <select
            value={partySize}
            onChange={(e) => handlePartySizeChange(Number(e.target.value))}
            style={inputStyle}
          >
            {Array.from({ length: maxParty - minParty + 1 }, (_, i) => minParty + i).map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Step 2: Time Slots */}
      {date && (
        <div className="mb-6">
          <label style={labelStyle}>Time</label>
          {loadingSlots ? (
            <div className="py-6 text-center">
              <div
                className="inline-block w-5 h-5 border-2 rounded-full animate-spin"
                style={{ borderColor: t.border, borderTopColor: t.accent }}
              />
              <p className="text-sm mt-2" style={{ color: t.textLight }}>Checking availability...</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="py-6 px-4 text-center text-sm" style={{ color: t.textMuted, background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radius }}>
              {slots.length === 0 ? "Closed on this day." : "No availability for this party size. Try a different date."}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map((slot) => {
                const isSelected = selectedTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => { setSelectedTime(slot.time); if (step === "select") setStep("details"); }}
                    className="py-2.5 text-sm font-medium transition-all"
                    style={{
                      border: `1.5px solid ${isSelected ? t.accent : t.border}`,
                      background: isSelected ? t.accent : t.surface,
                      color: isSelected ? "#ffffff" : t.text,
                      borderRadius: t.radius,
                      transform: isSelected ? "scale(1.03)" : "scale(1)",
                    }}
                  >
                    {formatTime(slot.time)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Guest Details (slides in after time selection) */}
      {step === "details" && selectedTime && (
        <div
          className="pt-6 mb-6"
          style={{ borderTop: `1px solid ${t.border}`, animation: "slideUp 0.3s ease" }}
        >
          <h3 className="text-base font-bold mb-4" style={{ color: t.text }}>Your details</h3>
          <div className="space-y-4">
            <div>
              <label style={labelStyle}>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" style={inputStyle} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@email.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone <span style={{ color: t.textLight, fontWeight: 400 }}>(optional)</span></label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-0000" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Special requests <span style={{ color: t.textLight, fontWeight: 400 }}>(optional)</span></label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Birthday, dietary needs, seating preference..."
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 text-sm font-medium" style={{
          background: "#fef2f2",
          color: "#991b1b",
          borderRadius: t.radius,
          border: "1px solid #fecaca",
        }}>
          {error}. Please try again or call us directly.
        </div>
      )}

      {/* Summary + Submit */}
      {step === "details" && selectedTime && (
        <div style={{ borderTop: `1px solid ${t.border}` }} className="pt-4">
          <div className="text-sm mb-4" style={{ color: t.textMuted }}>
            {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            {" "}at {formatTime(selectedTime)} · {partySize} {partySize === 1 ? "guest" : "guests"}
          </div>
          <button
            type="submit"
            disabled={submitting || !name || !email}
            className="w-full py-3.5 text-base font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: submitting ? t.textLight : t.accent,
              borderRadius: t.radius,
            }}
          >
            {submitting ? "Confirming..." : "Confirm Reservation"}
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </form>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}
