"use client";

import { useState } from "react";
import { cancelBooking } from "@/lib/restaurant-actions";

export function CancelButton({ bookingId, slug, accent }: { bookingId: string; slug: string; accent: string }) {
  const [cancelled, setCancelled] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    await cancelBooking(bookingId);
    setCancelled(true);
    setLoading(false);
  }

  if (cancelled) {
    return (
      <div>
        <p className="text-base font-semibold mb-4" style={{ color: "#059669" }}>
          Reservation cancelled.
        </p>
        <a href={`/r/${slug}/book`} className="text-sm font-medium" style={{ color: accent }}>
          Book a new reservation
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button onClick={handleCancel} disabled={loading}
        className="w-full py-3.5 text-base font-bold rounded-lg transition-colors disabled:opacity-50"
        style={{ background: "#dc2626", color: "#fff" }}>
        {loading ? "Cancelling..." : "Cancel Reservation"}
      </button>
      <a href={`/r/${slug}`} className="text-sm font-medium" style={{ color: accent }}>
        Keep my reservation
      </a>
    </div>
  );
}
