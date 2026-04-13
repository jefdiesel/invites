"use client";

import { useState } from "react";
import { submitReview } from "@/lib/actions";
import { useRouter } from "next/navigation";

export function ReviewForm({ eventId }: { eventId: string }) {
  const [email, setEmail] = useState("");
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stars === 0 || !email) return;
    setSubmitting(true);
    setError("");
    try {
      await submitReview(eventId, email, stars, body);
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 p-5 text-center">
        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Review submitted. Thanks!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-5 space-y-4">
      <h3 className="text-sm font-bold text-warm-600 dark:text-warm-400 uppercase tracking-wider">Write a Review</h3>

      <div>
        <label className="block text-sm font-medium text-warm-500 mb-1.5">Your email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full max-w-xs rounded-lg border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-800 px-3 py-2.5 text-sm text-warm-900 dark:text-warm-100 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-500 mb-2">Rating</label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStars(i + 1)}
              onMouseEnter={() => setHoverStars(i + 1)}
              onMouseLeave={() => setHoverStars(0)}
              className="text-2xl transition-colors"
            >
              <span className={`${
                i < (hoverStars || stars)
                  ? "text-amber-400"
                  : "text-warm-200 dark:text-warm-700"
              }`}>&#9733;</span>
            </button>
          ))}
          {stars > 0 && <span className="text-sm text-warm-400 ml-2">{stars}/5</span>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-500 mb-1.5">Review (optional, 1000 chars max)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 1000))}
          rows={3}
          maxLength={1000}
          placeholder="How was the event?"
          className="w-full rounded-lg border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-800 px-3 py-2.5 text-sm text-warm-900 dark:text-warm-100 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
        />
        {body.length > 0 && (
          <p className="text-xs text-warm-400 mt-1 text-right">{body.length}/1000</p>
        )}
      </div>

      {error && <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

      <button
        type="submit"
        disabled={submitting || stars === 0 || !email}
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
