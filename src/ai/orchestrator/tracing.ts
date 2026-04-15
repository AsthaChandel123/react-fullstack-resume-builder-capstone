/**
 * ReAct Tracing System
 *
 * Provides structured logging for agent reasoning using the ReAct pattern
 * (Reasoning + Acting). Every agent decision produces a Thought-Action-Observation
 * triple that makes the analysis transparent and auditable.
 *
 * Citation: Yao, S. et al. (2023). "ReAct: Synergizing Reasoning and Acting
 * in Language Model Agents." ICLR 2023.
 *
 * Usage:
 *   const tracer = createTracer('l1-nlp', 'L1 NLP Agent');
 *   tracer.step('Checking resume sections', 'detectSections()', 'Found 5 sections');
 *   tracer.complete();
 *   // tracer.trace() returns the full AgentTrace
 */

import type { AgentId, AgentTrace, TraceStep } from './types';

export interface Tracer {
  /** Log a ReAct step: thought -> action -> observation */
  step(thought: string, action: string, observation: string): void;
  /** Mark agent as successfully completed */
  complete(): void;
  /** Mark agent as failed */
  fail(error: string): void;
  /** Mark agent as skipped (dependency failed, optional) */
  skip(reason: string): void;
  /** Get the full trace */
  trace(): AgentTrace;
}

/**
 * Create a tracer for an agent execution.
 * Call step() for each reasoning step, then complete() or fail().
 */
export function createTracer(agentId: AgentId, agentName: string): Tracer {
  const startTime = performance.now();
  let lastStepTime = startTime;
  const steps: TraceStep[] = [];
  let status: AgentTrace['status'] = 'running';
  let error: string | undefined;
  let endTime: number | undefined;

  return {
    step(thought, action, observation) {
      const now = performance.now();
      steps.push({
        thought,
        action,
        observation,
        durationMs: Math.round(now - lastStepTime),
        timestamp: Date.now(),
      });
      lastStepTime = now;
    },

    complete() {
      status = 'success';
      endTime = performance.now();
    },

    fail(err) {
      status = 'failed';
      error = err;
      endTime = performance.now();
    },

    skip(reason) {
      status = 'skipped';
      error = reason;
      endTime = performance.now();
    },

    trace(): AgentTrace {
      return {
        agentId,
        agentName,
        steps,
        status,
        error,
        startTime: Math.round(startTime),
        endTime: endTime ? Math.round(endTime) : undefined,
      };
    },
  };
}

/**
 * Get a human-readable summary of an agent trace.
 * Used in the UI to show "how the AI analyzed your resume."
 */
export function summarizeTrace(trace: AgentTrace): string {
  if (trace.status === 'skipped') return `${trace.agentName}: Skipped (${trace.error})`;
  if (trace.status === 'failed') return `${trace.agentName}: Failed (${trace.error})`;
  if (trace.steps.length === 0) return `${trace.agentName}: No steps recorded`;

  const duration = trace.endTime
    ? `${Math.round(trace.endTime - trace.startTime)}ms`
    : 'running';

  const summary = trace.steps.map((s) => s.observation).filter(Boolean).join('. ');
  return `${trace.agentName} (${duration}): ${summary}`;
}

/**
 * Get total pipeline duration from all traces.
 */
export function pipelineDuration(traces: AgentTrace[]): number {
  if (traces.length === 0) return 0;
  const start = Math.min(...traces.map((t) => t.startTime));
  const end = Math.max(...traces.map((t) => t.endTime ?? t.startTime));
  return Math.round(end - start);
}
