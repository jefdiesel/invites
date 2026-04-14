"use client";

import { useState } from "react";
import { guestCancelBooking } from "@/lib/guest-actions";

type BookingRow = {
  id: string; booking_date: string; booking_time: string; party_size: number;
  status: string; notes: string;
  businesses?: { name: string; slug: string; phone?: string };
};

type Guest = { name: string; email: string; phone: string } | null;

export function GuestDashboard({ upcoming, past, guest }: {
  upcoming: BookingRow[]; past: BookingRow[]; guest: Guest;
}) {
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel(id: string) {
    setCancelling(true);
    await guestCancelBooking(id);
    setCancelling(false);
    setCancelId(null);
    location.reload();
  }

  return (
    <div>
      {guest && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">{guest.name}</h1>
          <p className="text-sm text-neutral-400">{guest.email}</p>
        </div>
      )}

      {/* Upcoming */}
      <div className="mb-10">
        <h2 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-4">
          Upcoming Reservations
        </h2>
        {upcoming.length === 0 ? (
          <div className="border border-neutral-200 rounded-xl p-8 text-center">
            <p className="text-neutral-400 mb-2">No upcoming reservations</p>
            <a href="/" className="text-sm font-medium text-neutral-900 underline">Browse restaurants</a>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(b => {
              const biz = b.businesses as { name: string; slug: string; phone?: string } | undefined;
              const dateStr = new Date(b.booking_date + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric",
              });

              return (
                <div key={b.id} className="border border-neutral-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <div className="text-base font-bold text-neutral-900">{biz?.name ?? "Restaurant"}</div>
                        <div className="text-sm text-neutral-600 mt-0.5">{dateStr}</div>
                        <div className="text-sm text-neutral-600">{fmtTime(b.booking_time)} · {b.party_size} {b.party_size === 1 ? "guest" : "guests"}</div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        b.status === "confirmed" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                      }`}>
                        {b.status === "confirmed" ? "Confirmed" : "Seated"}
                      </span>
                    </div>
                    {b.notes && <div className="text-sm text-neutral-400 mt-2">"{b.notes}"</div>}
                  </div>

                  <div className="flex border-t border-neutral-100">
                    {biz && (
                      <a href={`/r/${biz.slug}`} className="flex-1 py-3 text-center text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors border-r border-neutral-100">
                        View Restaurant
                      </a>
                    )}
                    {biz?.phone && (
                      <a href={`tel:${biz.phone}`} className="flex-1 py-3 text-center text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors border-r border-neutral-100">
                        Call
                      </a>
                    )}
                    {b.status === "confirmed" && (
                      cancelId === b.id ? (
                        <button onClick={() => handleCancel(b.id)} disabled={cancelling}
                          className="flex-1 py-3 text-center text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors">
                          {cancelling ? "Cancelling..." : "Confirm Cancel"}
                        </button>
                      ) : (
                        <button onClick={() => setCancelId(b.id)}
                          className="flex-1 py-3 text-center text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors">
                          Cancel
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-4">
            Past Reservations
          </h2>
          <div className="border border-neutral-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {past.map(b => {
                  const biz = b.businesses as { name: string; slug: string } | undefined;
                  return (
                    <tr key={b.id} className="border-b border-neutral-50">
                      <td className="px-4 py-3 text-neutral-500 tabular-nums">
                        {new Date(b.booking_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <a href={biz ? `/r/${biz.slug}` : "#"} className="font-medium text-neutral-700 hover:text-neutral-900 transition-colors">
                          {biz?.name ?? "Restaurant"}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-neutral-400 tabular-nums">{fmtTime(b.booking_time)}</td>
                      <td className="px-4 py-3 text-neutral-400 text-right tabular-nums">{b.party_size}p</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-medium ${
                          b.status === "cancelled" ? "text-rose-400" :
                          b.status === "no_show" ? "text-amber-400" :
                          "text-neutral-300"
                        }`}>
                          {b.status === "cancelled" ? "cancelled" : b.status === "no_show" ? "no-show" : "completed"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function fmtTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}
