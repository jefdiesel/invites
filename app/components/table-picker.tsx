"use client";

type Table = {
  id: string; name: string; zone: string; capacity: number;
  is_active: boolean;
};

type Booking = {
  id: string; table_id: string | null; status: string;
  booking_time: string; duration_minutes: number | null; party_size: number;
};

export function TablePicker({ tables, bookings, partySize, currentTableId, onSelect, slotDuration, compact }: {
  tables: Table[];
  bookings: Booking[];
  partySize: number;
  currentTableId: string | null;
  onSelect: (tableId: string) => void;
  slotDuration?: number;
  compact?: boolean;
}) {
  const activeTables = tables.filter(t => t.is_active);
  const zones = [...new Set(activeTables.map(t => t.zone || "Main"))];

  // Which tables are currently occupied (have a seated booking)
  const occupiedIds = new Set(bookings.filter(b => b.status === "seated" && b.table_id).map(b => b.table_id!));
  // Which tables have a confirmed booking (reserved)
  const reservedIds = new Set(bookings.filter(b => b.status === "confirmed" && b.table_id).map(b => b.table_id!));

  const cls = compact
    ? "border border-neutral-200 rounded px-2 py-1 text-xs bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
    : "border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";

  return (
    <select
      value={currentTableId || ""}
      onChange={e => { if (e.target.value) onSelect(e.target.value); }}
      className={cls}
    >
      <option value="">—</option>
      {zones.map(zone => {
        const zoneTables = activeTables.filter(t => (t.zone || "Main") === zone)
          .sort((a, b) => {
            // Tables that fit the party first
            const aFits = a.capacity >= partySize ? 0 : 1;
            const bFits = b.capacity >= partySize ? 0 : 1;
            if (aFits !== bFits) return aFits - bFits;
            return a.capacity - b.capacity;
          });

        return (
          <optgroup key={zone} label={zone}>
            {zoneTables.map(t => {
              const occupied = occupiedIds.has(t.id);
              const reserved = reservedIds.has(t.id);
              const tooSmall = t.capacity < partySize;
              const suffix = occupied ? " (seated)" : reserved ? " (reserved)" : tooSmall ? " (small)" : "";
              return (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.capacity}p{suffix}
                </option>
              );
            })}
          </optgroup>
        );
      })}
    </select>
  );
}
