import dotenv from 'dotenv';
dotenv.config();

// Validate and set defaults for critical environment variables from .env.example

if (!process.env.KURUKOO_PAY_PROVIDER) process.env.KURUKOO_PAY_PROVIDER = 'sandbox';
if (!process.env.CREDIT_ECONOMY_ENABLED) process.env.CREDIT_ECONOMY_ENABLED = 'true';

console.log(`[Kurukoo Startup] Environment initialized. PORT=${process.env.PORT || 3000}, Pay Provider=${process.env.KURUKOO_PAY_PROVIDER}`);

import { purgeExpiredData, exportUserData, deleteUserData } from './services/dataRetention.js';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { getDb, saveDb, searchUserMessages, searchMessagesByKeyword, getSystemSetting, setSystemSetting } from './database.js';
import { authenticateUser, authenticateAdmin, AuthRequest } from './middleware/auth.js';
import jwt from 'jsonwebtoken';
import { routeIntent } from './services/intentRouter.js';
import { finalizeOrder } from './services/orderFinalizer.js';
import { addPoints, deductPoints, getPointsBalance, addCredits } from './services/pointsEngine.js';
import { handleUssdRequest } from './ussd/menus.js';
import { handleWhatsAppWebhook } from './channels/whatsapp.js';
import { handleTelegramWebhook } from './channels/telegram.js';
import { handleSmsWebhook } from './channels/sms.js';
import { dispatchWebhook } from './channels/channelRegistry.js';
import { activatePulse, endPulseSession, getActivePulseProviders, canActivatePulse } from './services/nearbyPulse.js';
import { isOnboarding, handleOnboardingInput, onboardNewUser } from './services/progressiveOnboarding.js';
import { runEscrowPass } from './services/tradeEngine.js';
import { createWebRTCRoom, getRoomPeers } from './services/webrtcSignalling.js';
import { submitSurveyResponse } from './services/surveyEngine.js';
import { getAllBlogArticles, getBlogArticleBySlug } from './services/contentManager.js';
import { getAdCampaigns, createAdCampaign, spendAdCampaign, matchAdCampaigns, seedDemoAdCampaigns } from './services/adManager.js';
import { getCategoryTrends, getGeographicDensity, getMarketIntelData } from './services/analyticsEngine.js';
import { getPricing, getAllPricing, getPlan, updatePlan, createPlan, deletePlan } from './services/pricingService.js';
import { getAllCommissions, getCommission, updateCommission } from './services/commissionService.js';
import { updateSessionInteraction, startSessionManagerScheduler, checkAndTriggerKeepAlives } from './services/sessionManager.js';
import { recordKeepAliveEvent, getKeepAliveAnalyticsStats } from './services/analytics.js';
import fcmRouter from './server.js';

import { schedulePost } from './services/socialScheduler.js';

import { getAvailableTasks, acceptTask, completeTask } from './services/microTasks.js';
import { getProfile, updateProfile } from './services/memoryProfile.js';
import { generateReferralCode, trackReferral, claimReferral } from './services/referralService.js';
import { submitRating } from './services/ratingService.js';
import { createMoneyCircle, joinMoneyCircle, recordContribution, getCircleDetails, processBuyingCircleDiscount, broadcastSafetyCircleAlert } from './services/moneyCircle.js';
import { getQuickReplies } from './services/quickRepliesService.js';
import { getDailyPick } from './services/dailyPicks.js';
import { getAllAIAgents, getAIAgentById, createAIAgent, updateAIAgent, deleteAIAgent, cloneAIAgent, executeAgentTask } from './services/aiAgentService.js';
import { bookAppointment } from './services/appointmentService.js';
import { createDispute, getDisputeStatus, resolveDispute, escalateDispute } from './services/disputeResolution.js';
import { createEscrow, releaseEscrow, refundEscrow } from './services/escrow.js';
import { sourceProduct } from './services/productSourcing.js';
import { startContactSyncService } from './services/contactSyncService.js';
import { startDeliveryStatusService, updateDeliveryStatus } from './services/deliveryService.js';
import { streamUnifiedAI } from './services/unifiedAiEngine.js';
import { getGitHubSyncStatus, listGitHubFiles, getGitHubDiff, pullFromGitHub, pushToGitHub } from './services/githubService.js';

