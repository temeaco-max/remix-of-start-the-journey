import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getRideVehicleOptions, normalizeRideVehicle, validateRideDispatchFields } from '../src/services/rideDispatchContract.js';

const contract = getRideVehicleOptions();
assert.equal(contract.map(item => item.id).join(','), 'bike,keke,taxi,any');
assert.equal(normalizeRideVehicle(undefined), 'any');
assert.equal(normalizeRideVehicle('okada'), 'bike');
assert.equal(normalizeRideVehicle('tricycle'), 'keke');
assert.equal(normalizeRideVehicle('car'), 'taxi');
assert.equal(validateRideDispatchFields({ vehicleType: 'bike', passengers: 2 }).valid, false);
assert.equal(validateRideDispatchFields({ vehicleType: 'keke', passengers: 3 }).valid, true);
assert.equal(validateRideDispatchFields({ vehicleType: 'any', passengers: 8 }).valid, true);
assert.equal(fs.existsSync(path.join(process.cwd(), 'src/services/quickRideDispatchService.ts')), true);
assert.equal(fs.existsSync(path.join(process.cwd(), 'src/routes/quickRideRoutes.ts')), true);
console.log(JSON.stringify({ passed: true, vehicleTypes: contract.map(item => item.id), default: 'any', leadChargeEvent: 'provider_acceptance' }, null, 2));
