"use client";

import { useState } from "react";
import { createBooking } from "@/lib/restaurant-actions";

type Slot = { time: string; available: boolean };

export function BookingForm({
  businessId, slug, minParty, maxParty, windowDays,
}: {
  businessId: string; slug: string; minParty: number; maxParty: number; windowDays: number;
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
  const inputClass = "w-full rounded-lg border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors";

  if (step === "confirmed") {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-emerald-600 text-2xl">&#10003;</span>
        </div>
        <h2 className="text-xl font-bold text-warm-900">Reservation Confirmed</h2>
        <p className="text-base text-warm-500 mt-2">
          {name}, party of {partySize}<br />
          {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {formatTime(selectedTime)}
        </p>
        <p className="text-sm text-warm-400 mt-4">A confirmation has been sent to {email}.</p>
        <a href={`/r/${slug}`} className="inline-block mt-8 text-sm font-medium text-accent hover:text-accent-light transition-colors">
          &larr; Back to {slug}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date + Party Size */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-warm-600 mb-1.5">Date</label>
          <input type="date" value={date} onChange={(e) => handleDateChange(e.target.value)}
            min={today} max={maxDate} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-600 mb-1.5">Party Size</label>
          <select value={partySize} onChange={(e) => handlePartySizeChange(Number(e.target.value))} className={inputClass}>
            {Array.from({ length: maxParty - minParty + 1 }, (_, i) => minParty + i).map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Time Slots */}
      {date && (
        <div>
          <label className="block text-sm font-medium text-warm-600 mb-2">Available Times</label>
          {loadingSlots ? (
            <div className="text-sm text-warm-400 py-4">Loading availability...</div>
          ) : availableSlots.length === 0 ? (
            <div className="text-sm text-warm-500 py-4 border border-warm-200 rounded-lg px-4 bg-white">
              {slots.length === 0 ? "Closed on this day." : "No availability for this party size. Try a different date."}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => { setSelectedTime(slot.time); if (step === "select") setStep("details"); }}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                    selectedTime === slot.time
                      ? "border-accent bg-accent text-white"
                      : "border-warm-200 bg-white text-warm-700 hover:border-accent hover:text-accent"
                  }`}
                >
                  {formatTime(slot.time)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Guest Details */}
      {step === "details" && selectedTime && (
        <>
          <div className="border-t border-warm-200 pt-6">
            <h3 className="text-base font-bold text-warm-900 mb-4">Your Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-warm-600 mb-1.5">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-600 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@email.com" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-600 mb-1.5">Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-0000" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-600 mb-1.5">Special requests</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Birthday, dietary needs, seating preference..." className={inputClass} />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

          <div className="border-t border-warm-200 pt-4">
            <div className="text-sm text-warm-500 mb-4">
              {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {formatTime(selectedTime)} · {partySize} {partySize === 1 ? "guest" : "guests"}
            </div>
            <button type="submit" disabled={submitting || !name || !email}
              className="w-full rounded-lg bg-accent py-3 text-base font-bold text-white hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {submitting ? "Confirming..." : "Confirm Reservation"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}
