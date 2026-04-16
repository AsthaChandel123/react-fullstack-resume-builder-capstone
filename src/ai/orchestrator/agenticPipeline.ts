/**
 * Agentic Analysis Pipeline
 *
 * Wires all specialized agents into a DAG for maximum parallelism:
 *
 *   JD Processing ─┐
 *                   ├─> Skills Matcher ─┐
 *   L1 NLP ────────┤                   ├─> Scorer ──> Coach
 *                   │                   │
 *   L2 Embed ──────┤                   │
 *                   │                   │
 *   L3 Reason ─────┤   (L4 if L3 fail) │
 *                   │                   │
 *   Distance ──────────────────────────┘
 *
 * Parallel branches: JD + L1 + L2 + Distance run concurrently.
 * L3 starts after L1/L2 (needs parsed text context).
 * Skills Matcher runs after JD + L1 (needs both skill lists).
 * Scorer runs after everything except Coach.
 * Coach runs last (optional).
 *
 * Every agent writes to a shared Blackboard and logs ReAct traces.
 */

import type {
  Blackboard,
  DAGNode,
  PipelineConfig,
  ProgressCallback,
  CoachSuggestion,
} from './types';
import { executeDAG } from './dagExecutor';
import { createTracer } from './tracing';
import { analyzeL1 } from '../agents/L1_NLPAgent';
import { analyzeL2, analyzeL2Sync } from '../agents/L2_EmbedAgent';
import { analyzeL3 } from '../agents/L3_ReasonAgent';
import { analyzeWithGemini } from '../agents/L4_FallbackAgent';
import {
  buildContradictionPrompt,
  buildRefinementPrompt,
  parseContradictionResponse,
} from '../agents/L3_ReasonAgent';
import { computeScore } from '../agents/ScoreAgent';
import { getDistance } from '../agents/DistanceAgent';
import type { CandidateScores, RedFlag } from '../../store/types';

/**
 * Create the agent DAG nodes.
 * Each node wraps an agent with ReAct tracing and blackboard I/O.
 */
