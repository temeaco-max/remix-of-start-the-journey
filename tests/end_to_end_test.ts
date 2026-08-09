import { handleUssdRequest } from '../src/ussd/menus.js';
import { routeIntent } from '../src/services/intentRouter.js';
import { getDb } from '../src/database.js';

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  try {
    const db = await getDb();
    console.log("TEST 1: DB Connection - PASSED");
    passed++;
  } catch(e) {
    console.error("TEST 1: DB Connection - FAILED", e);
    failed++;
  }

  try {
    const ussdResp = await handleUssdRequest('+2348030000000', '');
    if (ussdResp.startsWith('CON Welcome to Kurukoo')) {
      console.log("TEST 2: USSD Home Menu - PASSED");
      passed++;
    } else {
      console.error("TEST 2: USSD Home Menu - FAILED");
      failed++;
    }
  } catch(e) {
    console.error("TEST 2: USSD Home Menu - FAILED", e);
    failed++;
  }

  try {
    const ussdRespInvalid = await handleUssdRequest('+2348030000000', '999');
    if (ussdRespInvalid.startsWith('END Invalid selection')) {
      console.log("TEST 3: USSD Invalid Selection - PASSED");
      passed++;
    } else {
      console.error("TEST 3: USSD Invalid Selection - FAILED");
      failed++;
    }
  } catch(e) {
    console.error("TEST 3: USSD Invalid Selection - FAILED", e);
    failed++;
  }

  console.log(`\nTests completed. Passed: ${passed}, Failed: ${failed}`);
}

runTests();
