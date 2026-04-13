"use client";

import { useState, useRef, useCallback } from "react";
import { addTable, updateTablePosition, updateTable, deleteTable } from "@/lib/restaurant-actions";
import { useRouter } from "next/navigation";

type Table = {
  id: string;
  name: string;
  zone: string;
  capacity: number;
  shape: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  is_active: boolean;
};

const CAPACITY_OPTIONS = [2, 4, 6, 8, 10, 12];

function getDefaultSize(capacity: number, shape: string): { w: number; h: number } {
  if (shape === "circle") {
    if (capacity <= 2) return { w: 6, h: 6 };
    if (capacity <= 4) return { w: 8, h: 8 };
    if (capacity <= 6) return { w: 10, h: 10 };
    return { w: 12, h: 12 };
  }
  // rectangle
  if (capacity <= 2) return { w: 8, h: 5 };
  if (capacity <= 4) return { w: 10, h: 6 };
  if (capacity <= 6) return { w: 13, h: 7 };
  return { w: 16, h: 8 };
}

function ChairDots({ shape, capacity, w, h }: { shape: string; capacity: number; w: number; h: number }) {
  const dots: { x: number; y: number }[] = [];
  const dotSize = 1.2; // percentage

  if (shape === "circle") {
    const r = Math.max(w, h) / 2 + dotSize;
    for (let i = 0; i < capacity; i++) {
      const angle = (2 * Math.PI * i) / capacity - Math.PI / 2;
      dots.push({ x: 50 + Math.cos(angle) * (r / w * 100), y: 50 + Math.sin(angle) * (r / h * 100) });
    }
  } else {
    // Rectangle: chairs along long sides
    const perSide = Math.ceil(capacity / 2);
    for (let i = 0; i < perSide; i++) {
      const xPct = ((i + 1) / (perSide + 1)) * 100;
      dots.push({ x: xPct, y: -dotSize / h * 100 - 15 }); // top
      if (dots.length < capacity) {
        dots.push({ x: xPct, y: 100 + dotSize / h * 100 + 15 }); // bottom
      }
    }
  }

  return (
    <>
      {dots.map((d, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-neutral-400"
          style={{
            width: `${dotSize / w * 100}%`,
            height: `${dotSize / h * 100}%`,
            left: `${d.x}%`,
            top: `${d.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </>
  );
}

export function FloorEditor({ businessId, tables: initialTables }: { businessId: string; tables: Table[] }) {
  const [tables, setTables] = useState(initialTables);
  const [zones, setZones] = useState(() => {
    const z = [...new Set(initialTables.map((t) => t.zone))];
    return z.length > 0 ? z : ["Main Dining"];
  });
  const [activeZone, setActiveZone] = useState(zones[0]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCapacity, setNewCapacity] = useState(4);
  const [newShape, setNewShape] = useState("circle");
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const router = useRouter();

  const zoneTables = tables.filter((t) => t.zone === activeZone && t.is_active);
  const selected = selectedId ? tables.find((t) => t.id === selectedId) : null;

  const handlePointerDown = useCallback((e: React.PointerEvent, table: Table) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(table.id);
    dragRef.current = { id: table.id, startX: e.clientX, startY: e.clientY, origX: table.pos_x, origY: table.pos_y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
    const newX = Math.max(0, Math.min(100, dragRef.current.origX + dx));
    const newY = Math.max(0, Math.min(100, dragRef.current.origY + dy));

    setTables((prev) =>
      prev.map((t) => t.id === dragRef.current!.id ? { ...t, pos_x: newX, pos_y: newY } : t)
    );
  }, []);

  const handlePointerUp = useCallback(async () => {
    if (!dragRef.current) return;
    const table = tables.find((t) => t.id === dragRef.current!.id);
    if (table) {
      // Find the updated position from state
      const updated = document.querySelector(`[data-table-id="${dragRef.current.id}"]`);
      const t = tables.find((t) => t.id === dragRef.current!.id);
      if (t) await updateTablePosition(t.id, { pos_x: t.pos_x, pos_y: t.pos_y });
    }
    dragRef.current = null;
  }, [tables]);

  async function handleAddTable() {
    if (!newName.trim()) return;
    setSaving(true);
    await addTable(businessId, { name: newName.trim(), zone: activeZone, capacity: newCapacity, shape: newShape });
    setAdding(false);
    setNewName("");
    setNewCapacity(4);
    setNewShape("circle");
    setSaving(false);
    router.refresh();
  }

  async function handleUpdateTable(field: string, value: string | number | boolean) {
    if (!selected) return;
    const updates: Record<string, string | number | boolean> = { [field]: value };

    // If changing capacity or shape, update dimensions
    if (field === "capacity" || field === "shape") {
      const cap = field === "capacity" ? (value as number) : selected.capacity;
      const sh = field === "shape" ? (value as string) : selected.shape;
      const size = getDefaultSize(cap, sh);
      updates.width = size.w;
      updates.height = size.h;
    }

    setTables((prev) => prev.map((t) => t.id === selected.id ? { ...t, ...updates } : t));
    await updateTable(selected.id, updates as Parameters<typeof updateTable>[1]);
  }

  async function handleDeleteTable() {
    if (!selected) return;
    await deleteTable(selected.id);
    setSelectedId(null);
    setTables((prev) => prev.filter((t) => t.id !== selected.id));
  }

  function handleAddZone() {
    if (!newZoneName.trim()) return;
    setZones((prev) => [...prev, newZoneName.trim()]);
    setActiveZone(newZoneName.trim());
    setAddingZone(false);
    setNewZoneName("");
  }

  return (
    <div>
      {/* Zone tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-neutral-200">
        {zones.map((z) => (
          <button
            key={z}
            onClick={() => { setActiveZone(z); setSelectedId(null); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
              activeZone === z ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {z} ({tables.filter((t) => t.zone === z && t.is_active).length})
          </button>
        ))}
        {addingZone ? (
          <div className="flex items-center gap-2 px-2">
            <input
              type="text"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              placeholder="Room name"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleAddZone(); if (e.key === "Escape") setAddingZone(false); }}
              className="border border-neutral-300 rounded px-2 py-1 text-sm w-32"
            />
            <button onClick={handleAddZone} className="text-sm font-medium text-neutral-900">Add</button>
            <button onClick={() => setAddingZone(false)} className="text-sm text-neutral-400">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setAddingZone(true)} className="px-3 py-2.5 text-sm text-neutral-400 hover:text-neutral-600 transition-colors">
            + Room
          </button>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative border border-neutral-200 rounded-xl bg-neutral-50 overflow-hidden select-none"
        style={{ aspectRatio: "16 / 10" }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => setSelectedId(null)}
      >
        {/* Grid dots */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle, #999 0.5px, transparent 0.5px)",
          backgroundSize: "5% 8%",
        }} />

        {/* Tables */}
        {zoneTables.map((table) => {
          const isSelected = table.id === selectedId;
          return (
            <div
              key={table.id}
              data-table-id={table.id}
              className={`absolute cursor-grab active:cursor-grabbing transition-shadow ${
                isSelected ? "ring-2 ring-blue-500 ring-offset-2 z-20" : "z-10 hover:ring-2 hover:ring-neutral-300"
              }`}
              style={{
                left: `${table.pos_x}%`,
                top: `${table.pos_y}%`,
                width: `${table.width}%`,
                height: `${table.height}%`,
                transform: "translate(-50%, -50%)",
                borderRadius: table.shape === "circle" ? "50%" : "12%",
                background: isSelected ? "#2563eb" : "#374151",
              }}
              onPointerDown={(e) => handlePointerDown(e, table)}
              onClick={(e) => { e.stopPropagation(); setSelectedId(table.id); }}
            >
              {/* Table label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
                <span className="text-xs font-bold leading-none">{table.name}</span>
                <span className="text-[9px] opacity-60 leading-none mt-0.5">{table.capacity}</span>
              </div>
              {/* Chair dots */}
              <ChairDots shape={table.shape} capacity={table.capacity} w={table.width} h={table.height} />
            </div>
          );
        })}

        {/* Empty state */}
        {zoneTables.length === 0 && !adding && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-neutral-400 mb-3">No tables in {activeZone}</p>
              <button onClick={() => setAdding(true)}
                className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-bold hover:bg-neutral-700 transition-colors">
                Add First Table
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-bold hover:bg-neutral-700 transition-colors"
          >
            + Add Table
          </button>
          <span className="text-sm text-neutral-400">
            {zoneTables.length} tables · {zoneTables.reduce((s, t) => s + t.capacity, 0)} seats in {activeZone}
          </span>
        </div>
        <span className="text-xs text-neutral-400">Drag to reposition</span>
      </div>

      {/* Add table form */}
      {adding && (
        <div className="mt-4 border border-neutral-200 rounded-xl bg-white p-4">
          <h3 className="text-sm font-bold text-neutral-900 mb-3">New Table</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Name / Number</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="12"
                autoFocus
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Seats</label>
              <select
                value={newCapacity}
                onChange={(e) => setNewCapacity(Number(e.target.value))}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              >
                {CAPACITY_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n} seats</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Shape</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewShape("circle")}
                  className={`flex-1 border rounded-lg py-2 text-sm font-medium transition-colors ${
                    newShape === "circle" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-600"
                  }`}
                >
                  Circle
                </button>
                <button
                  onClick={() => setNewShape("rect")}
                  className={`flex-1 border rounded-lg py-2 text-sm font-medium transition-colors ${
                    newShape === "rect" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-600"
                  }`}
                >
                  Rect
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddTable} disabled={saving || !newName.trim()}
              className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-bold hover:bg-neutral-700 disabled:opacity-40 transition-colors">
              {saving ? "Adding..." : "Add"}
            </button>
            <button onClick={() => setAdding(false)} className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors px-3">Cancel</button>
          </div>
        </div>
      )}

      {/* Selected table edit panel */}
      {selected && (
        <div className="mt-4 border border-blue-200 rounded-xl bg-blue-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-900">Edit Table</h3>
            <button onClick={() => setSelectedId(null)} className="text-xs text-neutral-400 hover:text-neutral-600">Close</button>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Name</label>
              <input
                type="text"
                value={selected.name}
                onChange={(e) => handleUpdateTable("name", e.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Seats</label>
              <select
                value={selected.capacity}
                onChange={(e) => handleUpdateTable("capacity", Number(e.target.value))}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {CAPACITY_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Shape</label>
              <div className="flex gap-1">
                <button
                  onClick={() => handleUpdateTable("shape", "circle")}
                  className={`flex-1 border rounded-lg py-2 text-xs font-medium transition-colors ${
                    selected.shape === "circle" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-600 bg-white"
                  }`}
                >
                  Circle
                </button>
                <button
                  onClick={() => handleUpdateTable("shape", "rect")}
                  className={`flex-1 border rounded-lg py-2 text-xs font-medium transition-colors ${
                    selected.shape === "rect" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-600 bg-white"
                  }`}
                >
                  Rect
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Room</label>
              <select
                value={selected.zone}
                onChange={(e) => handleUpdateTable("zone", e.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {zones.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={handleDeleteTable} className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
            Delete Table
          </button>
        </div>
      )}
    </div>
  );
}
