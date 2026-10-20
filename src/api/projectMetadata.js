// V6.0.3 - explicit, allowlisted metadata payload for the local development API.
// Deliberately excludes audio, analysis results, and arbitrary browser state.
export const PROJECT_METADATA_FIELDS = Object.freeze([
  "projectName", "clientName", "trackType", "aiTool", "currentStage",
  "mainConcern", "clientGoal", "producerNotes",
]);

export function buildLocalApiProjectPayload(projectSession, reviewMode = "draft", selectedPreset = "") {
  if (!projectSession || typeof projectSession !== "object" || Array.isArray(projectSession)) {
    throw new Error("Current project information is unavailable");
  }
  const filtered = {};
  for (const field of PROJECT_METADATA_FIELDS) {
    if (projectSession[field] === undefined) continue;
    const value = projectSession[field];
    const limit = field === "producerNotes" ? 4000 : 500;
    if (typeof value !== "string" || value.length > limit) {
      throw new Error(`${field} must be text under ${limit} characters`);
    }
    filtered[field] = value;
  }
  if (!filtered.projectName?.trim()) throw new Error("Enter a project name before saving to the local API");
  if (!["draft", "compare"].includes(reviewMode)) throw new Error("Invalid review mode");
  if (typeof selectedPreset !== "string" || selectedPreset.length > 120) {
    throw new Error("Invalid report preset");
  }
  return { projectSession: filtered, reviewMode, selectedPreset };
}
