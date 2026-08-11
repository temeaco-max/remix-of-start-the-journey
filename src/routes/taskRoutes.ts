/**
 * Work boundary: appointments + micro-tasks.
 * Identity comes from the authenticated session; task ownership is enforced
 * by the underlying task service.
 */
import { Router } from 'express';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import { bookAppointment } from '../services/appointmentService.js';
import { getAvailableTasks, acceptTask, completeTask } from '../services/microTasks.js';

const router = Router();

function sessionPhone(req: AuthRequest): string | null {
  return req.user?.phone ? String(req.user.phone) : null;
}

function positiveInteger(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

router.post('/appointments/book', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  if (req.body?.phone && String(req.body.phone) !== phone) {
    return res.status(403).json({ error: 'Forbidden: phone must match session' });
  }
  const providerPhone = typeof req.body?.provider_phone === 'string' ? req.body.provider_phone.trim() : '';
  const slotTime = typeof req.body?.slot_time === 'string' ? req.body.slot_time.trim() : '';
  if (!providerPhone || !slotTime || providerPhone === phone) {
    return res.status(400).json({ error: 'A valid provider_phone and slot_time are required' });
  }
  const parsedSlot = Date.parse(slotTime);
  if (!Number.isFinite(parsedSlot) || parsedSlot <= Date.now()) {
    return res.status(400).json({ error: 'slot_time must be a valid future date/time' });
  }
  try {
    const appointmentId = await bookAppointment(phone, providerPhone, slotTime);
    res.json({ success: true, appointmentId, message: 'Appointment booked successfully.' });
  } catch {
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

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

router.post('/tasks/accept', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  if (req.body?.phone && String(req.body.phone) !== phone) {
    return res.status(403).json({ error: 'Forbidden: phone must match session' });
  }
  const taskId = positiveInteger(req.body?.taskId ?? req.body?.task_id);
  if (!taskId) return res.status(400).json({ error: 'A positive taskId is required' });
  try {
    await acceptTask(phone, taskId);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to accept task' });
  }
});

router.post('/tasks/complete', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  if (req.body?.phone && String(req.body.phone) !== phone) {
    return res.status(403).json({ error: 'Forbidden: phone must match session' });
  }
  const taskId = positiveInteger(req.body?.taskId ?? req.body?.task_id);
  if (!taskId) return res.status(400).json({ error: 'A positive taskId is required' });
  const result = typeof req.body?.result === 'string' ? req.body.result : '';
  try {
    const response = await completeTask(phone, taskId, result);
    res.json(response);
  } catch {
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

export default router;
