export type TrajectoryTurn = {
  role: 'user' | 'assistant';
  text: string;
  expectedMode?: 'conversation' | 'action' | 'reference' | 'clarification' | 'control';
  expectedContext?: string;
  expectedTarget?: string;
};

export type TrajectoryDefinition = {
  id: string;
  market: 'NG' | 'GB' | 'GH' | 'CA';
  locale: string;
  title: string;
  goals: string[];
  turns: TrajectoryTurn[];
};

export type TrajectoryState = {
  activeGoals: string[];
  pausedGoals: string[];
  selectedContext?: string;
  lastActionTarget?: string;
  knownFacts: string[];
};

export type TrajectoryScore = {
  turns: number;
  contextRetention: number;
  interruptionHandling: number;
  correctionHandling: number;
  referenceResolution: number;
  actionDiscipline: number;
  goalRetention: number;
  naturalnessSignals: number;
  overall: number;
  issues: string[];
};

const REFERENCE_PATTERNS = [
  /\bthat one\b/i,
  /\bthe other (?:one|guy|person|place|option)\b/i,
  /\bthe second (?:one|option|guy|person)\b/i,
  /\bsame (?:place|one|thing|time)\b/i,
  /\bgo back to (?:the|that|what)\b/i,
  /\bprevious(?:ly)?\b/i,
  /\bcontinue (?:with|that)\b/i,
  /\bwhat were we doing\b/i,
];

const INTERRUPTION_PATTERNS = [
  /\bactually\b/i,
  /\bforget (?:that|this)\b/i,
  /\bhold on\b/i,
  /\bwait\b/i,
  /\bfor a second\b/i,
  /\bsomething else\b/i,
  /\bon another note\b/i,
];

const CORRECTION_PATTERNS = [
  /\bnot (?:that|him|her|it)\b/i,
  /\bi meant\b/i,
  /\bchange (?:it|that)\b/i,
  /\bmake (?:it|that)\b/i,
  /\bactually,? (?:make|use|set)\b/i,
  /\bno,?\s/i,
];

const ACTION_PATTERNS = [
  /\bplease (?:find|book|buy|get|arrange|order|hire|cancel|schedule)\b/i,
  /\b(?:book|buy|order|hire|arrange|schedule) (?:me|it|that)\b/i,
  /\bgo ahead\b/i,
  /\bdo it\b/i,
  /\bhandle it\b/i,
];

