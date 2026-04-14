"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBusiness, setupBusiness } from "@/lib/restaurant-actions";

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", slug: "", email: "", password: "", cuisine: "", price_range: "$$",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setForm(f => ({ ...f, name, slug }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Restaurant name is required.");
    if (!form.slug.trim()) return setError("URL slug is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (!/^[a-z0-9-]+$/.test(form.slug)) return setError("URL can only contain lowercase letters, numbers, and hyphens.");

    setLoading(true);
    try {
      const { id } = await createBusiness({
        name: form.name.trim(),
        slug: form.slug.trim(),
        type: "restaurant",
        cuisine: form.cuisine.trim(),
        price_range: form.price_range,
        email: form.email.trim(),
      });

      await setupBusiness(id, form.slug.trim(), {
        adminEmail: form.email.trim(),
        staffPin: Math.floor(1000 + Math.random() * 9000).toString(),
        adminPassword: form.password,
      });

      router.push(`/r/${form.slug}/admin`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. The slug may already be taken.");
      setLoading(false);
    }
  }

  const inputClass = "w-full border border-neutral-200 rounded-lg px-4 py-3 text-base bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";
  const labelClass = "block text-sm font-semibold text-neutral-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>Restaurant Name</label>
        <input value={form.name} onChange={e => handleNameChange(e.target.value)}
          placeholder="The Golden Fork" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Your URL</label>
        <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-neutral-900/10">
          <span className="bg-neutral-50 px-3 py-3 text-sm text-neutral-400 border-r border-neutral-200 whitespace-nowrap">itsremi.app/r/</span>
          <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
            placeholder="golden-fork" className="flex-1 px-3 py-3 text-base bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Cuisine</label>
          <input value={form.cuisine} onChange={e => setForm(f => ({ ...f, cuisine: e.target.value }))}
            placeholder="Italian, Mexican..." className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Price Range</label>
          <select value={form.price_range} onChange={e => setForm(f => ({ ...f, price_range: e.target.value }))} className={inputClass}>
            <option value="$">$ — Casual</option>
            <option value="$$">$$ — Moderate</option>
            <option value="$$$">$$$ — Upscale</option>
            <option value="$$$$">$$$$ — Fine Dining</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Admin Email</label>
        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="you@restaurant.com" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Admin Password</label>
        <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          placeholder="At least 6 characters" className={inputClass} />
      </div>

      {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full rounded-full bg-neutral-900 text-white py-4 text-base font-bold hover:bg-neutral-700 disabled:opacity-50 transition-colors">
        {loading ? "Creating your restaurant..." : "Create Restaurant"}
      </button>

      <p className="text-xs text-neutral-400 text-center">
        $99/mo after setup. No per-reservation fees. Cancel anytime.
      </p>
    </form>
  );
}
