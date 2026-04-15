/**
 * DAG Pipeline Executor
 *
 * Executes a directed acyclic graph of agents with maximum parallelism.
 * Nodes with satisfied dependencies run concurrently. Failures in optional
 * nodes are logged but don't block the pipeline. Required node failures
 * propagate to dependents (which get skipped).
 *
 * Pattern: Topological sort + parallel execution with shared blackboard.
 *
 * References:
 * - LangGraph state machine orchestration (langchain-ai/langgraph)
 * - Google Cloud: "Choose a design pattern for agentic AI systems" (2026)
 * - Kahn's algorithm for topological sort
 */

import type { Blackboard, DAGNode, AgentId, PipelineConfig, ProgressCallback } from './types';

/**
 * Validate DAG has no cycles (Kahn's algorithm).
 * Returns topological order if valid, throws if cycle detected.
 */
function validateDAG(nodes: DAGNode[]): AgentId[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map<AgentId, number>();
  const adjacency = new Map<AgentId, AgentId[]>();

  for (const node of nodes) {
    inDegree.set(node.id, node.dependencies.length);
    for (const dep of node.dependencies) {
      const existing = adjacency.get(dep) ?? [];
      existing.push(node.id);
      adjacency.set(dep, existing);
    }
  }

  const queue: AgentId[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const order: AgentId[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  if (order.length !== nodes.length) {
    throw new Error('DAG contains a cycle. Check agent dependencies.');
  }

  return order;
}

/**
 * Execute the DAG with maximum parallelism.
 *
 * Algorithm:
 * 1. Find all nodes with zero unresolved dependencies
 * 2. Execute them in parallel
 * 3. When each completes, check if any new nodes have all deps satisfied
 * 4. Repeat until all nodes complete or fail
 *
 * Failed required nodes cause their dependents to be skipped.
 * Failed optional nodes are logged but don't block dependents.
 */
export async function executeDAG(
  nodes: DAGNode[],
  board: Blackboard,
  config: PipelineConfig,
  onProgress?: ProgressCallback,
): Promise<Blackboard> {
  // Validate no cycles
  validateDAG(nodes);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const completed = new Set<AgentId>();
  const failed = new Set<AgentId>();
  const running = new Set<AgentId>();

  /** Check if all dependencies of a node are satisfied */
  function canRun(node: DAGNode): boolean {
    if (completed.has(node.id) || failed.has(node.id) || running.has(node.id)) {
      return false;
    }
    return node.dependencies.every((dep) => {
      if (completed.has(dep)) return true;
      // If dependency failed and this isn't optional, we can't run
      if (failed.has(dep)) {
        const depNode = nodeMap.get(dep);
        return depNode?.optional === true;
      }
      return false;
    });
  }

  /** Check if a node should be skipped because a required dependency failed */
  function shouldSkip(node: DAGNode): boolean {
    return node.dependencies.some((dep) => {
      if (!failed.has(dep)) return false;
      const depNode = nodeMap.get(dep);
      return depNode?.optional !== true;
    });
  }

  return new Promise((resolve) => {
    function scheduleReady() {
      const ready = nodes.filter(canRun);

      // If nothing ready and nothing running, we're done
      if (ready.length === 0 && running.size === 0) {
        resolve(board);
        return;
      }

      for (const node of ready) {
        // Skip if a required dependency failed
        if (shouldSkip(node)) {
          const trace = board.traces.find((t) => t.agentId === node.id);
          if (trace) {
            trace.status = 'skipped';
            trace.error = 'Required dependency failed';
          }
          failed.add(node.id);
          scheduleReady();
          return;
        }

        running.add(node.id);

        node
          .execute(board, config)
          .then(() => {
            completed.add(node.id);
            running.delete(node.id);

            // Emit progress
            onProgress?.({
              candidateId: board.candidateId,
              layer: mapAgentToLayer(node.id),
              scores: board.scores,
              redFlags: board.redFlags,
              pipelineLevel: board.pipelineLevel,
              traces: board.traces,
            });

            scheduleReady();
          })
          .catch((err) => {
            running.delete(node.id);

            const trace = board.traces.find((t) => t.agentId === node.id);
            if (trace) {
              trace.status = 'failed';
              trace.error = String(err);
              trace.endTime = performance.now();
            }

            if (node.optional) {
              // Optional failure: log and continue
              completed.add(node.id);
            } else {
              failed.add(node.id);
            }

            scheduleReady();
          });
      }
    }

    scheduleReady();
  });
}

/** Map agent IDs to progress layer names */
function mapAgentToLayer(
  id: AgentId,
): 'L1' | 'L2' | 'L3' | 'L4' | 'jd' | 'skills' | 'score' | 'coach' | 'done' {
  switch (id) {
    case 'jd-processor':
      return 'jd';
    case 'l1-nlp':
      return 'L1';
    case 'l2-embed':
      return 'L2';
    case 'l3-reason':
      return 'L3';
    case 'l4-fallback':
      return 'L4';
    case 'skills-matcher':
      return 'skills';
    case 'scorer':
      return 'score';
    case 'distance':
      return 'L1'; // groups with L1 since it's a simple lookup
    case 'coach':
      return 'coach';
  }
}