// §53 SEO Management System
import {
    getRobotsTxt, getLlmsTxt, getSitemapIndex, getChildSitemap,
    getSeoPage, getSeoSettings, updateSeoSettings, getSchemaForPage, getFaqForPage,
    getRedirects, addRedirect, deleteRedirect, matchRedirect,
    log404, get404Log, ignore404,
    getAllSeoPages, upsertSeoPage, deleteSeoPage,
    getFaqForPage as getFaqs, addFaq, updateFaq, deleteFaq, getAllFaqForPage,
    getSchemaTemplates, upsertSchemaTemplate, deleteSchemaTemplate,
    getInternalLinks, addInternalLink, deleteInternalLink, getOrphanPages,
    getKeywords, upsertKeyword, deleteKeyword, getRankings,
    getBacklinks, addBacklink, deleteBacklink,
    getContentCalendar, addContentCalendar, updateContentCalendar, deleteContentCalendar,
    getContentBriefs, addContentBrief, deleteContentBrief,
    runSeoAudit, getAuditResults, getLatestAudits, getSeoDashboard, getHealthScore, runFullAudit,
    getImageMeta, upsertImageMeta, deleteImageMeta,
    generateFaqsForPageWithAI, generateContentBriefWithAI, generateAltTextForImage, generateSeoTitle, generateSeoDescription
} from './services/seoService.js';

import { queryGroq } from './services/groqService.js';
import { createOpenIntention, resolveOpenIntention, getIntentions, incrementAttempt } from './services/deferredRequestService.js';
import { getOpportunitiesForFeed, actOnOpportunity, dismissOpportunity } from './services/opportunityEngine.js';

