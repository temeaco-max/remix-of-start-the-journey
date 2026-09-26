export type KurukooLocale = "gb" | "ng";

export const KURUKOO_LOCALES: Array<{
  code: KurukooLocale;
  label: string;
  flag: string;
  currency: string;
}> = [
  { code: "gb", label: "United Kingdom", flag: "🇬🇧", currency: "£" },
  { code: "ng", label: "Nigeria", flag: "🇳🇬", currency: "₦" },
];

const STORAGE_KEY = "kurukoo-locale";
const DEFAULT_LOCALE: KurukooLocale = "gb";

export function getLocale(): KurukooLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "ng" || stored === "gb" ? stored : DEFAULT_LOCALE;
}

export function setLocale(code: KurukooLocale): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, code);
}

export function localeMeta(code: KurukooLocale) {
  return KURUKOO_LOCALES.find((l) => l.code === code) ?? KURUKOO_LOCALES[0];
}
