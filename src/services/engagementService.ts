/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { getDb } from '../database.js';
import { queryGroq } from './groqService.js';

export async function createSuccessStory(jobId: number) {
    // Generate text via Groq
    const story = await queryGroq(`Generate a short, anonymised success story for a completed job.`);
    const db = await getDb();
    await db.run('INSERT INTO success_stories (story_text, category) VALUES (?, ?)', [story, 'general']);
}
