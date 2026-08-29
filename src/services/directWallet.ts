/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
export interface PaymentAdapterResult {
    ok: boolean;
    provider: string;
    reference?: string;
    error?: string;
}

/**
 * Direct wallet movement must never report success without a regulated provider
 * confirming the transaction. This adapter is intentionally fail-closed until
 * OPay/Moniepoint/Paga credentials and a real transaction implementation exist.
 */
export async function processDirectPayment(_payer: string, _payee: string, _amount: number): Promise<boolean> {
    const provider = process.env.KURUKOO_PAY_PROVIDER || 'sandbox';
    if (provider === 'sandbox') return false;
    console.warn(`[DIRECT WALLET] Provider '${provider}' has no production adapter; transfer not executed.`);
    return false;
}

export async function chargeProviderSubscription(_phone: string, _tier: string, _amount: number): Promise<boolean> {
    const provider = process.env.KURUKOO_PAY_PROVIDER || 'sandbox';
    if (provider === 'sandbox') return false;
    console.warn(`[DIRECT WALLET] Provider '${provider}' has no production subscription adapter; charge not executed.`);
    return false;
}
