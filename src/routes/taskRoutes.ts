/**
 * Work boundary: appointments + micro-tasks.
 * ChatGPT audit extraction — identity from JWT only.
 * Client cannot book as another user or accept/complete tasks for another phone.
 */
import { Router } from 'express';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import { bookAppointment } from '../services/appointmentService.js';
import { getAvailableTasks, acceptTask, completeTask } from '../services/microTasks.js';

const router = Router();

function sessionPhone(req: AuthRequest): string | null {
  return req.user?.phone ? String(req.user.phone) : null;
}

/** Book appointment — client is always the authenticated session phone */
router.post('/appointments/book', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  if (req.body?.phone && String(req.body.phone) !== phone) {
    return res.status(403).json({ error: 'Forbidden: phone must match session' });
  }
  const provider_phone = req.body?.provider_phone;
  const slot_time = req.body?.slot_time;
  if (!provider_phone || !slot_time) {
    return res.status(400).json({ error: 'Missing provider_phone or slot_time' });
  }
  try {
    const appointmentId = await bookAppointment(phone, String(provider_phone), String(slot_time));
    res.json({ success: true, appointmentId, message: 'Appointment booked successfully.' });
  } catch {
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

/**
 * List available micro-tasks.
 * Auth required so assignment context is bound to a real session;
 * listing itself is global available rows (service filters status=available).
 */
router.get('/tasks', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  if (req.query?.phone && String(req.query.phone) !== phone) {
    return res.status(403).json({ error: 'Forbidden: phone must match session' });
  }
  try {
    const tasks = await getAvailableTasks(phone);
    res.json(tasks);
  } catch {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/** Accept task — assigned_to is always session phone */
router.post('/tasks/accept', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  if (req.body?.phone && String(req.body.phone) !== phone) {
    return res.status(403).json({ error: 'Forbidden: phone must match session' });
  }
  const taskId = req.body?.taskId ?? req.body?.task_id;
  if (taskId === undefined || taskId === null) {
    return res.status(400).json({ error: 'taskId is required' });
  }
  try {
    await acceptTask(phone, parseInt(String(taskId), 10));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to accept task' });
  }
});

/** Complete task — only the assigned session can complete */
router.post('/tasks/complete', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  if (req.body?.phone && String(req.body.phone) !== phone) {
    return res.status(403).json({ error: 'Forbidden: phone must match session' });
  }
  const taskId = req.body?.taskId ?? req.body?.task_id;
  const result = req.body?.result ?? '';
  if (taskId === undefined || taskId === null) {
    return res.status(400).json({ error: 'taskId is required' });
  }
  try {
    const r = await completeTask(phone, parseInt(String(taskId), 10), String(result));
    res.json(r);
  } catch {
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

export default router;
