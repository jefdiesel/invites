"use client";

import { useState, useRef } from "react";
import { addMembers } from "@/lib/actions";
import { useRouter } from "next/navigation";

type MemberWithToken = {
  id: string;
  name: string;
  email: string;
  token: string | null;
  voted: boolean;
};

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
  pollId,
  pollTitle,
  pollDescription,
  pollLocation,
  pollDeadline,
  options,
  members,
  baseUrl,
}: {
  pollId: string;
  pollTitle: string;
  pollDescription: string;
  pollLocation: string;
  pollDeadline: string | null;
  options: { id: string; label: string; starts_at: string; capacity: number | null }[];
  members: MemberWithToken[];
  baseUrl: string;
}) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState<ParsedMember[]>([]);
  const [adding, setAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleCsvChange(text: string) {
    setCsvText(text);
    setCsvPreview(parseCsv(text));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      setCsvPreview(parseCsv(text));
    };
    reader.readAsText(file);
  }

  async function handleAddMembers() {
    if (csvPreview.length === 0) return;
    setAdding(true);
    await addMembers(pollId, csvPreview);
    setCsvText("");
    setCsvPreview([]);
    setAdding(false);
    router.refresh();
  }

  const pending = members.filter((m) => m.token && !m.voted);
  const voted = members.filter((m) => m.voted);
  const noToken = members.filter((m) => !m.token);

  function getVoteUrl(token: string) {
    return `${baseUrl}/vote/${token}`;
  }

  function copyLink(token: string, idx: number) {
    navigator.clipboard.writeText(getVoteUrl(token));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  function copyAllLinks() {
    const text = pending
      .map((m) => `${m.name} <${m.email}>: ${getVoteUrl(m.token!)}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
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
      {/* Add members via CSV */}
      <div>
        <h2 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Add Members</h2>
        <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              Upload CSV
            </button>
            <span className="text-[11px] text-stone-400">or paste below — name, email per line</span>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => handleCsvChange(e.target.value)}
            rows={3}
            placeholder={"Name, Email\nAlice Smith, alice@club.com\nBob Jones, bob@club.com"}
            className="w-full rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2 text-xs font-mono text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
          {csvPreview.length > 0 && (
            <div className="space-y-2">
              <div className="rounded-md border border-stone-200 dark:border-stone-800 overflow-hidden">
                <div className="px-3 py-1.5 bg-stone-50 dark:bg-stone-800/50 text-[11px] text-stone-500 font-medium">
                  {csvPreview.length} member{csvPreview.length === 1 ? "" : "s"} found
                </div>
                <div className="max-h-32 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/50">
                  {csvPreview.slice(0, 10).map((m, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-1 text-xs">
                      <span className="text-stone-700 dark:text-stone-300 w-32 truncate">{m.name}</span>
                      <span className="text-stone-400 truncate">{m.email}</span>
                    </div>
                  ))}
                  {csvPreview.length > 10 && (
                    <div className="px-3 py-1 text-[10px] text-stone-400">+{csvPreview.length - 10} more</div>
                  )}
                </div>
              </div>
              <button
                onClick={handleAddMembers}
                disabled={adding}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
              >
                {adding ? "Adding..." : `Add ${csvPreview.length} Members & Generate Links`}
              </button>
            </div>
          )}
          {members.length > 0 && csvPreview.length === 0 && (
            <p className="text-[11px] text-stone-400">{members.length} members already added</p>
          )}
        </div>
      </div>

      {/* Email preview */}
      <div>
        <h2 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Email Preview</h2>
        <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span className="font-medium text-stone-600 dark:text-stone-300">Subject:</span>
            Vote on dates for {pollTitle}
          </div>
          <div className="border-t border-stone-100 dark:border-stone-800 pt-3">
            <pre className="text-[13px] text-stone-700 dark:text-stone-300 whitespace-pre-wrap font-sans leading-relaxed">
              {pending.length > 0
                ? generateEmailPreview(pending[0])
                : members.length > 0
                ? generateEmailPreview(members[0])
                : `Hi [Name],\n\nYou're invited to vote on dates for "${pollTitle}".`}
            </pre>
          </div>
          <div className="border-t border-stone-100 dark:border-stone-800 pt-3">
            <p className="text-[11px] text-stone-400">
              Email sending via Resend is not wired yet. For now, copy the links below and send them manually.
            </p>
          </div>
        </div>
      </div>

      {/* Pending invites */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-stone-500 uppercase tracking-wider">
            Pending ({pending.length})
          </h2>
          {pending.length > 0 && (
            <button
              onClick={copyAllLinks}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
            >
              {copiedAll ? "Copied all!" : "Copy all links"}
            </button>
          )}
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-stone-400">No pending invites. {voted.length > 0 ? "Everyone has voted!" : "Add members to the poll first."}</p>
        ) : (
          <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 divide-y divide-stone-100 dark:divide-stone-800/50">
            {pending.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{m.name}</div>
                  <div className="text-xs text-stone-400">{m.email}</div>
                </div>
                <code className="text-[10px] text-stone-400 font-mono truncate max-w-[200px] hidden sm:block">
                  /vote/{m.token}
                </code>
                <button
                  onClick={() => copyLink(m.token!, i)}
                  className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                >
                  {copiedIdx === i ? "Copied!" : "Copy link"}
                </button>
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent(`Vote on dates for ${pollTitle}`)}&body=${encodeURIComponent(generateEmailPreview(m))}`}
                  className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Email
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Already voted */}
      {voted.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">
            Voted ({voted.length})
          </h2>
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 divide-y divide-emerald-100 dark:divide-emerald-900/30">
            {voted.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-sm text-stone-700 dark:text-stone-300">{m.name}</span>
                <span className="text-xs text-stone-400">{m.email}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {noToken.length > 0 && (
        <p className="text-xs text-stone-400">{noToken.length} member(s) without voting tokens. This shouldn&apos;t happen — try re-adding them.</p>
      )}
    </div>
  );
}
