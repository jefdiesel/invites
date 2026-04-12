# Club Event Poll — SPEC

A private polling tool for club organizers to plan events. Replaces SurveyMonkey in a workflow where the organizer feeds poll results into Claude to pick optimal dates/times.

## Goals

- Organizer proposes candidate event slots
- Members vote with availability + preference ranking
- Organizer sees live results, confirms which slots run, then notifies members of their confirmed slots
- Handle hundreds of voters per poll
- Private: per-member one-time voting links, no shared URLs
- Output is Claude-ready (structured markdown export)

## Roles

- **Organizer** — club admin. Uses a dashboard to create/view polls, confirm slots, send notifications. Magic-link auth.
- **Member (voter)** — receives a private link by email. No account. One-time vote, no edits after submit.

## Phases of a poll

1. **Polling** — members vote on proposed slots.
2. **Confirming** — organizer reviews scored results and decides which slots actually run. May add new slots here (e.g. when one date is oversubscribed) — this is a manual organizer action, not an automated algorithm.
3. **Notified** — each member gets an email listing the confirmed slots they're cleared for. Could be one or several.

## Voting model

For each candidate slot, a voter picks:
- **Available** or **Unable** (hard "can't attend")

Among the slots they marked available, they **rank** by preference (1st, 2nd, 3rd…). Unranked-available is allowed and means "I'm fine with any of these."

Plus one overall **flexibility flag** per voter: `flexible` | `inflexible`. Used as a weight when the organizer (and Claude) decides which slots to keep.

## Scoring (shown on the live results page)

For each candidate slot:
- **Available**: count of voters who can attend
- **Unable**: count
- **Criticality**: # of voters for whom this is their *only* available slot (would be stranded if dropped)
- **Preference strength (Borda)**: sum over voters of `(N - rank + 1)` where `N` is their number of available slots; unranked-available = `0.5`
- **Inflexible breakdown**: same numbers scoped to inflexible voters only

Coverage analysis: given a selected subset of slots, how many members have at least one of them available. Organizer can toggle slots on/off in the confirm UI for a live preview.

## Phase 3 — Notification algorithm

Input: set of confirmed slots, each with a per-slot `capacity` (nullable = unlimited).

Process:
1. Sort voters by **most constrained first** (fewest confirmed slots they're available for). Tiebreak: `inflexible` before `flexible`.
2. For each voter, offer every confirmed slot they marked available, walked in their preference order, until that slot's remaining capacity hits zero.
3. Once a slot is full, later voters no longer see it as an offer.
4. Voters with zero offers land on an overflow list — candidates for the organizer to add another slot in the confirm step.

Each voter gets one email listing all slots they were offered. They decide how many to actually attend.

## Data model

```
organizers     id, email, created_at
rosters        id, organizer_id, name
roster_members id, roster_id, name, email

polls          id, organizer_id, roster_id, title, description, location,
               deadline, phase (polling|confirming|notified), created_at
options        id, poll_id, label, starts_at, ends_at, capacity, confirmed, sort_order

poll_tokens    token, poll_id, member_id, used_at

responses      id, poll_id, member_id, flexibility, submitted_at
response_slots response_id, option_id, status (available|unable), rank

offers         response_id, option_id, offered_at   -- phase 3 output
```

## Pages

- `/` — **Admin dashboard**. Lists all polls owned by the current organizer on one page, with inline "new poll" form. Each poll card shows title, phase, response count, and links into the poll.
- `/poll/[id]` — **Live results**. Auto-refreshing view of slot scores, coverage grid, inflexible/flexible breakdown, Claude export button. Updates live as votes come in.
- `/poll/[id]/confirm` — **Confirm slots**. Organizer toggles slots on/off, adds new slots, sees live coverage preview, locks in confirmed set.
- `/poll/[id]/notify` — Review & send per-member offer emails.
- `/vote/[token]` — **Voter page**. Shows all slots as cards; voter marks each available/unable, drags available ones into preference order, sets flexibility, submits. Submission is locked.
- `/roster/[id]` — Manage club member roster (CSV import).

## Realtime

Live results page uses Server-Sent Events (or short-interval polling as fallback) so the organizer sees new votes appear without reloading.

## Stack

- **Next.js** (App Router, TypeScript) on Vercel
- **Database**: Neon Postgres in production. SQLite (better-sqlite3) for local dev. Schema is portable.
- **Email**: Resend — organizer magic-link, vote invites, confirmation emails.
- **Auth**: magic link for organizers only. Voters auth via one-time URL tokens.

## Claude export format

```
Event: <title>
Location: <location>
<N> responses (<X> inflexible, <Y> flexible)

Slot A — Mon Apr 20, 7pm
  Available: 88   Unable: 24
  Only-option for: 34 voters
  Borda score: 412
  Inflexible: 30 available (avg rank 1.5), 8 unable

Slot B — …

Coverage preview:
  A alone: 88/142
  A+C:     129/142 (stranded: 13)
  A+B+C:   140/142
```

Organizer pastes this into Claude Cowork to get a recommendation on which slots to confirm.

## Out of scope (v1)

- No voter edits after submit
- No capacity-based ticketing / booking — confirmation is informational, not binding
- No auto-reminder emails
- No mobile app — responsive web only
