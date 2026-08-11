import crypto from 'node:crypto';
import { getDb, saveDb } from '../database.js';
import { getProfile, updateProfile } from './memoryProfile.js';
import { releaseEscrow } from './escrow.js';
import { createEconomicRequest, getEconomicRequest, transitionEconomicRequest } from './skillFlows.js';
import { lockEscrowForEconomicRequest } from './tradeEngine.js';

/**
 * Artist/talent booking is a policy adapter over the shared Economic Request lifecycle.
 * Representation verification is category-specific; matching, quoting, confirmation,
 * escrow and fulfilment are not.
 */
export interface ArtistBookingRequest {
  artistPhone:string;
  eventDate:string;
  venue:string;
  eventDetails:string;
  budgetMinor:number;
  currency?:string;
  audienceSize?:number;
  duration?:string;
  eventType?:string;
  technicalRider?:string;
  travelRequirements?:string;
}
function validDate(value:string){const d=new Date(value);return !Number.isNaN(d.getTime())&&d.getTime()>Date.now();}
function bookingToken(){return crypto.randomBytes(18).toString('base64url');}

export async function requestArtistVerification(phone:string,skill:string,managerName:string,managerContact:string):Promise<void>{const profile=await getProfile(phone);if(!profile)throw new Error('Provider profile not found');if(!skill.trim()||!managerName.trim()||!managerContact.trim())throw new Error('Representation verification details are incomplete');const prefs=profile.preferences||{};prefs.representation_verification={skill:skill.trim(),managerName:managerName.trim(),managerContact:managerContact.trim(),status:'pending',requested_at:new Date().toISOString()};await updateProfile(phone,'system',{preferences:prefs});}
export async function approveArtistVerification(artistPhone:string,approvedBy:string):Promise<void>{const profile=await getProfile(artistPhone);if(!profile)throw new Error('Provider profile not found');if(!approvedBy.trim())throw new Error('Verification approver is required');const prefs=profile.preferences||{};if(!prefs.representation_verification&&!prefs.artist_verification)throw new Error('No representation verification request exists');prefs.representation_verification={...(prefs.representation_verification||prefs.artist_verification),status:'verified',verified_at:new Date().toISOString(),verified_by:approvedBy.trim()};delete prefs.artist_verification;await updateProfile(artistPhone,'system',{preferences:prefs});}

export async function bookArtist(customerPhone:string,request:ArtistBookingRequest):Promise<{requestId:string;bookingToken:string}>{
 if(!validDate(request.eventDate))throw new Error('Booking date must be a future date');
 if(!request.venue.trim()||!request.eventDetails.trim())throw new Error('Venue and event details are required');
 if(!Number.isInteger(request.budgetMinor)||request.budgetMinor<=0)throw new Error('Budget must be a positive integer in minor currency units');
 const provider=await getProfile(request.artistPhone);if(!provider)throw new Error('Provider profile not found');
 const verification=provider.preferences?.representation_verification||provider.preferences?.artist_verification;if(verification?.status!=='verified')throw new Error('Provider representation verification is required before booking');
 const token=bookingToken();const requestId=`booking_${token}`;const requirements={provider_phone:request.artistPhone,artist_or_act:provider.display_name||request.artistPhone,event_date:request.eventDate,venue:request.venue.trim(),event_details:request.eventDetails.trim(),event_type:request.eventType||'performance',audience_size:request.audienceSize??null,duration:request.duration||null,budget:request.budgetMinor,currency:request.currency||'NGN',representation_requirement:'verified representative',technical_rider:request.technicalRider||null,travel_requirements:request.travelRequirements||null};
 await createEconomicRequest({id:requestId,phone:customerPhone,skill:'verified_artist',requirements,amount:request.budgetMinor});
 await transitionEconomicRequest(requestId,'awaiting_match',{providerPhone:request.artistPhone});
 await transitionEconomicRequest(requestId,'matched',{providerPhone:request.artistPhone});
 await transitionEconomicRequest(requestId,'quoting');
 await transitionEconomicRequest(requestId,'quoted',{providerPhone:request.artistPhone,quote:{amount_minor:request.budgetMinor,currency:request.currency||'NGN',provider_name:provider.display_name||'Verified representative',verification:'verified',valid_for_hours:24}});
 return{requestId,bookingToken:token};
}

/** Explicit customer confirmation is the only path from a talent quote to escrow. */
export async function confirmArtistBooking(customerPhone:string,requestId:string):Promise<{success:boolean;requestId:string;orderId?:string;escrowId?:number;message:string}>{const request=await getEconomicRequest(requestId);if(!request||request.phone!==customerPhone)return{success:false,requestId,message:'Booking request not found'};if(request.skill!=='verified_artist')return{success:false,requestId,message:'Request is not an artist booking'};if(!request.providerPhone)return{success:false,requestId,message:'No verified representative has been matched'};if(!['quoted','awaiting_confirmation'].includes(request.status))return{success:false,requestId,message:`Booking cannot be confirmed from status ${request.status}`};const result=await lockEscrowForEconomicRequest(requestId,typeof request.quote?.amount_minor==='number'?Number(request.quote.amount_minor):undefined);return{success:result.success,requestId,orderId:result.orderId,escrowId:result.escrowId,message:result.success?'Booking confirmed and escrow locked. The provider can now proceed.':result.message};}

export async function releaseArtistEscrow(escrowId:number,bypassCoolingOff=false):Promise<{success:boolean;message:string}>{const db=await getDb();const stmt=db.prepare(`SELECT * FROM escrow WHERE id=?`);stmt.bind([escrowId]);if(!stmt.step()){stmt.free();return{success:false,message:'Escrow record not found'};}const escrow=stmt.getAsObject();stmt.free();const diff=(Date.now()-new Date(escrow.created_at as string).getTime())/3600000;if(diff<24&&!bypassCoolingOff)return{success:false,message:`Cannot release funds: booking is still within the 24-hour cooling-off period. (${(24-diff).toFixed(1)} hours remaining)`};await releaseEscrow(escrowId);const requestId=String(escrow.order_id||'');if(requestId){const request=await getEconomicRequest(requestId);if(request&&['in_fulfillment','fulfilled'].includes(request.status)&&request.status!=='fulfilled')await transitionEconomicRequest(requestId,'fulfilled',{providerPhone:String(escrow.provider_phone||''),fulfillment:{completed_at:new Date().toISOString()}});if(request&&request.status==='fulfilled')await transitionEconomicRequest(requestId,'completed',{providerPhone:String(escrow.provider_phone||'')});}return{success:true,message:'Funds successfully released to the verified provider.'};}