function buildAgentDAG(): DAGNode[] {
  return [
    // --- JD Processing (no dependencies, runs immediately) ---
    {
      id: 'jd-processor',
      name: 'JD Processor',
      dependencies: [],
      optional: true, // Pipeline works without structured JD
      async execute(board) {
        const tracer = createTracer('jd-processor', 'JD Processor');
        board.traces.push(tracer.trace());

        try {
          tracer.step(
            'JD text provided, extracting structured requirements',
            'processJD(jdText)',
            '',
          );

          // Dynamic import to keep JD agent out of initial bundle
          const { processJD } = await import('../agents/JDAgent');
          const requirements = processJD(board.jdText);
          board.jdRequirements = requirements;

          tracer.step(
            'JD processing complete',
            'writeToBlackboard(jdRequirements)',
            `Title: ${requirements.title}, Seniority: ${requirements.seniority}, ` +
              `Required skills: ${requirements.requiredSkills.length}, ` +
              `Preferred skills: ${requirements.preferredSkills.length}`,
          );

          tracer.complete();
        } catch (err) {
          tracer.fail(String(err));
        }
      },
    },

    // --- L1 NLP (no dependencies, runs immediately) ---
    {
      id: 'l1-nlp',
      name: 'L1 NLP Agent',
      dependencies: [],
      async execute(board) {
        const tracer = createTracer('l1-nlp', 'L1 NLP Agent');
        board.traces.push(tracer.trace());

        tracer.step(
          'Analyzing resume with keyword extraction and section detection',
          'analyzeL1(resumeText, jdText)',
          '',
        );

        const l1 = analyzeL1(board.resumeText, board.jdText);
        board.l1 = l1;
        board.pipelineLevel = 'L1';

        tracer.step(
          'L1 analysis complete',
          'writeToBlackboard(l1)',
          `Sections: ${l1.sections.join(', ')}. Name: ${l1.name || 'not found'}. ` +
            `Skills score: ${(l1.skillsScore * 100).toFixed(0)}%. Parseable: ${l1.parseability}`,
        );

        tracer.complete();
      },
    },

    // --- L2 Embedding (no dependencies, runs immediately) ---
    {
      id: 'l2-embed',
      name: 'L2 Embedding Agent',
      dependencies: [],
      async execute(board) {
        const tracer = createTracer('l2-embed', 'L2 Embedding Agent');
        board.traces.push(tracer.trace());

        tracer.step(
          'Computing semantic similarity between resume and JD',
          'analyzeL2(resumeText, jdText)',
          '',
        );

        try {
          const l2 = await analyzeL2(board.resumeText, board.jdText);
          board.l2 = l2;
          board.pipelineLevel = 'L2';

          tracer.step(
            'L2 embedding analysis complete',
            'writeToBlackboard(l2)',
            `Method: ${l2.method}. Semantic score: ${(l2.semanticScore * 100).toFixed(0)}%. ` +
              `Matches: ${l2.semanticMatches.length}`,
          );
        } catch {
          // Fallback to TF-IDF
          tracer.step(
            'ONNX embedding failed, falling back to TF-IDF',
            'analyzeL2Sync(resumeText, jdText)',
            '',
          );

          const l2 = analyzeL2Sync(board.resumeText, board.jdText);
          board.l2 = l2;

          tracer.step(
            'TF-IDF fallback complete',
            'writeToBlackboard(l2)',
            `Method: ${l2.method}. Score: ${(l2.semanticScore * 100).toFixed(0)}%`,
          );
        }

        tracer.complete();
      },
    },

    // --- Distance (no dependencies, optional, runs immediately) ---
    {
      id: 'distance',
      name: 'Distance Agent',
      dependencies: ['l1-nlp'], // needs L1 for name/location extraction
      optional: true,
      async execute(board, config) {
        const tracer = createTracer('distance', 'Distance Agent');
        board.traces.push(tracer.trace());

        if (!config.mapsApiKey || !config.jobLocation) {
          tracer.skip('No Maps API key or job location configured');
          return;
        }

        if (!board.l1?.name) {
          tracer.skip('No candidate location found in resume');
          return;
        }

        tracer.step(
          'Extracting candidate location from resume header',
          'extractLocation(resumeText)',
          '',
        );

        const lines = board.resumeText.split('\n').slice(0, 10);
        let candidateLocation = '';
        for (const line of lines) {
          const match = line.match(
            /\b(?:[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2}\b|[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Za-z\s]+(?:India|USA|UK|Canada))/,
          );
          if (match) {
            candidateLocation = match[0];
            break;
          }
        }

        if (!candidateLocation) {
          tracer.skip('No parseable location in resume header');
          return;
        }

        tracer.step(
          `Found location: ${candidateLocation}. Querying distance to ${config.jobLocation}`,
          'getDistance(apiKey, candidateLocation, jobLocation)',
          '',
        );

        const result = await getDistance(config.mapsApiKey, candidateLocation, config.jobLocation);
        if (result) {
          board.distance = { km: result.km, minutes: result.minutes };
          tracer.step(
            'Distance calculated',
            'writeToBlackboard(distance)',
            `${result.km.toFixed(0)}km, ~${result.minutes.toFixed(0)} min drive`,
          );
        } else {
          tracer.step('Distance lookup returned no results', 'skip', 'Weight redistributed');
        }

        tracer.complete();
      },
    },

    // --- Skills Matcher (depends on JD + L1) ---
    {
      id: 'skills-matcher',
      name: 'Skills Taxonomy Matcher',
      dependencies: ['jd-processor', 'l1-nlp'],
      optional: true,
      async execute(board) {
        const tracer = createTracer('skills-matcher', 'Skills Taxonomy Matcher');
        board.traces.push(tracer.trace());

        try {
          tracer.step(
            'Loading skills taxonomy and matching resume skills against JD requirements',
            'computeSkillOverlap(resumeSkills, jdSkills)',
            '',
          );

          const { computeSkillOverlap } = await import('../taxonomy/skillsGraph');

          const resumeSkills = board.l1?.skills ?? [];
          const jdSkills = board.jdRequirements
            ? [
                ...board.jdRequirements.requiredSkills.map((s) => s.normalized || s.raw),
                ...board.jdRequirements.preferredSkills.map((s) => s.normalized || s.raw),
              ]
            : [];

          if (jdSkills.length === 0) {
            // Fallback: extract skills from raw JD text
            const { extractSkillsFromJD } = await import('../agents/JDAgent');
            const extracted = extractSkillsFromJD(board.jdText);
            jdSkills.push(...extracted.required, ...extracted.preferred);
          }

          const overlap = computeSkillOverlap(resumeSkills, jdSkills);
          board.skillMatch = overlap;

          tracer.step(
            'Skills taxonomy matching complete',
            'writeToBlackboard(skillMatch)',
            `Exact: ${overlap.exact.length}, Adjacent: ${overlap.adjacent.length}, ` +
              `Missing: ${overlap.missing.length}, Score: ${(overlap.score * 100).toFixed(0)}%`,
          );

          tracer.complete();
        } catch (err) {
          tracer.fail(String(err));
        }
      },
    },

    // --- L3 Reasoning (depends on L1 + L2 for context) ---
    {
      id: 'l3-reason',
      name: 'L3 Reasoning Agent (Gemma 4)',
      dependencies: ['l1-nlp', 'l2-embed'],
      optional: true, // L4 is the fallback
      async execute(board, config) {
        const tracer = createTracer('l3-reason', 'L3 Reasoning Agent (Gemma 4)');
        board.traces.push(tracer.trace());

        if (config.skipReasoning) {
          tracer.skip('Reasoning skipped by config');
          return;
        }

        tracer.step(
          'Loading Gemma 4 E2B model for contradiction detection and resume refinement',
          'analyzeL3(resumeText, jdText)',
          '',
        );

        try {
          const l3 = await analyzeL3(board.resumeText, board.jdText);
          board.l3 = l3;
          board.redFlags.push(...l3.redFlags);
          board.pipelineLevel = 'L3';

          tracer.step(
            'L3 reasoning complete',
            'writeToBlackboard(l3)',
            `Red flags: ${l3.redFlags.length}. Experience: ${l3.experienceLevel}. ` +
              `Project scores: [${l3.projectScores.join(', ')}]`,
          );

          tracer.complete();
        } catch (err) {
          tracer.fail(`Gemma 4 failed: ${String(err)}`);
          // L4 will pick up as fallback
        }
      },
    },

    // --- L4 Fallback (depends on L3 failing) ---
    {
      id: 'l4-fallback',
      name: 'L4 Gemini API Fallback',
      dependencies: ['l3-reason'],
      optional: true,
      async execute(board, config) {
        const tracer = createTracer('l4-fallback', 'L4 Gemini API Fallback');
        board.traces.push(tracer.trace());

        // Only run if L3 failed AND we have an API key
        const l3Trace = board.traces.find((t) => t.agentId === 'l3-reason');
        if (l3Trace?.status === 'success') {
          tracer.skip('L3 succeeded, L4 not needed');
          return;
        }

        if (!config.geminiApiKey) {
          tracer.skip('No Gemini API key, cannot run L4');
          return;
        }

        tracer.step(
          'L3 failed. Falling back to Gemini 2.5 Flash API for reasoning',
          'analyzeWithGemini(apiKey, contradictionPrompt)',
          '',
        );

        try {
          const prompt = buildContradictionPrompt(board.resumeText, board.jdText);
          const response = await analyzeWithGemini(config.geminiApiKey, prompt);
          const redFlags = parseContradictionResponse(response);
          board.redFlags.push(...redFlags);

          tracer.step(
            'Contradiction detection via Gemini complete',
            'parseContradictionResponse(response)',
            `Found ${redFlags.length} red flags`,
          );

          const refinePrompt = buildRefinementPrompt(board.resumeText);
          const refineResponse = await analyzeWithGemini(config.geminiApiKey, refinePrompt);

          try {
            let cleaned = refineResponse.trim();
            const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) cleaned = jsonMatch[1].trim();
            const objMatch = cleaned.match(/\{[\s\S]*\}/);
            if (objMatch) {
              const parsed = JSON.parse(objMatch[0]);
              board.l3 = {
                redFlags,
                experienceLevel: parsed.experienceLevel ?? 'medium',
                projectScores: parsed.projectScores ?? [],
                reasoning: parsed.reasoning ?? '',
              };
            }
          } catch {
            board.l3 = {
              redFlags,
              experienceLevel: 'medium',
              projectScores: [],
              reasoning: '',
            };
          }

          board.l4Used = true;
          board.pipelineLevel = 'L4';

          tracer.step(
            'L4 Gemini fallback complete',
            'writeToBlackboard(l3, l4Used)',
            `Experience: ${board.l3?.experienceLevel}. Red flags: ${redFlags.length}`,
          );

          tracer.complete();
        } catch (err) {
          tracer.fail(`Gemini API failed: ${String(err)}`);
        }
      },
    },

    // --- Scorer (depends on L1, L2, L3/L4, skills-matcher, distance) ---
    {
      id: 'scorer',
      name: 'Score Agent',
      dependencies: ['l1-nlp', 'l2-embed', 'l4-fallback', 'skills-matcher', 'distance'],
      async execute(board) {
        const tracer = createTracer('scorer', 'Score Agent');
        board.traces.push(tracer.trace());

        if (!board.l1 || !board.l2) {
          tracer.fail('Missing L1 or L2 results');
          return;
        }

        tracer.step(
          'Computing weighted composite score from all agent outputs',
          'computeScore(l1, l2, l3, distance)',
          '',
        );

        const scores = computeScore(
          board.l1,
          board.l2,
          board.l3,
          board.distance ? { km: board.distance.km } : null,
        );

        // Enhance skill match data from taxonomy if available
        if (board.skillMatch) {
          scores.skillsMatch.matched = board.skillMatch.exact;
          scores.skillsMatch.missing = board.skillMatch.missing;
          scores.skillsMatch.semantic = board.skillMatch.adjacent;
        }

        board.scores = scores;

        tracer.step(
          'Scoring complete',
          'writeToBlackboard(scores)',
          `Overall: ${scores.overall}/100. Skills: ${(scores.skillsMatch.score * 100).toFixed(0)}%. ` +
            `Experience: ${scores.experience.level}. Education: ${scores.education.relevance}. ` +
            `Parseable: ${scores.parseability}`,
        );

        tracer.complete();
      },
    },

    // --- Coach (optional, runs last) ---
    {
      id: 'coach',
      name: 'AI Coach Agent',
      dependencies: ['scorer'],
      optional: true,
      async execute(board, config) {
        const tracer = createTracer('coach', 'AI Coach Agent');
        board.traces.push(tracer.trace());

        if (!config.enableCoach) {
          tracer.skip('Coach not enabled');
          return;
        }

        if (!board.scores || !board.l1) {
          tracer.skip('No scores available for coaching');
          return;
        }

        tracer.step(
          'Generating improvement suggestions based on analysis',
          'generateCoachSuggestions(scores, jdRequirements, skillMatch)',
          '',
        );

        const suggestions: CoachSuggestion[] = [];

        // Skills gap coaching
        if (board.skillMatch && board.skillMatch.missing.length > 0) {
          suggestions.push({
            section: 'skills',
            severity: 'high',
            title: `Missing ${board.skillMatch.missing.length} required skills`,
            description: `These skills from the JD are not in your resume: ${board.skillMatch.missing.slice(0, 5).join(', ')}${board.skillMatch.missing.length > 5 ? ` (+${board.skillMatch.missing.length - 5} more)` : ''}`,
            fix: 'Add these skills to your Skills section if you have experience with them. For adjacent skills, mention your related experience.',
            citation: 'NACE Job Outlook 2024: Skills-to-JD match is #1 ATS factor at 30% weight',
          });
        }

        // Adjacent skills opportunity
        if (board.skillMatch && board.skillMatch.adjacent.length > 0) {
          suggestions.push({
            section: 'skills',
            severity: 'tip',
            title: `${board.skillMatch.adjacent.length} related skills detected`,
            description: `You have skills adjacent to JD requirements: ${board.skillMatch.adjacent.join(', ')}. Emphasize how these transfer.`,
            citation: 'Skills taxonomy adjacency matching (ESCO/O*NET)',
          });
        }

        // Red flags coaching
        for (const flag of board.redFlags.slice(0, 3)) {
          suggestions.push({
            section: 'general',
            severity: 'high',
            title: `Red flag: ${flag.type}`,
            description: flag.description,
            fix: `Review and correct: ${flag.evidence}`,
            citation: flag.citation,
          });
        }

        // Seniority mismatch coaching
        if (board.jdRequirements && board.l3) {
          const jdSeniority = board.jdRequirements.seniority;
          const resumeExp = board.l3.experienceLevel;
          if (jdSeniority === 'senior' && resumeExp === 'low') {
            suggestions.push({
              section: 'experience',
              severity: 'high',
              title: 'Seniority mismatch',
              description: `This role requires senior-level experience but your resume indicates entry-level. Consider highlighting leadership, architecture decisions, or mentoring.`,
              citation: 'NACE Internship Survey 2024',
            });
          }
        }

        // Completeness coaching
        if (board.scores.completeness.missingSections.length > 0) {
          suggestions.push({
            section: 'structure',
            severity: 'medium',
            title: `Missing sections: ${board.scores.completeness.missingSections.join(', ')}`,
            description: 'Complete resumes score higher. Add these sections to improve your score.',
            fix: `Add: ${board.scores.completeness.missingSections.join(', ')}`,
            citation: 'Ladders Eye-Tracking 2018: F-pattern scan requires all key sections',
          });
        }

        board.coachSuggestions = suggestions;

        tracer.step(
          'Coach suggestions generated',
          'writeToBlackboard(coachSuggestions)',
          `${suggestions.length} suggestions: ${suggestions.filter((s) => s.severity === 'high').length} high, ${suggestions.filter((s) => s.severity === 'medium').length} medium, ${suggestions.filter((s) => s.severity === 'tip').length} tips`,
        );

        tracer.complete();
      },
    },
  ];
}

