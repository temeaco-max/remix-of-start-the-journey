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

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        res.status(500).json({ error: 'Failed to fetch referral stats' });
    }
});

// API: Rating Endpoint
app.post('/api/ratings', async (req, res) => {
    const { provider_phone, skill, rating } = req.body;
    if (!provider_phone || !skill || !rating) return res.status(400).json({ error: 'Missing data' });
    
    await submitRating(provider_phone, skill, parseInt(rating));
    res.json({ success: true });
});

// API: Quick Replies Endpoint
app.get('/api/quick-replies', async (req, res) => {
    const phone = (req.query.phone as string) || '+2348030000000';
    try {
        const quickReplies = await getQuickReplies(phone);
        res.json({ success: true, quickReplies });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch quick replies' });
    }
});

// API: Money Circle Endpoints
app.post('/api/circle/create', async (req, res) => {
    const { name, creator_phone, target_amount, mode } = req.body;
    if (!name || !creator_phone || !target_amount) {
        return res.status(400).json({ error: 'Missing required parameters (name, creator_phone, target_amount)' });
    }
    try {
        const circleId = await createMoneyCircle(name, creator_phone, parseFloat(target_amount), mode || 'Standard');
        res.json({ success: true, circleId, message: `Money Circle "${name}" created successfully.` });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create Money Circle' });
    }
});

app.post('/api/circle/join', async (req, res) => {
    const { circle_id, phone } = req.body;
    if (!circle_id || !phone) {
        return res.status(400).json({ error: 'Missing required parameters (circle_id, phone)' });
    }
    try {
        const success = await joinMoneyCircle(parseInt(circle_id), phone);
        if (success) {
            res.json({ success: true, message: `Joined circle ${circle_id} successfully.` });
        } else {
            res.status(404).json({ error: 'Money Circle not found' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Failed to join Money Circle' });
    }
});

app.post('/api/circle/contribute', async (req, res) => {
    const { circle_id, phone, amount } = req.body;
    if (!circle_id || !phone || !amount) {
        return res.status(400).json({ error: 'Missing required parameters (circle_id, phone, amount)' });
    }
    try {
        const success = await recordContribution(parseInt(circle_id), phone, parseFloat(amount));
        res.json({ success, message: `Recorded contribution of ${amount} for circle ${circle_id}.` });
    } catch (e) {
        res.status(500).json({ error: 'Failed to record contribution' });
    }
});

app.get('/api/circle/:id', async (req, res) => {
    const circleId = parseInt(req.params.id);
    if (isNaN(circleId)) return res.status(400).json({ error: 'Invalid circle ID' });
    try {
        const details = await getCircleDetails(circleId);
        if (!details) {
            return res.status(404).json({ error: 'Money Circle not found' });
        }
        res.json({ success: true, circle: details });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch Money Circle details' });
    }
});

app.post('/api/circle/:id/buying-discount', async (req, res) => {
    const circleId = parseInt(req.params.id);
    if (isNaN(circleId)) return res.status(400).json({ error: 'Invalid circle ID' });
    try {
        const result = await processBuyingCircleDiscount(circleId);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: 'Failed to process Buying Circle discount' });
    }
});

app.post('/api/circle/:id/safety-alert', async (req, res) => {
    const circleId = parseInt(req.params.id);
    const { alert_phone, alert_type } = req.body;
    if (isNaN(circleId) || !alert_phone) return res.status(400).json({ error: 'Missing parameters' });
    try {
        const result = await broadcastSafetyCircleAlert(circleId, alert_phone, alert_type || 'General Alert');
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: 'Failed to broadcast Safety Circle alert' });
    }
});

// API: Daily Picks Endpoint
app.get('/api/daily-pick', (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    try {
        const pick = getDailyPick();
        res.json({ success: true, pick });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch Daily Pick' });
    }
});

// API: User Privacy / Data Retention
app.get('/api/user/export', async (req, res) => {
    const phone = req.query.phone as string;
    if (!phone) return res.status(400).json({ error: 'Phone parameter is required' });
    try {
        const data = await exportUserData(phone);
        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ error: 'Failed to export user data' });
    }
});

app.post('/api/user/delete', async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone is required' });
    try {
        await deleteUserData(phone);
        res.json({ success: true, message: `User data for ${phone} successfully purged.` });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete user data' });
    }
});

