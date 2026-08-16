import { assessConversationQuality, type ConversationQualityAssessment } from './conversationQualityService.js';
import { detectTrajectorySignals, type TrajectoryDefinition, type TrajectoryTurn } from './conversationTrajectoryService.js';

export interface EvaluatedTurn {
  user: string;
  assistant?: string;
  quality?: ConversationQualityAssessment;
  signals: ReturnType<typeof detectTrajectorySignals>;
}

export interface TrajectoryEvaluation {
  trajectoryId: string;
  turns: number;
  userTurns: number;
  assistantTurns: number;
  conversationQuality: number;
  actionDiscipline: number;
  contextSignals: number;
  responseIssues: string[];
  evaluatedTurns: EvaluatedTurn[];
  status: 'passed' | 'needs_review';
}

function userTurns(trajectory: TrajectoryDefinition): TrajectoryTurn[] {
  return trajectory.turns.filter(turn => turn.role === 'user');
}

/**
 * Evaluates actual assistant responses in a trajectory rather than only
 * evaluating the user's keywords. This is intentionally read-only: it never
 * selects a route, mutates state, or approves an external action.
 */
export function evaluateConversationTrajectory(trajectory: TrajectoryDefinition): TrajectoryEvaluation {
  const issues: string[] = [];
  const evaluated: EvaluatedTurn[] = [];
  let conversationQualityTotal = 0;
  let qualityCount = 0;
  let actionDisciplinePass = 0;
  let actionDisciplineChecks = 0;
  let contextSignalPass = 0;
  let contextSignalChecks = 0;

  for (let i = 0; i < trajectory.turns.length; i += 1) {
    const turn = trajectory.turns[i];
    if (turn.role !== 'user') continue;
    const assistant = trajectory.turns[i + 1]?.role === 'assistant' ? trajectory.turns[i + 1].text : undefined;
    const signals = detectTrajectorySignals(turn.text);

    if (turn.expectedContext) {
      contextSignalChecks += 1;
      const text = turn.text.toLowerCase();
      const expected = turn.expectedContext.toLowerCase();
      if (text.includes(expected)) contextSignalPass += 1;
      else if (signals.reference || signals.interruption || signals.correction) contextSignalPass += 1;
      else issues.push(`context_signal_missing:${turn.text}`);
    }

    if (turn.expectedMode === 'conversation' || signals.exploration) {
      actionDisciplineChecks += 1;
      if (!signals.action) actionDisciplinePass += 1;
      else issues.push(`premature_action_language:${turn.text}`);
    }

    let quality: ConversationQualityAssessment | undefined;
    if (assistant) {
      quality = assessConversationQuality({
        latestUserMessage: turn.text,
        assistantReply: assistant,
      });
      conversationQualityTotal += quality.score;
      qualityCount += 1;
      for (const issue of quality.issues) issues.push(`${issue}:${turn.text}`);
    }

    evaluated.push({ user: turn.text, assistant, quality, signals });
  }

  const conversationQuality = qualityCount ? conversationQualityTotal / qualityCount : 0;
  const actionDiscipline = actionDisciplineChecks ? actionDisciplinePass / actionDisciplineChecks : 1;
  const contextSignals = contextSignalChecks ? contextSignalPass / contextSignalChecks : 1;

  return {
    trajectoryId: trajectory.id,
    turns: trajectory.turns.length,
    userTurns: userTurns(trajectory).length,
    assistantTurns: trajectory.turns.filter(turn => turn.role === 'assistant').length,
    conversationQuality,
    actionDiscipline,
    contextSignals,
    responseIssues: issues,
    evaluatedTurns: evaluated,
    status: conversationQuality >= 0.72 && actionDiscipline >= 0.95 && contextSignals >= 0.95 && issues.length === 0 ? 'passed' : 'needs_review',
  };
}

export function evaluateTrajectories(trajectories: TrajectoryDefinition[]): TrajectoryEvaluation[] {
  return trajectories.map(evaluateConversationTrajectory);
}
