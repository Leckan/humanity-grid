export type InitiativeStatus = "draft" | "submitted" | "approved" | "changes_requested" | "archived";
export type Role = "contributor" | "organizer" | "reviewer" | "admin";

export const initiativeTransitions: Record<InitiativeStatus, InitiativeStatus[]> = {
  draft: ["submitted", "archived"],
  submitted: ["approved", "changes_requested", "archived"],
  approved: ["archived"],
  changes_requested: ["submitted", "archived"],
  archived: [],
};

export function canTransitionInitiative(from: string, to: string): boolean {
  return (initiativeTransitions[from as InitiativeStatus] ?? []).includes(to as InitiativeStatus);
}

export function canReview(role: Role | string | undefined): boolean {
  return role === "reviewer" || role === "admin";
}

export function validateInitiative(input: Record<string, unknown>) {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const cause = typeof input.cause === "string" ? input.cause.trim() : "";
  const location = typeof input.location === "string" ? input.location.trim() : "";
  const amount = input.fundingGoal === "" || input.fundingGoal == null ? 0 : Number(input.fundingGoal);
  const errors: string[] = [];
  if (title.length < 8 || title.length > 110) errors.push("Title must be between 8 and 110 characters.");
  if (description.length < 40 || description.length > 5000) errors.push("Description must be between 40 and 5,000 characters.");
  if (!cause || cause.length > 80) errors.push("Choose a valid cause.");
  if (!location || location.length > 120) errors.push("Add a general location or choose Remote.");
  if (!Number.isFinite(amount) || amount < 0 || amount > 10000000) errors.push("Funding goal must be between 0 and 10,000,000.");
  return { ok: errors.length === 0, errors, value: { title, description, cause, location, fundingGoalMinor: Math.round(amount * 100) } };
}

export function slugify(text: string) {
  return text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "initiative";
}

export function matchScore(initiative: { cause: string; needs: string[]; location: string; remote: number }, preferences: { causes?: string[]; skills?: string[]; location?: string; remoteOnly?: boolean }) {
  let score = 0;
  if (preferences.causes?.some((cause) => cause.toLowerCase() === initiative.cause.toLowerCase())) score += 45;
  const skillOverlap = preferences.skills?.filter((skill) => initiative.needs.some((need) => need.toLowerCase().includes(skill.toLowerCase()))).length ?? 0;
  score += Math.min(skillOverlap * 18, 36);
  if (preferences.location && initiative.location.toLowerCase().includes(preferences.location.toLowerCase())) score += 19;
  if (preferences.remoteOnly && initiative.remote) score += 19;
  return Math.min(score, 100);
}