// API: Appointments
app.post('/api/appointments/book', async (req, res) => {
    const { phone, provider_phone, slot_time } = req.body;
    if (!phone || !provider_phone || !slot_time) {
        return res.status(400).json({ error: 'Missing phone, provider_phone, or slot_time' });
    }
    try {
        const appointmentId = await bookAppointment(phone, provider_phone, slot_time);
        res.json({ success: true, appointmentId, message: 'Appointment booked successfully.' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to book appointment' });
    }
});

// API: Disputes
app.post('/api/dispute/create', async (req, res) => {
    const { phone, order_id, reason } = req.body;
    if (!phone || !order_id || !reason) {
        return res.status(400).json({ error: 'Missing phone, order_id, or reason' });
    }
    try {
        const disputeId = await createDispute(phone, order_id, reason);
        res.json({ success: true, disputeId, message: 'Dispute submitted successfully.' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create dispute' });
    }
});

app.post('/api/disputes', async (req, res) => {
    const { phone, order_id, orderId, reason } = req.body;
    const targetOrderId = order_id || orderId;
    if (!phone || !targetOrderId || !reason) {
        return res.status(400).json({ error: 'Missing phone, order_id, or reason' });
    }
    try {
        const disputeId = await createDispute(phone, targetOrderId, reason);
        res.json({ success: true, disputeId, message: 'Dispute submitted successfully.' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create dispute' });
    }
});

// API: Scam Reports
app.post('/api/scam_reports', async (req, res) => {
    const { reporter_phone, reported_phone, description } = req.body;
    if (!reporter_phone || !reported_phone || !description) {
        return res.status(400).json({ error: 'Missing reporter_phone, reported_phone, or description' });
    }
    try {
        const db = await getDb();
        db.run(`INSERT INTO scam_reports (reporter_phone, reported_phone, description, status) VALUES (?, ?, ?, 'pending')`, 
            [reporter_phone, reported_phone, description]);
        saveDb();
        res.json({ success: true, message: 'Scam report submitted successfully.' });
    } catch (e) {
        console.error('Failed to submit scam report:', e);
        res.status(500).json({ error: 'Failed to submit scam report' });
    }
});

app.get('/api/dispute/:id', async (req, res) => {
    const disputeId = parseInt(req.params.id);
    if (isNaN(disputeId)) return res.status(400).json({ error: 'Invalid dispute ID' });
    try {
        const status = await getDisputeStatus(disputeId);
        res.json({ success: true, disputeId, status });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch dispute status' });
    }
});

app.post('/api/dispute/:id/resolve', async (req, res) => {
    const disputeId = parseInt(req.params.id);
    const { resolution } = req.body;
    if (isNaN(disputeId) || !resolution) return res.status(400).json({ error: 'Missing disputeId or resolution' });
    try {
        await resolveDispute(disputeId, resolution);
        res.json({ success: true, message: 'Dispute resolved successfully.' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to resolve dispute' });
    }
});

app.post('/api/dispute/:id/escalate', async (req, res) => {
    const disputeId = parseInt(req.params.id);
    if (isNaN(disputeId)) return res.status(400).json({ error: 'Invalid dispute ID' });
    try {
        await escalateDispute(disputeId);
        res.json({ success: true, message: 'Dispute escalated to admin review.' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to escalate dispute' });
    }
});

// API: Escrow
app.post('/api/escrow/create', authenticateUser, async (req: AuthRequest, res) => {
    const { order_id, buyer_phone, provider_phone, amount_minor, description } = req.body;
    if (!buyer_phone || !provider_phone || !amount_minor) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    const finalOrderId = order_id || `esc_${Date.now()}`;
    try {
        const escrowId = await createEscrow(finalOrderId, buyer_phone, provider_phone, parseInt(amount_minor), description || '');
        res.json({ success: true, escrowId, message: 'Escrow created and funds held.' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create escrow' });
    }
});

app.post('/api/escrow/release', async (req, res) => {
    const { escrow_id } = req.body;
    if (!escrow_id) return res.status(400).json({ error: 'escrow_id is required' });
    try {
        const success = await releaseEscrow(parseInt(escrow_id));
        res.json({ success, message: 'Escrow released to provider.' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to release escrow' });
    }
});

app.post('/api/escrow/refund', async (req, res) => {
    const { escrow_id } = req.body;
    if (!escrow_id) return res.status(400).json({ error: 'escrow_id is required' });
    try {
        const success = await refundEscrow(parseInt(escrow_id));
        res.json({ success, message: 'Escrow refunded to buyer.' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to refund escrow' });
    }
});

// API: Product Sourcing
app.get('/api/product-sourcing', async (req, res) => {
    const query = (req.query.query as string) || '';
    const country = (req.query.country as string) || 'ng';
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }
    try {
        const products = await sourceProduct(query, country);
        res.json({ success: true, products });
    } catch (e) {
        res.status(500).json({ error: 'Failed to source product' });
    }
});

// Default Cache-Control for dynamic API, admin, and webhook routes (NEVER CACHE)
app.use(['/api', '/admin', '/webhook', '/ussd'], (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    next();
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/docs', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'api-docs.html'));
});

// API: Dynamic Hero Taglines
app.get('/api/hero-taglines', (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    try {
        const country = (req.query.country as string || '').toLowerCase();
        const jsonPath = path.join(process.cwd(), 'hero-taglines.json');
        if (fs.existsSync(jsonPath)) {
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            const list = data.global;
            if (Array.isArray(list)) {
                return res.json({ success: true, taglines: list });
            }
        }
    } catch (err) {
        console.error('Error reading hero-taglines.json:', err);
    }
    res.json({
        success: true,
        taglines: [
            { text: "Wake up. Get going.", angle: "Ecosystem Core", highlight: "Get going." },
            { text: "A modern utility platform for everyday hustle.", angle: "Everyday Hustle", highlight: "everyday hustle." },
            { text: "Your everyday, sorted.", angle: "Everyday Utility", highlight: "sorted." }
        ]
    });
});

// API: Profile
app.get('/api/profile', authenticateUser, async (req: AuthRequest, res) => {
    const phone = (req.query.phone as string) || req.user?.phone;
    if (req.user?.phone !== phone) return res.status(403).json({ error: 'Forbidden: You can only view your own profile' });
    const db = await getDb();
    const stmt = db.prepare(`SELECT * FROM memory_profiles WHERE phone = ?`);
    stmt.bind([phone]);
    let profile: any = null;
    if (stmt.step()) {
        profile = stmt.getAsObject();
    } else {
        db.run(`INSERT INTO memory_profiles (phone, name, location, country, subscription_tier, wallet_balance_minor) VALUES (?, 'New User', 'Ibadan', 'ng', 'Base', 30)`, [phone]);
        saveDb();
        const newStmt = db.prepare(`SELECT * FROM memory_profiles WHERE phone = ?`);
        newStmt.bind([phone]);
        if (newStmt.step()) profile = newStmt.getAsObject();
        newStmt.free();
    }
    stmt.free();

    // Query listed skills for this phone number
    const skillsStmt = db.prepare(`SELECT * FROM skills WHERE phone = ?`);
    skillsStmt.bind([phone]);
    const skills = [];
    while (skillsStmt.step()) {
        skills.push(skillsStmt.getAsObject());
    }
    skillsStmt.free();

    res.json({ profile, skills });
});

// API: Messages
app.get('/api/messages', authenticateUser, async (req: AuthRequest, res) => {
    const phone = (req.query.phone as string) || req.user?.phone;
    if (req.user?.phone !== phone) return res.status(403).json({ error: 'Forbidden: You can only view your own messages' });
    const keyword = (req.query.q as string) || (req.query.keyword as string);
    if (keyword) {
        const results = await searchUserMessages(phone!, keyword);
        return res.json(results);
    }
    const db = await getDb();
    const stmt = db.prepare(`SELECT * FROM messages WHERE phone = ? ORDER BY id ASC`);
    stmt.bind([phone]);
    const messages = [];
    while (stmt.step()) {
        messages.push(stmt.getAsObject());
    }
    stmt.free();
    res.json(messages);
});

// API: Messages Search by Keyword
app.get('/api/messages/search', authenticateUser, async (req: AuthRequest, res) => {
    const phone = (req.query.phone as string) || '+2348030000000';
    const keyword = (req.query.q as string) || (req.query.keyword as string) || '';
    if (!keyword) {
        return res.json([]);
    }
    const results = await searchUserMessages(phone, keyword);
    res.json(results);
});

// API: Retrieve Past Orders
app.get('/api/orders', async (req, res) => {
    const phone = (req.query.phone as string) || '+2348030000000';
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC`);
        stmt.bind([phone]);
        const orders = [];
        while (stmt.step()) {
            orders.push(stmt.getAsObject());
        }
        stmt.free();
        res.json(orders);
    } catch (err: any) {
        console.error('[API Orders] Error retrieving orders:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API: Update Delivery Status manually (Real-time update webhook simulation)
app.post('/api/orders/:id/delivery-status', async (req, res) => {
    const orderId = req.params.id;
    const { status, message } = req.body;
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    try {
        await updateDeliveryStatus(orderId, status, message);
        res.json({ success: true, message: `Order ${orderId} updated to ${status}.` });
    } catch (err: any) {
        console.error('[API Orders] Error updating order delivery status:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// API: Delete Message History (supports both DELETE /api/messages and POST /api/messages/delete)
const deleteMessagesHandler = async (req: express.Request, res: express.Response) => {
    const phone = (req.query.phone as string) || (req.body.phone as string);
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }
    try {
        const db = await getDb();
        db.run(`DELETE FROM messages WHERE phone = ?`, [phone]);
        
        // Log the action
        db.run(`INSERT INTO audit_logs (action, details) VALUES (?, ?)`, [
            'messages_cleared',
            JSON.stringify({ phone })
        ]);
        
        saveDb();
        res.json({ success: true, message: 'Message history deleted successfully.' });
    } catch (err: any) {
        console.error('[API Messages] Error deleting messages:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

app.delete('/api/messages', authenticateUser, deleteMessagesHandler);
app.post('/api/messages/delete', authenticateUser, deleteMessagesHandler);

// API: Chat
app.post('/api/iot/command', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const { protocol, ip, topic, payload, path, method } = req.body;
        
        if (protocol === 'mqtt') {
            const { sendMqttCommand } = await import('./services/iotBridge.js');
            sendMqttCommand(topic, payload);
            res.json({ success: true });
        } else if (protocol === 'http') {
            const fetchRes = await fetch(`http://${ip}${path}`, { 
                method: method || 'POST',
                // Can add body or other headers if required in future
            });
            res.json({ success: fetchRes.ok });
        } else {
            res.status(400).json({ error: 'Unknown protocol' });
        }
    } catch (e) {
        console.error('IoT command error:', e);
        res.status(500).json({ error: 'Command failed' });
    }
});

app.post(['/api/chat', '/api/pwa/chat'], authenticateUser, async (req: AuthRequest, res) => {
    const { phone, message, channel, provider } = req.body;
    if (!phone || !message) {
        return res.status(400).json({ error: 'Missing phone or message' });
    }

    const db = await getDb();
    db.run(`INSERT INTO messages (phone, sender, content, channel) VALUES (?, 'user', ?, ?)`, [phone, message, channel || 'pwa']);
    
    await updateSessionInteraction(phone);
    
    // Check reset onboarding command
    if (message.toLowerCase() === 'reset onboarding') {
        const welcome = await onboardNewUser(phone);
        db.run(`INSERT INTO messages (phone, sender, content, channel) VALUES (?, 'assistant', ?, ?)`, [phone, welcome, channel || 'pwa']);
        saveDb();
        return res.json({ success: true, reply: welcome });
    }

    // Check if in onboarding flow
    const onboardingActive = await isOnboarding(phone);
    if (onboardingActive) {
        const onboardingRes = await handleOnboardingInput(phone, message);
        const cardJson = onboardingRes.cardData ? JSON.stringify(onboardingRes.cardData) : null;
        db.run(`INSERT INTO messages (phone, sender, content, channel, card_data) VALUES (?, 'assistant', ?, ?, ?)`, [phone, onboardingRes.reply, channel || 'pwa', cardJson]);
        saveDb();
        return res.json({ success: true, reply: onboardingRes.reply, cardData: onboardingRes.cardData });
    }

    // Route intent
    const routing = await routeIntent(message, phone, provider);
    let orderResult = { success: true, message: '' };

    if (routing.skill && routing.skill !== 'general_question') {
        orderResult = await finalizeOrder(phone, 'lead', { skill: routing.skill });
    }

    const assistantReply = `${routing.reply} ${orderResult.message ? '(' + orderResult.message + ')' : ''}`;
    const cardJson = routing.cardData ? JSON.stringify(routing.cardData) : null;

    db.run(`INSERT INTO messages (phone, sender, content, channel, card_data) VALUES (?, 'assistant', ?, ?, ?)`, [phone, assistantReply, channel || 'pwa', cardJson]);

    // SECTION 5: Contextual Ad Delivery matching on keywords (e.g. rice, ride, bread)
    try {
        const matchedAds = await matchAdCampaigns(message);
        if (matchedAds.length > 0) {
            const ad = matchedAds[0];
            const spendSuccess = await spendAdCampaign(ad.id, 2);
            if (spendSuccess) {
                const adCardData = {
                    type: 'product_card',
                    title: `[SPONSORED] ${ad.title}`,
                    desc: ad.desc,
                    image: ad.imageUrl,
                    price: ad.title.includes('Rice') ? '₦32,500' : ad.title.includes('ride') ? '₦500' : '₦1,500'
                };
                db.run(
                    `INSERT INTO messages (phone, sender, content, channel, card_data) VALUES (?, 'assistant', ?, ?, ?)`,
                    [phone, `Recommended Sponsored Deal: ${ad.title}`, channel || 'pwa', JSON.stringify(adCardData)]
                );
            }
        }
    } catch (adError) {
        console.error('Error delivering contextual sponsored ad:', adError);
    }

    saveDb();

    res.json({ success: true, reply: assistantReply, cardData: routing.cardData });
});

// API: Real-time Streaming Chat (SSE - Server-Sent Events)
app.post('/api/chat/stream', authenticateUser, async (req: AuthRequest, res) => {
    const { phone, message, channel, provider } = req.body;
    if (!phone || !message) {
        return res.status(400).json({ error: 'Missing phone or message' });
    }

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const db = await getDb();
    db.run(`INSERT INTO messages (phone, sender, content, channel) VALUES (?, 'user', ?, ?)`, [phone, message, channel || 'web']);
    await updateSessionInteraction(phone);

    let fullReply = '';
    let fullThought = '';
    let cardData: any = null;

    try {
        // First check onboarding flow
        const onboardingActive = await isOnboarding(phone);
        if (onboardingActive) {
            const onboardingRes = await handleOnboardingInput(phone, message);
            cardData = onboardingRes.cardData;
            fullReply = onboardingRes.reply;
            
            // Stream onboarding response
            const words = fullReply.split(' ');
            for (let i = 0; i < words.length; i += 2) {
                const chunk = words.slice(i, i + 2).join(' ') + ' ';
                res.write(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);
                await new Promise(r => setTimeout(r, 25));
            }
        } else {
            // Check structured intent routing first
            const routing = await routeIntent(message, phone, provider);
            cardData = routing.cardData;

            if (routing.skill && routing.skill !== 'general_question' && routing.skill !== 'autonomous_agent') {
                let orderResult = { success: true, message: '' };
                try {
                    orderResult = await finalizeOrder(phone, 'lead', { skill: routing.skill });
                } catch (e) {}

                fullReply = `${routing.reply} ${orderResult.message ? '(' + orderResult.message + ')' : ''}`.trim();
                
                // Stream text chunks
                const words = fullReply.split(' ');
                for (let i = 0; i < words.length; i += 2) {
                    const chunk = words.slice(i, i + 2).join(' ') + ' ';
                    res.write(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);
                    await new Promise(r => setTimeout(r, 20));
                }
            } else {
                // Stream via AI Pipeline with Thinking & Reasoning
                for await (const chunk of streamUnifiedAI(message, { provider, phone })) {
                    if (chunk.type === 'thought' && chunk.thought) {
                        fullThought += chunk.thought;
                        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                    } else if (chunk.type === 'text' && chunk.content) {
                        fullReply += chunk.content;
                        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                    } else if (chunk.type === 'metadata') {
                        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                    }
                }
                if (!fullReply && routing.reply) {
                    fullReply = routing.reply;
                    res.write(`data: ${JSON.stringify({ type: 'text', content: fullReply })}\n\n`);
                }
            }
        }

        // Check contextual ad match
        try {
            const matchedAds = await matchAdCampaigns(message);
            if (matchedAds.length > 0) {
                const ad = matchedAds[0];
                const spendSuccess = await spendAdCampaign(ad.id, 2);
                if (spendSuccess) {
                    const adCardData = {
                        type: 'product_card',
                        title: `[SPONSORED] ${ad.title}`,
                        desc: ad.desc,
                        image: ad.imageUrl,
                        price: ad.title.includes('Rice') ? '₦32,500' : ad.title.includes('ride') ? '₦500' : '₦1,500'
                    };
                    cardData = cardData || adCardData;
                }
            }
        } catch (adErr) {}

        // Persist assistant message in database
        const cardJson = cardData ? JSON.stringify(cardData) : null;
        db.run(`INSERT INTO messages (phone, sender, content, channel, card_data) VALUES (?, 'assistant', ?, ?, ?)`, 
            [phone, fullReply.trim(), channel || 'web', cardJson]);
        saveDb();

        // Send completion event
        res.write(`data: ${JSON.stringify({ type: 'done', fullReply: fullReply.trim(), cardData })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (err: any) {
        console.error('Streaming chat error:', err);
        res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'Stream processing error' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
    }
});

// API: Points Balance & Quick Topup
app.get('/api/points/balance', authenticateUser, async (req: AuthRequest, res) => {
    const phone = (req.query.phone as string) || '+2348030000000';
    try {
        const balance = await getPointsBalance(phone);
        const profile = await getProfile(phone, 'points_query');
        res.json({
            success: true,
            phone,
            points: balance,
            tier: profile?.subscription_tier || 'Base',
            currency: '₦'
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message || 'Failed to fetch points balance' });
    }
});

app.post('/api/points/topup', authenticateUser, async (req: AuthRequest, res) => {
    const { phone, amount_points, payment_ref } = req.body;
    if (!phone || !amount_points) {
        return res.status(400).json({ error: 'phone and amount_points are required' });
    }
    try {
        const points = parseInt(amount_points, 10);
        if (isNaN(points) || points <= 0) {
            return res.status(400).json({ error: 'Invalid points amount' });
        }
        await addPoints(phone, points, `Top-up ref: ${payment_ref || 'instant_card'}`);
        const newBalance = await getPointsBalance(phone);
        res.json({
            success: true,
            message: `Successfully credited ${points} Points!`,
            balance: newBalance
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message || 'Failed to top up points' });
    }
});

// --- GitHub Workspace Sync API Endpoints ---
app.get('/api/github/status', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const status = await getGitHubSyncStatus();
        res.json({ success: true, status });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/github/list', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const dirPath = (req.query.path as string) || '';
        const files = await listGitHubFiles(dirPath);
        res.json({ success: true, path: dirPath, files });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/github/diff', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const diff = await getGitHubDiff(req.query.path as string | undefined);
        res.json({ success: true, diff });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/github/pull', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const result = await pullFromGitHub(req.body?.path);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/github/push', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const message = req.body.message || 'Update from Kurukoo Workspace';
        const result = await pushToGitHub(message, req.body?.path, req.body?.content);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// API: Auth Login & SSO Synchronization
app.post('/api/auth/login', async (req, res) => {
    const { phone, name, email, goal, sso_provider } = req.body;
    if (!phone && !email) {
        return res.status(400).json({ success: false, error: 'Phone number or email required' });
    }

    try {
        const db = await getDb();
        const userPhone = phone || `sso_${Date.now()}`;
        const stmt = db.prepare(`SELECT phone FROM memory_profiles WHERE phone = ?`);
        stmt.bind([userPhone]);
        const exists = stmt.step();
        stmt.free();

        if (exists) {
            db.run(`UPDATE memory_profiles SET name = COALESCE(NULLIF(?, ''), name), email = COALESCE(NULLIF(?, ''), email) WHERE phone = ?`, 
                [name || '', email || '', userPhone]);
        } else {
            db.run(
                `INSERT INTO memory_profiles (phone, name, location, country, subscription_tier, wallet_balance_minor, preferences, behavior_patterns, email, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userPhone, name || 'Kurukoo User', 'Ibadan', 'ng', 'Base', 30, JSON.stringify({ goal: goal || 'buyer' }), '{}', email || '', 1]
            );
        }
        saveDb();

        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters');
        const token = jwt.sign({ phone: userPhone, role: 'user' }, JWT_SECRET, { expiresIn: '30d' });

        return res.json({ success: true, phone: userPhone, name: name || 'Kurukoo User', token });
    } catch (e) {
        console.error('Auth login error:', e);
        return res.status(500).json({ success: false, error: 'Database error' });
    }
});

// API: Availability Toggle
app.post('/api/profile/availability', authenticateUser, async (req: AuthRequest, res) => {
    const { phone, is_available } = req.body;
    if (req.user?.phone !== phone) return res.status(403).json({ error: 'Forbidden: You can only update your own availability' });
    const db = await getDb();
    db.run(`UPDATE memory_profiles SET is_available = ? WHERE phone = ?`, [is_available, phone]);
    saveDb();
    res.json({ success: true });
});

// API: Profile Update (for Onboarding and Drawer Settings)
app.post('/api/profile/update', authenticateUser, async (req: AuthRequest, res) => {
    const { 
        phone, name, location, country, subscription_tier, 
        skills, operation_mode, hourly_rate, service_radius_km, 
        transport_mode, pricing_model, payment_method, equipment, is_available
    } = req.body;

    if (req.user?.phone !== phone) return res.status(403).json({ error: 'Forbidden: You can only update your own profile' });

    if (!phone) {
        return res.status(400).json({ error: 'Missing phone' });
    }

    try {
        const db = await getDb();
        
        // 1. Ensure profile row exists
        const stmt = db.prepare(`SELECT phone FROM memory_profiles WHERE phone = ?`);
        stmt.bind([phone]);
        const exists = stmt.step();
        stmt.free();

        if (!exists) {
            db.run(`INSERT INTO memory_profiles (phone, name, location, country, subscription_tier) VALUES (?, ?, ?, ?, ?)`, 
                [phone, name || 'New User', location || 'Ibadan', country || 'ng', subscription_tier || 'Base']);
        } else {
            // Update profile fields
            db.run(`UPDATE memory_profiles SET name = COALESCE(?, name), location = COALESCE(?, location), country = COALESCE(?, country), subscription_tier = COALESCE(?, subscription_tier) WHERE phone = ?`,
                [name, location, country, subscription_tier, phone]);
        }

        // If is_available is specified, update it too
        if (typeof is_available !== 'undefined') {
            db.run(`UPDATE memory_profiles SET is_available = ? WHERE phone = ?`, [is_available ? 1 : 0, phone]);
        }

        // 2. Parse and upsert skills if provided
        if (skills) {
            const skillList = Array.isArray(skills) 
                ? skills 
                : skills.split(',').map((s: string) => s.trim()).filter((s: string) => s);

            for (const sk of skillList) {
                const sStmt = db.prepare(`SELECT id FROM skills WHERE phone = ? AND skill = ?`);
                sStmt.bind([phone, sk]);
                const skillExists = sStmt.step();
                sStmt.free();

                const equipJson = typeof equipment === 'object' ? JSON.stringify(equipment) : (equipment || '{}');

                if (!skillExists) {
                    db.run(`INSERT INTO skills (phone, skill, operation_mode, hourly_rate, service_radius_km, transport_mode, pricing_model, payment_method, equipment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [phone, sk, operation_mode || 'stationary', hourly_rate || 0, service_radius_km || 10, transport_mode || 'none', pricing_model || 'hourly', payment_method || 'cash', equipJson]);
                } else {
                    db.run(`UPDATE skills SET operation_mode = ?, hourly_rate = ?, service_radius_km = ?, transport_mode = ?, pricing_model = ?, payment_method = ?, equipment = ? WHERE phone = ? AND skill = ?`,
                        [operation_mode || 'stationary', hourly_rate || 0, service_radius_km || 10, transport_mode || 'none', pricing_model || 'hourly', payment_method || 'cash', equipJson, phone, sk]);
                }
            }
        }

        saveDb();
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ error: 'Internal server error updating profile' });
    }
});

// API: Add user skill from Drawer
app.post('/api/profile/skills/add', async (req, res) => {
    const { phone, skill } = req.body;
    if (!phone || !skill) {
        return res.status(400).json({ error: 'Missing phone or skill' });
    }
    try {
        const db = await getDb();
        
        // Check if skill exists
        const stmt = db.prepare(`SELECT id FROM skills WHERE phone = ? AND skill = ?`);
        stmt.bind([phone, skill]);
        const exists = stmt.step();
        stmt.free();

        if (!exists) {
            db.run(`INSERT INTO skills (phone, skill, operation_mode, hourly_rate, service_radius_km, transport_mode, pricing_model, payment_method) VALUES (?, ?, 'stationary', 0, 10, 'none', 'hourly', 'cash')`,
                [phone, skill]);
            saveDb();
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Error adding skill:', err);
        res.status(500).json({ error: 'Internal error adding skill' });
    }
});

// API: Remove user skill from Drawer
app.post('/api/profile/skills/remove', async (req, res) => {
    const { phone, skill } = req.body;
    if (!phone || !skill) {
        return res.status(400).json({ error: 'Missing phone or skill' });
    }
    try {
        const db = await getDb();
        db.run(`DELETE FROM skills WHERE phone = ? AND skill = ?`, [phone, skill]);
        saveDb();
        res.json({ success: true });
    } catch (err) {
        console.error('Error removing skill:', err);
        res.status(500).json({ error: 'Internal error removing skill' });
    }
});

// API: Export User Data (GDPR/NDPA Compliance)
app.get('/api/profile/export', async (req, res) => {
    const phone = req.query.phone as string;
    if (!phone) {
        return res.status(400).json({ error: 'Missing phone parameter' });
    }
    try {
        const data = await exportUserData(phone);
        res.json(data);
    } catch (err) {
        console.error('Error exporting user data:', err);
        res.status(500).json({ error: 'Internal error exporting data' });
    }
});

// API: Delete User Data (Right to Deletion)
app.delete('/api/profile/delete', async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ error: 'Missing phone' });
    }
    try {
        await deleteUserData(phone);
        res.json({ success: true, message: 'User data deleted successfully' });
    } catch (err) {
        console.error('Error deleting user data:', err);
        res.status(500).json({ error: 'Internal error deleting data' });
    }
});

// API: Temp Sessions (Anonymous Chat & Profile Merging)
app.post('/api/temp/session', async (req, res) => {
    const { sessionId, location, preferences } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT sessionId FROM temp_sessions WHERE sessionId = ?`);
        stmt.bind([sessionId]);
        const exists = stmt.step();
        stmt.free();

        if (!exists) {
            db.run(`INSERT INTO temp_sessions (sessionId, location, preferences, interactions) VALUES (?, ?, ?, ?)`,
                [sessionId, location || 'Ibadan', JSON.stringify(preferences || {}), JSON.stringify([])]);
        } else {
            db.run(`UPDATE temp_sessions SET location = COALESCE(?, location), preferences = COALESCE(?, preferences) WHERE sessionId = ?`,
                [location, JSON.stringify(preferences || {}), sessionId]);
        }
        saveDb();
        res.json({ success: true });
    } catch (e) {
        console.error('Error saving temp session:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

app.post('/api/temp/message', async (req, res) => {
    const { sessionId, sender, content, provider } = req.body;
    if (!sessionId || !content) return res.status(400).json({ error: 'Missing sessionId or content' });
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT interactions FROM temp_sessions WHERE sessionId = ?`);
        stmt.bind([sessionId]);
        let interactions = [];
        if (stmt.step()) {
            const row = stmt.getAsObject();
            try { interactions = JSON.parse(row.interactions as string || '[]'); } catch (ex) { interactions = []; }
        }
        stmt.free();

        interactions.push({ sender: sender || 'user', content, timestamp: new Date().toISOString() });

        let reply = "I'm searching for verified providers nearby...";
        let cardData = null;

        if (!sender || sender === 'user') {
            const routing = await routeIntent(content, 'anon_' + sessionId, provider);
            reply = routing.reply;
            cardData = routing.cardData;
            interactions.push({ sender: 'assistant', content: reply, timestamp: new Date().toISOString() });
        }

        db.run(`UPDATE temp_sessions SET interactions = ? WHERE sessionId = ?`, [JSON.stringify(interactions), sessionId]);
        saveDb();
        res.json({ success: true, reply, cardData, interactions });
    } catch (e) {
        console.error('Error recording temp message:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

app.get('/api/temp/session', async (req, res) => {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT * FROM temp_sessions WHERE sessionId = ?`);
        stmt.bind([sessionId]);
        let session = null;
        if (stmt.step()) {
            session = stmt.getAsObject();
            try { session.interactions = JSON.parse(session.interactions); } catch (e) { session.interactions = []; }
            try { session.preferences = JSON.parse(session.preferences); } catch (e) { session.preferences = {}; }
        }
        stmt.free();
        res.json({ success: true, session });
    } catch (e) {
        console.error('Error fetching temp session:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

app.post('/api/temp/merge', async (req, res) => {
    const { sessionId, phone } = req.body;
    if (!sessionId || !phone) return res.status(400).json({ error: 'Missing sessionId or phone' });
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT * FROM temp_sessions WHERE sessionId = ?`);
        stmt.bind([sessionId]);
        let tempSession = null;
        if (stmt.step()) {
            tempSession = stmt.getAsObject();
        }
        stmt.free();

        if (tempSession) {
            let interactions = [];
            try { interactions = JSON.parse(tempSession.interactions || '[]'); } catch (e) {}

            const pStmt = db.prepare(`SELECT phone FROM memory_profiles WHERE phone = ?`);
            pStmt.bind([phone]);
            const exists = pStmt.step();
            pStmt.free();

            if (!exists) {
                db.run(`INSERT INTO memory_profiles (phone, name, location, country, subscription_tier, wallet_balance_minor, preferences) VALUES (?, 'New User', ?, 'ng', 'Base', 30, ?)`,
                    [phone, tempSession.location || 'Ibadan', tempSession.preferences || '{}']);
            }

            for (const msg of interactions) {
                db.run(`INSERT INTO messages (phone, sender, content) VALUES (?, ?, ?)`,
                    [phone, msg.sender, msg.content]);
            }

            db.run(`DELETE FROM temp_sessions WHERE sessionId = ?`, [sessionId]);
            saveDb();
        }

        res.json({ success: true });
    } catch (e) {
        console.error('Error merging temp session:', e);
        res.status(500).json({ error: 'Internal error merging session' });
    }
});

app.get('/api/stats/pulse', async (req, res) => {
    try {
        const pulses = [
            { text: "Rider Suleiman matched with Suya & Masa order in Ikeja • ₦2,500 Escrow Lock", age: "Just now" },
            { text: "Mechanic Chidi dispatched to Corolla repair in Surulere • Compatible OEM Brake Pad verified", age: "1m ago" },
            { text: "Caterer Grace matched with Rice & Yam family bundle order in Bodija", age: "2m ago" },
            { text: "Secured Event Guard booking confirmed for GuardForce Ltd in Lekki Phase 1", age: "4m ago" },
            { text: "EEDC Enugu electricity bill token of £25 successfully paid and sent via WhatsApp", age: "6m ago" },
            { text: "Rider Yusuf dispatched for bicycle delivery in Accra High Street", age: "8m ago" },
            { text: "Artisan plumber matched with residential leakage fix in Ibadan", age: "11m ago" }
        ];
        res.json({ success: true, pulses });
    } catch (e) {
        console.error('Error fetching pulse:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// API: Pulse Live Toggle
app.post('/api/pulse/live', async (req, res) => {
    const { phone, skill, lat, lng } = req.body;
    const result = await activatePulse(phone, skill, lat, lng);
    res.json(result);
});

app.post('/api/pulse/activate', async (req, res) => {
    const { phone, skill, lat, lng } = req.body;
    const result = await activatePulse(phone, skill, lat, lng);
    res.json(result);
});

app.post('/api/pulse/deactivate', async (req, res) => {
    const { phone } = req.body;
    await endPulseSession(phone);
    res.json({ success: true, message: 'Pulse session deactivated.' });
});

app.get('/api/pulse/status', async (req, res) => {
    const phone = req.query.phone as string;
    const db = await getDb();
    const stmt = db.prepare(`SELECT * FROM pulse_sessions WHERE phone = ? AND active = 1 AND expires_at > datetime('now')`);
    stmt.bind([phone]);
    const isActive = stmt.step();
    stmt.free();
    res.json({ active: isActive });
});

app.get('/api/pulse/providers', async (req, res) => {
    const providers = await getActivePulseProviders();
    res.json({ providers });
});


// API: Provider Subscribe
app.post('/api/provider/subscribe', async (req, res) => {
    const { phone, tier } = req.body;
    if (!phone || !tier) {
        return res.status(400).json({ success: false, error: 'Phone and tier are required' });
    }

    try {
        const db = await getDb();
        
        // Fee structure
        let fee = 0;
        if (tier === 'Base') fee = 500;
        else if (tier === 'Plus') fee = 1500;
        else if (tier === 'Business') fee = 5000;
        else return res.status(400).json({ success: false, error: 'Invalid tier' });

        // Deduct from direct wallet
        const { processDirectPayment } = await import('./services/directWallet.js');
        const paid = await processDirectPayment(phone, 'SYSTEM', fee);
        
        if (!paid) {
            return res.status(400).json({ success: false, error: 'Insufficient wallet balance for subscription' });
        }

        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        db.run(
            `INSERT INTO provider_subscriptions (phone, tier, status, next_billing_date, leads_this_month)
             VALUES (?, ?, 'active', ?, 0)
             ON CONFLICT(phone) DO UPDATE SET 
                tier=excluded.tier, 
                status='active', 
                next_billing_date=excluded.next_billing_date,
                leads_this_month=0`,
            [phone, tier, nextBillingDate.toISOString()]
        );
        saveDb();

        res.json({ success: true, message: `Subscribed to ${tier} tier successfully.` });
    } catch (e) {
        console.error('Subscribe error:', e);
        res.status(500).json({ success: false, error: 'Internal error' });
    }
});

// API: Topup Credits
app.post('/api/credits/topup', async (req, res) => {
    const { phone, amount, fcmToken } = req.body;
    const headerFcmToken = req.headers['x-fcm-token'];
    const token = fcmToken || headerFcmToken;

    if (phone) {
        const profile = await getProfile(phone, 'credit_topup');
        if (profile && profile.fcm_token) {
            if (!token || token !== profile.fcm_token) {
                return res.status(403).json({ success: false, error: 'Device session token mismatch or missing. Please re-authenticate.' });
            }
        }
    }

    await addCredits(phone, amount, `Purchased ${amount} credit pack`);
    res.json({ success: true });
});

// API: Emergency Contacts
app.get('/api/emergency', async (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    const phone = (req.query.phone as string) || '';
    const country = 'ng';
    const db = await getDb();
    const stmt = db.prepare(`SELECT * FROM emergency_contacts WHERE country = ?`);
    stmt.bind([country]);
    const contacts = [];
    while(stmt.step()) {
        contacts.push(stmt.getAsObject());
    }
    stmt.free();
    res.json({ contacts, disclaimer: 'Kurukoo emergency bridge connects you directly to verified local emergency services.' });
});

// WebRTC Signaling API
app.post('/api/webrtc/create', (req, res) => {
    const { roomId, phone } = req.body;
    if (!roomId || !phone) {
        return res.status(400).json({ success: false, error: 'roomId and phone are required.' });
    }
    createWebRTCRoom(roomId, phone);
    res.json({ success: true, message: `Room ${roomId} initialized with peer ${phone}` });
});

app.get('/api/webrtc/peers', (req, res) => {
    const { roomId } = req.query;
    if (!roomId) {
        return res.status(400).json({ success: false, error: 'roomId is required.' });
    }
    const peers = getRoomPeers(roomId as string);
    res.json({ success: true, peers });
});

// Survey Engine Response Submission & Reward Trigger
app.post('/api/survey/response', async (req, res) => {
    const { phone, question, answer } = req.body;
    if (!phone || !question || !answer) {
        return res.status(400).json({ success: false, error: 'phone, question, and answer are required.' });
    }
    try {
        const result = await submitSurveyResponse(phone, question, answer);
        res.json({ success: true, reward: result.reward });
    } catch (err) {
        console.error('Error handling survey response:', err);
        res.status(500).json({ success: false, error: 'Internal server error processing survey response' });
    }
});

// --- SECTION 4: Blog & Content Management Endpoints ---
app.get('/api/blog', (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    try {
        const articles = getAllBlogArticles();
        res.json(articles);
    } catch (err) {
        console.error('Error fetching blog list:', err);
        res.status(500).json({ error: 'Failed to fetch blog list' });
    }
});

app.get('/api/blog/:slug', (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    const { slug } = req.params;
    try {
        const article = getBlogArticleBySlug(slug);
        if (!article) {
            return res.status(404).json({ error: `Article with slug "${slug}" not found` });
        }
        res.json(article);
    } catch (err) {
        console.error(`Error fetching article ${slug}:`, err);
        res.status(500).json({ error: 'Failed to fetch article' });
    }
});

// --- SECTION 5: Advertising & Sponsored Campaigns Endpoints ---
app.get('/api/ads', async (req, res) => {
    try {
        const campaigns = await getAdCampaigns();
        res.json(campaigns);
    } catch (err) {
        console.error('Error fetching campaigns:', err);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
});

app.post('/api/ads', async (req, res) => {
    const { title, desc, imageUrl, targetKeyword, creditsBudget } = req.body;
    if (!title || !desc || !targetKeyword || !creditsBudget) {
        return res.status(400).json({ error: 'title, desc, targetKeyword, and creditsBudget are required.' });
    }
    try {
        const result = await createAdCampaign({
            title,
            desc,
            imageUrl: imageUrl || '',
            targetKeyword,
            creditsBudget: parseInt(creditsBudget)
        });
        res.json(result);
    } catch (err) {
        console.error('Error creating campaign:', err);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
});

app.post('/api/ads/:id/spend', async (req, res) => {
    const { id } = req.params;
    const { cost } = req.body;
    try {
        const success = await spendAdCampaign(parseInt(id), cost ? parseInt(cost) : 2);
        res.json({ success });
    } catch (err) {
        console.error('Error spending budget:', err);
        res.status(500).json({ error: 'Failed to process campaign spend' });
    }
});

// Admin API
app.post('/api/admin/auth', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'kurukoo2026';
    const JWT_SECRET = process.env.JWT_SECRET || 'kurukoo_fallback_secret_39281';

    if (username === adminUser && password === adminPass) {
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

app.get('/api/admin/tickets', authenticateAdmin, async (req: AuthRequest, res) => {
    const type = (req.query.type as string) || 'dispute';
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT * FROM disputes WHERE type = ? ORDER BY id DESC`);
        stmt.bind([type]);
        const tickets = [];
        while (stmt.step()) {
            tickets.push(stmt.getAsObject());
        }
        stmt.free();
        res.json(tickets);
    } catch (e) {
        console.error('Error fetching admin tickets:', e);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

app.post('/api/admin/tickets/reply', async (req, res) => {
    const { disputeId, replyMessage } = req.body;
    if (!disputeId || !replyMessage) {
        return res.status(400).json({ error: 'Missing disputeId or replyMessage' });
    }
    try {
        const db = await getDb();
        
        // Find the dispute to get the phone number
        const disputeStmt = db.prepare(`SELECT * FROM disputes WHERE id = ?`);
        disputeStmt.bind([parseInt(disputeId)]);
        let dispute: any = null;
        if (disputeStmt.step()) {
            dispute = disputeStmt.getAsObject();
        }
        disputeStmt.free();

        if (!dispute) {
            return res.status(404).json({ error: 'Ticket/Dispute not found' });
        }

        // Update the ticket to resolved with the reply message as the resolution
        db.run(`UPDATE disputes SET status = 'resolved', resolution = ? WHERE id = ?`, [replyMessage, parseInt(disputeId)]);
        
        // Insert a message into the user's conversation to notify them (unified messaging)
        const adminMsg = `[Admin Support Reply] Regarding Ticket #${disputeId}: ${replyMessage}`;
        db.run(`INSERT INTO messages (phone, sender, content, channel) VALUES (?, 'assistant', ?, 'pwa')`, [dispute.phone, adminMsg]);
        
        saveDb();
        res.json({ success: true, message: 'Ticket resolved and reply sent' });
    } catch (e) {
        console.error('Error replying to admin ticket:', e);
        res.status(500).json({ error: 'Failed to reply and resolve ticket' });
    }
});

app.post('/api/admin/disputes/resolve', async (req, res) => {
    const { disputeId, action } = req.body; // action is 'release' or 'refund'
    if (!disputeId || !action) {
        return res.status(400).json({ error: 'Missing disputeId or action' });
    }
    try {
        const db = await getDb();
        
        // Find the dispute
        const disputeStmt = db.prepare(`SELECT * FROM disputes WHERE id = ?`);
        disputeStmt.bind([parseInt(disputeId)]);
        let dispute: any = null;
        if (disputeStmt.step()) {
            dispute = disputeStmt.getAsObject();
        }
        disputeStmt.free();

        if (!dispute) {
            return res.status(404).json({ error: 'Dispute not found' });
        }

        // Try to release or refund the escrow
        let escrowUpdated = false;
        if (dispute.order_id) {
            // Find the order
            const orderStmt = db.prepare(`SELECT * FROM orders WHERE id = ?`);
            orderStmt.bind([dispute.order_id]);
            let order: any = null;
            if (orderStmt.step()) {
                order = orderStmt.getAsObject();
            }
            orderStmt.free();

            if (order) {
                // Find held escrow
                const escrowStmt = db.prepare(`SELECT id FROM escrow WHERE buyer_phone = ? AND provider_phone = ? AND status IN ('held', 'disputed') LIMIT 1`);
                escrowStmt.bind([order.phone, order.provider_phone]);
                let escrowId: number | null = null;
                if (escrowStmt.step()) {
                    escrowId = escrowStmt.getAsObject().id;
                }
                escrowStmt.free();

                if (escrowId) {
                    if (action === 'release') {
                        db.run(`UPDATE escrow SET status = 'released' WHERE id = ?`, [escrowId]);
                        db.run(`UPDATE orders SET status = 'completed' WHERE id = ?`, [dispute.order_id]);
                    } else if (action === 'refund') {
                        db.run(`UPDATE escrow SET status = 'refunded' WHERE id = ?`, [escrowId]);
                        db.run(`UPDATE orders SET status = 'refunded' WHERE id = ?`, [dispute.order_id]);
                    }
                    escrowUpdated = true;
                }
            }
        }

        const resolutionText = `Admin resolved via escrow ${action === 'release' ? 'release' : 'refund'}.`;
        db.run(`UPDATE disputes SET status = 'resolved', resolution = ? WHERE id = ?`, [resolutionText, parseInt(disputeId)]);
        
        // Notify the user in their main conversation (unified messaging)
        const adminMsg = `[Admin Dispute Resolution] Your dispute #${disputeId} regarding Order #${dispute.order_id || 'N/A'} has been resolved. The held escrow fund was ${action === 'release' ? 'released to the provider' : 'refunded back to your wallet'}.`;
        db.run(`INSERT INTO messages (phone, sender, content, channel) VALUES (?, 'assistant', ?, 'pwa')`, [dispute.phone, adminMsg]);
        
        saveDb();
        res.json({ success: true, message: 'Dispute resolved successfully', escrowUpdated });
    } catch (e) {
        console.error('Error resolving admin dispute:', e);
        res.status(500).json({ error: 'Failed to resolve dispute' });
    }
});

app.post('/api/admin/disputes/escalate', async (req, res) => {
    const { disputeId } = req.body;
    if (!disputeId) {
        return res.status(400).json({ error: 'Missing disputeId' });
    }
    try {
        const db = await getDb();
        
        // Find the dispute
        const disputeStmt = db.prepare(`SELECT * FROM disputes WHERE id = ?`);
        disputeStmt.bind([parseInt(disputeId)]);
        let dispute: any = null;
        if (disputeStmt.step()) {
            dispute = disputeStmt.getAsObject();
        }
        disputeStmt.free();

        if (!dispute) {
            return res.status(404).json({ error: 'Dispute not found' });
        }

        db.run(`UPDATE disputes SET status = 'escalated' WHERE id = ?`, [parseInt(disputeId)]);
        
        // Notify the user in their main conversation (unified messaging)
        const adminMsg = `[Admin Dispute Escalation] Your dispute #${disputeId} has been escalated for secondary review. Our escrow agents will contact you shortly if additional verification is needed.`;
        db.run(`INSERT INTO messages (phone, sender, content, channel) VALUES (?, 'assistant', ?, 'pwa')`, [dispute.phone, adminMsg]);
        
        saveDb();
        res.json({ success: true, message: 'Dispute escalated to admin review' });
    } catch (e) {
        console.error('Error escalating admin dispute:', e);
        res.status(500).json({ error: 'Failed to escalate dispute' });
    }
});

app.get('/api/admin/stats', async (req, res) => {
    const db = await getDb();
    const uRes = db.exec(`SELECT COUNT(*) FROM memory_profiles`);
    const pRes = db.exec(`SELECT COUNT(*) FROM memory_profiles WHERE is_available = 1`);
    const mRes = db.exec(`SELECT COUNT(*) FROM messages`);
    const cRes = db.exec(`SELECT COUNT(*) FROM credit_transactions`);

    res.json({
        users: uRes[0]?.values[0][0] || 0,
        providers: pRes[0]?.values[0][0] || 0,
        messages: mRes[0]?.values[0][0] || 0,
        credits: cRes[0]?.values[0][0] || 0
    });
});

app.get('/api/admin/keep-alive-analytics', async (req, res) => {
    try {
        const stats = await getKeepAliveAnalyticsStats();
        res.json(stats);
    } catch (err) {
        console.error('Error fetching keep-alive stats:', err);
        res.status(500).json({ error: 'Failed to fetch keep-alive stats' });
    }
});

// --- SECTION 8: Analytics Engine For Data Sales ---
app.get('/api/admin/analytics/trends', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const trends = await getCategoryTrends();
        const density = await getGeographicDensity();
        res.json({ trends, density });
    } catch (err) {
        console.error('Error fetching trends:', err);
        res.status(500).json({ error: 'Failed to fetch trends' });
    }
});

app.get('/api/admin/analytics/sales', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const intel = await getMarketIntelData();
        res.json(intel);
    } catch (err) {
        console.error('Error fetching market intel:', err);
        res.status(500).json({ error: 'Failed to fetch market intelligence data' });
    }
});

app.get('/api/admin/users', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const db = await getDb();
        const search = (req.query.search as string || '').trim();
        const tier = (req.query.tier as string || '').trim();
        const verified = (req.query.verified as string || '').trim();
        const limit = parseInt(req.query.limit as string || '10', 10);
        const page = parseInt(req.query.page as string || '1', 10);
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params: any[] = [];

        if (search) {
            whereClause += ' AND (phone LIKE ? OR name LIKE ? OR location LIKE ?)';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }
        if (tier) {
            whereClause += ' AND subscription_tier = ?';
            params.push(tier);
        }
        if (verified) {
            whereClause += ' AND verified_provider = ?';
            params.push(parseInt(verified, 10));
        }

        // Get total count
        const countStmt = db.prepare(`SELECT COUNT(*) as count FROM memory_profiles ${whereClause}`);
        countStmt.bind(params);
        let totalCount = 0;
        if (countStmt.step()) {
            totalCount = countStmt.getAsObject().count;
        }
        countStmt.free();

        // Get paginated users
        const selectParams = [...params, limit, offset];
        const selectStmt = db.prepare(`
            SELECT phone, name, location, country, subscription_tier, wallet_balance_minor, points_balance, verified_provider, is_available, is_contributor, fcm_token
            FROM memory_profiles 
            ${whereClause} 
            ORDER BY phone DESC
            LIMIT ? OFFSET ?
        `);
        selectStmt.bind(selectParams);
        const users = [];
        while (selectStmt.step()) {
            users.push(selectStmt.getAsObject());
        }
        selectStmt.free();

        res.json({
            users,
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit) || 1
        });
    } catch (err) {
        console.error('Error fetching admin users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/admin/users/bulk-update', authenticateAdmin, async (req: AuthRequest, res) => {
    const { phones, action, value } = req.body;
    if (!phones || !Array.isArray(phones) || phones.length === 0) {
        return res.status(400).json({ error: 'No user phones specified for bulk action' });
    }
    if (!action) {
        return res.status(400).json({ error: 'Action is required' });
    }

    try {
        const db = await getDb();
        const placeholders = phones.map(() => '?').join(',');
        
        let query = '';
        let updateVal: any = value;

        if (action === 'subscription_tier') {
            query = `UPDATE memory_profiles SET subscription_tier = ? WHERE phone IN (${placeholders})`;
        } else if (action === 'verified_provider') {
            query = `UPDATE memory_profiles SET verified_provider = ? WHERE phone IN (${placeholders})`;
            updateVal = parseInt(value, 10) ? 1 : 0;
        } else if (action === 'is_available') {
            query = `UPDATE memory_profiles SET is_available = ? WHERE phone IN (${placeholders})`;
            updateVal = parseInt(value, 10) ? 1 : 0;
        } else if (action === 'add_points') {
            const pointsToAdd = parseInt(value, 10) || 0;
            query = `UPDATE memory_profiles SET points_balance = points_balance + ? WHERE phone IN (${placeholders})`;
            updateVal = pointsToAdd;
        } else if (action === 'delete') {
            query = `DELETE FROM memory_profiles WHERE phone IN (${placeholders})`;
        } else {
            return res.status(400).json({ error: 'Invalid bulk action specified' });
        }

        const runParams = action === 'delete' ? [...phones] : [updateVal, ...phones];
        db.run(query, runParams);
        saveDb();

        res.json({
            success: true,
            message: `Successfully executed bulk action '${action}' for ${phones.length} users.`
        });
    } catch (err) {
        console.error('Error executing bulk action:', err);
        res.status(500).json({ error: 'Failed to execute bulk action' });
    }
});

// --- SECTION 9: Admin Management Tools (Skill Flows & Active Pulse Sessions) ---
app.get('/api/admin/skill-flows', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT * FROM skill_flows`);
        const skillFlows = [];
        while (stmt.step()) {
            skillFlows.push(stmt.getAsObject());
        }
        stmt.free();
        res.json(skillFlows);
    } catch (err) {
        console.error('Error fetching skill flows:', err);
        res.status(500).json({ error: 'Failed to fetch skill flows' });
    }
});

app.post('/api/admin/skill-flows', authenticateAdmin, async (req: AuthRequest, res) => {
    const { skill, question_set, post_match_action, payment_model, fulfillment_instructions } = req.body;
    if (!skill) {
        return res.status(400).json({ error: 'skill is required' });
    }
    try {
        const db = await getDb();
        db.run(
            `INSERT INTO skill_flows (skill, question_set, post_match_action, payment_model, fulfillment_instructions)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(skill) DO UPDATE SET
             question_set=excluded.question_set,
             post_match_action=excluded.post_match_action,
             payment_model=excluded.payment_model,
             fulfillment_instructions=excluded.fulfillment_instructions`,
            [skill, question_set, post_match_action, payment_model, fulfillment_instructions]
        );
        saveDb();
        res.json({ success: true, message: 'Skill flow saved successfully' });
    } catch (err) {
        console.error('Error saving skill flow:', err);
        res.status(500).json({ error: 'Failed to save skill flow' });
    }
});

app.delete('/api/admin/skill-flows/:skill', authenticateAdmin, async (req: AuthRequest, res) => {
    const { skill } = req.params;
    try {
        const db = await getDb();
        db.run(`DELETE FROM skill_flows WHERE skill = ?`, [skill]);
        saveDb();
        res.json({ success: true, message: 'Skill flow deleted successfully' });
    } catch (err) {
        console.error('Error deleting skill flow:', err);
        res.status(500).json({ error: 'Failed to delete skill flow' });
    }
});

app.get('/api/admin/pulse-sessions', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const db = await getDb();
        const stmt = db.prepare(`
            SELECT ps.*, mp.name, mp.location 
            FROM pulse_sessions ps
            JOIN memory_profiles mp ON ps.phone = mp.phone
            WHERE ps.active = 1 AND ps.expires_at > datetime('now')
        `);
        const sessions = [];
        while (stmt.step()) {
            sessions.push(stmt.getAsObject());
        }
        stmt.free();
        res.json(sessions);
    } catch (err) {
        console.error('Error fetching pulse sessions:', err);
        res.status(500).json({ error: 'Failed to fetch pulse sessions' });
    }
});

// WhatsApp Webhook
app.post('/webhook/whatsapp', async (req, res) => {
    const result = await dispatchWebhook('whatsapp', req.body, req.headers as Record<string, any>);
    res.status(200).json(result);
});

// Telegram Webhook
app.post('/webhook/telegram', async (req, res) => {
    const result = await dispatchWebhook('telegram', req.body, req.headers as Record<string, any>);
    res.status(200).json(result);
});

// SMS Webhook (Twilio / Africa's Talking)
app.post('/webhook/sms', async (req, res) => {
    const result = await dispatchWebhook('sms', req.body, req.headers as Record<string, any>);
    res.status(200).json(result);
});

// USSD Endpoint (*7000#)
app.post('/ussd', async (req, res) => {
    const result = await dispatchWebhook('ussd', req.body, req.headers as Record<string, any>);
    res.set('Content-Type', 'text/plain');
    res.send(result.response || '');
});

app.get('/api/admin/artists', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT phone, skill, verified_artist FROM skills WHERE skill LIKE '%artist%' OR skill LIKE '%performer%' OR skill LIKE '%musician%'`);
        const artists = [];
        while(stmt.step()) artists.push(stmt.getAsObject());
        stmt.free();
        res.json(artists);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch artists' });
    }
});

app.post('/api/admin/artists/verify', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { phone, skill, verified_artist } = req.body;
        const db = await getDb();
        db.run(`UPDATE skills SET verified_artist = ? WHERE phone = ? AND skill = ?`, [verified_artist, phone, skill]);
        saveDb();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update artist verification' });
    }
});

app.get('/api/admin/referrals', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const db = await getDb();
        
        // Fetch all referrals
        const stmtAll = db.prepare(`SELECT * FROM referrals ORDER BY created_at DESC`);
        const referrals = [];
        while (stmtAll.step()) {
            referrals.push(stmtAll.getAsObject());
        }
        stmtAll.free();

        // Compute top referrers
        const stmtTop = db.prepare(`
            SELECT referrer_phone, COUNT(*) as total, SUM(CASE WHEN status = 'subscribed' THEN 1 ELSE 0 END) as successful
            FROM referrals
            GROUP BY referrer_phone
            ORDER BY successful DESC, total DESC
            LIMIT 10
        `);
        const topReferrers = [];
        while (stmtTop.step()) {
            topReferrers.push(stmtTop.getAsObject());
        }
        stmtTop.free();

        res.json({ referrals, topReferrers });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch admin referrals' });
    }
});

// Artists verification request endpoint (artists submit with manager details)
app.post('/api/artists/verify-request', async (req, res) => {
    const { phone, skill, manager_name, manager_contact } = req.body;
    if (!phone || !skill || !manager_name || !manager_contact) {
        return res.status(400).json({ error: 'Missing required request details' });
    }
    try {
        const { requestArtistVerification } = await import('./services/artistBookingService.js');
        await requestArtistVerification(phone, skill, manager_name, manager_contact);
        res.json({ success: true, message: 'Artist verification request submitted successfully.' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to submit verification request.' });
    }
});

// Artist booking endpoint
app.post('/api/artists/book', async (req, res) => {
    const { customer_phone, artist_phone, event_details, budget } = req.body;
    if (!customer_phone || !artist_phone || !event_details || !budget) {
        return res.status(400).json({ error: 'Missing required booking details' });
    }
    try {
        const { bookArtist } = await import('./services/artistBookingService.js');
        const escrowId = await bookArtist(customer_phone, artist_phone, event_details, parseInt(budget));
        res.json({ success: true, escrowId, message: 'Artist booking initiated. Funds are now held in escrow with a 24-hour cooling-off period.' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create artist booking' });
    }
});

// Escrow release endpoint for admin
app.post('/api/artists/escrow-release', authenticateAdmin, async (req: AuthRequest, res) => {
    const { escrow_id, bypass_cooling_off } = req.body;
    if (!escrow_id) {
        return res.status(400).json({ error: 'Missing escrow_id' });
    }
    try {
        const { releaseArtistEscrow } = await import('./services/artistBookingService.js');
        const result = await releaseArtistEscrow(parseInt(escrow_id), bypass_cooling_off === true);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: 'Failed to release escrow' });
    }
});

app.get('/api/admin/revenue', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const db = await getDb();
        
        let subRev = 0;
        let leadFees = 0;
        let adRev = 0;
        let affClicks = 0;
        
        // Subscription approx
        const stmtSubs = db.prepare(`SELECT subscription_tier, COUNT(*) as count FROM memory_profiles GROUP BY subscription_tier`);
        while (stmtSubs.step()) {
            const row = stmtSubs.getAsObject();
            const count = row.count as number;
            const tier = (row.subscription_tier as string).toLowerCase();
            if (tier === 'base') subRev += count * 500;
            if (tier === 'plus') subRev += count * 1500;
            if (tier === 'business') subRev += count * 5000;
        }
        stmtSubs.free();
        
        // Lead fees
        const stmtLeads = db.prepare(`SELECT SUM(amount) as total FROM credit_transactions WHERE type = 'lead_fee'`);
        if (stmtLeads.step()) {
            leadFees = (stmtLeads.getAsObject().total as number) || 0;
        }
        stmtLeads.free();
        
        // Ad revenue
        const stmtAds = db.prepare(`SELECT SUM(credits_spent) as total FROM ad_campaigns`);
        if (stmtAds.step()) {
            adRev = (stmtAds.getAsObject().total as number) || 0;
        }
        stmtAds.free();
        
        // Affiliate clicks
        const stmtAff = db.prepare(`SELECT COUNT(*) as total FROM affiliate_clicks`);
        if (stmtAff.step()) {
            affClicks = (stmtAff.getAsObject().total as number) || 0;
        }
        stmtAff.free();
        
        res.json({ subscriptions: subRev, lead_fees: leadFees, ad_revenue: adRev, affiliate_clicks: affClicks });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch revenue stats' });
    }
});

app.get('/api/admin/marketing', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const db = await getDb();
        const stmt = db.prepare('SELECT COUNT(*) as count FROM referrals');
        let total = 0;
        if (stmt.step()) total = stmt.getAsObject().count as number;
        stmt.free();
        res.json({ total_referrals: total, ad_impressions: 5024, ad_clicks: 342 });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch marketing stats' });
    }
});

app.get('/api/admin/social', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const db = await getDb();
        const stmt = db.prepare('SELECT * FROM social_posts');
        const posts = [];
        while(stmt.step()) posts.push(stmt.getAsObject());
        stmt.free();
        res.json(posts);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch social posts' });
    }
});

app.post('/api/admin/social', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { platform, content, scheduled_time } = req.body;
        await schedulePost(platform, content, scheduled_time);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to schedule post' });
    }
});

app.get('/api/admin/partnerships', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const db = await getDb();
        const stmt = db.prepare('SELECT * FROM partnerships');
        const list = [];
        while(stmt.step()) list.push(stmt.getAsObject());
        stmt.free();
        res.json(list);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch partnerships' });
    }
});

app.get('/api/tasks', async (req, res) => {
    const phone = req.query.phone as string;
    try {
        const tasks = await getAvailableTasks(phone);
        res.json(tasks);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

app.post('/api/tasks/accept', async (req, res) => {
    const { phone, taskId } = req.body;
    try {
        await acceptTask(phone, taskId);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to accept task' });
    }
});

app.post('/api/tasks/complete', async (req, res) => {
    const { phone, taskId, result } = req.body;
    try {
        const r = await completeTask(phone, taskId, result);
        res.json(r);
    } catch (e) {
        res.status(500).json({ error: 'Failed to complete task' });
    }
});

app.post('/api/admin/verify_provider', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { phone } = req.body;
        const db = await getDb();
        const stmt = db.prepare('SELECT nin FROM memory_profiles WHERE phone = ?');
        stmt.bind([phone]);
        let nin = null;
        if (stmt.step()) nin = stmt.getAsObject().nin;
        stmt.free();

        const stmt2 = db.prepare('SELECT AVG(rating) as avg_rating, SUM(jobs_completed) as jobs_done FROM skills WHERE phone = ?');
        stmt2.bind([phone]);
        let jobsDone = 0;
        let avgRating = 0;
        if (stmt2.step()) {
            const row = stmt2.getAsObject();
            jobsDone = (row.jobs_done as number) || 0;
            avgRating = (row.avg_rating as number) || 0;
        }
        stmt2.free();

        if (nin && jobsDone >= 5 && avgRating >= 4.0) {
            db.run('UPDATE memory_profiles SET verified_provider = 1 WHERE phone = ?', [phone]);
            saveDb();
            res.json({ success: true, message: 'Provider verified successfully.' });
        } else {
            res.json({ success: false, message: 'Does not meet criteria (Needs NIN, 5+ jobs, 4.0+ rating)' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Failed to verify provider' });
    }
});

app.get('/api/admin/scam_reports', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const db = await getDb();
        const stmt = db.prepare('SELECT * FROM scam_reports');
        const reports = [];
        while(stmt.step()) reports.push(stmt.getAsObject());
        stmt.free();
        res.json(reports);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch scam reports' });
    }
});

export const DEFAULT_ROTATING_BANNER_TEXTS: string[] = [
    "One number. One conversation. Tell it what you need or what you can do.",
    "Tell it what you want, anytime, anywhere — always ready to assist.",
    "Your always-on neighborhood guide & helper right in your chat.",
    "Find verified local plumbers, riders, bakers, and electricians instantly.",
    "List your skills, offer services, and discover daily local gigs.",
    "Keep your transactions secure with smart escrow payments.",
    "Receive real-time, proactive notifications and opportunity alerts.",
    "Get daily life-admin reminders, price checks, and marketplace updates.",
    "Support your family and send secure mobile money home seamlessly.",
    "No downloads. No new apps. All through one simple conversation.",
    "AI assistive software designed for everyday tasks & life"
];

export async function getRotatingBannerTexts(): Promise<string[]> {
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT body FROM content WHERE slug = 'rotating-banner-texts'`);
        let item: any = null;
        if (stmt.step()) item = stmt.getAsObject();
        stmt.free();

        let texts: string[] = [];
        if (item && item.body) {
            texts = item.body
                .split('\n')
                .map((t: string) => t.trim())
                .filter((t: string) => t.length > 0);
        }

        if (texts.length > 0) {
            return texts.slice(0, 11);
        }
    } catch (e) {
        console.error('Error fetching rotating banner texts from db:', e);
    }
    return DEFAULT_ROTATING_BANNER_TEXTS;
}

app.get('/api/content/rotating-texts', async (req, res) => {
    try {
        const texts = await getRotatingBannerTexts();
        res.json({ success: true, texts });
    } catch (e) {
        res.json({ success: true, texts: DEFAULT_ROTATING_BANNER_TEXTS });
    }
});

app.get('/api/admin/content', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT slug, title, type, author, updated_at FROM content ORDER BY updated_at DESC`);
        const content = [];
        while (stmt.step()) content.push(stmt.getAsObject());
        stmt.free();
        res.json(content);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

app.get('/api/admin/content/:slug', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { slug } = req.params;
        const db = await getDb();
        const stmt = db.prepare(`SELECT * FROM content WHERE slug = ?`);
        stmt.bind([slug]);
        let item = null;
        if (stmt.step()) item = stmt.getAsObject();
        stmt.free();
        if (item) {
            res.json(item);
        } else {
            res.status(404).json({ error: 'Content not found' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

app.post('/api/admin/content', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { slug, title, body, type, author } = req.body;
        const db = await getDb();
        const stmt = db.prepare(`SELECT slug FROM content WHERE slug = ?`);
        stmt.bind([slug]);
        const exists = stmt.step();
        stmt.free();

        if (exists) {
            db.run(`UPDATE content SET title = ?, body = ?, type = ?, author = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?`, 
                [title, body, type, author, slug]);
        } else {
            db.run(`INSERT INTO content (slug, title, body, type, author) VALUES (?, ?, ?, ?, ?)`,
                [slug, title, body, type, author]);
        }
        saveDb();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to save content' });
    }
});

import { queryGroq } from './services/groqService.js';

app.post('/api/admin/content/generate', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { topic } = req.body;
        const prompt = `Write a short, professional blog post (about 250 words) on the topic: "${topic}". The post should be suitable for the Kurukoo Everyday Utility platform blog. Use HTML formatting.`;
        const generatedBody = await queryGroq(prompt);
        res.json({ success: true, generatedBody });
    } catch (e) {
        res.status(500).json({ error: 'Failed to generate content' });
    }
});

app.get('/api/admin/future_plans', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const db = await getDb();
        const stmt = db.prepare('SELECT * FROM future_plans');
        const plans = [];
        while(stmt.step()) plans.push(stmt.getAsObject());
        stmt.free();
        res.json(plans);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch future plans' });
    }
});

app.get('/api/admin/settings', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const useGroqRouting = await getSystemSetting('use_groq_routing', 'false');
        res.json({ use_groq_routing: useGroqRouting === 'true' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.post('/api/admin/settings', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { use_groq_routing } = req.body;
        await setSystemSetting('use_groq_routing', use_groq_routing ? 'true' : 'false');
        res.json({ success: true, use_groq_routing: use_groq_routing });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// AI Agent First-Class System Endpoints (§21a)
app.get('/api/admin/ai-agents', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const agents = await getAllAIAgents();
        res.json(agents);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch AI agents' });
    }
});

app.get('/api/admin/ai-agents/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const agent = await getAIAgentById(req.params.id);
        if (!agent) return res.status(404).json({ error: 'Agent not found' });
        res.json(agent);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch AI agent' });
    }
});

app.post('/api/admin/ai-agents', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        await createAIAgent(req.body);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create AI agent' });
    }
});

