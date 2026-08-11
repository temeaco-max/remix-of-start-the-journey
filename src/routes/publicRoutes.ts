import express, { Router } from 'express';
import fs from 'fs';
import path from 'path';
import {
    getSeoPage,
    getSchemaForPage,
    getFaqForPage,
} from '../services/seoService.js';

function getLocale(lang = 'en') {
    const localePath = path.join(process.cwd(), 'locales', `${lang}.json`);
    const fallbackPath = path.join(process.cwd(), 'locales', 'en.json');

    try {
        const filePath = fs.existsSync(localePath) ? localePath : fallbackPath;
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch {
        // Fall through to the minimal default locale.
    }

    return { tagline: 'Your everyday, sorted.' };
}

async function fetchSeoData(urlPath: string, pageTitle?: string) {
    const seo = await getSeoPage(urlPath);
    const schemas = await getSchemaForPage(urlPath, pageTitle || seo.title);
    const faqs = await getFaqForPage(urlPath);
    return { seo, schemas, faqs };
}

export function createPublicRouter(): Router {
    const router = express.Router();

    const renderPage = async (req: express.Request, res: express.Response, view: string, reqPath = req.path, extra = {}) => {
        const country = 'ng';
        const t = getLocale('en');
        const { seo, schemas, faqs } = await fetchSeoData(reqPath);
        res.render(view, {
            country,
            t,
            shortcode: '*7000#',
            seo,
            schemas,
            faqs,
            reqPath,
            ...extra,
        });
    };

    router.get('/', async (req, res, next) => {
        try {
            await renderPage(req, res, 'index', '/');
        } catch (error) {
            next(error);
        }
    });

    router.get('/explore', async (req, res, next) => {
        try {
            const categoriesPath = path.join(process.cwd(), 'content', 'explore', 'categories.json');
            const categories = fs.existsSync(categoriesPath) ? JSON.parse(fs.readFileSync(categoriesPath, 'utf-8')) : [];
            await renderPage(req, res, 'explore/index', '/explore', { categories, ads: [] });
        } catch (error) {
            next(error);
        }
    });

    router.get('/p/:providerSlug', async (req, res, next) => {
        try {
            const dbModule = await import('../database.js');
            const db = await dbModule.getDb();
            const stmt = db.prepare('SELECT * FROM memory_profiles WHERE profile_slug = ?');
            stmt.bind([req.params.providerSlug]);
            let profile: any = null;
            if (stmt.step()) profile = stmt.getAsObject();
            stmt.free();
            if (!profile) return next();

            const skills: any[] = [];
            const skillStmt = db.prepare('SELECT * FROM skills WHERE phone = ?');
            skillStmt.bind([profile.phone]);
            while (skillStmt.step()) skills.push(skillStmt.getAsObject());
            skillStmt.free();
            if (!skills.length) return next();

            const providerName = String(profile.display_name || profile.name || 'Provider');
            const provider = {
                name: providerName,
                initials: providerName.charAt(0).toUpperCase(),
                location: String(profile.location || profile.primary_lga || 'Nigeria'),
                verified: profile.verified_provider === 1,
                trustScore: Number(profile.trust_score) || 5,
                skills: skills.map((skill: any) => ({
                    skill: String(skill.skill || ''),
                    rating: Number(skill.rating) || 5,
                    jobsCompleted: Number(skill.jobs_completed) || 0,
                    hourlyRate: Number(skill.hourly_rate) || 0,
                })),
            };
            const reqPath = `/p/${req.params.providerSlug}`;
            const { seo, schemas, faqs } = await fetchSeoData(reqPath, providerName);
            res.render('provider-profile', { country: 'ng', t: getLocale('en'), shortcode: '*7000#', provider, seo, schemas, faqs, reqPath });
        } catch (error) {
            next(error);
        }
    });

    router.get('/web', async (_req, res) => {
        res.sendFile(path.join(process.cwd(), 'public', 'dashboard.html'));
    });

    router.get('/download', async (req, res, next) => { try { await renderPage(req, res, 'download', '/download'); } catch (error) { next(error); } });
    router.get('/about', async (req, res, next) => { try { await renderPage(req, res, 'about'); } catch (error) { next(error); } });
    router.get('/contact', async (req, res, next) => { try { await renderPage(req, res, 'contact'); } catch (error) { next(error); } });

    router.get('/help', async (req, res, next) => {
        try {
            await renderPage(req, res, 'help', '/help', {
                articles: [
                    { title: 'Getting Started', body: 'Sign up with your phone number and start chatting.' },
                    { title: 'For Providers', body: 'Add your skills to start accepting gigs.' },
                    { title: 'Payments', body: 'Manage your credits and withdraw earnings.' },
                ],
            });
        } catch (error) { next(error); }
    });

    router.get('/api-docs', async (req, res, next) => { try { await renderPage(req, res, 'api_docs'); } catch (error) { next(error); } });

    router.get('/legal/:section?', async (req, res, next) => {
        try {
            const params = req.params as Record<string, string | undefined>;
            await renderPage(req, res, 'legal', '/legal', { section: params.section || 'privacy' });
        } catch (error) { next(error); }
    });

    router.get('/blog', async (req, res, next) => { try { await renderPage(req, res, 'blog'); } catch (error) { next(error); } });
    router.get('/careers', async (req, res, next) => { try { await renderPage(req, res, 'careers'); } catch (error) { next(error); } });
    router.get('/discover', async (req, res, next) => { try { await renderPage(req, res, 'discover'); } catch (error) { next(error); } });
    router.get('/login', async (req, res, next) => { try { await renderPage(req, res, 'login'); } catch (error) { next(error); } });
    router.get('/for-you', async (req, res, next) => { try { await renderPage(req, res, 'for-you'); } catch (error) { next(error); } });
    router.get('/resources', async (req, res, next) => { try { await renderPage(req, res, 'resources/index'); } catch (error) { next(error); } });
    router.get('/resources/:slug', async (req, res, next) => { try { await renderPage(req, res, 'resources/article', `/resources/${req.params.slug}`, { slug: req.params.slug }); } catch (error) { next(error); } });
    router.get('/partners', async (req, res, next) => { try { await renderPage(req, res, 'partners'); } catch (error) { next(error); } });
    router.get('/advertise', async (req, res, next) => { try { await renderPage(req, res, 'advertise'); } catch (error) { next(error); } });

    return router;
}

export default createPublicRouter();
