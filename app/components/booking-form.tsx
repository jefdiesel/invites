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
  businessId, slug, restaurantName, minParty, maxParty, windowDays, phone, theme,
}: {
  businessId: string; slug: string; restaurantName: string;
  minParty: number; maxParty: number; windowDays: number;
  phone?: string;
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
  const [phoneNum, setPhoneNum] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const t = theme ?? {
    accent: "#c4703c", accentHover: "#d4884f", text: "#1f1a14",
    textMuted: "#7a6a54", textLight: "#96836a", bg: "#f7f3ed",
    surface: "#ffffff", border: "#e8e0d4", radius: "0.375rem",
    displayFont: "var(--font-geist-sans)",
  };

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + windowDays * 86400000).toISOString().split("T")[0];
  const availableSlots = slots.filter((s) => s.available);

  // Group time slots into early/prime/late
  function groupSlots(slots: Slot[]) {
    const early: Slot[] = [];
    const prime: Slot[] = [];
    const late: Slot[] = [];
    for (const s of slots) {
      if (!s.available) continue;
      const h = parseInt(s.time.split(":")[0]);
      if (h < 18) early.push(s);
      else if (h < 20) prime.push(s);
      else late.push(s);
    }
    return { early, prime, late };
  }

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
    setStep("select");
    if (d) loadSlots(d, partySize);
  }

  function handlePartySizeChange(ps: number) {
    setPartySize(ps);
    if (date) loadSlots(date, ps);
  }

  function selectTime(time: string) {
    setSelectedTime(time);
    setStep("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !selectedTime || !date) return;
    setSubmitting(true);
    setError("");
    try {
      await createBooking(businessId, {
        name, email, phone: phoneNum, date, time: selectedTime, partySize, notes,
      });
      setStep("confirmed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setSubmitting(false);
  }

  const dateStr = date ? new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  }) : "";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: `1px solid ${t.border}`,
    background: t.surface,
    color: t.text,
    padding: "0.75rem 1rem",
    fontSize: "0.9375rem",
    borderRadius: t.radius,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: t.textMuted,
    marginBottom: "0.375rem",
    letterSpacing: "0.01em",
  };

  // ── Step 3: Confirmed ──
  if (step === "confirmed") {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center"
          style={{ background: t.accent, animation: "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" className="checkmark-draw" />
          </svg>
        </div>

        <h2 style={{ fontFamily: t.displayFont, color: t.text }} className="text-2xl font-bold mb-1">
          You're booked
        </h2>
        <p className="text-base mb-6" style={{ color: t.textMuted }}>
          Confirmation sent to <strong style={{ color: t.text }}>{email}</strong>
        </p>

        <div className="rounded-xl px-5 py-4 mb-6 text-left" style={{ background: t.bg, border: `1px solid ${t.border}` }}>
          <div className="text-base font-semibold mb-0.5" style={{ color: t.text }}>{name}</div>
          <div className="text-sm" style={{ color: t.textMuted }}>
            {dateStr} at {formatTime(selectedTime)} · {partySize} {partySize === 1 ? "guest" : "guests"}
          </div>
          {notes && <div className="text-sm mt-2" style={{ color: t.textLight }}>"{notes}"</div>}
        </div>

        <a href={`/r/${slug}`} className="text-sm font-medium transition-colors" style={{ color: t.accent }}>
          Back to {restaurantName}
        </a>

        <style>{`
          @keyframes scaleIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
          .checkmark-draw { stroke-dasharray: 24; stroke-dashoffset: 24; animation: draw 0.4s 0.3s ease forwards; }
          @keyframes draw { to { stroke-dashoffset: 0; } }
        `}</style>
      </div>
    );
  }

  // ── Step indicator ──
  const steps = [
    { key: "select", label: "Pick a time" },
    { key: "details", label: "Your details" },
  ];
  const currentStepIdx = steps.findIndex(s => s.key === step);

  return (
    <form onSubmit={handleSubmit}>
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        {steps.map((s, i) => (
          <button key={s.key} type="button"
            onClick={() => { if (i < currentStepIdx) setStep(s.key as "select" | "details"); }}
            className="flex items-center gap-2"
            style={{ cursor: i < currentStepIdx ? "pointer" : "default" }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors" style={{
              background: i <= currentStepIdx ? t.accent : t.border,
              color: i <= currentStepIdx ? "#fff" : t.textLight,
            }}>
              {i < currentStepIdx ? "✓" : i + 1}
            </span>
            <span className="text-sm font-medium transition-colors" style={{
              color: i <= currentStepIdx ? t.text : t.textLight,
            }}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* ── Step 1: Date + Party + Time ── */}
      {step === "select" && (
        <div style={{ animation: "fadeIn 0.2s ease" }}>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} onChange={(e) => handleDateChange(e.target.value)}
                min={today} max={maxDate} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Guests</label>
              <select value={partySize} onChange={(e) => handlePartySizeChange(Number(e.target.value))} style={inputStyle}>
                {Array.from({ length: maxParty - minParty + 1 }, (_, i) => minParty + i).map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Time slots */}
          {date && (
            <div>
              <label style={labelStyle}>Time</label>
              {loadingSlots ? (
                <div className="py-8 text-center">
                  <div className="inline-block w-5 h-5 border-2 rounded-full animate-spin"
                    style={{ borderColor: t.border, borderTopColor: t.accent }} />
                  <p className="text-sm mt-2" style={{ color: t.textLight }}>Checking availability...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-6 px-4 text-center rounded-lg" style={{ background: t.bg, border: `1px solid ${t.border}` }}>
                  <p className="text-sm font-medium mb-1" style={{ color: t.text }}>
                    {slots.length === 0 ? "Closed on this day" : "Fully booked"}
                  </p>
                  <p className="text-xs" style={{ color: t.textLight }}>
                    Try a different date{slots.length > 0 ? " or a smaller party" : ""}.
                  </p>
                </div>
              ) : (
                <div>
                  {(() => {
                    const groups = groupSlots(slots);
                    const sections = [
                      { label: "Early", slots: groups.early },
                      { label: "Prime", slots: groups.prime },
                      { label: "Later", slots: groups.late },
                    ].filter(s => s.slots.length > 0);

                    return sections.map(section => (
                      <div key={section.label} className="mb-3">
                        <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: t.textLight }}>
                          {section.label}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {section.slots.map((slot) => (
                            <button key={slot.time} type="button" onClick={() => selectTime(slot.time)}
                              className="px-4 py-2.5 text-sm font-medium transition-all"
                              style={{
                                border: `1.5px solid ${selectedTime === slot.time ? t.accent : t.border}`,
                                background: selectedTime === slot.time ? t.accent : t.surface,
                                color: selectedTime === slot.time ? "#ffffff" : t.text,
                                borderRadius: t.radius,
                              }}>
                              {formatTime(slot.time)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Guest Details ── */}
      {step === "details" && selectedTime && (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          {/* Summary of selection */}
          <div className="rounded-lg px-4 py-3 mb-6 flex items-center justify-between"
            style={{ background: t.bg, border: `1px solid ${t.border}` }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: t.text }}>{dateStr}</div>
              <div className="text-sm" style={{ color: t.textMuted }}>
                {formatTime(selectedTime)} · {partySize} {partySize === 1 ? "guest" : "guests"}
              </div>
            </div>
            <button type="button" onClick={() => setStep("select")}
              className="text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
              style={{ color: t.accent, background: `${t.accent}10` }}>
              Change
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label style={labelStyle}>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                required placeholder="Full name" style={inputStyle} autoFocus />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required placeholder="you@email.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone <span style={{ color: t.textLight, fontWeight: 400 }}>(optional)</span></label>
                <input type="tel" value={phoneNum} onChange={(e) => setPhoneNum(e.target.value)}
                  placeholder="(555) 555-0000" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>
                Special requests <span style={{ color: t.textLight, fontWeight: 400 }}>(allergies, seating, occasions)</span>
              </label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder="Nut allergy, window seat, birthday dinner..." style={inputStyle} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-3 text-sm font-medium rounded-lg"
              style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={submitting || !name || !email}
            className="w-full mt-6 py-3.5 text-base font-bold text-white transition-all"
            style={{
              background: submitting ? t.textLight : t.accent,
              borderRadius: t.radius,
              opacity: (!name || !email) ? 0.5 : 1,
              cursor: (!name || !email) ? "default" : "pointer",
            }}>
            {submitting ? "Confirming..." : "Confirm Reservation"}
          </button>

          {phone && (
            <p className="text-center text-xs mt-3" style={{ color: t.textLight }}>
              Questions? Call <a href={`tel:${phone}`} className="underline" style={{ color: t.textMuted }}>{phone}</a>
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .checkmark-draw { stroke-dasharray: 24; stroke-dashoffset: 24; animation: draw 0.4s 0.3s ease forwards; }
        @keyframes draw { to { stroke-dashoffset: 0; } }
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