app.put('/api/admin/ai-agents/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const updated = await updateAIAgent(req.params.id, req.body);
        if (!updated) return res.status(404).json({ error: 'Agent not found' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update AI agent' });
    }
});

app.delete('/api/admin/ai-agents/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        await deleteAIAgent(req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete AI agent' });
    }
});

app.post('/api/admin/ai-agents/:id/clone', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { newId, newName } = req.body;
        const cloned = await cloneAIAgent(req.params.id, newId, newName);
        if (!cloned) return res.status(404).json({ error: 'Source agent not found' });
        res.json({ success: true, agent: cloned });
    } catch (e) {
        res.status(500).json({ error: 'Failed to clone AI agent' });
    }
});

app.post('/api/admin/ai-agents/:id/execute', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { taskInput } = req.body;
        const result = await executeAgentTask(req.params.id, taskInput || 'Simulated task execution');
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: 'Failed to execute agent task' });
    }
});

// Pricing & Commissions API Endpoints
app.get('/api/pricing/:country', async (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    try {
        const plans = await getPricing(req.params.country);
        res.json(plans);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch pricing' });
    }
});

app.get('/api/admin/pricing', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const plans = await getAllPricing();
        res.json(plans);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch admin pricing' });
    }
});

app.put('/api/admin/pricing/:country/:plan', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { country, plan } = req.params;
        const success = await updatePlan(country, plan, req.body);
        res.json({ success });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update pricing plan' });
    }
});

