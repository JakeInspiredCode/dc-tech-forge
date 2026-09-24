// The app's vocabulary, in plain words. The space theme stays, but nobody
// should have to guess what a "sector" is. Order: the way a newcomer meets them.

export interface GlossaryEntry {
  term: string;
  means: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  { term: "Galaxy Map", means: "The home screen — your whole curriculum at a glance. Each star is one subject area." },
  { term: "Sector", means: "One subject area: Linux, hardware, networking, fiber, power and cooling, operations, scale, advanced Linux." },
  { term: "Campaign", means: "The run of missions that teaches a sector. Every sector has exactly one, and it carries the sector's name." },
  { term: "Mission", means: "One short lesson, 15–30 minutes: a few steps (read, practise, review), then a knowledge check." },
  { term: "Knowledge Check", means: "The short multiple-choice quiz that ends a mission. Pass it and the mission is complete; you can retake it." },
  { term: "Arsenal", means: "Everything you can practise outside a mission: the lesson library, flashcards, drills, the terminal, and tools." },
  { term: "Battlestation", means: "A ticket simulator. You are handed realistic data center tickets and resolve them by typing commands." },
  { term: "Flashcard Review", means: "Spaced repetition: a card comes back just before you would forget it. A few minutes a day is the point." },
  { term: "Due / New", means: "New cards are ones you have never studied. Due cards are ones you have studied that are scheduled for today." },
  { term: "Tier", means: "How deep a topic's flashcards go, 1 to 4 — from definitions up to incident scenarios. Reviewing a tier well unlocks the next." },
  { term: "XP", means: "Points for finishing things: missions, reviews, tickets. They measure practice done, nothing else." },
  { term: "Streak", means: "How many days in a row you have studied." },
  { term: "Fleet Log", means: "The recent-activity list on the home screen: missions accomplished, badges earned, drills, tickets and study sessions, newest first — yours, and every pilot with a callsign." },
  { term: "Callsign", means: "An optional account name (Profile). With one, your progress is saved to the cloud and follows you to other devices, and what you do appears in the Fleet Log." },
  { term: "Recovery code", means: "The one secret behind a callsign — issued when you claim it, shown again in Profile on request. Type it on another device to sign in. There is no password and no email." },
  { term: "Sample progress", means: "A pre-filled account for looking around. It is always labelled, and \"Start fresh\" removes it." },
];
