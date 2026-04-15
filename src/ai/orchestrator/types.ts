/**
 * Agentic Pipeline Types
 *
 * Defines the shared blackboard state, agent trace format, and DAG node interfaces
 * for the multi-agent resume analysis pipeline.
 *
 * Architecture: Hybrid DAG + Blackboard pattern
 * - DAG: Agents execute in dependency order with parallel branches
 * - Blackboard: Shared state that agents read from and write to
 * - ReAct traces: Every agent decision is logged as Thought-Action-Observation
 *
 * References:
 * - Yao, S. et al. (2023). "ReAct: Synergizing Reasoning and Acting in LLMs." ICLR.
 * - Google Cloud Agentic AI Design Patterns (2026)
 * - LangGraph state machine orchestration pattern
 */

import type { CandidateScores, RedFlag, AnalysisLayer } from '../../store/types';
import type { L1Result } from '../agents/L1_NLPAgent';
import type { L2Result } from '../agents/L2_EmbedAgent';
import type { L3Result } from '../agents/L3_ReasonAgent';
import type { JDRequirements } from '../agents/JDAgent';

/** A single step in an agent's reasoning trace (ReAct pattern). */
export interface TraceStep {
  /** What the agent is thinking / planning */
  thought: string;
  /** What action the agent took */
  action: string;
  /** What the agent observed from the action */
  observation: string;
  /** Milliseconds this step took */
  durationMs: number;
  /** Timestamp */
  timestamp: number;
}

/** Complete trace for one agent's execution */
export interface AgentTrace {
  agentId: AgentId;
  agentName: string;
  steps: TraceStep[];
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  error?: string;
  startTime: number;
  endTime?: number;
}

/** All agent IDs in the pipeline */
export type AgentId =
  | 'jd-processor'
  | 'l1-nlp'
  | 'l2-embed'
  | 'l3-reason'
  | 'l4-fallback'
  | 'skills-matcher'
  | 'scorer'
  | 'distance'
  | 'coach';

/**
 * The Blackboard: shared state written by agents, read by downstream agents.
 *
 * Each field is nullable -- agents check if their dependencies have written
 * their output before proceeding. If a dependency failed, the agent either
 * uses a fallback or skips gracefully.
 */
export interface Blackboard {
  /** Raw inputs */
  candidateId: string;
  resumeText: string;
  jdText: string;
  resumePdfBase64?: string;

  /** JD Agent output */
  jdRequirements: JDRequirements | null;

  /** L1 NLP Agent output */
  l1: L1Result | null;

  /** L2 Embedding Agent output */
  l2: L2Result | null;

  /** L3 Reasoning Agent output */
  l3: L3Result | null;

  /** L4 Fallback output (only if L3 failed) */
  l4Used: boolean;

  /** Skills taxonomy matching output */
  skillMatch: {
    exact: string[];
    adjacent: string[];
    missing: string[];
    score: number;
  } | null;

  /** Distance Agent output */
  distance: { km: number; minutes: number } | null;

  /** Red flags aggregated from all agents */
  redFlags: RedFlag[];

  /** Final composite scores */
  scores: CandidateScores | null;

  /** The highest AI layer that produced results */
  pipelineLevel: AnalysisLayer;

  /** All agent traces for transparency */
  traces: AgentTrace[];

  /** Coach suggestions (optional, runs last) */
  coachSuggestions: CoachSuggestion[] | null;
}

export interface CoachSuggestion {
  section: string;
  severity: 'high' | 'medium' | 'tip';
  title: string;
  description: string;
  fix?: string;
  citation?: string;
}

/** Configuration for the pipeline */
export interface PipelineConfig {
  geminiApiKey?: string;
  mapsApiKey?: string;
  jobLocation?: string;
  concurrency?: number;
  /** Skip L3/L4 reasoning (faster, less accurate) */
  skipReasoning?: boolean;
  /** Enable coach agent */
  enableCoach?: boolean;
}

/** Progress callback with trace visibility */
export interface PipelineProgress {
  candidateId: string;
  layer: AnalysisLayer | 'jd' | 'skills' | 'score' | 'coach' | 'done' | 'error';
  scores: CandidateScores | null;
  redFlags: RedFlag[];
  pipelineLevel?: AnalysisLayer;
  traces: AgentTrace[];
  error?: string;
}

export type ProgressCallback = (progress: PipelineProgress) => void;

/**
 * DAG node definition. Each node declares its dependencies and the
 * function to execute. The orchestrator runs nodes in topological order
 * with maximum parallelism for independent branches.
 */
export interface DAGNode {
  id: AgentId;
  name: string;
  /** IDs of nodes that must complete before this one starts */
  dependencies: AgentId[];
  /** Execute this agent, reading from and writing to the blackboard */
  execute: (board: Blackboard, config: PipelineConfig) => Promise<void>;
  /** Whether this node is optional (failure doesn't block pipeline) */
  optional?: boolean;
}
