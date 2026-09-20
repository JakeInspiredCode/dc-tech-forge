# DC-Tech-Forge — Vision

## The Goal

Transform DC-Tech-Forge from a single-role study tool into a **universal interview preparation engine** that can target any job role from a single input: the job posting.

## How It Would Work

```
Job Requisition URL or Text
        │
        ▼
┌──────────────────────┐
│  Agentic Job Parser  │  Extracts the top 8 technical requirements
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Content Researcher  │  For each requirement, researches and generates
│                      │  tiered flashcard content (Tier 1–4)
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Forge Populator     │  Structures content into topics, cards, and
│                      │  seed data — then loads it into the app
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Ready to Study      │  The full study experience: SM-2 scheduling,
│                      │  missions, drills, progress tracking
└──────────────────────┘
```

## Agentic Pipeline (Future Development)

### 1. Job Requisition Parser
- Accept a URL, pasted text, or uploaded PDF of a job posting
- Use an LLM agent to extract and rank the **top 8 technical competency areas**
- Identify the role level (junior / mid / senior) to calibrate card difficulty
- Detect company-specific context (tech stack, products, culture keywords)

### 2. Content Research Agent
- For each of the 8 competency areas, research and generate:
  - **Tier 1** — Foundational recall cards (definitions, concepts, "what is X?")
  - **Tier 2** — Intermediate application cards (troubleshooting, explain-how, compare/contrast)
  - **Tier 3** — Scenario-based cards (walk through a real situation, multi-step reasoning)
  - **Tier 4** — Branching scenario cards (decision trees, tradeoff analysis)
- Generate company-specific behavioral prompts based on the posting's language
- Include STAR story templates tailored to the role

### 3. Content Quality Gate
- Validate generated cards for technical accuracy
- Ensure difficulty progression across tiers is consistent
- De-duplicate and merge overlapping content
- Flag cards that need human review

### 4. Forge Population
- Map the 8 competency areas to Forge topics
- Assign card IDs, difficulty ratings, and tier placements
- Load it into the app's data store
- Initialize progress tracking for the new topic set

## Example

**Input:** A job posting for "Site Reliability Engineer at Acme Corp" mentioning Kubernetes, observability, incident response, Linux, networking, CI/CD, cloud infrastructure, and distributed systems.

**Output:** 8 fully-populated study topics with 15–30 tiered flashcards each, and behavioral interview prep tailored to SRE culture.

## Current State

The app currently ships with hardcoded seed data for a specific technical role. The architecture (topic-based organization, tiered cards, SM-2 scheduling) is already role-agnostic — the content pipeline is the piece that needs to become dynamic.

## Status

This is a possible future direction, not current work. An earlier agent prototype was removed, and today the app is fully client-side with hand-written content for one role — data center technician — which is also what its name now says. Pursuing this vision would mean generalizing both.
