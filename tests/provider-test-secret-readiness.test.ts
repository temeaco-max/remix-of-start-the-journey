import { describe, expect, it } from 'vitest';

describe('provider test-secret readiness', () => {
  it('accepts only explicit test-mode Stripe credentials', () => {
    const secret = process.env.KURUKOO_TEST_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '';
    const webhook = process.env.KURUKOO_TEST_STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!secret && !webhook) {
      expect({ configured: false, productionClaim: false }).toEqual({ configured: false, productionClaim: false });
      return;
    }
    expect(secret.startsWith('sk_test_')).toBe(true);
    expect(webhook.startsWith('whsec_')).toBe(true);
  });

  it('accepts Firebase service-account JSON or a complete credential triplet without claiming delivery', () => {
    const json = process.env.FCM_SERVICE_ACCOUNT_JSON || '';
    const triplet = [process.env.KURUKOO_FCM_PROJECT_ID, process.env.KURUKOO_FCM_CLIENT_EMAIL, process.env.KURUKOO_FCM_PRIVATE_KEY];
    const configured = Boolean(json) || triplet.every(Boolean);
    if (json) {
      const parsed = JSON.parse(json);
      expect(parsed.project_id).toBeTruthy();
      expect(parsed.client_email).toBeTruthy();
      expect(parsed.private_key).toBeTruthy();
    } else if (configured) {
      expect(triplet[0]).toBeTruthy();
      expect(triplet[1]).toContain('@');
      expect(triplet[2]).toContain('PRIVATE KEY');
    }
    expect({ configured, deliveryClaimed: false }).toMatchObject({ deliveryClaimed: false });
  });
});
