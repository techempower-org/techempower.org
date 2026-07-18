# TechEMPOWER Newsletter — Editorial Plan & Schedule

**Status: ADOPTED 2026-07-18** (JP: "finish and push"). Cadence Option A in
effect. Still open before the first send: sender identity + SPF/DKIM/DMARC
check, Spanish policy, and the optional signup-copy tweak (see
[Open questions](#open-questions-for-jp)). Nothing has been sent yet.

## Ground truth (as of 2026-07-18)

- **Infra:** self-hosted listmonk on ubox0 (`list.techempower.org`), list
  **"TechEMPOWER News"** (id 3, double opt-in). **1 confirmed subscriber,
  2 unconfirmed. Zero campaigns ever sent.** This plan launches the program.
- **The promise already on the homepage signup** (`NewsletterSignup.tsx`):
  *"A short email when we publish a new guide or a program changes. No spam,
  no fundraising pitches — just useful resources, a few times a year. You can
  unsubscribe with one click."*
  That copy is the editorial contract. Everything below is designed to honor
  it — or explicitly asks JP before changing it.

## Editorial contract

1. **Short.** 300–450 words. One screen on a phone. Every issue passes the
   test: "could a busy person skim this in 90 seconds and still get value?"
   Images: keep total self-hosted payload ≤ ~500 KB — much of the audience
   reads on metered mobile data (Luna design review, 2026-07-18; issue #1
   ships ~505 KB after JP's adds — treat that as the ceiling). Every image
   needs strong alt text; the email must still work with images off.
2. **No fundraising, ever.** Not even a soft "support us" — the signup copy
   rules it out.
3. **Only verified claims.** Same discipline as the show and the screener:
   every program fact carries a source and a verify-date. The pre-send
   checklist in each issue file must be fully checked before the campaign
   goes out (mirrors the show's week-of recheck).
4. **Plain, warm language.** Site voice. No bureaucratese, no acronym soup —
   spell out CalFresh/LifeLine on first use, same as the teleprompters do.
5. **Links point at techempower.org** (the /show page, guides, /qualify), not
   raw YouTube/third-party URLs, so links stay stable and readers land where
   the rest of the help is.

## Content pillars (issue skeleton)

| Section | What goes in it | Source of truth |
|---|---|---|
| **New from us** | Episodes published, new guides, screener/resources updates since last issue | /show page, `site.config.ts` guides, screener changelog |
| **Program watch** | 2–3 verified benefit-program changes, each with a date and a one-line "what to do about it" | `lib/screener/rules.data.json` provenance churn + show fact-check reports |
| **Try this** | ONE action for the reader (e.g., the 2-minute /qualify check) | rotates |
| **Featured resource** | ONE gem from the Resources DB per issue (JP 2026-07-18) — pick seasonal + broadly useful; re-verify its claim at send. #1: kids/teens ride NCC buses free → #2 candidates: free school meals (back-to-school) → #3: LIHEAP season opens | Resources DB (256 rows); claim freshness per rules-DB discipline |
| **From the workshop** | ONE featured open-source project per issue (JP 2026-07-18). Queue: #1 Star Charts → #2 Minecraft-on-Linux guide (back-to-school) → #3 smol → #4 iTags (holiday stocking-stuffer angle) | project catalog; verify link live at send |
| **Close** | The standing help channels: 211, findhelp.org, techempower.org, Discord — same close as every episode | fixed |

**Program watch is the differentiator.** The rules DB already enforces
per-number provenance with ≤120-day freshness — no local outlet covers
"what changed in benefit programs this month" with citations. The newsletter
is that verification pipeline's public exhaust.

## Cadence — options considered

- **A. Seasonal hybrid (RECOMMENDED):** monthly during show season
  (Jul–Sep 2026, last Tuesday) + a year-end issue, then **quarterly** in 2027
  (Mar/Jun/Sep/Dec). ~4–6/yr total. Matches "a few times a year" while riding
  the show's momentum when there's genuinely news. Trade-off: cadence shifts
  twice; mitigated by dating every issue in the calendar below.
- **B. Strict quarterly:** simplest, unambiguously honors the promise, but
  wastes the season — Ep3–Ep6 news would be stale by the next slot.
- **C. Event-driven (send per publish/change):** maximally honest to "when we
  publish a new guide or a program changes," but at 2 episodes/month it
  overshoots "a few times a year" and trains people to unsubscribe.

Option A also keeps an **alert-issue exception**: a major program change that
affects many readers (an ACP-style shutdown) justifies a short off-schedule
issue. Expected use: ≤1–2/year.

## 2026–2027 calendar (Option A)

| Issue | Send date (Tue) | Anchors | Notes |
|---|---|---|---|
| **#1** | ~~Jul 28~~ **SENT Jul 18** (11/11) | **Welcome tour** (per JP 2026-07-18): the newsletter itself, the site + guides, /qualify, /resources + /submit, the two apps (Candela, Forage for All), workshop corner featuring Star Charts, Discord, show + season schedule | Draft: `issues/2026-07-28-issue-01.md` |
| #2 | Aug 25 | **Program watch debut** (LifeLine broadband pilot, CARE/FERA, Market Match resolution) + Ep4 (home/transport) + Ep5 finale (nonprofits/farmers) | Ep5 publishes ~Aug 20–24 — confirm before locking |
| #3 | Sep 29 | Ep6 (rural connectivity), CalFresh COLA lands Oct 1, LIHEAP season opens | Strong "program watch" issue |
| #4 | Dec 15 | Year in review, holiday/winter resources | Last 2026 issue |
| #5–#8 | 2027: late Mar / late Jun / late Sep / mid Dec | Quarterly steady state | Revisit cadence if the show gets a season 2 |

## Production workflow (per issue)

1. **Draft** in `newsletter/issues/YYYY-MM-DD-issue-NN.md` — email body in
   Markdown up top, `## Pre-send verification` checklist below a marked
   cut-line (never pasted into listmonk).
2. **Verify**: every checklist item confirmed (drain to an agent, JP
   approves — same operating model as the show task drain).
3. **Stage** in listmonk: new campaign, content type **Markdown** (native
   support — paste the body verbatim), list "TechEMPOWER News".
4. **Test-send** to jp@jphein.com; read it on a phone.
5. **Send** (JP pushes the button), then mark the issue file `SENT` and keep
   it in the repo as the archive.

## Growth (recommendations only — separate decisions, no action taken)

With 1 confirmed subscriber, distribution matters more than cadence. Cheap,
on-brand options: mention the newsletter in episode closes/show notes and on
the /show page; add the signup to guide footers; NCM cross-promo. Each is its
own small change — none included in this plan's scope.

## Open questions for JP

1. **Cadence:** approve Option A (or pick B/C)?
2. **Signup copy:** monthly-during-season stretches "a few times a year."
   Tweak `NewsletterSignup.tsx` copy to "about monthly during our show
   season, quarterly otherwise"? (One-line code change, honest either way.)
3. **Spanish:** issue #1 drafted EN-only with a one-line ES pointer to the
   bilingual screener. Full EN/ES parity like the screener is a real
   production cost — when, if ever?
4. **Sender identity:** propose `news@techempower.org` with a human
   from-name ("Jeff at TechEMPOWER"?). Needs a decision + listmonk SMTP
   check before first send (deliverability: SPF/DKIM/DMARC for the sending
   domain should be verified once, before issue #1).
5. **Issue #1 draft approval** — see `issues/2026-07-28-issue-01.md`.
