/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
/**
 * Generates a standardized WhatsApp deep-link URL (wa.me/number?text=encodedText)
 * @param text The pre-filled message text to send to WhatsApp
 * @param number Optional recipient number, defaults to Kurukoo's number '2347000'
 */
export function generateWhatsAppDeepLink(text: string = 'Show nearby active providers', number: string = '2347000'): string {
    const cleanText = text.trim();
    // Normalize number if there are any non-digit chars
    const cleanNumber = number.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(cleanText)}`;
}
