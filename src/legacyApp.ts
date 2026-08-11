import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import fs from 'fs';
import { getRobotsTxt, getLlmsTxt, getSitemapIndex, getChildSitemap, getSeoPage, getFaqForPage, matchRedirect, getSchemaForPage } from './services/seoService.js';
import { generateReferralCode, claimReferral, trackReferral } from './services/referralService.js';
import { getAdCampaigns } from './services/adManager.js';
import { getDb } from './database.js';

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

async function fetchSeoData(pathname: string, pageTitle?: string): Promise<any> {
    try {
        const seo = await getSeoPage(pathname);
        const schemas = await getSchemaForPage(pathname, pageTitle || seo.title);
        const faqs = await getFaqForPage(pathname);
        return { seo, schemas, faqs };
    } catch {
        return { seo: null, schemas: [], faqs: [] };
    }
}

/**
 * Transitional legacy boundary.
 *
 * Canonical product routes live under src/routes/* and are mounted by
 * src/index.ts. This module now owns only genuinely transitional page/SEO
 * infrastructure; do not add new business APIs here.
 */
export function registerLegacyRoutes(app: express.Application) {
    app.set('trust proxy', 1);
    app.use(express.urlencoded({ extended: true }));
    app.set('view engine', 'ejs');
    app.set('views', path.join(process.cwd(), 'views'));

    app.use(async (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/admin') || req.path.startsWith('/webhook') || req.path.startsWith('/ussd') || req.path.includes('.')) return next();
        try {
            const redirect = await matchRedirect(req.path);
            if (redirect) return res.redirect(redirect.status_code, redirect.to_url);
        } catch (error) {
            console.error('SEO redirect middleware error:', error);
        }
        next();
    });

    app.get('/robots.txt', async (_req, res) => {
        try { res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(await getRobotsTxt()); }
        catch (error) { console.error('robots.txt error:', error); res.status(500).send('Error generating robots.txt'); }
    });

    app.get('/llms.txt', async (_req, res) => {
        try { res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(await getLlmsTxt()); }
        catch (error) { console.error('llms.txt error:', error); res.status(500).send('Error generating llms.txt'); }
    });

    app.get('/*.md', async (req, res, next) => {
        try {
            const rawPath = req.path.slice(0, -3);
            if (rawPath === '/llms') return next();
            const seoData = await fetchSeoData(rawPath);
            const title = seoData.seo?.title || 'Kurukoo Page';
            const description = seoData.seo?.meta_description || '';
            const faqs = seoData.faqs || [];
            let mdContent = `# ${title}\n\n${description}\n\n`;
            if (faqs.length) {
                mdContent += '## Frequently Asked Questions\n\n';
                for (const faq of faqs) mdContent += `### ${faq.question}\n${faq.answer}\n\n`;
            }
            mdContent += `\n---\n*Source: https://kurukoo.com${rawPath}*`;
            res.type('text/markdown').set('Cache-Control', 'public, max-age=3600').send(mdContent);
        } catch { next(); }
    });

    app.get('/sitemap.xml', async (_req, res) => {
        try { res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(await getSitemapIndex()); }
        catch (error) { console.error('Sitemap index error:', error); res.status(500).send('Error generating sitemap index'); }
    });
    for (const type of ['pages', 'categories', 'blog', 'programmatic']) {
        app.get(`/sitemap-${type}.xml`, async (_req, res) => {
            try { res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(await getChildSitemap(type)); }
            catch (error) { console.error(`sitemap-${type} error:`, error); res.status(500).send('Error'); }
        });
    }

    app.use(express.static(path.join(process.cwd(), 'public')));
    app.get('/admin', (_req, res) => res.redirect('/admin/login.html'));
    app.get('/admin/', (_req, res) => res.redirect('/admin/login.html'));
    app.get('/admin/:page', (req, res, next) => {
        const page = req.params.page;
        if (!page.endsWith('.html')) {
            const filePath = path.join(process.cwd(), 'public', 'admin', `${page}.html`);
            if (fs.existsSync(filePath)) return res.sendFile(filePath);
        }
        next();
    });

    // API: Referral Endpoints
    app.post('/api/referral/code', async (req, res) => {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: 'Missing phone' });
        const code = await generateReferralCode(phone);
        res.json({ success: true, code });
    });

    app.post('/api/referral/claim', async (req, res) => {
        const { phone, referral_code } = req.body;
        if (!phone || !referral_code) return res.status(400).json({ error: 'Missing data' });
        try {
            const { findReferrerByCode, trackReferral } = await import('./services/referralService.js');
            const referrer_phone = await findReferrerByCode(referral_code.trim().toUpperCase());
            if (!referrer_phone) {
                return res.status(400).json({ error: 'Invalid referral code' });
            }
            if (referrer_phone === phone) {
                return res.status(400).json({ error: 'You cannot refer yourself' });
            }
            await trackReferral(referrer_phone, phone, referral_code.trim().toUpperCase());
            res.json({ success: true, message: 'Referral registered successfully. 200 Points reward will activate on your first subscription payment.' });
        } catch (e) {
            res.status(500).json({ error: 'Failed to register referral code' });
        }
    });

    app.post('/api/referral/share-reward', async (req, res) => {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: 'Missing phone' });
        try {
            const { awardShareReward } = await import('./services/referralService.js');
            const rewarded = await awardShareReward(phone);
            res.json({ success: true, rewarded });
        } catch (e) {
            res.status(500).json({ error: 'Failed to award sharing reward' });
        }
    });

    app.post('/api/referral/resolve', async (req, res) => {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Missing code' });
        try {
            const { findReferrerByCode } = await import('./services/referralService.js');
            const phone = await findReferrerByCode(code.trim().toUpperCase());
            if (phone) {
                res.json({ success: true, phone });
            } else {
                res.json({ success: false, error: 'Invalid referral code' });
            }
        } catch (e) {
            res.status(500).json({ error: 'Failed to resolve referral code' });
        }
    });

    app.get('/api/referral/stats/:phone', async (req, res) => {
        const { phone } = req.params;
        if (!phone) return res.status(400).json({ error: 'Missing phone' });
        try {
            const { getReferralStats } = await import('./services/referralService.js');
            const stats = await getReferralStats(phone);
            res.json({ success: true, stats });
        } catch (e) {
            res.status(500).json({ error: 'Failed to get referral stats' });
        }
    });

    app.post('/api/referral/track', async (req, res) => {
        const { referrer_phone, referred_phone, referral_code } = req.body;
        if (!referrer_phone || !referred_phone || !referral_code) return res.status(400).json({ error: 'Missing data' });
        try {
            await trackReferral(referrer_phone, referred_phone, referral_code);
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: 'Failed to track referral' });
        }
    });

    app.post('/api/referral/claim-reward', async (req, res) => {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: 'Missing phone' });
        try {
            const result = await claimReferral(phone);
            res.json({ success: true, result });
        } catch (e) {
            res.status(500).json({ error: 'Failed to claim referral reward' });
        }
    });

    // Health check remains in legacyApp as a compatibility route.
    app.get('/health', (req, res) => {
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Homepage remains in legacyApp during incremental extraction.
    app.get('/', async (req, res) => {
        const country = 'ng';
        const t = getLocale('en');
        const reqPath = `/`;
        const { seo, schemas, faqs } = await fetchSeoData(reqPath);
        res.render('index', { country, t, shortcode: '*7000#', seo, schemas, faqs, reqPath });
    });

    // Explore hub remains in legacyApp during incremental extraction.
    app.get('/explore', async (req, res) => {
        try {
            const country = 'ng';
            const categoriesPath = path.join(process.cwd(), 'content', 'explore', 'categories.json');
            let categories = [];
            if (fs.existsSync(categoriesPath)) {
                categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
            }
            const ads = await getAdCampaigns();
            const reqPath = `/explore`;
            const { seo, schemas, faqs } = await fetchSeoData(reqPath);
            res.render('explore/index', { categories, ads, country, t: getLocale('en'), shortcode: '*7000#', seo, schemas, faqs, reqPath });
        } catch (e) {
            console.error('Error loading explore hub:', e);
            res.status(500).send('Error loading Explore Hub');
        }
    });

    // Provider profile page remains in legacyApp during incremental extraction.
    app.get('/p/:providerSlug', async (req, res, next) => {
        try {
            const country = 'ng';
            const providerSlug = req.params.providerSlug;
            const db = await getDb();
            const stmt = db.prepare(`SELECT * FROM memory_profiles WHERE profile_slug = ?`);
            stmt.bind([providerSlug]);
            let profile: any = null;
            if (stmt.step()) profile = stmt.getAsObject();
            stmt.free();
            if (!profile) return next();
            const skills: any[] = [];
            const sStmt = db.prepare(`SELECT * FROM skills WHERE phone = ?`);
            sStmt.bind([profile.phone]);
            while (sStmt.step()) skills.push(sStmt.getAsObject());
            sStmt.free();
            if (skills.length === 0) return next();
            const providerName = String(profile.display_name || profile.name || 'Provider');
            const provider = {
                name: providerName,
                initials: providerName.charAt(0).toUpperCase(),
                location: String(profile.location || profile.primary_lga || 'Nigeria'),
                verified: profile.verified_provider === 1,
                trustScore: Number(profile.trust_score) || 5.0,
                skills: skills.map((s: any) => ({
                    skill: String(s.skill || ''),
                    rating: Number(s.rating) || 5.0,
                    jobsCompleted: Number(s.jobs_completed) || 0,
                    hourlyRate: Number(s.hourly_rate) || 0,
                })),
            };
            const reqPath = `/p/${providerSlug}`;
            let { seo, schemas, faqs } = await fetchSeoData(reqPath, providerName);
            if (!seo.title || seo.title === 'Kurukoo — Wake up. Get going.') {
                seo = { ...seo, title: `${providerName} — ${String(skills[0].skill)} in ${provider.location}`, meta_description: `${providerName} offers ${skills.map((s: any) => s.skill).join(', ')} on Kurukoo.` };
            }
            schemas = [...schemas, {
                '@context': 'https://schema.org', '@type': 'LocalBusiness',
                name: providerName, description: seo.meta_description,
                url: `https://kurukoo.com${reqPath}`,
                address: { '@type': 'PostalAddress', addressLocality: provider.location },
                aggregateRating: { '@type': 'AggregateRating', ratingValue: provider.trustScore.toFixed(1), reviewCount: skills.reduce((sum: number, s: any) => sum + (Number(s.jobs_completed) || 0), 0) },
            }];
            const t = getLocale('en');
            res.render('provider-profile', { country, t, shortcode: '*7000#', provider, seo, schemas, faqs, reqPath });
        } catch (e: any) {
            console.error('Provider profile error:', e);
            next();
        }
    });
}
