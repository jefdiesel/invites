"use client";

import { useState, useRef } from "react";
import { addMembers } from "@/lib/actions";
import { useRouter } from "next/navigation";

type MemberWithToken = { id: string; name: string; email: string; token: string | null; voted: boolean };
type ParsedMember = { name: string; email: string };

function parseCsv(text: string): ParsedMember[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const first = lines[0].toLowerCase();
  const hasHeader = first.includes("name") || first.includes("email");
  const dataLines = hasHeader ? lines.slice(1) : lines;
  return dataLines.map((line) => {
    const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length >= 2) {
      const a = parts[0], b = parts[1];
      if (a.includes("@")) return { name: b, email: a };
      return { name: a, email: b };
    }
    return { name: parts[0] || "", email: "" };
  }).filter((m) => m.name && m.email && m.email.includes("@"));
}

export function InviteUI({
  pollId, pollTitle, pollDescription, pollLocation, pollDeadline, options, members, baseUrl,
}: {
  pollId: string; pollTitle: string; pollDescription: string; pollLocation: string; pollDeadline: string | null;
  options: { id: string; label: string; starts_at: string; capacity: number | null }[];
  members: MemberWithToken[]; baseUrl: string;
}) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState<ParsedMember[]>([]);
  const [adding, setAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleCsvChange(text: string) { setCsvText(text); setCsvPreview(parseCsv(text)); }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const text = ev.target?.result as string; setCsvText(text); setCsvPreview(parseCsv(text)); };
    reader.readAsText(file);
  }

  async function handleAddMembers() {
    if (csvPreview.length === 0) return;
    setAdding(true); await addMembers(pollId, csvPreview); setCsvText(""); setCsvPreview([]); setAdding(false); router.refresh();
  }

  const pending = members.filter((m) => m.token && !m.voted);
  const voted = members.filter((m) => m.voted);

  function getVoteUrl(token: string) { return `${baseUrl}/vote/${token}`; }

  function copyLink(token: string, idx: number) {
    navigator.clipboard.writeText(getVoteUrl(token));
    setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 1500);
  }

  function copyAllLinks() {
    const text = pending.map((m) => `${m.name} <${m.email}>: ${getVoteUrl(m.token!)}`).join("\n");
    navigator.clipboard.writeText(text); setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2000);
  }

  function generateEmailPreview(member: MemberWithToken) {
    let body = `Hi ${member.name},\n\n`;
    body += `You're invited to vote on dates for "${pollTitle}".\n\n`;
    if (pollLocation) body += `Location: ${pollLocation}\n`;
    if (pollDeadline) body += `Please vote by: ${new Date(pollDeadline).toLocaleDateString()}\n`;
    body += `\nDates being considered:\n`;
    for (const opt of options) {
      body += `  - ${opt.label} (${new Date(opt.starts_at).toLocaleString()})`;
      if (opt.capacity) body += ` — ${opt.capacity} seats`;
      body += `\n`;
    }
    body += `\nCast your vote here:\n${getVoteUrl(member.token!)}\n`;
    body += `\nThis link is unique to you — don't share it.`;
    return body;
  }

  return (
    <div className="space-y-8">
      {/* Add members */}
      <div>
        <h2 className="text-sm font-bold text-warm-600 uppercase tracking-wider mb-3">Add Members</h2>
        <div className="rounded-xl border border-warm-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-warm-200 bg-warm-50 px-3 py-2 text-sm font-medium text-warm-600 hover:bg-warm-100 transition-colors">
              Upload CSV
            </button>
            <span className="text-sm text-warm-400">or paste below — name, email per line</span>
          </div>
          <textarea value={csvText} onChange={(e) => handleCsvChange(e.target.value)} rows={3}
            placeholder={"Name, Email\nAlice Smith, alice@club.com\nBob Jones, bob@club.com"}
            className="w-full rounded-lg border border-warm-200 bg-warm-50 px-3 py-2.5 text-sm font-mono text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
          {csvPreview.length > 0 && (
            <div className="space-y-2">
              <div className="rounded-lg border border-warm-200 overflow-hidden">
                <div className="px-3 py-2 bg-warm-50 text-sm text-warm-500 font-medium">
                  {csvPreview.length} member{csvPreview.length === 1 ? "" : "s"} found
                </div>
                <div className="max-h-32 overflow-y-auto divide-y divide-warm-100">
                  {csvPreview.slice(0, 10).map((m, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-1.5 text-sm">
                      <span className="text-warm-700 w-32 truncate">{m.name}</span>
                      <span className="text-warm-400 truncate">{m.email}</span>
                    </div>
                  ))}
                  {csvPreview.length > 10 && <div className="px-3 py-1.5 text-xs text-warm-400">+{csvPreview.length - 10} more</div>}
                </div>
              </div>
              <button onClick={handleAddMembers} disabled={adding}
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-light disabled:opacity-40 transition-colors">
                {adding ? "Adding..." : `Add ${csvPreview.length} Members & Generate Links`}
              </button>
            </div>
          )}
          {members.length > 0 && csvPreview.length === 0 && (
            <p className="text-sm text-warm-400">{members.length} members already added</p>
          )}
        </div>
      </div>

      {/* Email preview */}
      <div>
        <h2 className="text-sm font-bold text-warm-600 uppercase tracking-wider mb-3">Email Preview</h2>
        <div className="rounded-xl border border-warm-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm text-warm-400">
            <span className="font-semibold text-warm-600">Subject:</span>
            Vote on dates for {pollTitle}
          </div>
          <div className="border-t border-warm-100 pt-3">
            <pre className="text-sm text-warm-700 whitespace-pre-wrap font-sans leading-relaxed">
              {pending.length > 0 ? generateEmailPreview(pending[0]) : members.length > 0 ? generateEmailPreview(members[0]) : `Hi [Name],\n\nYou're invited to vote on dates for "${pollTitle}".`}
            </pre>
          </div>
          <div className="border-t border-warm-100 pt-3">
            <p className="text-sm text-warm-400">Email sending via Resend is not wired yet. Copy the links below and send them manually.</p>
          </div>
        </div>
      </div>

      {/* Pending */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-warm-600 uppercase tracking-wider">Pending ({pending.length})</h2>
          {pending.length > 0 && (
            <button onClick={copyAllLinks} className="rounded-lg px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-muted transition-colors">
              {copiedAll ? "Copied all!" : "Copy all links"}
            </button>
          )}
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-warm-400">No pending invites. {voted.length > 0 ? "Everyone has voted!" : "Add members first."}</p>
        ) : (
          <div className="rounded-xl border border-warm-200 bg-white divide-y divide-warm-100">
            {pending.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-warm-900">{m.name}</div>
                  <div className="text-sm text-warm-400">{m.email}</div>
                </div>
                <button onClick={() => copyLink(m.token!, i)}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-muted transition-colors">
                  {copiedIdx === i ? "Copied!" : "Copy link"}
                </button>
                <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Vote on dates for ${pollTitle}`)}&body=${encodeURIComponent(generateEmailPreview(m))}`}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-warm-500 hover:text-warm-700 hover:bg-warm-100 transition-colors">
                  Email
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voted */}
      {voted.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3">Voted ({voted.length})</h2>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 divide-y divide-emerald-100">
            {voted.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-sm font-medium text-warm-700">{m.name}</span>
                <span className="text-sm text-warm-400">{m.email}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