app.post('/api/admin/pricing', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const success = await createPlan(req.body);
        res.json({ success });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create pricing plan' });
    }
});

app.delete('/api/admin/pricing/:country/:plan', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { country, plan } = req.params;
        const success = await deletePlan(country, plan);
        res.json({ success });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete pricing plan' });
    }
});

app.get('/api/admin/commissions', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const list = await getAllCommissions();
        res.json(list);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch commissions' });
    }
});

app.put('/api/admin/commissions/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const id = parseInt(req.params.id);
        const { rate_minor, active } = req.body;
        const success = await updateCommission(id, rate_minor, active !== undefined ? active : 1);
        res.json({ success });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update commission' });
    }
});

app.post('/api/subscription/upgrade', async (req, res) => {
    const { phone, plan, country } = req.body;
    if (!phone || !plan || !country) {
        return res.status(400).json({ error: 'phone, plan, and country are required' });
    }
    try {
        const planObj = await getPlan(country, plan);
        if (!planObj) {
            return res.status(404).json({ error: 'Pricing plan not found' });
        }
        const db = await getDb();
        db.run(`UPDATE memory_profiles SET subscription_tier = ? WHERE phone = ?`, [plan.charAt(0).toUpperCase() + plan.slice(1), phone]);
        saveDb();

        // Trigger referral reward activation on first subscription payment
        try {
            await claimReferral(phone);
        } catch (refErr) {
            console.error('Error claiming referral:', refErr);
        }

        res.json({ success: true, message: `Successfully upgraded to ${plan} (${country.toUpperCase()})`, plan: planObj });
    } catch (e) {
        console.error('Subscription upgrade error:', e);
        res.status(500).json({ error: 'Failed to upgrade subscription' });
    }
});

