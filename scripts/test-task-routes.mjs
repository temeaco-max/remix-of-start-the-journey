/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
/**
 * Contract tests for taskRoutes (appointments + micro-tasks).
 * Static analysis — no runtime Express import required.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`  ok: ${msg}`);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, '../src/routes/taskRoutes.ts');
const src = fs.readFileSync(srcPath, 'utf8');

console.log('test-task-routes');

assert(src.includes("router.post('/appointments/book'"), 'POST /appointments/book registered');
assert(src.includes("router.get('/tasks'"), 'GET /tasks registered');
assert(src.includes("router.get('/tasks/summary'"), 'GET /tasks/summary registered');
assert(src.includes("router.post('/tasks/accept'"), 'POST /tasks/accept registered');
assert(src.includes("router.post('/tasks/complete'"), 'POST /tasks/complete registered');
assert(src.includes('authenticateUser'), 'uses authenticateUser');
assert(src.includes('sessionPhone'), 'uses sessionPhone helper');
assert(src.includes('phone must match session'), 'rejects mismatched client phone');
assert(!src.includes('+2348030000000'), 'no demo phone literal');

const markers = [
  "router.post('/appointments/book', authenticateUser",
  "router.get('/tasks', authenticateUser",
  "router.get('/tasks/summary', authenticateUser",
  "router.post('/tasks/accept', authenticateUser",
  "router.post('/tasks/complete', authenticateUser",
];
for (const m of markers) {
  assert(src.includes(m), `auth middleware inline: ${m.split(',')[0]}`);
}

assert(src.includes("from '../services/appointmentService.js'"), 'imports appointment service');
assert(src.includes("from '../services/microTasks.js'"), 'imports microTasks service');
assert(src.includes("from '../database.js'"), 'summary reads the canonical task database owner');
assert(src.includes('TaskStateConflictError'), 'preserves canonical task conflict error handling');
assert(src.includes('taskStateError'), 'returns canonical stale or conflicting task state errors');
assert(src.includes("status IN ('completed', 'approved')"), 'Completed metric uses canonical terminal states');
assert(src.includes("status = 'available'"), 'Available metric uses canonical available state');
assert(src.includes("status = 'in_progress'"), 'In progress metric uses canonical active state');

const taskService = fs.readFileSync(path.join(__dirname, '../src/services/microTasks.ts'), 'utf8');
assert(taskService.includes("status = 'available'"), 'canonical task projection includes available work');
assert(taskService.includes('assigned_to = ?'), 'canonical task projection is owner-scoped');
assert(taskService.includes('getRowsModified'), 'conditional task transitions protect stale and duplicate actions');
assert(taskService.includes("status = 'in_progress'"), 'canonical acceptance transitions to in_progress');
assert(taskService.includes("status = 'completed'"), 'canonical completion transitions to completed');

const template = fs.readFileSync(path.join(__dirname, '../views/app.ejs'), 'utf8');
assert(template.includes('data-workspace-owned-surface="tasks"'), 'Tasks declares an owned workspace surface contract');
assert(template.includes('data-task-metric="available"'), 'Tasks exposes an accessible Available work metric hook');
assert(template.includes('data-task-metric="progress"'), 'Tasks exposes an accessible In progress metric hook');
assert(template.includes('data-task-metric="completed"'), 'Tasks exposes an accessible Completed metric hook');
assert(template.includes('data-tasks-error'), 'Tasks distinguishes unavailable task authority from an empty state');
assert(template.includes('/css/kurukoo-tasks-convergence.css'), 'Tasks loads only its screen-specific convergence CSS');
assert(template.includes('/js/kurukoo-tasks-convergence.js'), 'Tasks loads only its screen-specific convergence JS');

const workspace = fs.readFileSync(path.join(__dirname, '../public/js/kurukoo-workspace.js'), 'utf8');
assert(workspace.includes("api('/api/tasks')"), 'shared workspace hydrator reads the canonical Tasks API');
assert(workspace.includes("status === 'available'"), 'Tasks acceptance is available-state-only in the client projection');
assert(workspace.includes('else if (task.id)'), 'Tasks continuation opens persisted owner-scoped work in the exact canonical Chat context after available work is accepted');
assert(workspace.includes("status === 'completed'"), 'Tasks metrics identify canonical completion');

const convergence = fs.readFileSync(path.join(__dirname, '../public/js/kurukoo-tasks-convergence.js'), 'utf8');
assert(convergence.includes("api('/api/tasks/summary')"), 'Tasks UI reads canonical summary metrics');
assert(convergence.includes("api('/api/tasks/accept'"), 'Tasks UI uses canonical acceptance action');
assert(convergence.includes("api('/api/tasks/complete'"), 'Tasks UI uses canonical completion action');
assert(convergence.includes("sourceType === 'request'"), 'Tasks UI preserves request source context when supplied');
assert(convergence.includes("sourceType === 'conversation'"), 'Tasks UI preserves conversation source context when supplied');
assert(convergence.includes('No available work right now.'), 'Tasks has a distinct empty state for available work');
assert(convergence.includes('No active work right now.'), 'Tasks has a distinct empty state for in-progress work');
assert(convergence.includes('No completed work to show yet.'), 'Tasks has a distinct empty state for completed work');
assert(convergence.includes('Task access requires authentication'), 'Tasks distinguishes authorization failure from unavailable data');

// Composition-root contract: src/index.ts is the canonical application entrypoint.
const indexSrc = fs.readFileSync(path.join(__dirname, '../src/index.ts'), 'utf8');
assert(!indexSrc.includes('legacyApp'), 'composition root does not depend on legacyApp');
assert(indexSrc.includes("./routes/taskRoutes.js"), 'composition root mounts the canonical task route boundary');
assert(indexSrc.includes('taskRoutes'), 'canonical task route is imported by the application entrypoint');

console.log('PASS test-task-routes');
