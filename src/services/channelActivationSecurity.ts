const present = (value: unknown): boolean => {
  const normalized = String(value || '').trim().toLowerCase();
  return Boolean(normalized) && !['stub', 'unconfigured'].includes(normalized) && !normalized.startsWith('change_me');
};

const encryptionSecretConfigured = (env: NodeJS.ProcessEnv): boolean =>
  present(env.KURUKOO_STORAGE_ENCRYPTION_KEY)
  || present(env.MEMORY_ENCRYPTION_KEY)
  || String(env.JWT_SECRET || '').trim().length >= 32;

/**
 * Security prerequisites layered on top of provider/channel credentials.
 * These checks deliberately do not prove live provider/device evidence.
 */
export function getChannelActivationSecurity(env: NodeJS.ProcessEnv = process.env) {
  const telegramEnabled = env.KURUKOO_TELEGRAM_LINKED_DEVICE_ENABLED === 'true'
    && env.KURUKOO_TELEGRAM_LINKED_DEVICE_ALLOW === 'true';
  const telegramSecurityReady = !telegramEnabled || encryptionSecretConfigured(env);

  const whatsappEnabled = env.KURUKOO_WHATSAPP_LINKED_DEVICE_ENABLED === 'true'
    && env.KURUKOO_WHATSAPP_LINKED_DEVICE_ALLOW === 'true';
  const whatsappAuthDir = String(env.KURUKOO_WHATSAPP_LINKED_DEVICE_AUTH_DIR || '').trim();
  const whatsappSecurityReady = !whatsappEnabled || (
    Boolean(whatsappAuthDir)
    && !whatsappAuthDir.startsWith('/tmp/')
    && !whatsappAuthDir.startsWith('/var/tmp/')
  );

  return {
    telegram: { enabled: telegramEnabled, encryptionReady: telegramSecurityReady },
    whatsapp: { enabled: whatsappEnabled, persistentAuthPathReady: whatsappSecurityReady },
  };
}

export function isTelegramActivationSecure(env: NodeJS.ProcessEnv = process.env): boolean {
  return getChannelActivationSecurity(env).telegram.encryptionReady;
}

export function isWhatsAppActivationSecure(env: NodeJS.ProcessEnv = process.env): boolean {
  return getChannelActivationSecurity(env).whatsapp.persistentAuthPathReady;
}