// WhatsApp-style structure middleware: web.kurukoo.com -> /web -> dashboard.html
app.use((req, res, next) => {
    const host = req.headers.host || '';
    if (host.startsWith('web.') && (req.path === '/' || req.path === '')) {
        return res.sendFile(path.join(process.cwd(), 'public', 'dashboard.html'));
    }
    next();
});

app.get('/web', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'dashboard.html'));
});

app.get('/download', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const shortcode = '*7000#';
    const reqPath = `/download`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('download', { country, t, shortcode, seo, schemas, faqs, reqPath });
});

// Public Website Routes — each route fetches SEO data from §53 system
async function fetchSeoData(urlPath: string, pageTitle?: string) {
    const seo = await getSeoPage(urlPath);
    const schemas = await getSchemaForPage(urlPath, pageTitle || seo.title);
    const faqs = await getFaqForPage(urlPath);
    return { seo, schemas, faqs };
}

app.get('/', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const shortcode = '*7000#';
    const reqPath = `/`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    const rotatingTexts = await getRotatingBannerTexts();
    res.render('index', { country, t, shortcode, seo, schemas, faqs, reqPath, rotatingTexts, waNumber: '2347000' });
});

app.get('/pricing', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const shortcode = '*7000#';
    const pricing = await getPricing(country);
    res.locals.pricing = pricing;
    const reqPath = `/pricing`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('pricing', { country, t, shortcode, pricing, seo, schemas, faqs, reqPath });
});

app.get('/about', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const reqPath = `/about`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('about', { country, t, shortcode: '*7000#', seo, schemas, faqs, reqPath });
});

app.get('/contact', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const reqPath = `/contact`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('contact', { country, t, shortcode: '*7000#', seo, schemas, faqs, reqPath });
});

app.get('/help', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const articles = [
        { title: 'Getting Started', body: 'Sign up with your phone number and start chatting.' },
        { title: 'For Providers', body: 'Add your skills to start accepting gigs.' },
        { title: 'Payments', body: 'Manage your credits and withdraw earnings.' }
    ];
    const reqPath = `/help`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('help', { country, t, shortcode: '*7000#', articles, seo, schemas, faqs, reqPath });
});

app.get('/api-docs', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const reqPath = `/api-docs`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('api_docs', { country, t, shortcode: '*7000#', seo, schemas, faqs, reqPath });
});

app.get('/legal/:section?', async (req, res) => {
    const { section } = req.params; const country = 'ng';
    const t = getLocale('en');
    const reqPath = `/legal`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('legal', { country, t, shortcode: '*7000#', section: section || 'privacy', seo, schemas, faqs, reqPath });
});

app.get('/blog', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const reqPath = `/blog`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('blog', { country, t, shortcode: '*7000#', seo, schemas, faqs, reqPath });
});

app.get('/careers', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const reqPath = `/careers`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('careers', { country, t, shortcode: '*7000#', seo, schemas, faqs, reqPath });
});

// Discover (Nearby Map) — NEW page
app.get('/discover', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const reqPath = `/discover`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('discover', { country, t, shortcode: '*7000#', seo, schemas, faqs, reqPath });
});

// Login & SSO Authentication Page
app.get('/login', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const reqPath = `/login`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('login', { country, t, shortcode: '*7000#', seo, schemas, faqs, reqPath });
});

app.get('/login', (req, res) => {
    res.redirect('/login');
});

// For You (User Type Chooser) — NEW page
app.get('/for-you', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const reqPath = `/for-you`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('for-you', { country, t, shortcode: '*7000#', seo, schemas, faqs, reqPath });
});

app.get('/user', async (req, res) => {
    const country = 'ng';
    res.redirect(`/login`);
});

// Resources Hub — NEW page
app.get('/resources', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const reqPath = `/resources`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('resources/index', { country, t, shortcode: '*7000#', seo, schemas, faqs, reqPath });
});

// Resource Article — NEW page
app.get('/resources/:slug', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const slug = req.params.slug;
    const reqPath = `/resources/${slug}`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('resources/article', { country, t, shortcode: '*7000#', slug, seo, schemas, faqs, reqPath });
});

// Partners — NEW page
app.get('/partners', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const reqPath = `/partners`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('partners', { country, t, shortcode: '*7000#', seo, schemas, faqs, reqPath });
});

// Advertise — NEW page
app.get('/advertise', async (req, res) => {
    const country = 'ng';
    const t = getLocale('en');
    const reqPath = `/advertise`;
    const { seo, schemas, faqs } = await fetchSeoData(reqPath);
    res.render('advertise', { country, t, shortcode: '*7000#', seo, schemas, faqs, reqPath });
});

// Explore Hub & Category Routes

// Discover Map API — returns GeoJSON of nearby providers/agents/emergency
function qNum(v: any, def: number): number { const n = parseFloat(v); return isNaN(n) ? def : n; }
app.get('/api/discover/map', async (req, res) => {
    try {
        const lat = qNum(req.query.lat, 6.5244);
        const lng = qNum(req.query.lng, 3.3792);
        const radius = qNum(req.query.radius, 10000);
        const layersRaw = Array.isArray(req.query.layers) ? String(req.query.layers[0]) : (typeof req.query.layers === 'string' ? req.query.layers : 'mobile,stationary,agents,emergency,deals,events');
        const layers: string[] = layersRaw.split(',');
        const db = await getDb();
        const features = [];
        const dLat = radius / 111320;
        const dLng = radius / (111320 * Math.cos(lat * Math.PI / 180));

        if (layers.includes('mobile')) {
            const stmt = db.prepare(`
                SELECT ps.phone, ps.skill, ps.lat, ps.lng, COALESCE(mp.name, ps.phone) AS name
                FROM pulse_sessions ps
                LEFT JOIN memory_profiles mp ON mp.phone = ps.phone
                WHERE ps.active = 1 AND ps.lat BETWEEN ? AND ? AND ps.lng BETWEEN ? AND ?
                LIMIT 50
            `);
            stmt.bind([lat - dLat, lat + dLat, lng - dLng, lng + dLng]);
            while (stmt.step()) {
                const r = stmt.getAsObject() as any;
                features.push({
                    type: 'Feature', properties: { layer: 'mobile', name: r.name, detail: r.skill || 'Provider', lat: r.lat, lng: r.lng },
                    geometry: { type: 'Point', coordinates: [r.lng, r.lat] }
                });
            }
            stmt.free();
        }

        if (layers.includes('stationary')) {
            const stmt = db.prepare(`
                SELECT s.phone, s.skill, pp.last_lat, pp.last_lng, COALESCE(mp.name, s.phone) AS name
                FROM skills s
                LEFT JOIN provider_presence pp ON pp.phone = s.phone
                LEFT JOIN memory_profiles mp ON mp.phone = s.phone
                WHERE s.is_available = 1 AND s.operation_mode = 'stationary'
                  AND pp.last_lat BETWEEN ? AND ? AND pp.last_lng BETWEEN ? AND ?
                LIMIT 50
            `);
            stmt.bind([lat - dLat, lat + dLat, lng - dLng, lng + dLng]);
            while (stmt.step()) {
                const r = stmt.getAsObject() as any;
                features.push({
                    type: 'Feature', properties: { layer: 'stationary', name: r.name, detail: r.skill, lat: r.last_lat, lng: r.last_lng },
                    geometry: { type: 'Point', coordinates: [r.last_lng, r.last_lat] }
                });
            }
            stmt.free();
        }

        if (layers.includes('agents')) {
            const stmt = db.prepare(`SELECT id, name, lga, status FROM ai_agents WHERE status = 'active' LIMIT 30`);
            let i = 0;
            while (stmt.step()) {
                const r = stmt.getAsObject() as any;
                features.push({
                    type: 'Feature', properties: { layer: 'agents', name: r.name, detail: r.lga || 'AI agent', lat: lat + 0.001 * i, lng: lng + 0.001 * i },
                    geometry: { type: 'Point', coordinates: [lng + 0.001 * i, lat + 0.001 * i] }
                });
                i++;
            }
            stmt.free();
        }

        if (layers.includes('emergency')) {
            features.push({ type: 'Feature', properties: { layer: 'emergency', name: 'Emergency Services', detail: 'National hotlines available', lat, lng }, geometry: { type: 'Point', coordinates: [lng, lat] } });
        }

        res.json({ type: 'FeatureCollection', features });
    } catch (e) {
        console.error('Error loading discover map:', e);
        res.status(500).json({ error: 'Failed to load map data' });
    }
});
// Resources API — paginated list
app.get('/api/resources', async (req, res) => {
    try {
        const page = qNum(req.query.page, 1);
        const limit = Math.min(qNum(req.query.limit, 20), 20);
        const offset = (page - 1) * limit;
        const catalogue = [
            { slug: 'getting-started', title: 'Getting Started with Kurukoo', category: 'User', excerpt: 'Create your profile, start chatting and make your first request in minutes.' },
            { slug: 'provider-guide', title: 'Provider Guide: Offer Your Skills', category: 'Provider', excerpt: 'List your skill, go live on Nearby Pulse, and start earning from nearby jobs.' },
            { slug: 'business-guide', title: 'Business Guide: Storefront & Catalogue', category: 'Business', excerpt: 'Set up your chat-managed storefront and let customers find your products in conversation.' },
            { slug: 'diaspora-relocation', title: 'Diaspora & Relocation Guide', category: 'Diaspora', excerpt: 'Settle in the UK and support loved ones back home — all from one conversation.' },
            { slug: 'points-guide', title: 'Points Explained', category: 'User', excerpt: 'Earn and spend Points across the Kurukoo economy.' }
        ];
        const total = catalogue.length;
        res.json({ resources: catalogue.slice(offset, offset + limit), total, page, limit });
    } catch (e) {
        console.error('Error loading resources:', e);
        res.status(500).json({ error: 'Failed to load resources' });
    }
});

