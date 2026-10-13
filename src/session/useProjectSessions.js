// SoulFrame V5.4.8 - Project session state and actions.
// The audio-file state intentionally remains in App.jsx; only project data is persisted.
import { useEffect, useState } from "react";
import { defaultProjectSession } from "../core/projectDefaults.js";
import {
  loadSavedSession,
  loadSavedSetting,
  saveSetting,
  loadSavedProjects,
  saveSavedProjects,
  buildSavedProjectRecord,
  parseSavedProjectsBackup,
} from "./sessionStorage.js";

export function useProjectSessions({ demoPresets, onPresetApplied }) {
  const [selectedPreset, setSelectedPreset] = useState(() => loadSavedSetting("soulframe-selected-preset", "marcel"));
  const [reviewMode, setReviewMode] = useState(() => loadSavedSetting("soulframe-review-mode", "draft"));
  const [projectSession, setProjectSession] = useState(() => loadSavedSession());
  const [savedProjects, setSavedProjects] = useState(() => loadSavedProjects());

  useEffect(() => {
    saveSetting("soulframe-project-session", JSON.stringify(projectSession));
  }, [projectSession]);

  useEffect(() => {
    saveSetting("soulframe-selected-preset", selectedPreset);
  }, [selectedPreset]);

  useEffect(() => {
    saveSetting("soulframe-review-mode", reviewMode);
  }, [reviewMode]);

  useEffect(() => {
    saveSavedProjects(savedProjects);
  }, [savedProjects]);

  function resetProjectSession() {
    setProjectSession(defaultProjectSession);
    setSelectedPreset("marcel");
    setReviewMode("draft");
  }

  function applyDemoPreset(presetKey) {
    const preset = demoPresets[presetKey];
    if (!preset) return;
    setProjectSession({ ...defaultProjectSession, ...preset.projectSession });
    setSelectedPreset(preset.selectedPreset || "marcel");
    setReviewMode(preset.reviewMode || "draft");
    onPresetApplied?.();
  }

  function saveDemoPresetAsProject(presetKey) {
    const preset = demoPresets[presetKey];
    if (!preset) return;
    const presetSession = { ...defaultProjectSession, ...preset.projectSession };
    const record = buildSavedProjectRecord(presetSession, preset.reviewMode || "draft", preset.selectedPreset || "marcel");
    setSavedProjects((current) => [record, ...current].slice(0, 24));
  }

  function saveProjectSnapshot() {
    const record = buildSavedProjectRecord(projectSession, reviewMode, selectedPreset);
    setSavedProjects((current) => [record, ...current].slice(0, 12));
  }

  function loadSavedProjectSnapshot(projectId) {
    const savedProject = savedProjects.find((project) => project.id === projectId);
    if (!savedProject) return;
    setProjectSession({ ...defaultProjectSession, ...savedProject.projectSession });
    setReviewMode(savedProject.reviewMode || "draft");
    setSelectedPreset(savedProject.selectedPreset || "marcel");
  }

  function deleteSavedProject(projectId) {
    setSavedProjects((current) => current.filter((project) => project.id !== projectId));
  }

  function clearSavedProjects() {
    setSavedProjects([]);
  }

  function importSavedProjectsBackup(backupText) {
    const importedProjects = parseSavedProjectsBackup(backupText);
    if (!importedProjects.length) return;
    setSavedProjects((current) => {
      const existingIds = new Set(current.map((project) => project.id));
      const freshImports = importedProjects.filter((project) => project && project.id && !existingIds.has(project.id));
      return [...freshImports, ...current].slice(0, 24);
    });
  }

  return {
    selectedPreset, setSelectedPreset,
    reviewMode, setReviewMode,
    projectSession, setProjectSession,
    savedProjects,
    resetProjectSession, applyDemoPreset, saveDemoPresetAsProject,
    saveProjectSnapshot, loadSavedProjectSnapshot, deleteSavedProject,
    clearSavedProjects, importSavedProjectsBackup,
  };
}