/**
 * Create a fresh blackboard for a candidate analysis.
 */
function createBlackboard(
  candidateId: string,
  resumeText: string,
  jdText: string,
  resumePdfBase64?: string,
): Blackboard {
  return {
    candidateId,
    resumeText,
    jdText,
    resumePdfBase64,
    jdRequirements: null,
    l1: null,
    l2: null,
    l3: null,
    l4Used: false,
    skillMatch: null,
    distance: null,
    redFlags: [],
    scores: null,
    pipelineLevel: 'L1',
    traces: [],
    coachSuggestions: null,
  };
}

/**
 * Run the full agentic analysis pipeline for a single resume.
 *
 * This is the new entry point replacing the old linear pipeline.
 * Agents run in a DAG with maximum parallelism. Every decision is traced
 * via the ReAct pattern for full transparency.
 *
 * Pipeline DAG:
 *   JD Processing ─┐
 *                   ├─> Skills Matcher ─┐
 *   L1 NLP ────────┤                   ├─> Scorer ──> Coach
 *                   │                   │
 *   L2 Embed ──────┤                   │
 *                   │                   │
 *   L3 Reason ─────┤   (L4 if fail)    │
 *                   │                   │
 *   Distance ──────────────────────────┘
 */
export async function analyzeResumeAgentic(
  candidateId: string,
  resumeText: string,
  jdText: string,
  config: PipelineConfig = {},
  onProgress?: ProgressCallback,
): Promise<{
  scores: CandidateScores;
  redFlags: RedFlag[];
  traces: import('./types').AgentTrace[];
  coachSuggestions: CoachSuggestion[] | null;
  pipelineLevel: import('../../store/types').AnalysisLayer;
}> {
  const board = createBlackboard(candidateId, resumeText, jdText);
  const dag = buildAgentDAG();

  await executeDAG(dag, board, config, onProgress);

  // Final progress callback
  onProgress?.({
    candidateId,
    layer: 'done',
    scores: board.scores,
    redFlags: board.redFlags,
    pipelineLevel: board.pipelineLevel,
    traces: board.traces,
  });

  if (!board.scores) {
    throw new Error('Pipeline completed without producing scores');
  }

  return {
    scores: board.scores,
    redFlags: board.redFlags,
    traces: board.traces,
    coachSuggestions: board.coachSuggestions,
    pipelineLevel: board.pipelineLevel,
  };
}