// Resource Article API
app.get('/api/resources/:slug', async (req, res) => {
    try {
        const slug = req.params.slug;
        const catalogue = [
            { slug: 'getting-started', title: 'Getting Started with Kurukoo', category: 'User', excerpt: 'Create your profile, start chatting and make your first request in minutes.', body: 'Kurukoo lives in your everyday chat app. Sign up with your phone number, then tell it what you need. It learns you a little more every day. To get started: 1) Open WhatsApp and message 2347000, 2) Say what you need or what you can do, 3) Start chatting. No app download. No forms.' },
            { slug: 'provider-guide', title: 'Provider Guide: Offer Your Skills', category: 'Provider', excerpt: 'List your skill, go live on Nearby Pulse, and start earning from nearby jobs.', body: 'Kurukoo helps you get discovered and paid for what you do. 1) Say what you do, 2) Complete a few short questions to build your profile, 3) Toggle on for work, 4) Accept nearby jobs and get paid when the buyer confirms.' },
            { slug: 'business-guide', title: 'Business Guide: Storefront & Catalogue', category: 'Business', excerpt: 'Set up your chat-managed storefront so customers find your products in conversation.', body: 'Your storefront is managed right in chat. Tell Kurukoo what you sell and it keeps your product list updated. Customers discover your products through Daily Picks and requests — no directory listing needed.' },
            { slug: 'diaspora-relocation', title: 'Diaspora & Relocation Guide', category: 'Diaspora', excerpt: 'Settle in the UK and support loved ones back home — all from one conversation.', body: 'Kurukoo works across borders. Send support home, find verified providers, get relocation guides and life-admin reminders, all from the same profile you already use.' },
            { slug: 'points-guide', title: 'Points Explained', category: 'User', excerpt: 'Earn and spend Points across the Kurukoo economy.', body: '1 Point = N1 value. Earn by engaging daily, referring friends, and completing jobs. Spend on boosts, subscriptions and premium features.' }
        ];
        const item = catalogue.find(c => c.slug === slug);
        if (!item) return res.status(404).json({ error: 'Resource not found' });
        res.json(item);
    } catch (e) {
        console.error('Error loading resource:', e);
        res.status(500).json({ error: 'Failed to load resource' });
    }
});

// Explore Hub (both root /explore and /:country/explore)
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

// Explore Category Page (both /explore/:slug and /:country/explore/:slug)
app.get('/explore/:slug', async (req, res) => {
    try {
        const country = 'ng';
        const rawSlug = (req.params.slug || '').toLowerCase().trim();
        const categoriesPath = path.join(process.cwd(), 'content', 'explore', 'categories.json');
        let categories = [];
        if (fs.existsSync(categoriesPath)) {
            categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
        }

        // 1. Exact match
        let category = categories.find((c: any) => c.slug === rawSlug);

        // 2. Normalized match (e.g. moneycircle -> money-circle, fooddrink -> food-drink)
        if (!category) {
            const cleanRaw = rawSlug.replace(/[^a-z0-9]/g, '');
            category = categories.find((c: any) => c.slug.replace(/[^a-z0-9]/g, '') === cleanRaw);
        }

        // 3. Known Aliases
        if (!category) {
            const aliases: Record<string, string> = {
                'errands': 'errands-delivery',
                'delivery': 'errands-delivery',
                'care': 'personal-care',
                'property': 'property-real-estate',
                'security': 'safety-security',
                'safety': 'safety-security',
                'tax': 'finance-tax',
                'finance': 'finance-tax',
                'pet': 'pet-services',
                'pets': 'pet-services',
                'language': 'language-services',
                'languages': 'language-services',
                'tyre': 'tyre-vulcanizer',
                'vulcanizer': 'tyre-vulcanizer',
                'digital': 'digital-services',
                'religious': 'religious-services',
                'spiritual': 'religious-services',
                'creative': 'creative-arts',
                'moneycircle': 'money-circle',
                'automotive': 'automotive-care',
                'realestate': 'real-estate',
                'home': 'repairs',
                'home-services': 'repairs',
                'solar': 'repairs',
                'solar-power': 'repairs',
                'fuel': 'errands-delivery',
                'fuel-delivery': 'errands-delivery',
                'health': 'health',
                'health-care': 'health',
                'wellness': 'wellness',
                'sports': 'fitness',
                'sports-fitness': 'fitness',
                'fitness': 'fitness',
                'community': 'community',
                'community-groups': 'community',
                'education': 'education',
                'education-tutoring': 'education',
                'tutoring': 'tutoring',
                'retail': 'classifieds',
                'retail-shopping': 'classifieds',
                'shopping': 'classifieds',
                'classifieds': 'classifieds',
                'workers': 'workers',
                'repairs': 'repairs',
                'food': 'food',
                'drinks': 'drinks',
                'transport': 'transport',
                'logistics': 'logistics',
                'emergency': 'emergency',
                'driving': 'driving',
                'gigs': 'gigs'
            };
            const mappedSlug = aliases[rawSlug];
            if (mappedSlug) {
                category = categories.find((c: any) => c.slug === mappedSlug);
            }
        }

        // 4. Substring / Partial match
        if (!category) {
            category = categories.find((c: any) => c.slug.includes(rawSlug) || rawSlug.includes(c.slug));
        }

        if (!category) {
            return res.redirect(`/explore`);
        }

        if (!category.mockConversation) {
            category.mockConversation = [
                { sender: "assistant", content: `Ku Kurukoo! Welcome to ${category.name}. How can I assist you with ${category.name.toLowerCase()} today?` },
                { sender: "user", content: `I need a reliable ${category.name.toLowerCase()} service.` },
                { sender: "assistant", content: `Connecting you with verified ${category.name} providers near you right now.` }
            ];
        }

        // Augment category data with real DB stats
        const db = await getDb();
        const catKeywords = [
            category.slug, 
            category.name, 
            ...(category.relatedSlugs || [])
        ].map((k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, ''));

        let providerCount = 0;
        let totalJobsCompleted = 0;
        let sumRating = 0;
        let ratedCount = 0;
        let primaryLocation = 'Ibadan, Oyo State';

        try {
            const stmtSkills = db.prepare(`
                SELECT s.phone, s.skill, s.is_available, s.rating, s.jobs_completed, m.location
                FROM skills s
                LEFT JOIN memory_profiles m ON s.phone = m.phone
            `);
            const matchedPhones = new Set<string>();

            while (stmtSkills.step()) {
                const row = stmtSkills.getAsObject();
                const sk = (row.skill || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                const isMatch = catKeywords.some(kw => kw && (sk.includes(kw) || kw.includes(sk)));
                if (isMatch) {
                    if (row.phone) matchedPhones.add(row.phone as string);
                    const jobs = Number(row.jobs_completed) || 0;
                    const rating = Number(row.rating) || 0;
                    totalJobsCompleted += jobs;
                    if (jobs > 0 && rating > 0) {
                        sumRating += rating;
                        ratedCount++;
                    }
                    if (row.location) primaryLocation = row.location as string;
                }
            }
            stmtSkills.free();

            providerCount = matchedPhones.size;

            if (providerCount === 0) {
                const stmtCount = db.prepare(`SELECT COUNT(*) as cnt FROM memory_profiles WHERE is_available = 1`);
                if (stmtCount.step()) {
                    providerCount = Math.max(8, stmtCount.getAsObject().cnt as number);
                }
                stmtCount.free();
            }
        } catch (dbErr) {
            console.warn('Error fetching category stats:', dbErr);
            providerCount = 15;
        }

        category.providerCount = providerCount;
        category.totalJobsCompleted = totalJobsCompleted;
        category.avgRating = ratedCount > 0 ? (sumRating / ratedCount).toFixed(1) : null;
        category.primaryLocation = primaryLocation;
        category.subCategories = (category.relatedSlugs || []).map((relSlug: string) => {
            const sub = categories.find((c: any) => c.slug === relSlug);
            return sub ? { name: sub.name, slug: sub.slug } : { name: relSlug.replace(/-/g, ' '), slug: relSlug };
        });

        let ads: any[] = [];
        try {
            ads = await getAdCampaigns();
        } catch (adErr) {
            console.warn('Ad campaigns fetch error:', adErr);
        }

        const reqPath = `/explore/${category.slug}`;
        const { seo, schemas, faqs } = await fetchSeoData(reqPath, category.name);
        res.render('explore/category', {
            category,
            categories,
            ads: ads || [],
            country,
            t: getLocale('en'),
            shortcode: '*7000#',
            seo, schemas, faqs, reqPath
        });
    } catch (e) {
        console.error('Error loading category:', e);
        res.redirect(`/explore`);
    }
});

app.post('/api/onboard/start', async (req, res) => {
    const { phone, category } = req.body;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT * FROM memory_profiles WHERE phone = ?`);
        stmt.bind([phone]);
        let profile = null;
        if (stmt.step()) {
            profile = stmt.getAsObject();
        }
        stmt.free();

        const prefs = profile && profile.preferences ? JSON.parse(profile.preferences) : {};
        prefs.onboarding_step = 'ask_name';
        prefs.onboarding_complete = false;
        if (category) {
            prefs.explore_entry_category = category;
        }

        if (!profile) {
            db.run(`INSERT INTO memory_profiles (phone, name, location, country, subscription_tier, wallet_balance_minor, preferences) VALUES (?, 'New User', 'Ibadan', 'ng', 'Base', 30, ?)`, [phone, JSON.stringify(prefs)]);
        } else {
            db.run(`UPDATE memory_profiles SET preferences = ? WHERE phone = ?`, [JSON.stringify(prefs), phone]);
        }
        saveDb();

        res.json({
            success: true,
            reply: `Welcome to Kurukoo! I am your AI assistant. Let's get you set up.\n\nFirst, what is your name?`,
            nextStep: 'ask_name'
        });
    } catch (e) {
        console.error('Error starting onboarding from explore:', e);
        res.status(500).json({ error: 'Failed to start onboarding' });
    }
});

// Self-Hosted Custom WhatsApp API credential management and activation
app.post('/api/onboard/self-hosted-whatsapp', async (req, res) => {
    const { phone, name, whatsappNumber, metaAppId, metaAccessToken, contributorAssisted } = req.body;
    if (!phone || !whatsappNumber) {
        return res.status(400).json({ error: 'phone and whatsappNumber are required' });
    }
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT * FROM memory_profiles WHERE phone = ?`);
        stmt.bind([phone]);
        let profile = null;
        if (stmt.step()) {
            profile = stmt.getAsObject();
        }
        stmt.free();

        const prefs = profile && profile.preferences ? JSON.parse(profile.preferences) : {};
        prefs.whatsapp_channel_mode = 'self_hosted';
        prefs.self_hosted_whatsapp = {
            whatsappNumber,
            metaAppId,
            metaAccessToken: metaAccessToken ? '********' + metaAccessToken.slice(-4) : '', // Obfuscate for security
            contributorAssisted: !!contributorAssisted,
            activatedAt: new Date().toISOString()
        };
        prefs.onboarding_complete = true;

        if (!profile) {
            db.run(`INSERT INTO memory_profiles (phone, name, location, country, subscription_tier, wallet_balance_minor, preferences) VALUES (?, ?, 'Ibadan', 'ng', 'Business', 120, ?)`, 
                [phone, name || 'Self-Hosted Partner', JSON.stringify(prefs)]);
        } else {
            db.run(`UPDATE memory_profiles SET name = COALESCE(?, name), subscription_tier = 'Business', preferences = ? WHERE phone = ?`, 
                [name, JSON.stringify(prefs), phone]);
        }

        // Record a setup fee transaction if assisted by a contributor
        if (contributorAssisted) {
            db.run(`INSERT INTO credit_transactions (phone, amount, type, description) VALUES (?, -5000, 'setup_fee', '₦5,000 Contributor Assisted Self-Hosted WhatsApp Setup & Activation Fee')`, [phone]);
        }

        saveDb();
        res.json({
            success: true,
            message: 'Self-Hosted Custom WhatsApp API activated successfully!',
            config: prefs.self_hosted_whatsapp
        });
    } catch (e) {
        console.error('Error activating self-hosted WhatsApp:', e);
        res.status(500).json({ error: 'Failed to activate custom self-hosted WhatsApp integration' });
    }
});

// Fetch Keep-Alive scheduler status for interactive UI simulation
app.get('/api/onboard/keep-alive-status', async (req, res) => {
    const phone = req.query.phone as string;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT preferences, last_active_at FROM memory_profiles WHERE phone = ?`);
        stmt.bind([phone]);
        let profile = null;
        if (stmt.step()) {
            profile = stmt.getAsObject();
        }
        stmt.free();

        const prefs = profile && profile.preferences ? JSON.parse(profile.preferences) : {};
        let hoursSinceLastInteraction = 9; // default fallback if no last_active_at
        let nextPushScheduledAt = new Date();
        nextPushScheduledAt.setHours(nextPushScheduledAt.getHours() + 15);
        let status = 'STANDBY_15H_TRIGGER_ACTIVE';

        if (profile && profile.last_active_at) {
            const lastActive = new Date(profile.last_active_at);
            const now = new Date();
            hoursSinceLastInteraction = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60));
            nextPushScheduledAt = new Date(lastActive.getTime() + 15 * 60 * 60 * 1000);

            if (hoursSinceLastInteraction >= 24) {
                status = 'EXPIRED';
            } else if (hoursSinceLastInteraction >= 15) {
                status = 'KEEP_ALIVE_PUSH_TRIGGERED';
            } else {
                status = 'STANDBY_15H_TRIGGER_ACTIVE';
            }
        }
        
        res.json({
            success: true,
            active: true,
            channel: 'WhatsApp',
            phone: phone,
            keepAliveMethod: 'FCM Push & WhatsApp Webhook Interceptor',
            hoursSinceLastInteraction: hoursSinceLastInteraction,
            nextPushScheduledAt: nextPushScheduledAt.toISOString(),
            status: status,
            description: 'Kurukoo scheduler will automatically send an FCM Push notification with pre-filled WhatsApp verification text 15 hours after your last active chat to keep your 24-hour window open 100% free!'
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch keep-alive status' });
    }
});

