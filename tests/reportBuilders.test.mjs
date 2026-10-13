import test from 'node:test';
import assert from 'node:assert/strict';
import * as report from '../src/report/reportBuilders.js';
import { defaultProjectSession } from '../src/core/projectDefaults.js';

const analyzedDraft = {
  status: 'Ready',
  brightness: 'Bright / Potentially Harsh',
  textureStability: 'Unstable / Busy',
  dynamics: 'Compressed',
  clippingRisk: 'High',
  sampleRate: 44100,
  peakDb: '-0.3 dB',
  rmsDb: '-12.0 dB',
};
const analyzedEdit = {
  ...analyzedDraft,
  brightness: 'Balanced',
  textureStability: 'Stable',
  dynamics: 'Moderate',
  clippingRisk: 'Low',
  peakDb: '-3.0 dB',
  rmsDb: '-17.0 dB',
};

const session = {
  ...defaultProjectSession,
  projectName: 'Client Hip Hop Vocal Demo',
  trackType: 'hip hop vocal track',
};

test('report engine exposes all 28 V4.2 builders', () => {
  const names = Object.keys(report);
  assert.equal(names.length, 28);
  assert.ok(names.includes('buildV42SmartReportComposer'));
  assert.ok(names.includes('buildV42ReportControlCenter'));
});

test('project template remains unchanged', () => {
  assert.equal(defaultProjectSession.projectName, 'Untitled AI Draft');
  assert.equal(defaultProjectSession.clientName, 'Client');
});

test('report route distinguishes draft vs comparison', () => {
  assert.equal(report.detectV42ReportPath(session, 'draft'), 'Vocal Humanization Report');
  assert.equal(report.detectV42ReportPath(session, 'compare'), 'Before / After Humanization Report');
  assert.equal(report.detectV42GenreFocus(session), 'Hip-Hop / Rap');
});

test('composer and control center preserve ready-analysis contracts', () => {
  const composer = report.buildV42SmartReportComposer(session, 'draft', analyzedDraft);
  const center = report.buildV42ReportControlCenter(session, 'draft', analyzedDraft);
  assert.equal(composer.feature, 'Smart Report Composer');
  assert.ok(composer.reportTitle.includes('Vocal Humanization'));
  assert.ok(composer.producerPlan.length > 0);
  assert.equal(center.feature, 'Report Control Center');
  assert.ok(center.controlCards.length >= 3);
});

test('comparison and client report text remain available', () => {
  const comparison = report.buildV42BeforeAfterExplanation(analyzedDraft, analyzedEdit);
  const text = report.buildV42SmartReportComposerText(session, 'compare', analyzedDraft, analyzedEdit);
  assert.ok(comparison.clientSafeLine.length > 10);
  assert.ok(text.includes('SOULFRAME V4.2 SMART REPORT COMPOSER'));
  assert.ok(text.includes('BEFORE/AFTER LINE'));
});

test('incomplete analysis returns non-final report guidance', () => {
  const reportContext = report.buildV42ReportContext();
  assert.equal(reportContext.priorityScore, null);
  assert.ok(reportContext.suggestedEditOrder.length > 0);
});
