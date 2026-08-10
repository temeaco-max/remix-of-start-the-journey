import crypto from 'node:crypto';
import { getDb, saveDb } from '../database.js';
import { getProfile, updateProfile } from './memoryProfile.js';
import { createEscrow, releaseEscrow } from './escrow.js';
import { createEconomicRequest, getEconomicRequest, transitionEconomicRequest } from './skillFlows.js';

/** Artist booking is a category policy over the shared Economic Request lifecycle. */
export interface ArtistBookingRequest { artistPhone:string; eventDate:string; venue:string; eventDetails:string; budgetMinor:number; currency?:string; }
function validDate(value:string){const d=new Date(value);return !Number.isNaN(d.getTime())&&d.getTime()>Date.now();}
function bookingToken(){return crypto.randomBytes(18).toString('base64url');}

export async function requestArtistVerification(phone:string,skill:string,managerName:string,managerContact:string):Promise<void>{const profile=await getProfile(phone);if(!profile)throw new Error('Provider profile not found');if(!skill.trim()||!managerName.trim()||!managerContact.trim())throw new Error('Representation verification details are incomplete');const prefs=profile.preferences||{};prefs.representation_verification={skill:skill.trim(),managerName:managerName.trim(),managerContact:managerContact.trim(),status:'pending',requested_at:new Date().toISOString()};await updateProfile(phone,'system',{preferences:prefs});}
export async function approveArtistVerification(artistPhone:string,approvedBy:string):Promise<void>{const profile=await getProfile(artistPhone);if(!profile)throw new Error('Provider profile not found');if(!approvedBy.trim())throw new Error('Verification approver is required');const prefs=profile.preferences||{};if(!prefs.representation_verification&&!prefs.artist_verification)throw new Error('No representation verification request exists');prefs.representation_verification={...(prefs.representation_verification||prefs.artist_verification),status:'verified',verified_at:new Date().toISOString(),verified_by:approvedBy.trim()};delete prefs.artist_verification;await updateProfile(artistPhone,'system',{preferences:prefs});}

export async function bookArtist(customerPhone:string,request:ArtistBookingRequest):Promise<{escrowId:number;bookingToken:string;requestId:string}>;
export async function bookArtist(customerPhone:string,artistPhone:string,eventDetails:string,budget:number):Promise<number>;
export async function bookArtist(customerPhone:string,input:ArtistBookingRequest|string,legacyEventDetails?:string,legacyBudget?:number):Promise<number|{escrowId:number;bookingToken:string;requestId:string}>{
 const request:ArtistBookingRequest=typeof input==='string'?{artistPhone:input,eventDate:'',venue:'',eventDetails:legacyEventDetails||'',budgetMinor:Number(legacyBudget||0)}:input;
 if(!validDate(request.eventDate))throw new Error('Booking date must be a future date');if(!request.venue.trim()||!request.eventDetails.trim())throw new Error('Venue and event details are required');if(!Number.isInteger(request.budgetMinor)||request.budgetMinor<=0)throw new Error('Budget must be a positive integer in minor currency units');
 const provider=await getProfile(request.artistPhone);if(!provider)throw new Error('Provider profile not found');const verification=provider.preferences?.representation_verification||provider.preferences?.artist_verification;if(verification?.status!=='verified')throw new Error('Provider representation verification is required before booking');
 const token=bookingToken();const requestId=`booking_${token}`;
 await createEconomicRequest({id:requestId,phone:customerPhone,skill:'verified_artist',requirements:{provider_phone:request.artistPhone,event_date:request.eventDate,venue:request.venue.trim(),event_details:request.eventDetails.trim(),currency:request.currency||'NGN'},amount:request.budgetMinor});
 await transitionEconomicRequest(requestId,'awaiting_match',{providerPhone:request.artistPhone});
 const currency=request.currency||'NGN';const description=`Booking: ${request.eventDetails} | ${request.venue} | ${request.eventDate} | ${currency}`;const escrowId=await createEscrow(requestId,customerPhone,request.artistPhone,request.budgetMinor,`${description} (24-hour cooling-off period)`);
 await transitionEconomicRequest(requestId,'partially_matched',{providerPhone:request.artistPhone,quote:{amount_minor:request.budgetMinor,currency}});saveDb();return typeof input==='string'?escrowId:{escrowId,bookingToken:token,requestId};
}

export async function releaseArtistEscrow(escrowId:number,bypassCoolingOff=false):Promise<{success:boolean;message:string}>{const db=await getDb();const stmt=db.prepare(`SELECT * FROM escrow WHERE id=?`);stmt.bind([escrowId]);if(!stmt.step()){stmt.free();return{success:false,message:'Escrow record not found'};}const escrow=stmt.getAsObject();stmt.free();const diff=(Date.now()-new Date(escrow.created_at as string).getTime())/3600000;if(diff<24&&!bypassCoolingOff)return{success:false,message:`Cannot release funds: booking is still within the 24-hour cooling-off period. (${(24-diff).toFixed(1)} hours remaining)`};await releaseEscrow(escrowId);const requestId=String(escrow.order_id||'');if(requestId){const request=await getEconomicRequest(requestId);if(request&&['partially_matched','awaiting_match'].includes(request.status))await transitionEconomicRequest(requestId,'fulfilled',{providerPhone:String(escrow.provider_phone||''),fulfillment:{completed_at:new Date().toISOString()}});}return{success:true,message:'Funds successfully released to the verified provider.'};}
