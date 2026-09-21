# DC-Tech-Forge — Vision

## The goal

Get someone **floor-ready for a data center technician role** — and be the best free tool for doing it.

Floor-ready means more than recognising terms. It means you can sit down at a node you have never seen, work out what is wrong with it, fix it or escalate it cleanly, and explain what you did. DC-Tech-Forge trains for that: the knowledge, the hands-on reflexes, and the judgement.

This is deliberately narrow. The app is not a general interview-prep engine and is not trying to become one. Everything in it should make a person better at data center work.

## Who it is for

- **People breaking into data center operations** — career changers, new grads, and IT generalists who have never worked a hall.
- **Working technicians levelling up** — a hardware tech who needs Linux, a Linux admin who needs fiber and power.
- **Anyone preparing for a DC technician interview**, where the questions are practical: *a GPU fell off the bus — walk me through it.*

## What "ready" covers

| Domain | You can… |
|---|---|
| **Linux operations** | navigate, read logs, manage services, storage and permissions, and troubleshoot a node from the shell |
| **Server hardware** | identify components, read BMC/SEL data, triage GPU, memory and disk faults, and swap parts safely |
| **Networking** | reason about L2/L3, VLANs, routing and DNS, and isolate a connectivity fault |
| **Fiber & cabling** | tell connector and transceiver types apart, check polarity and light levels, and keep a cable plant sane |
| **Power & cooling** | understand A/B feeds, PDUs, UPS behaviour and thermal limits — and what not to touch |
| **Operations** | work a ticket, follow and improve a runbook, handle an incident, and hand off cleanly |
| **Scale & architecture** | understand how racks, rows and clusters fit together, so a local fix makes sense in context |

## Principles

1. **Do, don't just read.** Every topic should end in something hands-on — a terminal, a triage, a ticket — not only a quiz.
2. **Honest progress.** Mastery is computed from what you have actually reviewed, never hand-set. Quitting a drill does not count as finishing it. Sample data is always labelled as sample data.
3. **One obvious next step.** A learner should never have to wonder what to do next.
4. **Open access.** Nothing is locked. The app recommends an order; it does not enforce one.
5. **Plain words alongside the theme.** The space theme is the app's identity, but every themed name is paired with what it means.
6. **Local-first and private.** No account, no backend, no tracking. Your progress lives in your browser and leaves only when you export it.
7. **Secure by construction.** Shipped as static files with a strict content-security policy. Anything imported from a file is treated as hostile.

## Where it is going

**Depth beyond Linux.** The missions cover every domain, but the Arsenal's practice tools are still almost all Linux. Hardware, fiber, power and networking deserve their own drills and simulators — a BMC/SEL log reader, a fiber polarity and light-level trainer, a PDU and A/B-feed scenario, a cabling-plan exercise.

**A broader Battlestation.** More ticket families (hardware RMA flows, network isolation, power events), multi-step incidents that span domains, and debriefs that show the path an experienced tech would have taken.

**Usable by everyone, everywhere.** Full keyboard and screen-reader support, a real mobile layout, and reduced-motion handling.

**Content that stays current.** Data center practice moves — new GPU platforms, new fabrics, new cooling. One possible direction is an assisted authoring pipeline *for data center content only*: take real DC technician job postings and vendor documentation, find the gaps against the current curriculum, and draft tiered cards and scenarios for a human to review. It would exist to keep this curriculum sharp, not to generalise the app to other roles. An earlier, broader prototype of this idea was removed; nothing like it runs today, and all content is hand-written.

## Not goals

- A general-purpose interview-prep or flashcard platform for arbitrary roles.
- Accounts, leaderboards, or anything else that needs a backend — unless a feature that genuinely serves the goal cannot be built without one.
- Gamification for its own sake. XP, streaks and badges are there to support a study habit, and should never reward anything other than real practice.
