// SoulFrame V5.4.8 - Browser-local session persistence and backup helpers.
// Keep existing storage keys and backup format for backwards compatibility.
import { defaultProjectSession } from "../core/projectDefaults.js";

export function getSessionValue(projectSession, key) {
  const value = projectSession && projectSession[key];
  if (typeof value === "string" && value.trim()) return value.trim();
  return defaultProjectSession[key];
}
export function loadSavedSession() {
  if (typeof window === "undefined") return defaultProjectSession;
  try {
    const saved = window.localStorage.getItem("soulframe-project-session");
    return saved ? { ...defaultProjectSession, ...JSON.parse(saved) } : defaultProjectSession;
  } catch (error) {
    return defaultProjectSession;
  }
}
export function loadSavedSetting(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch (error) {
    return fallback;
  }
}
export function saveSetting(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // Ignore local storage failures so the app keeps working.
  }
}
export function loadSavedProjects() {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem("soulframe-saved-projects");
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}
export function saveSavedProjects(projects) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("soulframe-saved-projects", JSON.stringify(projects));
  } catch (error) {
    // Ignore local storage failures so the app keeps working.
  }
}
export function buildSavedProjectRecord(projectSession, reviewMode, selectedPreset) {
  const now = new Date().toISOString();
  return {
    id: `soulframe-${Date.now()}`,
    projectSession,
    reviewMode,
    selectedPreset,
    savedAt: now,
    title: getSessionValue(projectSession, "projectName"),
    client: getSessionValue(projectSession, "clientName"),
    stage: getSessionValue(projectSession, "currentStage"),
  };
}
export function buildSavedProjectsBackup(savedProjects) {
  return JSON.stringify(
    {
      app: "SoulFrame",
      type: "saved-projects-backup",
      version: "3.5",
      exportedAt: new Date().toISOString(),
      projects: savedProjects,
    },
    null,
    2
  );
}
export function parseSavedProjectsBackup(text) {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || parsed.type !== "saved-projects-backup" || !Array.isArray(parsed.projects)) {
      return [];
    }
    return parsed.projects;
  } catch (error) {
    return [];
  }
}
