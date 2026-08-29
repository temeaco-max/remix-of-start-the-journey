/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { importTeacherCandidates, listCurationCandidates, getCurationStats } from '../src/services/curationService.js';

const imported = await importTeacherCandidates();
const stats = await getCurationStats();
const queue = await listCurationCandidates({ import: false, status: 'pending', limit: 100 });
console.log(JSON.stringify({ imported, stats, pendingCount: queue.count, pending: queue.candidates.map(candidate => ({ exampleId: candidate.exampleId, scenarioId: candidate.trajectory?.scenarioId || candidate.provenance?.scenarioId || null, skill: candidate.skill, family: candidate.family, actor: candidate.actor, market: candidate.market, locale: candidate.locale, channel: candidate.channel, lifecycle: candidate.lifecycle, scenarioVariant: candidate.scenarioVariant, teacher: candidate.teacher, candidateScore: candidate.candidateScore, failureDimensions: candidate.failureDimensions, reviewStatus: candidate.reviewStatus, reviewed: candidate.reviewed, accepted: candidate.accepted })) }, null, 2));