/**
 * Batch analyze multiple resumes with the agentic pipeline.
 */
export async function analyzeBatchAgentic(
  candidates: Array<{ id: string; resumeText: string }>,
  jdText: string,
  config: PipelineConfig = {},
  onProgress?: ProgressCallback,
): Promise<
  Map<
    string,
    {
      scores: CandidateScores;
      redFlags: RedFlag[];
      traces: import('./types').AgentTrace[];
    }
  >
> {
  const concurrency = config.concurrency ?? 4;
  const results = new Map<
    string,
    {
      scores: CandidateScores;
      redFlags: RedFlag[];
      traces: import('./types').AgentTrace[];
    }
  >();

  for (let i = 0; i < candidates.length; i += concurrency) {
    const batch = candidates.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((c) =>
        analyzeResumeAgentic(c.id, c.resumeText, jdText, config, onProgress)
          .then((result) => ({ id: c.id, result }))
          .catch((error) => {
            onProgress?.({
              candidateId: c.id,
              layer: 'error',
              scores: null,
              redFlags: [],
              traces: [],
              error: String(error),
            });
            return null;
          }),
      ),
    );

    for (const settled of batchResults) {
      if (settled.status === 'fulfilled' && settled.value) {
        results.set(settled.value.id, settled.value.result);
      }
    }
  }

  return results;
}