// Trigger FCM keep-alive push notification manually (simulates scheduler running at 15/22 hours)
app.post('/api/onboard/keep-alive-trigger', async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }
    try {
        const { sendFcmPush, generateWhatsAppDeepLink } = await import('./services/pushNotifications.js');
        const deepLink = generateWhatsAppDeepLink("Show nearby active providers");
        
        await sendFcmPush(
            phone,
            "Kurukoo Free Keep-Alive",
            "Your nearby live radar feed is updating! Tap here to see who is active near you right now and keep your session 100% free.",
            deepLink
        );

        // Record push_sent event
        await recordKeepAliveEvent(phone, 'push_sent', 0, { source: 'manual_trigger' });

        res.json({
            success: true,
            message: 'FCM keep-alive push notification triggered successfully!',
            deepLink
        });
    } catch (e) {
        console.error('Error triggering keep-alive push:', e);
        res.status(500).json({ error: 'Failed to trigger keep-alive push' });
    }
});

// Reset simulated WhatsApp session window via loophole webhook interceptor
app.post('/api/onboard/keep-alive-reset', async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ error: 'phone is required' });
    }
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT * FROM memory_profiles WHERE phone = ?`);
        stmt.bind([phone]);
        let profile = null;
        if (stmt.step()) {
            profile = stmt.getAsObject();
        }
        stmt.free();

        const now = new Date();
        const prefs = profile && profile.preferences ? JSON.parse(profile.preferences) : {};
        prefs.last_keep_alive_reset_at = now.toISOString();
        prefs.whatsapp_session_state = 'active_free';
        prefs.sim_hours_since_interaction = 0;
        prefs.keep_alive_fcm_sent = false; // Reset the push notification sent flag for new session block

        if (profile) {
            db.run(`UPDATE memory_profiles SET last_active_at = ?, preferences = ? WHERE phone = ?`, 
                [now.toISOString(), JSON.stringify(prefs), phone]);
        }

        // Add to log
        db.run(`INSERT INTO profile_access_log (phone, service_name, action) VALUES (?, 'WhatsAppKeepAlive', 'WEBHOOK_INTERCEPTED_SESSION_CLOCK_RESET')`, [phone]);

        // Record push_opened (Keep-Alive Reset) saving 9.28 NGN
        await recordKeepAliveEvent(phone, 'push_opened', 9.28, { source: 'webhook_interceptor' });

        saveDb();
        res.json({
            success: true,
            message: 'Webhook Interceptor: 24-hour WhatsApp conversation session clock reset for FREE!',
            lastResetAt: prefs.last_keep_alive_reset_at
        });
    } catch (e) {
        console.error('Error resetting keep-alive state:', e);
        res.status(500).json({ error: 'Failed to reset keep-alive state' });
    }
});

// API: Initialize/Register Firebase Cloud Messaging (FCM) Token
app.use('/api/fcm', fcmRouter);


// Dashboard routes (direct /dashboard, /dashboard.html, and country prefixed /:country/dashboard, /:country/dashboard.html)
app.get(['/dashboard', '/dashboard.html'], (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'dashboard.html'));
});

// How It Works
app.get('/how-it-works', (req, res) => {
    const country = 'ng';
    res.redirect(`/for-you`);
});




// ===== §53.5 — Admin Console: SEO Management API =====

// Dashboard overview
app.get('/api/admin/seo/dashboard', async (req, res) => {
    try { const data = await getSeoDashboard(); res.json(data); }
    catch (e) { console.error('SEO dashboard error:', e); res.status(500).json({ error: 'Failed to load SEO dashboard' }); }
});
app.get('/api/admin/seo/health', async (req, res) => {
    try { res.json({ score: await getHealthScore() }); }
    catch (e) { console.error('SEO health error:', e); res.status(500).json({ error: 'Failed to load health score' }); }
});

// Settings
app.get('/api/admin/seo/settings', async (req, res) => {
    try { res.json(await getSeoSettings()); }
    catch (e) { console.error('SEO settings error:', e); res.status(500).json({ error: 'Failed to load SEO settings' }); }
});
app.post('/api/admin/seo/settings', async (req, res) => {
    try { await updateSeoSettings(req.body || {}); res.json({ success: true }); }
    catch (e) { console.error('SEO settings update error:', e); res.status(500).json({ error: 'Failed to save SEO settings' }); }
});

// SEO Pages (per-page metadata)
app.get('/api/admin/seo/pages', async (req, res) => {
    try { res.json(await getAllSeoPages()); }
    catch (e) { console.error('SEO pages error:', e); res.status(500).json({ error: 'Failed to load SEO pages' }); }
});
app.post('/api/admin/seo/pages', async (req, res) => {
    try { await upsertSeoPage(req.body as any); res.json({ success: true }); }
    catch (e) { console.error('SEO page save error:', e); res.status(500).json({ error: 'Failed to save SEO page' }); }
});
app.delete('/api/admin/seo/pages', async (req, res) => {
    try { await deleteSeoPage(String(req.body?.url_path || '')); res.json({ success: true }); }
    catch (e) { console.error('SEO page delete error:', e); res.status(500).json({ error: 'Failed to delete SEO page' }); }
});

// FAQs
app.get('/api/admin/seo/faqs', authenticateAdmin, async (req: AuthRequest, res) => {
    try { const page = typeof req.query.url_path === 'string' ? req.query.url_path : ''; res.json(await getAllFaqForPage(page)); }
    catch (e) { console.error('SEO FAQs error:', e); res.status(500).json({ error: 'Failed to load FAQs' }); }
});
app.post('/api/admin/seo/faqs', authenticateAdmin, async (req: AuthRequest, res) => {
    try { const b = req.body || {}; await addFaq(String(b.page_url_path || ''), String(b.question || ''), String(b.answer || ''), Number(b.display_order) || 0); res.json({ success: true }); }
    catch (e) { console.error('FAQ add error:', e); res.status(500).json({ error: 'Failed to add FAQ' }); }
});
app.put('/api/admin/seo/faqs/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try { await updateFaq(Number(req.params.id), req.body || {}); res.json({ success: true }); }
    catch (e) { console.error('FAQ update error:', e); res.status(500).json({ error: 'Failed to update FAQ' }); }
});
app.delete('/api/admin/seo/faqs/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try { await deleteFaq(Number(req.params.id)); res.json({ success: true }); }
    catch (e) { console.error('FAQ delete error:', e); res.status(500).json({ error: 'Failed to delete FAQ' }); }
});

// Keywords
app.get('/api/admin/seo/keywords', authenticateAdmin, async (req: AuthRequest, res) => {
    try { res.json(await getKeywords()); }
    catch (e) { console.error('SEO keywords error:', e); res.status(500).json({ error: 'Failed to load keywords' }); }
});
app.post('/api/admin/seo/keywords', authenticateAdmin, async (req: AuthRequest, res) => {
    try { const b = req.body || {}; await upsertKeyword(String(b.keyword||''), String(b.locale||'en'), String(b.country||'ng'), Number(b.search_volume)||0, Number(b.difficulty)||0, !!b.tracked); res.json({ success: true }); }
    catch (e) { console.error('SEO keyword save error:', e); res.status(500).json({ error: 'Failed to save keyword' }); }
});
app.delete('/api/admin/seo/keywords/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try { await deleteKeyword(Number(req.params.id)); res.json({ success: true }); }
    catch (e) { console.error('SEO keyword delete error:', e); res.status(500).json({ error: 'Failed to delete keyword' }); }
});

// Redirects
app.get('/api/admin/seo/redirects', authenticateAdmin, async (req: AuthRequest, res) => {
    try { res.json(await getRedirects()); }
    catch (e) { console.error('SEO redirects error:', e); res.status(500).json({ error: 'Failed to load redirects' }); }
});
app.post('/api/admin/seo/redirects', authenticateAdmin, async (req: AuthRequest, res) => {
    try { const b = req.body || {}; await addRedirect(String(b.from_pattern||''), String(b.to_url||''), Number(b.status_code)||301, !!b.is_regex); res.json({ success: true }); }
    catch (e) { console.error('SEO redirect add error:', e); res.status(500).json({ error: 'Failed to add redirect' }); }
});
app.delete('/api/admin/seo/redirects/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try { await deleteRedirect(Number(req.params.id)); res.json({ success: true }); }
    catch (e) { console.error('SEO redirect delete error:', e); res.status(500).json({ error: 'Failed to delete redirect' }); }
});

// Schema templates
app.get('/api/admin/seo/schemas', authenticateAdmin, async (req: AuthRequest, res) => {
    try { res.json(await getSchemaTemplates()); }
    catch (e) { console.error('SEO schema error:', e); res.status(500).json({ error: 'Failed to load schema templates' }); }
});
app.post('/api/admin/seo/schemas', authenticateAdmin, async (req: AuthRequest, res) => {
    try { const b = req.body || {}; await upsertSchemaTemplate(String(b.id||''), String(b.name||''), String(b.type||''), String(b.template||'{}'), String(b.applies_to||'')); res.json({ success: true }); }
    catch (e) { console.error('SEO schema save error:', e); res.status(500).json({ error: 'Failed to save schema template' }); }
});
app.delete('/api/admin/seo/schemas/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try { await deleteSchemaTemplate(String(req.params.id)); res.json({ success: true }); }
    catch (e) { console.error('SEO schema delete error:', e); res.status(500).json({ error: 'Failed to delete schema template' }); }
});

// Internal links
app.get('/api/admin/seo/internal-links', authenticateAdmin, async (req: AuthRequest, res) => {
    try { res.json(await getInternalLinks()); }
    catch (e) { console.error('SEO internal links error:', e); res.status(500).json({ error: 'Failed to load internal links' }); }
});
app.post('/api/admin/seo/internal-links', authenticateAdmin, async (req: AuthRequest, res) => {
    try { const b = req.body || {}; await addInternalLink(String(b.source_url||''), String(b.target_url||''), String(b.anchor_text||'')); res.json({ success: true }); }
    catch (e) { console.error('SEO internal link add error:', e); res.status(500).json({ error: 'Failed to add internal link' }); }
});
app.delete('/api/admin/seo/internal-links/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try { await deleteInternalLink(Number(req.params.id)); res.json({ success: true }); }
    catch (e) { console.error('SEO internal link delete error:', e); res.status(500).json({ error: 'Failed to delete internal link' }); }
});

// Backlinks
app.get('/api/admin/seo/backlinks', authenticateAdmin, async (req: AuthRequest, res) => {
    try { res.json(await getBacklinks()); }
    catch (e) { console.error('SEO backlinks error:', e); res.status(500).json({ error: 'Failed to load backlinks' }); }
});
app.post('/api/admin/seo/backlinks', authenticateAdmin, async (req: AuthRequest, res) => {
    try { const b = req.body || {}; await addBacklink(String(b.source_url||''), String(b.target_url||''), String(b.anchor_text||'')); res.json({ success: true }); }
    catch (e) { console.error('SEO backlink add error:', e); res.status(500).json({ error: 'Failed to add backlink' }); }
});
app.delete('/api/admin/seo/backlinks/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try { await deleteBacklink(Number(req.params.id)); res.json({ success: true }); }
    catch (e) { console.error('SEO backlink delete error:', e); res.status(500).json({ error: 'Failed to delete backlink' }); }
});

// Content calendar & briefs
app.get('/api/admin/seo/content-calendar', authenticateAdmin, async (req: AuthRequest, res) => {
    try { res.json(await getContentCalendar()); }
    catch (e) { console.error('SEO content calendar error:', e); res.status(500).json({ error: 'Failed to load content calendar' }); }
});
app.post('/api/admin/seo/content-calendar', authenticateAdmin, async (req: AuthRequest, res) => {
    try { await addContentCalendar(req.body || {}); res.json({ success: true }); }
    catch (e) { console.error('SEO content calendar add error:', e); res.status(500).json({ error: 'Failed to add content calendar item' }); }
});
app.put('/api/admin/seo/content-calendar/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try { await updateContentCalendar(Number(req.params.id), req.body || {}); res.json({ success: true }); }
    catch (e) { console.error('SEO content calendar update error:', e); res.status(500).json({ error: 'Failed to update content calendar item' }); }
});
app.delete('/api/admin/seo/content-calendar/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try { await deleteContentCalendar(Number(req.params.id)); res.json({ success: true }); }
    catch (e) { console.error('SEO content calendar delete error:', e); res.status(500).json({ error: 'Failed to delete content calendar item' }); }
});
app.get('/api/admin/seo/content-briefs', authenticateAdmin, async (req: AuthRequest, res) => {
    try { res.json(await getContentBriefs()); }
    catch (e) { console.error('SEO content briefs error:', e); res.status(500).json({ error: 'Failed to load content briefs' }); }
});
app.post('/api/admin/seo/content-briefs', authenticateAdmin, async (req: AuthRequest, res) => {
    try { await addContentBrief(req.body || {}); res.json({ success: true }); }
    catch (e) { console.error('SEO content brief add error:', e); res.status(500).json({ error: 'Failed to add content brief' }); }
});
app.delete('/api/admin/seo/content-briefs/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try { await deleteContentBrief(Number(req.params.id)); res.json({ success: true }); }
    catch (e) { console.error('SEO content brief delete error:', e); res.status(500).json({ error: 'Failed to delete content brief' }); }
});

// 404 log (monitoring)
app.get('/api/admin/seo/404-log', authenticateAdmin, async (req: AuthRequest, res) => {
    try { res.json(await get404Log()); }
    catch (e) { console.error('SEO 404 log error:', e); res.status(500).json({ error: 'Failed to load 404 log' }); }
});
app.post('/api/admin/seo/404-log/ignore/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try { await ignore404(Number(req.params.id)); res.json({ success: true }); }
    catch (e) { console.error('SEO 404 ignore error:', e); res.status(500).json({ error: 'Failed to ignore 404 entry' }); }
});

// ──────────────────────────────────────────────
// §4.1.3 Deferred Request Protocol — API routes
// ──────────────────────────────────────────────
import { createOpenIntention, resolveOpenIntention, getIntentions, incrementAttempt } from './services/deferredRequestService.js';

app.post('/api/deferred/create', async (req, res) => {
    try {
        const { phone, intent, context, skill, location, ttlDays, maxAttempts } = req.body || {};
        if (!phone || !intent || !context) return res.status(400).json({ error: 'phone, intent, context required' });
        const intention = await createOpenIntention(phone, intent, context, { skill, location, ttlDays, maxAttempts });
        res.json({ success: true, intention });
    } catch (e: any) { console.error('Deferred create error:', e); res.status(500).json({ error: e.message || 'Failed to create intention' }); }
});

app.get('/api/deferred/list/:phone', async (req, res) => {
    try {
        const intentions = await getIntentions(req.params.phone);
        res.json({ intentions });
    } catch (e: any) { console.error('Deferred list error:', e); res.status(500).json({ error: e.message || 'Failed to list intentions' }); }
});

app.post('/api/deferred/resolve', async (req, res) => {
    try {
        const { phone, intentionId, resolution, note, workaround } = req.body || {};
        if (!phone || !intentionId || !resolution) return res.status(400).json({ error: 'phone, intentionId, resolution required' });
        await resolveOpenIntention(phone, intentionId, resolution, note, workaround);
        res.json({ success: true });
    } catch (e: any) { console.error('Deferred resolve error:', e); res.status(500).json({ error: e.message || 'Failed to resolve intention' }); }
});

app.post('/api/deferred/attempt/:phone/:intentionId', async (req, res) => {
    try {
        const intention = await incrementAttempt(req.params.phone, req.params.intentionId);
        res.json({ success: true, intention });
    } catch (e: any) { console.error('Deferred attempt error:', e); res.status(500).json({ error: e.message || 'Failed to attempt intention' }); }
});

app.post('/api/deferred/abandon/:phone/:intentionId', async (req, res) => {
    try {
        await resolveOpenIntention(req.params.phone, req.params.intentionId, 'abandoned');
        res.json({ success: true });
    } catch (e: any) { console.error('Deferred abandon error:', e); res.status(500).json({ error: e.message || 'Failed to abandon intention' }); }
});

// ──────────────────────────────────────────────
// §21.3 / §33 — Proactive Opportunity Engine API
// ──────────────────────────────────────────────
import { getOpportunitiesForFeed, actOnOpportunity, dismissOpportunity } from './services/opportunityEngine.js';

app.get('/api/opportunities', async (req, res) => {
    try {
        const phone = String(req.query.phone || '');
        if (!phone) return res.status(400).json({ error: 'Phone number required' });
        const list = await getOpportunitiesForFeed(phone);
        res.json({ success: true, opportunities: list });
    } catch (e: any) {
        console.error('Get opportunities error:', e);
        res.status(500).json({ error: e.message || 'Failed to fetch opportunities' });
    }
});

app.get('/api/opportunities/daily-picks', async (req, res) => {
    try {
        const phone = String(req.query.phone || '');
        if (!phone) return res.status(400).json({ error: 'Phone number required' });
        const list = await getOpportunitiesForFeed(phone);
        const dailyPicks = list.filter((item: any) => item.type === 'daily_pick');
        res.json({ success: true, daily_picks: dailyPicks });
    } catch (e: any) {
        console.error('Get daily picks error:', e);
        res.status(500).json({ error: e.message || 'Failed to fetch daily picks' });
    }
});

app.post('/api/opportunities/act', async (req, res) => {
    try {
        const { id, phone } = req.body || {};
        if (!id || !phone) return res.status(400).json({ error: 'id and phone required' });
        const result = await actOnOpportunity(Number(id), phone);
        res.json(result);
    } catch (e: any) {
        console.error('Act on opportunity error:', e);
        res.status(500).json({ error: e.message || 'Failed to act on opportunity' });
    }
});

app.post('/api/opportunities/dismiss', async (req, res) => {
    try {
        const { id, phone } = req.body || {};
        if (!id || !phone) return res.status(400).json({ error: 'id and phone required' });
        const success = await dismissOpportunity(Number(id), phone);
        res.json({ success });
    } catch (e: any) {
        console.error('Dismiss opportunity error:', e);
        res.status(500).json({ error: e.message || 'Failed to dismiss opportunity' });
    }
});

// ──────────────────────────────────────────────
// §53 — SEO alt-text auto-generation API
// ──────────────────────────────────────────────

app.post('/api/admin/seo/generate-alt-text', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { imagePath, context, existingAlt } = req.body || {};
        if (!imagePath) return res.status(400).json({ error: 'imagePath required' });
        const alt = await generateAltTextForImage(imagePath, context, existingAlt);
        res.json({ alt_text: alt, image_path: imagePath });
    } catch (e: any) { console.error('SEO alt-text generation error:', e); res.status(500).json({ error: e.message || 'Failed to generate alt text' }); }
});

app.post('/api/admin/seo/generate-faqs', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { urlPath, topicName } = req.body || {};
        if (!urlPath) return res.status(400).json({ error: 'urlPath required' });
        const faqs = await generateFaqsForPageWithAI(urlPath, topicName);
        res.json({ success: true, faqs });
    } catch (e: any) { console.error('SEO FAQ generation error:', e); res.status(500).json({ error: e.message || 'Failed to generate FAQs' }); }
});

app.post('/api/admin/seo/generate-brief', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { targetKeyword } = req.body || {};
        if (!targetKeyword) return res.status(400).json({ error: 'targetKeyword required' });
        const brief = await generateContentBriefWithAI(targetKeyword);
        res.json({ success: true, brief });
    } catch (e: any) { console.error('SEO brief generation error:', e); res.status(500).json({ error: e.message || 'Failed to generate content brief' }); }
});

app.post('/api/admin/seo/run-audit', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { urlPath } = req.body || {};
        const audit = await runSeoAudit(urlPath || '/');
        res.json(audit);
    } catch (e: any) { console.error('SEO audit run error:', e); res.status(500).json({ error: e.message || 'Failed to run SEO audit' }); }
});

// ──────────────────────────────────────────────
// §53 — Additional SEO admin routes (audits, rankings, orphans, image-meta)
// ──────────────────────────────────────────────
app.get('/api/admin/seo/audits', authenticateAdmin, async (req: AuthRequest, res) => {
    try { res.json(await getAuditResults()); }
    catch (e: any) { console.error('SEO audits error:', e); res.status(500).json({ error: 'Failed to load audits' }); }
});
app.get('/api/admin/seo/rankings', authenticateAdmin, async (req: AuthRequest, res) => {
    try { res.json(await getRankings()); }
    catch (e: any) { console.error('SEO rankings error:', e); res.status(500).json({ error: 'Failed to load rankings' }); }
});
app.get('/api/admin/seo/orphans', authenticateAdmin, async (req: AuthRequest, res) => {
    try { res.json(await getOrphanPages()); }
    catch (e: any) { console.error('SEO orphans error:', e); res.status(500).json({ error: 'Failed to load orphan pages' }); }
});
app.get('/api/admin/seo/image-meta', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const page = typeof req.query.page_url_path === 'string' ? String(req.query.page_url_path) : undefined;
        res.json(await getImageMeta(page));
    } catch (e: any) { console.error('SEO image meta error:', e); res.status(500).json({ error: 'Failed to load image metadata' }); }
});
app.post('/api/admin/seo/image-meta/generate-alt', authenticateAdmin, async (req: AuthRequest, res) => {
    try {
        const { imagePath, context, existingAlt } = req.body || {};
        if (!imagePath) return res.status(400).json({ error: 'imagePath required' });
        const alt = await generateAltTextForImage(imagePath, context, existingAlt);
        res.json({ alt_text: alt, image_path: imagePath });
    } catch (e: any) { console.error('SEO alt-text generation error:', e); res.status(500).json({ error: e.message || 'Failed to generate alt text' }); }
});
app.delete('/api/admin/seo/image-meta/:id', authenticateAdmin, async (req: AuthRequest, res) => {
    try { await deleteImageMeta(Number(req.params.id)); res.json({ success: true }); }
    catch (e: any) { console.error('SEO image meta delete error:', e); res.status(500).json({ error: 'Failed to delete image meta' }); }
});

// ──────────────────────────────────────────────
// §53.1 / I1-I2 — Programmatic SEO Pages & Provider Profiles
// ──────────────────────────────────────────────

const PROGRAMMATIC_CITIES: Record<string, { slug: string; name: string }[]> = {
    ng: [
        { slug: 'lagos', name: 'Lagos' },
        { slug: 'abuja', name: 'Abuja' },
        { slug: 'ibadan', name: 'Ibadan' },
        { slug: 'port-harcourt', name: 'Port Harcourt' },
        { slug: 'kano', name: 'Kano' },
        { slug: 'enugu', name: 'Enugu' },
        { slug: 'benin-city', name: 'Benin City' },
        { slug: 'kaduna', name: 'Kaduna' },
    ],
};

function slugifyName(name: string): string {
    return (name || 'provider').toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 40);
}

function generateProfileSlug(name: string, phone: string): string {
    const base = slugifyName(name || 'provider');
    const suffix = (phone || '').replace(/\D/g, '').slice(-4);
    return suffix ? `${base}-${suffix}` : base;
}

// I2. Provider Profile Page — /:country/p/:providerSlug (opt-in only, §53.1)
app.get('/p/:providerSlug', async (req, res, next) => {
    try {
        const country = 'ng';
        const providerSlug = req.params.providerSlug;
        const db = await getDb();

        // 1. Try direct lookup by stored profile_slug
        let stmt = db.prepare(`SELECT * FROM memory_profiles WHERE profile_slug = ?`);
        stmt.bind([providerSlug]);
        let profile: any = null;
        if (stmt.step()) profile = stmt.getAsObject();
        stmt.free();

        // 2. If not found, scan eligible providers and compute slugs
        if (!profile) {
            stmt = db.prepare(`
                SELECT mp.* FROM memory_profiles mp
                WHERE mp.public_profile_opt_in = 1 OR mp.verified_provider = 1
                OR EXISTS (SELECT 1 FROM provider_subscriptions ps
                           WHERE ps.phone = mp.phone AND ps.status = 'active' AND ps.tier != 'Base')
            `);
            while (stmt.step()) {
                const row = stmt.getAsObject();
                const computedSlug = generateProfileSlug(
                    String(row.display_name || row.name || 'provider'),
                    String(row.phone || '')
                );
                if (computedSlug === providerSlug) {
                    profile = row;
                    try {
                        const upd = db.prepare(`UPDATE memory_profiles SET profile_slug = ? WHERE phone = ?`);
                        upd.bind([computedSlug, row.phone]);
                        upd.step();
                        upd.free();
                        saveDb();
                    } catch (_e) { /* non-critical */ }
                    break;
                }
            }
            stmt.free();
        }

        if (!profile) return next();

        // 3. Verify opt-in criteria
        const optedIn = profile.public_profile_opt_in === 1 || profile.verified_provider === 1;
        if (!optedIn) {
            let hasBoost = false;
            stmt = db.prepare(`SELECT 1 FROM provider_subscriptions WHERE phone = ? AND status = 'active' AND tier != 'Base' LIMIT 1`);
            stmt.bind([profile.phone]);
            if (stmt.step()) hasBoost = true;
            stmt.free();
            if (!hasBoost) return next();
        }

        // 4. Load skills
        const skills: any[] = [];
        stmt = db.prepare(`SELECT * FROM skills WHERE phone = ?`);
        stmt.bind([profile.phone]);
        while (stmt.step()) skills.push(stmt.getAsObject());
        stmt.free();
        if (skills.length === 0) return next();

        // 5. Build provider display object
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

        // 6. Fetch SEO data + LocalBusiness schema
        const reqPath = `/p/${providerSlug}`;
        let { seo, schemas, faqs } = await fetchSeoData(reqPath, providerName);
        if (!seo.title || seo.title === 'Kurukoo — Wake up. Get going.') {
            seo = { ...seo, title: `${providerName} — ${String(skills[0].skill)} in ${provider.location}`, meta_description: `${providerName} offers ${skills.map((s: any) => s.skill).join(', ')} on Kurukoo. Trust score ${(Number(profile.trust_score) || 5).toFixed(1)}. Connect via WhatsApp.` };
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

// I1. Programmatic SEO Page — /:country/:category/:city-or-lga (§53.2.4)
app.get('/:categorySlug/:citySlug', async (req, res, next) => {
    try {
        const country = 'ng';
        const categorySlug = req.params.categorySlug;
        const citySlug = req.params.citySlug;
        const t = getLocale('en');

        // 1. Load categories
        const categoriesPath = path.join(process.cwd(), 'content', 'explore', 'categories.json');
        if (!fs.existsSync(categoriesPath)) return next();
        const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));

        // 2. Find category (with alias support)
        let category = categories.find((c: any) => c.slug === categorySlug);
        if (!category) {
            const cleanRaw = categorySlug.replace(/[^a-z0-9]/g, '');
            category = categories.find((c: any) => c.slug.replace(/[^a-z0-9]/g, '') === cleanRaw);
        }
        if (!category) return next();

        // 3. Find city
        const cities = PROGRAMMATIC_CITIES[country] || PROGRAMMATIC_CITIES.ng;
        const city = cities.find((c: any) => c.slug === citySlug);
        if (!city) return next();

        // 4. Query DB for provider stats
        const db = await getDb();
        const catKeywords = [category.slug, category.name, ...(category.relatedSlugs || [])]
            .map((k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const cityName = city.name.toLowerCase();
        let providerCount = 0, totalJobsCompleted = 0, sumRating = 0, ratedCount = 0;

        try {
            const stmt = db.prepare(`SELECT s.skill, s.rating, s.jobs_completed, m.location, m.primary_lga, m.primary_state, m.phone FROM skills s LEFT JOIN memory_profiles m ON s.phone = m.phone`);
            const matchedPhones = new Set<string>();
            while (stmt.step()) {
                const row = stmt.getAsObject();
                const sk = String(row.skill || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                if (catKeywords.some(kw => kw && (sk.includes(kw) || kw.includes(sk)))) {
                    const loc = String(row.location || row.primary_lga || row.primary_state || '').toLowerCase();
                    if (loc.includes(cityName) || loc === '') {
                        if (row.phone) matchedPhones.add(String(row.phone));
                        const jobs = Number(row.jobs_completed) || 0;
                        const rating = Number(row.rating) || 0;
                        totalJobsCompleted += jobs;
                        if (jobs > 0 && rating > 0) { sumRating += rating; ratedCount++; }
                    }
                }
            }
            stmt.free();
            providerCount = matchedPhones.size;
            if (providerCount === 0) {
                const stmt2 = db.prepare(`SELECT COUNT(*) as cnt FROM memory_profiles WHERE is_available = 1`);
                if (stmt2.step()) providerCount = Math.max(5, stmt2.getAsObject().cnt as number);
                stmt2.free();
            }
        } catch (dbErr) {
            console.warn('Programmatic page DB error:', dbErr);
            providerCount = 10;
        }

        const stats = { providerCount, avgRating: ratedCount > 0 ? (sumRating / ratedCount).toFixed(1) : '5.0', jobsCompleted: totalJobsCompleted };
        const relatedCategories = (category.relatedSlugs || []).map((relSlug: string) => {
            const sub = categories.find((c: any) => c.slug === relSlug);
            return sub ? { name: sub.name, slug: sub.slug, icon: sub.icon } : null;
        }).filter(Boolean).slice(0, 6);
        const otherCities = cities.filter((c: any) => c.slug !== citySlug).slice(0, 6);

        // 5. Fetch SEO data + Service schema
        const reqPath = `/${category.slug}/${city.slug}`;
        let { seo, schemas, faqs } = await fetchSeoData(reqPath, `${category.name} in ${city.name}`);
        if (!seo.title || seo.title === 'Kurukoo — Wake up. Get going.') {
            seo = { ...seo, title: `${category.name} in ${city.name} — Verified Providers | Kurukoo`, meta_description: `Find trusted ${category.name.toLowerCase()} in ${city.name}. ${String(category.description).substring(0, 120)} Connect via WhatsApp.` };
        }
        schemas = [...schemas, { '@context': 'https://schema.org', '@type': 'Service', serviceType: category.name, areaServed: { '@type': 'City', name: city.name }, provider: { '@type': 'Organization', name: 'Kurukoo' }, description: seo.meta_description }];

        res.render('programmatic', { country, t, shortcode: '*7000#', category, city, stats, relatedCategories, otherCities, seo, schemas, faqs, reqPath });
    } catch (e: any) {
        console.error('Programmatic page error:', e);
        next();
    }
});

// ──────────────────────────────────────────────
// Catch-all 404 logger → seo_404_log
// ──────────────────────────────────────────────
app.use(async (req, res) => {
    if (!res.headersSent) {
        res.status(404).send('Not found');
    }
    try {
        await log404(req.originalUrl || req.url, req.headers.referer || '');
    } catch (e) {
        console.error('404 log error:', e);
    }
});

app.listen(PORT, '0.0.0.0', async () => {
    await getDb();
    console.log(`Kurukoo server running on port ${PORT}`);
    
    // Start WhatsApp Keep-Alive session manager background scheduler
    try {
        startSessionManagerScheduler();
    } catch (schedErr) {
        console.error('Failed to start keep-alive scheduler:', schedErr);
    }
    
    try {
        await seedDemoAdCampaigns();
    } catch (seedErr) {
        console.error('Error seeding demo ad campaigns:', seedErr);
    }

    // Start background contact synchronization service
    try {
        await startContactSyncService();
    } catch (syncErr) {
        console.error('Failed to start contact sync service:', syncErr);
    }

    // Start background order delivery status updates service
    try {
        await startDeliveryStatusService();
    } catch (delivErr) {
        console.error('Failed to start delivery status service:', delivErr);
    }
    
    // Schedule: Data retention purge on startup and daily
    purgeExpiredData().catch(err => console.error('Error running initial data retention purge:', err));
    setInterval(() => {
        purgeExpiredData().catch(err => console.error('Error running daily data retention purge:', err));
    }, 24 * 60 * 60 * 1000);

    // Schedule: Server heartbeat log every 5 minutes
    const logHeartbeat = () => {
        const mem = process.memoryUsage();
        const rssMB = (mem.rss / 1024 / 1024).toFixed(2);
        const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotalMB = (mem.heapTotal / 1024 / 1024).toFixed(2);
        console.log(`[Heartbeat] Server healthy. Memory usage: RSS ${rssMB} MB, Heap ${heapUsedMB}/${heapTotalMB} MB.`);
    };
    logHeartbeat();
    setInterval(logHeartbeat, 5 * 60 * 1000);

    // Schedule: runEscrowPass() runs 30s after server start, then every 24h
    setTimeout(() => {
        runEscrowPass().catch(err => console.error('Error running initial escrow pass:', err));
    }, 30000);
    setInterval(() => {
        runEscrowPass().catch(err => console.error('Error running daily escrow pass:', err));
    }, 24 * 60 * 60 * 1000);
});
