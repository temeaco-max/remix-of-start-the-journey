/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { Router } from 'express';
import { authenticateUser, type AuthRequest } from '../middleware/auth.js';
import { getOutcomeContext } from '../services/outcomeContextService.js';

const router=Router();
router.get('/outcomes/:requestId/context',authenticateUser,async(req:AuthRequest,res)=>{
  try{const context=await getOutcomeContext({ownerPhone:String(req.user?.phone||''),requestId:String(req.params.requestId||'')});if(!context)return res.status(404).json({success:false,error:'Outcome context not found.'});return res.json({success:true,context});}
  catch(error){return res.status(500).json({success:false,error:error instanceof Error?error.message:'Unable to build outcome context.'});}
});
export default router;
