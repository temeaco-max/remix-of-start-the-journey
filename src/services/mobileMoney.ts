/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import crypto from 'node:crypto';

export interface PaymentPayload {
    success: boolean;
    checkoutUrl: string;
    transactionReference: string;
    gatewayResponse: string;
}

export interface KycResponse {
    verified: boolean;
    fullName: string;
    idNumber: string;
    idType: 'NIN' | 'BVN' | 'UK_NINO';
    message: string;
}

/**
 * Payment orchestration boundary. A configured provider must have a real API
 * adapter before Kurukoo can report a checkout as created. Never fabricate a
 * checkout URL or transaction success.
 */
export async function initiateMobileMoneyTopup(
    provider: string,
    phone: string,
    amount: number
): Promise<PaymentPayload> {
    const activeProvider = (process.env.KURUKOO_PAY_PROVIDER || 'sandbox').trim().toLowerCase();
    const requestedProvider = provider.trim().toLowerCase();
    if (!phone || !Number.isFinite(amount) || amount <= 0) {
        return { success: false, checkoutUrl: '', transactionReference: '', gatewayResponse: 'Invalid payment request' };
    }

    // Keep sandbox explicitly non-production. It produces no externally valid
    // payment URL and cannot mutate the user's balance.
    if (activeProvider === 'sandbox' || process.env.NODE_ENV !== 'production' && requestedProvider === 'sandbox') {
        const reference = `KURUKOO-SANDBOX-${crypto.randomBytes(8).toString('hex')}`;
        return {
            success: false,
            checkoutUrl: '',
            transactionReference: reference,
            gatewayResponse: 'Sandbox payment adapter is not a real payment rail. Configure a supported provider before launch.'
        };
    }

    // Provider adapters must be implemented against the provider's current API,
    // webhook/signature scheme, idempotency rules and settlement callbacks.
    // Until then, fail closed instead of claiming a payment session exists.
    return {
        success: false,
        checkoutUrl: '',
        transactionReference: '',
        gatewayResponse: 'A payment provider is configured but has no verified production adapter.'
    };
}

/**
 * Identity verification boundary. Never return fabricated names or claim that
 * a government identity registry was queried. Provider adapters must perform
 * the real lookup and preserve the provider's verification reference/audit data.
 */
export async function verifyIdentity(
    _phone: string,
    idNumber: string,
    idType: 'NIN' | 'BVN' | 'UK_NINO'
): Promise<KycResponse> {
    const normalized = idNumber.trim();
    const validLength = idType === 'UK_NINO' ? /^[A-Z]{2}\d{6}[A-Z]$/i.test(normalized) : /^\d{11}$/.test(normalized);
    if (!validLength) {
        return { verified: false, fullName: '', idNumber: normalized, idType, message: `Validation failed: ${idType} format is invalid.` };
    }

    return {
        verified: false,
        fullName: '',
        idNumber: normalized,
        idType,
        message: 'No production identity provider is configured. Verification has not been performed.'
    };
}
