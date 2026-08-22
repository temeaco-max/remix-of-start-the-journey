import { getCanonicalPersistenceMode } from './canonicalPersistence.js';
import * as sqljs from './economicParticipantsSqljs.js';
import * as postgres from './economicParticipantsPersistence.js';
export type { EconomicOffer, EconomicParticipant, EconomicParticipantRole, EconomicParticipantStatus, EconomicOfferStatus, EconomicOfferProvenance, KnownEconomicOffer } from './economicParticipantsSqljs.js';
export const ECONOMIC_PARTICIPANT_ROLES=sqljs.ECONOMIC_PARTICIPANT_ROLES;
export const ECONOMIC_PARTICIPANT_STATUSES=sqljs.ECONOMIC_PARTICIPANT_STATUSES;
export const ECONOMIC_OFFER_STATUSES=sqljs.ECONOMIC_OFFER_STATUSES;
export const ECONOMIC_OFFER_PROVENANCE=sqljs.ECONOMIC_OFFER_PROVENANCE;
function fn<T extends keyof typeof sqljs & keyof typeof postgres>(name:T){return getCanonicalPersistenceMode()==='postgres'?(postgres[name] as any):(sqljs[name] as any)}
export const attachEconomicOffer=(i:Parameters<typeof sqljs.attachEconomicOffer>[0])=>fn('attachEconomicOffer')(i);
export const addEconomicParticipant=(i:Parameters<typeof sqljs.addEconomicParticipant>[0])=>fn('addEconomicParticipant')(i);
export const searchKnownEconomicOffers=(q:string,limit?:number)=>fn('searchKnownEconomicOffers')(q,limit);
export const startKnownOfferEconomicRequest=(i:Parameters<typeof sqljs.startKnownOfferEconomicRequest>[0])=>fn('startKnownOfferEconomicRequest')(i);
export const getDeliveryCandidates=(i:Parameters<typeof sqljs.getDeliveryCandidates>[0])=>fn('getDeliveryCandidates')(i);
export const selectDeliveryCandidate=(i:Parameters<typeof sqljs.selectDeliveryCandidate>[0])=>fn('selectDeliveryCandidate')(i);
export const getEconomicOffer=(id:string)=>fn('getEconomicOffer')(id);
export const getEconomicParticipants=(id:string)=>fn('getEconomicParticipants')(id);
export const updateEconomicParticipant=(i:Parameters<typeof sqljs.updateEconomicParticipant>[0])=>fn('updateEconomicParticipant')(i);
export const getEconomicRequestCoordination=(id:string)=>fn('getEconomicRequestCoordination')(id);
