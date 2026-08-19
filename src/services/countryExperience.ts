export type CountryCode = 'ng' | 'gh' | 'gb' | 'ca' | 'us';

export interface CountryExperience {
  code: CountryCode;
  iso3: string;
  name: string;
  locale: string;
  currency: string;
  currencyMinorUnit: string;
  defaultEmergencyNumber: string;
  publicPath: string;
  pricingManaged: boolean;
  channels: readonly string[];
}

const COUNTRY_EXPERIENCES: Record<CountryCode, CountryExperience> = {
  ng: {
    code: 'ng', iso3: 'NGA', name: 'Nigeria', locale: 'en-NG', currency: 'NGN', currencyMinorUnit: 'kobo',
    defaultEmergencyNumber: '112', publicPath: '/ng', pricingManaged: true,
    channels: ['web', 'whatsapp', 'telegram', 'sms', 'ussd', 'email', 'fcm', 'voice'],
  },
  gh: {
    code: 'gh', iso3: 'GHA', name: 'Ghana', locale: 'en-GH', currency: 'GHS', currencyMinorUnit: 'pesewas',
    defaultEmergencyNumber: '112', publicPath: '/gh', pricingManaged: true,
    channels: ['web', 'whatsapp', 'telegram', 'sms', 'ussd', 'email', 'fcm', 'voice'],
  },
  gb: {
    code: 'gb', iso3: 'GBR', name: 'United Kingdom', locale: 'en-GB', currency: 'GBP', currencyMinorUnit: 'pence',
    defaultEmergencyNumber: '999', publicPath: '/gb', pricingManaged: true,
    channels: ['web', 'whatsapp', 'telegram', 'sms', 'email', 'fcm', 'voice'],
  },
  ca: {
    code: 'ca', iso3: 'CAN', name: 'Canada', locale: 'en-CA', currency: 'CAD', currencyMinorUnit: 'cents',
    defaultEmergencyNumber: '911', publicPath: '/ca', pricingManaged: true,
    channels: ['web', 'whatsapp', 'telegram', 'sms', 'email', 'fcm', 'voice'],
  },
  us: {
    code: 'us', iso3: 'USA', name: 'United States', locale: 'en-US', currency: 'USD', currencyMinorUnit: 'cents',
    defaultEmergencyNumber: '911', publicPath: '/us', pricingManaged: true,
    channels: ['web', 'whatsapp', 'telegram', 'sms', 'email', 'fcm', 'voice'],
  },
};

export function normalizeCountryCode(value: unknown, fallback: CountryCode = 'ng'): CountryCode {
  const normalized = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(COUNTRY_EXPERIENCES, normalized) ? normalized as CountryCode : fallback;
}

export function getCountryExperience(value: unknown, fallback: CountryCode = 'ng'): CountryExperience {
  return COUNTRY_EXPERIENCES[normalizeCountryCode(value, fallback)];
}

export function listCountryExperiences(): CountryExperience[] {
  return Object.values(COUNTRY_EXPERIENCES);
}

export function isSupportedCountry(value: unknown): value is CountryCode {
  const normalized = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(COUNTRY_EXPERIENCES, normalized);
}