const EXPLORATION_PATTERNS = [
  /\bwhat do you think\b/i,
  /\bmaybe\b/i,
  /\bi(?:'m| am) thinking\b/i,
  /\bwhat if\b/i,
  /\bshould i\b/i,
  /\bwhat(?:'s| is) (?:a )?good\b/i,
];

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

export function detectTrajectorySignals(text: string) {
  const value = String(text || '');
  return {
    reference: REFERENCE_PATTERNS.some(pattern => pattern.test(value)),
    interruption: INTERRUPTION_PATTERNS.some(pattern => pattern.test(value)),
    correction: CORRECTION_PATTERNS.some(pattern => pattern.test(value)),
    action: ACTION_PATTERNS.some(pattern => pattern.test(value)),
    exploration: EXPLORATION_PATTERNS.some(pattern => pattern.test(value)),
  };
}

export function updateTrajectoryState(state: TrajectoryState, turn: TrajectoryTurn): TrajectoryState {
  const next: TrajectoryState = {
    activeGoals: [...state.activeGoals],
    pausedGoals: [...state.pausedGoals],
    selectedContext: state.selectedContext,
    lastActionTarget: state.lastActionTarget,
    knownFacts: [...state.knownFacts],
  };
  if (turn.role !== 'user') return next;
  const signals = detectTrajectorySignals(turn.text);
  if (signals.interruption && signals.action === false) {
    const current = next.activeGoals.at(-1);
    if (current && !next.pausedGoals.includes(current)) next.pausedGoals.push(current);
  }
  if (signals.reference && next.activeGoals.length) {
    next.selectedContext = next.activeGoals.at(-1);
  }
  if (signals.action) {
    next.lastActionTarget = next.selectedContext || next.activeGoals.at(-1);
  }
  if (signals.correction) {
    next.lastActionTarget = next.selectedContext || next.lastActionTarget;
  }
  return next;
}

export function scoreTrajectory(trajectory: TrajectoryDefinition): TrajectoryScore {
  const issues: string[] = [];
  let contextPass = 0;
  let interruptionPass = 0;
  let correctionPass = 0;
  let referencePass = 0;
  let actionDisciplinePass = 0;
  let naturalnessPass = 0;
  let goalPass = 0;
  let checks = 0;
  const state: TrajectoryState = { activeGoals: [...trajectory.goals], pausedGoals: [], knownFacts: [] };

  for (const turn of trajectory.turns) {
    if (turn.role !== 'user') continue;
    const signals = detectTrajectorySignals(turn.text);
    checks += 1;

    if (turn.expectedMode === 'reference') {
      if (signals.reference) referencePass += 1;
      else issues.push(`reference_not_detected:${turn.text}`);
    } else if (signals.reference || signals.interruption || signals.correction || signals.action || signals.exploration) {
      referencePass += signals.reference ? 1 : 0;
      interruptionPass += signals.interruption ? 1 : 0;
      correctionPass += signals.correction ? 1 : 0;
      actionDisciplinePass += signals.action || signals.exploration ? 1 : 0;
    } else {
      actionDisciplinePass += 1;
    }

    if (turn.expectedContext) {
      const normalizedExpected = normalize(turn.expectedContext);
      const contextMatches = state.activeGoals.some(goal => normalize(goal).includes(normalizedExpected) || normalizedExpected.includes(normalize(goal)));
      if (contextMatches) contextPass += 1;
      else issues.push(`context_mismatch:${turn.text}`);
    } else {
      contextPass += 1;
    }

    if (signals.interruption || signals.correction) {
      if (state.pausedGoals.length || state.selectedContext) interruptionPass += 1;
      else issues.push(`interruption_without_preservation:${turn.text}`);
    }

    if (signals.correction) {
      if (state.lastActionTarget || state.selectedContext) correctionPass += 1;
      else issues.push(`correction_without_target:${turn.text}`);
    } else {
      correctionPass += 1;
    }

    if (signals.action && signals.exploration) {
      issues.push(`action_and_exploration_conflict:${turn.text}`);
    }
    if (!signals.action && turn.expectedMode === 'conversation') actionDisciplinePass += 1;

    if (turn.expectedTarget) {
      if (state.lastActionTarget || state.selectedContext) goalPass += 1;
      else issues.push(`goal_target_missing:${turn.text}`);
    } else {
      goalPass += 1;
    }

    naturalnessPass += 1;
    Object.assign(state, updateTrajectoryState(state, turn));
  }

  const denom = Math.max(checks, 1);
  const score = (value: number) => Math.max(0, Math.min(1, value / denom));
  const contextRetention = score(contextPass);
  const interruptionHandling = score(interruptionPass);
  const correctionHandling = score(correctionPass);
  const referenceResolution = score(referencePass);
  const actionDiscipline = score(actionDisciplinePass);
  const goalRetention = score(goalPass);
  const naturalnessSignals = score(naturalnessPass);
  const overall = (
    contextRetention * 0.20 +
    interruptionHandling * 0.15 +
    correctionHandling * 0.15 +
    referenceResolution * 0.15 +
    actionDiscipline * 0.15 +
    goalRetention * 0.10 +
    naturalnessSignals * 0.10
  );
  return { turns: trajectory.turns.length, contextRetention, interruptionHandling, correctionHandling, referenceResolution, actionDiscipline, goalRetention, naturalnessSignals, overall, issues };
}

export function buildReferenceTrajectories(): TrajectoryDefinition[] {
  return [
    {
      id: 'long-001-phone-cleaner-reminder', market: 'NG', locale: 'en-NG',
      title: 'Phone repair interrupted by cleaner and reminder', goals: ['phone repair', 'cleaner', 'reminder'],
      turns: [
        { role: 'user', text: "My phone has been acting weird." , expectedMode: 'conversation' },
        { role: 'assistant', text: 'Tell me what it has been doing and I’ll help you work it out.' },
        { role: 'user', text: 'The screen keeps going black.' },
        { role: 'assistant', text: 'Does it happen randomly or while you use a particular app?' },
        { role: 'user', text: "Actually forget the phone for a second. I need a cleaner." , expectedMode: 'action' },
        { role: 'assistant', text: 'Sure. What area should I use for the cleaner?' },
        { role: 'user', text: 'Ibadan this weekend.' },
        { role: 'assistant', text: 'Got it. I can use Ibadan and this weekend.' },
        { role: 'user', text: 'Remind me tomorrow to call the cleaner.' , expectedMode: 'action' },
        { role: 'assistant', text: 'I can set that reminder.' },
        { role: 'user', text: 'Back to the phone — it is an iPhone 13.' , expectedMode: 'reference' },
        { role: 'assistant', text: 'Back to the phone issue. An iPhone 13, with the screen going black.' },
        { role: 'user', text: 'I need it fixed before Friday.' },
        { role: 'assistant', text: 'Understood. I’ll keep Friday as the deadline.' },
        { role: 'user', text: 'Find someone.' , expectedMode: 'action' },
        { role: 'assistant', text: 'I can look for suitable providers.' },
        { role: 'user', text: 'Not the expensive one. The other guy.' , expectedMode: 'reference', expectedTarget: 'phone repair' },
        { role: 'assistant', text: 'Got it — I’ll keep the phone request and use the other option.' },
      ],
    },
    {
      id: 'long-002-subscription-agent', market: 'GB', locale: 'en-GB',
      title: 'Subscription discussion followed by agent goal', goals: ['subscription', 'agent'],
      turns: [
        { role: 'user', text: 'I think I am paying too much for this subscription.', expectedMode: 'conversation' },
        { role: 'assistant', text: 'I can help you compare what you have now with the available options.' },
        { role: 'user', text: 'What would you do?' },
        { role: 'assistant', text: 'I’d compare the actual benefits you use against what you pay before changing anything.' },
        { role: 'user', text: 'Actually, remind me to review it tomorrow.' , expectedMode: 'action' },
        { role: 'assistant', text: 'I can set that reminder.' },
        { role: 'user', text: 'And keep an eye on the price for me.', expectedMode: 'action' },
        { role: 'assistant', text: 'I can set up a bounded agent goal to monitor the price and tell you if it changes.' },
        { role: 'user', text: 'Not now though. Pause it.' , expectedMode: 'control' },
        { role: 'assistant', text: 'I’ll pause the monitoring goal.' },
        { role: 'user', text: 'The other thing was the subscription.' , expectedMode: 'reference', expectedTarget: 'subscription' },
        { role: 'assistant', text: 'Right — the subscription you were concerned about.' },
      ],
    },
    {
      id: 'long-003-informal-suya', market: 'NG', locale: 'en-NG',
      title: 'Informal local discovery conversation', goals: ['suya discovery'],
      turns: [
        { role: 'user', text: 'Abeg where can I get good suya around here tonight?', expectedMode: 'conversation' },
        { role: 'assistant', text: 'I can help you look for nearby options. Are you after somewhere to sit, or just the closest seller?' },
        { role: 'user', text: 'Just the closest one.' },
        { role: 'assistant', text: 'Got it. I’ll focus on nearby sellers rather than sit-down places.' },
        { role: 'user', text: 'What about the second one you mentioned?', expectedMode: 'reference', expectedTarget: 'suya discovery' },
        { role: 'assistant', text: 'The second option was the other nearby seller.' },
        { role: 'user', text: 'Can they deliver?', expectedMode: 'conversation' },
        { role: 'assistant', text: 'I can check what is actually known about delivery rather than assume it.' },
        { role: 'user', text: 'Actually, leave it. Just tell me which one looks better.' , expectedMode: 'conversation' },
        { role: 'assistant', text: 'I can compare the available evidence and explain the trade-offs.' },
      ],
    },
  ];
}