export function registerLegacyRoutes(app: express.Application) {
    app.set('trust proxy', 1);

app.use('/api/chat/attachments', express.json({ limit: process.env.CHAT_ATTACHMENT_BODY_LIMIT || '35mb' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Chat is mounted by the composition root (src/index.ts). Do not register a
// second /api/chat owner here; legacyApp only owns routes that have not yet
// been extracted into canonical route modules.

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// ===== §53 SEO — Redirect Middleware (applied before route matching) =====
app.use(async (req, res, next) => {
    // Skip for API, admin, webhook, USSD, and static asset requests
    if (req.path.startsWith('/api') || req.path.startsWith('/admin') || req.path.startsWith('/webhook') ||
        req.path.startsWith('/ussd') || req.path.includes('.')) return next();
    try {
        const redirect = await matchRedirect(req.path);
        if (redirect) {
            return res.redirect(redirect.status_code, redirect.to_url);
        }
    } catch (e) {
        console.error('SEO redirect middleware error:', e);
    }
    next();
});

// ===== §53.2.1 — Technical SEO Infrastructure =====

// robots.txt (env-aware, admin-editable from seo_settings)
app.get('/robots.txt', async (req, res) => {
    try {
        const txt = await getRobotsTxt();
        res.header('Content-Type', 'text/plain');
        res.header('Cache-Control', 'public, max-age=3600');
        res.send(txt);
    } catch (e) {
        console.error('robots.txt error:', e);
        res.status(500).send('Error generating robots.txt');
    }
});

// llms.txt (Jeremy Howard 2024 standard — LLM entry point)
app.get('/llms.txt', async (req, res) => {
    try {
        const txt = await getLlmsTxt();
        res.header('Content-Type', 'text/plain');
        res.header('Cache-Control', 'public, max-age=3600');
        res.send(txt);
    } catch (e) {
        console.error('llms.txt error:', e);
        res.status(500).send('Error generating llms.txt');
    }
});

// Clean .md page variant handler (§53.2.1 - GEO/LLM compatibility)
app.get('/*.md', async (req, res, next) => {
    try {
        const rawPath = req.path.slice(0, -3);
        if (rawPath === '/llms') return next();
        const seoData = await fetchSeoData(rawPath);
        const title = seoData.seo?.title || 'Kurukoo Page';
        const description = seoData.seo?.meta_description || '';
        const faqs = seoData.faqs || [];

        let mdContent = `# ${title}\n\n${description}\n\n`;
        if (faqs.length > 0) {
            mdContent += `## Frequently Asked Questions\n\n`;
            for (const f of faqs) {
                mdContent += `### ${f.question}\n${f.answer}\n\n`;
            }
        }
        mdContent += `\n---\n*Source: https://kurukoo.com${rawPath}*`;

        res.header('Content-Type', 'text/markdown; charset=utf-8');
        res.header('Cache-Control', 'public, max-age=3600');
        res.send(mdContent);
    } catch (e) {
        next();
    }
});

// Sitemap index (links to child sitemaps)
app.get('/sitemap.xml', async (req, res) => {
    try {
        const xml = await getSitemapIndex();
        res.header('Content-Type', 'application/xml');
        res.header('Cache-Control', 'public, max-age=3600');
        res.send(xml);
    } catch (e) {
        console.error('Sitemap index error:', e);
        res.status(500).send('Error generating sitemap index');
    }
});

// Child sitemaps
app.get('/sitemap-pages.xml', async (req, res) => {
    try {
        const xml = await getChildSitemap('pages');
        res.header('Content-Type', 'application/xml');
        res.header('Cache-Control', 'public, max-age=3600');
        res.send(xml);
    } catch (e) {
        console.error('sitemap-pages error:', e);
        res.status(500).send('Error');
    }
});

app.get('/sitemap-categories.xml', async (req, res) => {
    try {
        const xml = await getChildSitemap('categories');
        res.header('Content-Type', 'application/xml');
        res.header('Cache-Control', 'public, max-age=3600');
        res.send(xml);
    } catch (e) {
        console.error('sitemap-categories error:', e);
        res.status(500).send('Error');
    }
});

app.get('/sitemap-blog.xml', async (req, res) => {
    try {
        const xml = await getChildSitemap('blog');
        res.header('Content-Type', 'application/xml');
        res.header('Cache-Control', 'public, max-age=3600');
        res.send(xml);
    } catch (e) {
        console.error('sitemap-blog error:', e);
        res.status(500).send('Error');
    }
});

app.get('/sitemap-programmatic.xml', async (req, res) => {
    try {
        const xml = await getChildSitemap('programmatic');
        res.header('Content-Type', 'application/xml');
        res.header('Cache-Control', 'public, max-age=3600');
        res.send(xml);
    } catch (e) {
        console.error('sitemap-programmatic error:', e);
        res.status(500).send('Error');
    }
});

// Static files
app.use(express.static(path.join(process.cwd(), 'public')));

// Admin clean URLs and redirect routing
app.get('/admin', (req, res) => {
    res.redirect('/admin/login.html');
});
app.get('/admin/', (req, res) => {
    res.redirect('/admin/login.html');
});
app.get('/admin/:page', (req, res, next) => {
    const page = req.params.page;
    if (!page.endsWith('.html')) {
        const filePath = path.join(process.cwd(), 'public', 'admin', `${page}.html`);
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
    }
    next();
});

// Helper to load locale
function getLocale(lang: string = 'en') {
    const localeFile = lang;
    const filePath = path.join(process.cwd(), 'locales', `${localeFile}.json`);
    const fallbackPath = path.join(process.cwd(), 'locales', `en.json`);
    
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } else if (fs.existsSync(fallbackPath)) {
            return JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
        }
    } catch (e) {}
    return { tagline: "Your everyday, sorted." };
}

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
    const { phone, referral_code } = req.body;
    if (!phone || !referral_code) return res.status(400).json({ error: 'Missing data' });
    try {
        const result = await claimReferral(phone, referral_code);
        res.json({ success: true, result });
    } catch (e) {
        res.status(500).json({ error: 'Failed to claim referral reward' });
    }
});

// Keep the remaining legacy/public handlers intact during incremental extraction.
// Canonical route groups are owned by src/routes/* and are mounted by src/index.ts.
