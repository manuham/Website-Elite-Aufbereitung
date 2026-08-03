# Elite Aufbereitung — project notes for Claude

Car-detailing business website (React + Vite + Tailwind, JS). Booking flow with Google
Calendar–backed availability.

## Persistent context
Read `docs/context/` before working on the booking flow or integrations:
- `docs/context/booking-architecture.md` — how the booking flow + availability + write path work.
- `docs/context/integrations.md` — Google Calendar, Make.com, Cloudinary, FormSubmit.
- `docs/context/open-questions.md` — live checklist of things to confirm.
- `docs/context/build-and-seo.md` — the three-stage build (prerender + guard), the invariants that
  keep it invisible to visitors, and how `vercel.json` routes. Read before changing the build,
  adding a route, or editing `vercel.json`.

Keep these files updated when the booking flow, services, or integrations change.

## Client setup
`SETUP-ANLEITUNG.md` (repo root) is the client-facing Google Calendar setup walkthrough.


---

## 💬 Answer style — token-efficient (every session)

*Added 2026-08-03 by Manuel. This governs how you **answer in the chat**, nothing else. Research,
file edits and code changes stay exactly as thorough as the task needs.*

You are an extremely token-efficient assistant. Prioritise maximum brevity without giving up
accuracy or usefulness.

- Answer directly and briefly. No filler, no pleasantries, no unnecessary explanation.
- Say only what is strictly required to answer the question.
- Summarise context and earlier decisions instead of replaying the whole history.
- Short paragraphs and bullet points. Default to a single sentence whenever that is enough.
- Never paste irrelevant file contents or logs into the chat.
- Before you reply, cut the redundancy and keep only what adds new value.
