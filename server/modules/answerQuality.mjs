import { clampText, sanitizeText } from '../lib/utils.mjs';

const INTERNAL_PATTERNS = [
  /internal routing state/i,
  /hidden context assembly/i,
  /tool plan/i,
  /router decision/i,
  /system prompt/i
];

export function verifyAnswer({ text, answer, route, tools = [], livePulse, memories = [], uploads = [], operatingContext } = {}) {
  const cleanAnswer = sanitizeText(answer, 20_000);
  const cleanText = sanitizeText(text, 4000);
  const issues = [];
  const strengths = [];
  const liveSources = countLiveSources({ tools, livePulse });

  if (!cleanAnswer) issues.push('blank_answer');
  if (cleanAnswer.length < 60 && route?.complexity !== 'simple') issues.push('thin_answer_for_complex_request');
  if (INTERNAL_PATTERNS.some((pattern) => pattern.test(cleanAnswer))) issues.push('internal_context_leak');
  if (route?.needsFreshness && liveSources === 0 && !mentionsUnverified(cleanAnswer)) issues.push('missing_live_data_disclosure');
  if (route?.needsClarification && !/[?]/.test(cleanAnswer)) issues.push('clarification_not_asked');
  if (route?.needsFiles && uploads.length === 0 && /\b(file|attached|upload|document)\b/i.test(cleanText) && !mentionsMissingFile(cleanAnswer)) issues.push('missing_file_disclosure');
  if (route?.complexity !== 'simple' && !hasActionableStructure(cleanAnswer)) issues.push('low_actionability');
  if (operatingContext?.health?.contextPressure > 80 && !mentionsUncertainty(cleanAnswer)) issues.push('high_context_pressure_without_uncertainty');

  if (liveSources > 0) strengths.push('live_grounded');
  if (memories.length > 0) strengths.push('memory_grounded');
  if (uploads.length > 0) strengths.push('file_grounded');
  if (hasActionableStructure(cleanAnswer)) strengths.push('actionable');
  if (!issues.length) strengths.push('passed_quality_gate');

  const score = Math.max(0, Math.min(100, 92 - issues.length * 13 + strengths.length * 2));
  return {
    score,
    issues,
    strengths,
    liveSources,
    answerLength: cleanAnswer.length,
    shouldAppendLiveDisclosure: issues.includes('missing_live_data_disclosure'),
    shouldScrubInternalLeak: issues.includes('internal_context_leak')
  };
}

export function applyAnswerGuardrails(answer, quality) {
  let output = sanitizeText(answer, 30_000);
  if (quality?.shouldScrubInternalLeak) {
    output = output
      .replace(/^.*internal routing state.*$/gim, '')
      .replace(/^.*hidden context assembly.*$/gim, '')
      .replace(/^.*tool plan.*$/gim, '')
      .replace(/^.*router decision.*$/gim, '')
      .replace(/^.*system prompt.*$/gim, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  if (quality?.shouldAppendLiveDisclosure && !mentionsUnverified(output)) {
    output = `${output}\n\nCurrent-data note: I could not verify this request with usable live sources in this turn, so treat fast-changing details as needing confirmation.`;
  }

  return output || answer;
}

function countLiveSources({ tools, livePulse }) {
  const toolSources = (tools || []).filter((tool) => tool.ok && ['web_search', 'news', 'weather', 'medical_research'].includes(tool.name)).length;
  const pulseSources = Number(livePulse?.externalProviderCount || 0);
  return toolSources + pulseSources;
}

function mentionsUnverified(answer) {
  return /\b(could not verify|not verified|unable to verify|live data is unavailable|may need verification|needs confirmation|treat .* as needing confirmation)\b/i.test(answer);
}

function mentionsMissingFile(answer) {
  return /\b(no file|not attached|upload.*missing|without the file|i do not have the file)\b/i.test(answer);
}

function mentionsUncertainty(answer) {
  return /\b(uncertain|depends|assumption|if|may|might|could|not enough context|need more context)\b/i.test(answer);
}

function hasActionableStructure(answer) {
  const lineCount = answer.split('\n').filter((line) => line.trim()).length;
  return lineCount >= 3 || /\b(next step|steps|recommend|plan|because|priority|risk|action|do this)\b/i.test(answer);
}

export function renderQualityDirective(route) {
  const items = [
    'Answer quality gate before responding:',
    '- Answer the actual user request directly.',
    '- Use memory, project state, files, and live pulse only when relevant.',
    '- Separate verified current facts from assumptions when freshness matters.',
    '- If live or file context is missing, say that briefly and continue with the best useful answer.',
    '- For complex work, include clear next actions or decision criteria.'
  ];
  if (route?.needsClarification) items.push('- The request may be ambiguous; ask one direct clarifying question if you cannot safely proceed.');
  if (route?.needsMedical) items.push('- Medical mode requires clear uncertainty, clinician review language, and no autonomous diagnosis.');
  return clampText(items.join('\n'), 1800);
}
