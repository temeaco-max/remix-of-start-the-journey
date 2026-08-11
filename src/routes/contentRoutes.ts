import express, { Router } from 'express';
import { getAllBlogArticles, getBlogArticleBySlug } from '../services/contentManager.js';

/** Public content API. Content storage remains owned by contentManager. */
export function createContentRouter(): Router {
    const router = express.Router();

    router.get('/api/blog', async (_req, res) => {
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        try {
            res.json(await getAllBlogArticles());
        } catch (error) {
            console.error('Error fetching blog list:', error);
            res.status(500).json({ error: 'Failed to fetch blog list' });
        }
    });

    router.get('/api/blog/:slug', async (req, res) => {
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        try {
            const article = await getBlogArticleBySlug(req.params.slug);
            if (!article) return res.status(404).json({ error: `Article with slug "${req.params.slug}" not found` });
            res.json(article);
        } catch (error) {
            console.error(`Error fetching article ${req.params.slug}:`, error);
            res.status(500).json({ error: 'Failed to fetch article' });
        }
    });

    return router;
}

export default createContentRouter();
