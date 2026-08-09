import { routeIntent } from '../src/services/intentRouter.js';

async function test() {
  try {
    console.log("Testing intent router...");
    const res = await routeIntent('I need a plumber', '+2348030000000');
    console.log("Result:", res);
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
