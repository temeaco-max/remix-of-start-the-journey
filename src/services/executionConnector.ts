/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { getCanonicalPersistenceMode } from './canonicalPersistence.js';
import * as sqljs from './executionConnectorSqljs.js';
import * as postgres from './executionPersistence.js';
import { emitDomainEvent, DomainEvents } from './domainEvents.js';
export type { ConnectorAdapter, ExecutionEvidence, ExecutionRequestRecord, ExecutionStatus, EvidenceSource, EvidenceVerificationState } from './executionConnectorSqljs.js';
export { ExecutionAuthorizationError, ExecutionConflictError } from './executionConnectorSqljs.js';
export const EXECUTION_STATUSES = sqljs.EXECUTION_STATUSES;
export const EVIDENCE_SOURCES = sqljs.EVIDENCE_SOURCES;
export const EVIDENCE_VERIFICATION_STATES = sqljs.EVIDENCE_VERIFICATION_STATES;
export const dummyTestConnector = sqljs.dummyTestConnector;
export function registerConnector(adapter: sqljs.ConnectorAdapter){return sqljs.registerConnector(adapter)}
export function getConnector(id:string){return sqljs.getConnector(id)}
function impl<T extends keyof typeof sqljs & keyof typeof postgres>(name:T):typeof sqljs[T]|typeof postgres[T]{return getCanonicalPersistenceMode()==='postgres'?(postgres[name] as any):(sqljs[name] as any)}
export const authorizeProviderConnector=(i:Parameters<typeof sqljs.authorizeProviderConnector>[0])=>impl('authorizeProviderConnector')(i);
export const revokeProviderConnector=(i:Parameters<typeof sqljs.revokeProviderConnector>[0])=>impl('revokeProviderConnector')(i);
export const authorizeProviderExecution=(i:Parameters<typeof sqljs.authorizeProviderExecution>[0])=>impl('authorizeProviderExecution')(i);
export const getExecutionRequest=(id:string)=>impl('getExecutionRequest')(id);
export const getExecutionRequestsForRequest=(id:string)=>impl('getExecutionRequestsForRequest')(id);
export const createExecutionRequest=async(i:Parameters<typeof sqljs.createExecutionRequest>[0])=> { const created = await impl('createExecutionRequest')(i); emitDomainEvent(DomainEvents.EXECUTION_REQUEST_CREATED, { executionId: created.id, requestId: created.requestId, providerPhone: created.providerPhone, actionRequested: created.actionRequested, connectorId: created.connectorId, status: created.status }); return created; };
export const completeDevelopmentExecution=(id:string)=>impl('completeDevelopmentExecution')(id);
export const dispatchExecutionRequest=(id:string)=>impl('dispatchExecutionRequest')(id);
export const drainPendingExecutionRequests=(limit?:number)=>impl('drainPendingExecutionRequests')(limit);
export const updateExecutionStatus=(id:string,status:sqljs.ExecutionStatus,patch?:Parameters<typeof sqljs.updateExecutionStatus>[2])=>impl('updateExecutionStatus')(id,status,patch);
export const recordExecutionEvidence=(id:string,input:Parameters<typeof sqljs.recordExecutionEvidence>[1])=>impl('recordExecutionEvidence')(id,input);
export const reviewExecutionEvidence=(i:Parameters<typeof sqljs.reviewExecutionEvidence>[0])=>impl('reviewExecutionEvidence')(i);
