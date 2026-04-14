"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateBusinessSettings, updateBusinessHours,
  addTable, addMenuItem,
} from "@/lib/restaurant-actions";
import { themes, type ThemeId } from "@/lib/themes";

type Business = {
  id: string; name: string; slug: string; theme: string;
  about: string; cuisine: string; address: string; phone: string;
};

type Hour = {
  id: string; day_of_week: number; open_time: string; close_time: string;
  last_seating: string | null; is_closed: boolean;
};

type TableRow = {
  id: string; name: string; zone: string; capacity: number;
};

type MenuRow = {
  id: string; category: string; name: string; description: string;
  price_cents: number; dietary_flags: string[];
};

type Step = "theme" | "hours" | "tables" | "menu" | "done";
const STEPS: Step[] = ["theme", "hours", "tables", "menu", "done"];
const STEP_LABELS: Record<Step, string> = {
  theme: "Pick a look", hours: "Set your hours", tables: "Add tables", menu: "Add menu", done: "You're live",
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function OnboardingWizard({ business, slug, existingHours, existingTables, existingMenu }: {
  business: Business; slug: string;
  existingHours: Hour[]; existingTables: TableRow[]; existingMenu: MenuRow[];
}) {
  const router = useRouter();

  // Figure out starting step based on what's already been filled in
  function getStartStep(): Step {
    if (existingMenu.length > 0) return "done";
    if (existingTables.length > 0) return "menu";
    if (existingHours.length > 0) return "tables";
    return "theme";
  }

  const [step, setStep] = useState<Step>(getStartStep());
  const stepIdx = STEPS.indexOf(step);

  function next() {
    if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1]);
  }

  return (
    <div>
      {/* Progress bar */}
      {step !== "done" && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {STEPS.filter(s => s !== "done").map((s, i) => {
              const current = STEPS.indexOf(step);
              const done = i < current;
              const active = i === current;
              return (
                <button key={s} onClick={() => i <= current && setStep(s)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    active ? "text-neutral-900" : done ? "text-neutral-400 cursor-pointer" : "text-neutral-300 cursor-default"
                  }`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    active ? "bg-neutral-900 text-white" : done ? "bg-neutral-200 text-neutral-600" : "bg-neutral-100 text-neutral-300"
                  }`}>{done ? "✓" : i + 1}</span>
                  <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
                </button>
              );
            })}
          </div>
          <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-neutral-900 rounded-full transition-all duration-500"
              style={{ width: `${((stepIdx + 1) / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>
      )}

      {step === "theme" && <ThemeStep business={business} onDone={next} />}
      {step === "hours" && <HoursStep businessId={business.id} existing={existingHours} onDone={next} />}
      {step === "tables" && <TablesStep businessId={business.id} existing={existingTables} onDone={next} />}
      {step === "menu" && <MenuStep businessId={business.id} existing={existingMenu} onDone={next} />}
      {step === "done" && <DoneStep slug={slug} businessName={business.name} />}
    </div>
  );
}

// ── Step 1: Theme ──

function ThemeStep({ business, onDone }: { business: Business; onDone: () => void }) {
  const [selected, setSelected] = useState<ThemeId>((business.theme as ThemeId) || "classic");
  const [saving, setSaving] = useState(false);

  async function handleNext() {
    setSaving(true);
    await updateBusinessSettings(business.id, { theme: selected });
    setSaving(false);
    onDone();
  }

  const themeIds = Object.keys(themes) as ThemeId[];

  return (
    <div>
      <h2 className="text-3xl font-bold text-neutral-900 mb-2">Pick your look</h2>
      <p className="text-base text-neutral-500 mb-8">Choose a theme for your restaurant's website. You can change this anytime.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {themeIds.map(id => {
          const t = themes[id];
          const active = selected === id;
          return (
            <button key={id} onClick={() => setSelected(id)}
              className={`text-left rounded-xl border-2 overflow-hidden transition-all ${
                active ? "border-neutral-900 shadow-lg scale-[1.02]" : "border-neutral-200 hover:border-neutral-400"
              }`}>
              {/* Color preview bar */}
              <div className="flex h-16">
                <div className="flex-1" style={{ background: t.colors.navBg }} />
                <div className="flex-1" style={{ background: t.colors.heroBg }} />
                <div className="flex-1" style={{ background: t.colors.accent }} />
                <div className="flex-1" style={{ background: t.colors.surface }} />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base font-bold text-neutral-900">{t.label}</span>
                  {active && <span className="text-xs font-bold text-white bg-neutral-900 px-2 py-0.5 rounded-full">Selected</span>}
                </div>
                <p className="text-sm text-neutral-500">{t.description}</p>
                <div className="flex gap-2 mt-2 text-xs text-neutral-400">
                  <span>{t.navStyle} nav</span>
                  <span>·</span>
                  <span>{t.heroStyle} hero</span>
                  <span>·</span>
                  <span>{t.menuStyle} menu</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button onClick={handleNext} disabled={saving}
        className="w-full sm:w-auto px-8 py-4 bg-neutral-900 text-white text-base font-bold rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors">
        {saving ? "Saving..." : "Next — Set Hours"}
      </button>
    </div>
  );
}

// ── Step 2: Hours ──

function HoursStep({ businessId, existing, onDone }: { businessId: string; existing: Hour[]; onDone: () => void }) {
  const [hours, setHours] = useState(() => {
    const map = new Map(existing.map(h => [h.day_of_week, h]));
    return Array.from({ length: 7 }, (_, i) => ({
      day: i,
      is_closed: map.get(i)?.is_closed ?? (i === 0 || i === 1),
      open_time: map.get(i)?.open_time ?? "17:00",
      close_time: map.get(i)?.close_time ?? "22:00",
      last_seating: map.get(i)?.last_seating ?? "20:30",
    }));
  });
  const [saving, setSaving] = useState(false);

  function toggleDay(day: number) {
    setHours(h => h.map(d => d.day === day ? { ...d, is_closed: !d.is_closed } : d));
  }

  function updateField(day: number, field: string, value: string) {
    setHours(h => h.map(d => d.day === day ? { ...d, [field]: value } : d));
  }

  // Copy from one day to all open days
  function copyToAll(sourceDay: number) {
    const src = hours.find(h => h.day === sourceDay);
    if (!src) return;
    setHours(h => h.map(d => d.is_closed ? d : {
      ...d, open_time: src.open_time, close_time: src.close_time, last_seating: src.last_seating,
    }));
  }

  async function handleNext() {
    setSaving(true);
    await updateBusinessHours(businessId, hours.map(h => ({
      day_of_week: h.day, open_time: h.open_time, close_time: h.close_time,
      last_seating: h.last_seating, is_closed: h.is_closed,
    })));
    setSaving(false);
    onDone();
  }

  const inputClass = "border border-neutral-200 rounded-lg px-2.5 py-2 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";

  return (
    <div>
      <h2 className="text-3xl font-bold text-neutral-900 mb-2">Set your hours</h2>
      <p className="text-base text-neutral-500 mb-8">When are you open? Toggle days on/off and set times. You can edit these later.</p>

      <div className="space-y-3 mb-8">
        {hours.map(h => (
          <div key={h.day} className={`flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors ${
            h.is_closed ? "border-neutral-100 bg-neutral-50" : "border-neutral-200 bg-white"
          }`}>
            <button onClick={() => toggleDay(h.day)}
              className={`w-20 text-left text-sm font-semibold transition-colors ${h.is_closed ? "text-neutral-300" : "text-neutral-900"}`}>
              {DAYS[h.day]}
            </button>

            <button onClick={() => toggleDay(h.day)}
              className={`w-12 h-7 rounded-full transition-colors relative ${h.is_closed ? "bg-neutral-200" : "bg-neutral-900"}`}>
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                h.is_closed ? "left-0.5" : "left-[22px]"
              }`} />
            </button>

            {h.is_closed ? (
              <span className="text-sm text-neutral-300 flex-1">Closed</span>
            ) : (
              <div className="flex items-center gap-3 flex-1">
                <input type="time" value={h.open_time} onChange={e => updateField(h.day, "open_time", e.target.value)} className={inputClass} />
                <span className="text-neutral-300">—</span>
                <input type="time" value={h.close_time} onChange={e => updateField(h.day, "close_time", e.target.value)} className={inputClass} />
                <span className="text-xs text-neutral-400 hidden sm:inline">Last seat:</span>
                <input type="time" value={h.last_seating ?? ""} onChange={e => updateField(h.day, "last_seating", e.target.value)}
                  className={`${inputClass} hidden sm:block`} />
                <button onClick={() => copyToAll(h.day)} className="text-xs text-neutral-400 hover:text-neutral-700 whitespace-nowrap transition-colors">
                  Copy to all
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={handleNext} disabled={saving}
        className="w-full sm:w-auto px-8 py-4 bg-neutral-900 text-white text-base font-bold rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors">
        {saving ? "Saving..." : "Next — Add Tables"}
      </button>
    </div>
  );
}

// ── Step 3: Tables ──

function TablesStep({ businessId, existing, onDone }: { businessId: string; existing: TableRow[]; onDone: () => void }) {
  const [tables, setTables] = useState<TableRow[]>(existing);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", zone: "Main", capacity: "4" });
  const [saving, setSaving] = useState(false);

  // Quick-add presets
  const presets = [
    { label: "4 two-tops", tables: [{ name: "T1", cap: 2 }, { name: "T2", cap: 2 }, { name: "T3", cap: 2 }, { name: "T4", cap: 2 }] },
    { label: "4 four-tops", tables: [{ name: "T5", cap: 4 }, { name: "T6", cap: 4 }, { name: "T7", cap: 4 }, { name: "T8", cap: 4 }] },
    { label: "2 six-tops", tables: [{ name: "T9", cap: 6 }, { name: "T10", cap: 6 }] },
    { label: "Bar (8 seats)", tables: [{ name: "Bar", cap: 8 }] },
  ];

  async function handleAddPreset(preset: typeof presets[0]) {
    setSaving(true);
    for (const t of preset.tables) {
      const result = await addTable(businessId, { name: t.name, zone: "Main", capacity: t.cap, shape: "circle" });
      setTables(prev => [...prev, { id: result.id, name: t.name, zone: "Main", capacity: t.cap }]);
    }
    setSaving(false);
  }

  async function handleAddCustom() {
    if (!form.name.trim()) return;
    setSaving(true);
    const result = await addTable(businessId, {
      name: form.name, zone: form.zone, capacity: parseInt(form.capacity) || 4, shape: "circle",
    });
    setTables(prev => [...prev, { id: result.id, name: form.name, zone: form.zone, capacity: parseInt(form.capacity) || 4 }]);
    setForm({ name: "", zone: form.zone, capacity: "4" });
    setSaving(false);
  }

  const inputClass = "border border-neutral-200 rounded-lg px-3 py-2.5 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";

  return (
    <div>
      <h2 className="text-3xl font-bold text-neutral-900 mb-2">Add your tables</h2>
      <p className="text-base text-neutral-500 mb-8">
        These are used for reservations and the host stand floor view. You can rearrange them on the floor plan later.
      </p>

      {/* Quick presets */}
      {tables.length === 0 && (
        <div className="mb-8">
          <p className="text-sm font-semibold text-neutral-600 mb-3">Quick start — add a common layout:</p>
          <div className="flex flex-wrap gap-2">
            {presets.map(p => (
              <button key={p.label} onClick={() => handleAddPreset(p)} disabled={saving}
                className="px-4 py-2.5 border-2 border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50 transition-colors">
                + {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current tables */}
      {tables.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {tables.map(t => (
              <div key={t.id} className="flex items-center gap-2 border border-neutral-200 rounded-lg px-3 py-2 bg-white">
                <span className="text-sm font-bold text-neutral-900">{t.name}</span>
                <span className="text-xs text-neutral-400">{t.capacity} seats</span>
                {t.zone !== "Main" && <span className="text-xs text-neutral-400">· {t.zone}</span>}
              </div>
            ))}
          </div>
          <p className="text-sm text-neutral-400 mt-2">{tables.length} tables · {tables.reduce((s, t) => s + t.capacity, 0)} total seats</p>
        </div>
      )}

      {/* Add more */}
      {tables.length > 0 && !adding && (
        <button onClick={() => setAdding(true)} className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors mb-6">
          + Add more tables
        </button>
      )}

      {/* Quick presets after first batch */}
      {tables.length > 0 && adding && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {presets.map(p => (
              <button key={p.label} onClick={() => handleAddPreset(p)} disabled={saving}
                className="px-3 py-2 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-600 hover:border-neutral-400 disabled:opacity-50 transition-colors">
                + {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-end">
            <div>
              <label className="text-xs font-semibold text-neutral-500 mb-1 block">Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="T11" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 mb-1 block">Zone</label>
              <input value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} placeholder="Main" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 mb-1 block">Seats</label>
              <select value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className={inputClass}>
                {[2, 4, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button onClick={handleAddCustom} disabled={saving || !form.name.trim()}
              className="px-4 py-2.5 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors">
              Add
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <button onClick={onDone} disabled={tables.length === 0}
          className="w-full sm:w-auto px-8 py-4 bg-neutral-900 text-white text-base font-bold rounded-lg hover:bg-neutral-700 disabled:opacity-30 transition-colors">
          {tables.length === 0 ? "Add at least one table" : "Next — Add Menu"}
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Menu ──

function MenuStep({ businessId, existing, onDone }: { businessId: string; existing: MenuRow[]; onDone: () => void }) {
  const [items, setItems] = useState<MenuRow[]>(existing);
  const [form, setForm] = useState({ category: "Starters", name: "", description: "", price: "", flags: "" });
  const [saving, setSaving] = useState(false);

  const categories = [...new Set(items.map(m => m.category))];

  // Quick-add single item
  async function handleAdd() {
    if (!form.name.trim()) return;
    setSaving(true);
    await addMenuItem(businessId, {
      category: form.category, name: form.name, description: form.description,
      price_cents: Math.round(parseFloat(form.price || "0") * 100),
      dietary_flags: form.flags.split(",").map(f => f.trim()).filter(Boolean),
    });
    setItems(prev => [...prev, {
      id: Date.now().toString(), category: form.category, name: form.name,
      description: form.description, price_cents: Math.round(parseFloat(form.price || "0") * 100),
      dietary_flags: form.flags.split(",").map(f => f.trim()).filter(Boolean),
    }]);
    setForm({ ...form, name: "", description: "", price: "", flags: "" });
    setSaving(false);
  }

  const inputClass = "border border-neutral-200 rounded-lg px-3 py-2.5 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";

  const suggestedCategories = ["Starters", "Mains", "Desserts", "Drinks", "Sides"];

  return (
    <div>
      <h2 className="text-3xl font-bold text-neutral-900 mb-2">Add menu items</h2>
      <p className="text-base text-neutral-500 mb-8">
        Your menu shows on your website. Add a few items now — you can always add more later.
      </p>

      {/* Add form */}
      <div className="border-2 border-neutral-200 rounded-xl p-5 mb-6 bg-neutral-50">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs font-semibold text-neutral-500 mb-1 block">Category</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {suggestedCategories.map(c => (
                <button key={c} onClick={() => setForm({ ...form, category: c })}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                    form.category === c ? "bg-neutral-900 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400"
                  }`}>{c}</button>
              ))}
            </div>
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              placeholder="Or type your own..." className={`${inputClass} w-full`} />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 mb-1 block">Price</label>
            <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
              placeholder="14.00" className={`${inputClass} w-full mt-7`} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs font-semibold text-neutral-500 mb-1 block">Item Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Pan-Seared Salmon" className={`${inputClass} w-full`} />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 mb-1 block">Dietary flags</label>
            <input value={form.flags} onChange={e => setForm({ ...form, flags: e.target.value })}
              placeholder="V, GF, DF" className={`${inputClass} w-full`} />
          </div>
        </div>
        <div className="mb-3">
          <label className="text-xs font-semibold text-neutral-500 mb-1 block">Description</label>
          <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Lentils du Puy, herb butter, haricots verts" className={`${inputClass} w-full`} />
        </div>
        <button onClick={handleAdd} disabled={saving || !form.name.trim()}
          className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors">
          {saving ? "Adding..." : "+ Add Item"}
        </button>
      </div>

      {/* Current items */}
      {items.length > 0 && (
        <div className="mb-8">
          {[...new Set(items.map(m => m.category))].map(cat => (
            <div key={cat} className="mb-4">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">{cat}</h4>
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                {items.filter(m => m.category === cat).map((item, i) => (
                  <div key={item.id} className={`flex items-center justify-between px-4 py-2.5 ${i > 0 ? "border-t border-neutral-100" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-neutral-900">{item.name}</span>
                      {item.dietary_flags?.length > 0 && (
                        <span className="text-xs text-neutral-400 ml-2">{item.dietary_flags.join(", ")}</span>
                      )}
                      {item.description && <div className="text-xs text-neutral-500 mt-0.5 truncate">{item.description}</div>}
                    </div>
                    {item.price_cents > 0 && (
                      <span className="text-sm tabular-nums font-medium text-neutral-700 ml-4">${(item.price_cents / 100).toFixed(0)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-sm text-neutral-400">{items.length} items across {new Set(items.map(m => m.category)).size} categories</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onDone}
          className="px-8 py-4 bg-neutral-900 text-white text-base font-bold rounded-lg hover:bg-neutral-700 transition-colors">
          {items.length === 0 ? "Skip for now" : "Finish Setup"}
        </button>
        {items.length === 0 && (
          <p className="text-sm text-neutral-400 self-center">You can add menu items later from your admin dashboard.</p>
        )}
      </div>
    </div>
  );
}

// ── Done ──

function DoneStep({ slug, businessName }: { slug: string; businessName: string }) {
  const router = useRouter();

  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 className="text-3xl font-bold text-neutral-900 mb-3">{businessName} is live</h2>
      <p className="text-base text-neutral-500 mb-10 max-w-md mx-auto">
        Your restaurant website is ready. Share it with your team, customize the floor plan, and start taking reservations.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
        <a href={`/r/${slug}`} target="_blank"
          className="px-8 py-4 border-2 border-neutral-200 text-neutral-900 text-base font-bold rounded-lg hover:border-neutral-400 transition-colors">
          View Your Site
        </a>
        <button onClick={() => router.push(`/r/${slug}/admin`)}
          className="px-8 py-4 bg-neutral-900 text-white text-base font-bold rounded-lg hover:bg-neutral-700 transition-colors">
          Go to Dashboard
        </button>
      </div>

      <div className="max-w-sm mx-auto text-left border border-neutral-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-neutral-900 mb-3">Next up</h3>
        <div className="space-y-2 text-sm text-neutral-600">
          <div className="flex gap-3 items-start">
            <span className="w-5 h-5 rounded bg-neutral-100 flex items-center justify-center text-xs text-neutral-400 shrink-0 mt-0.5">1</span>
            <span>Drag tables on the <strong>Floor Plan</strong> to match your room layout</span>
          </div>
          <div className="flex gap-3 items-start">
            <span className="w-5 h-5 rounded bg-neutral-100 flex items-center justify-center text-xs text-neutral-400 shrink-0 mt-0.5">2</span>
            <span>Upload photos in the <strong>Photos</strong> tab</span>
          </div>
          <div className="flex gap-3 items-start">
            <span className="w-5 h-5 rounded bg-neutral-100 flex items-center justify-center text-xs text-neutral-400 shrink-0 mt-0.5">3</span>
            <span>Set up your <strong>custom domain</strong> in the Domain tab</span>
          </div>
          <div className="flex gap-3 items-start">
            <span className="w-5 h-5 rounded bg-neutral-100 flex items-center justify-center text-xs text-neutral-400 shrink-0 mt-0.5">4</span>
            <span>Share the <strong>staff PIN</strong> with your host team for floor view</span>
          </div>
        </div>
      </div>
    </div>
  );
}
