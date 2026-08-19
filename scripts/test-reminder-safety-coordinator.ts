import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kurukoo-reminder-safety-coordinator-'));
process.env.DB_PATH = path.join(tempDir, 'flow.sqlite');
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.KURUKOO_DISABLE_LISTEN = 'true';

const { getDb } = await import('../src/database.js');
const { createReminder, cancelReminder } = await import('../src/services/reminderService.js');
const { addSafetyContact, startCheckIn, completeCheckIn } = await import('../src/services/safetyService.js');
const { getCoordinatorTelemetry } = await import('../src/services/coordinatorStore.js');

const phone = '+2348095550101';
const privateReminderTitle = 'PRIVATE_REMINDER_SENTINEL';
const privateReminderNote = 'PRIVATE_NOTE_SENTINEL';
const privateContactName = 'PRIVATE_CONTACT_SENTINEL';
const privateRouteNote = 'PRIVATE_ROUTE_SENTINEL';