import { getFirebaseFcmReadiness, getFirebaseWebConfig } from './firebaseCloudMessaging.js';
import { getMqttBridgeStatus } from './iotBridge.js';
import { getWebRTCClientConfig, getWebRTCStatus } from './webrtcSignalling.js';
import { getTrustedContactReadiness } from './trustedContactService.js';
import { getMistralStatus } from './mistralService.js';

export interface IntegrationOperationalStatus {
  id: 'fcm' | 'mqtt_iot' | 'webrtc' | 'trusted_contacts' | 'mistral_ai';
  configured: boolean;
  connected: boolean;
  runtimeReady: boolean;
  physicalOrProviderEvidenceRequired: boolean;
  detail: string;
}

export function getExternalIntegrationOperationalStatus(): IntegrationOperationalStatus[] {
  const fcm = getFirebaseFcmReadiness();
  const web = getFirebaseWebConfig();
  const mqtt = getMqttBridgeStatus();
  const webrtc = getWebRTCStatus();
  const webrtcConfig = getWebRTCClientConfig();
  const trustedContacts = getTrustedContactReadiness();
  const mistral = getMistralStatus();
  const mistralText = mistral.capabilities.find(capability => capability.capability === 'text');

  return [
    {
      id: 'mistral_ai',
      configured: mistral.configured,
      connected: Boolean(mistralText?.available),
      runtimeReady: Boolean(mistralText?.available),
      physicalOrProviderEvidenceRequired: true,
      detail: mistralText?.note || 'Mistral provider status unavailable.',
    },
    {
      id: 'fcm',
      configured: fcm.configured && web.configured,
      connected: fcm.configured,
      runtimeReady: fcm.configured && web.configured,
      physicalOrProviderEvidenceRequired: true,
      detail: fcm.configured && web.configured
        ? 'Server and Web/PWA Firebase configuration are present. A real registered device and physical receipt still provide delivery evidence.'
        : fcm.reason || web.reason,
    },
    {
      id: 'mqtt_iot',
      configured: mqtt.configured,
      connected: mqtt.connected,
      runtimeReady: mqtt.configured && mqtt.connected,
      physicalOrProviderEvidenceRequired: true,
      detail: mqtt.connected ? `Broker connected; ${mqtt.subscribedTopics} authorized state topics are subscribed.` : mqtt.lastError || mqtt.activationRequirement,
    },
    {
      id: 'webrtc',
      configured: webrtc.relayConfigured,
      connected: false,
      runtimeReady: webrtc.available && webrtcConfig.iceServers.length > 0,
      physicalOrProviderEvidenceRequired: true,
      detail: webrtc.available ? `WebRTC signalling and ICE configuration are available via ${webrtcConfig.transport}; peer interoperability still requires a real call.` : webrtc.activationRequirement,
    },
    {
      id: 'trusted_contacts',
      configured: trustedContacts.providerAvailable,
      connected: trustedContacts.providerAvailable,
      runtimeReady: trustedContacts.providerAvailable,
      physicalOrProviderEvidenceRequired: true,
      detail: trustedContacts.providerAvailable
        ? 'At least one trusted-contact delivery provider is configured. Consent remains owner- and recipient-driven, and provider delivery still requires evidence.'
        : trustedContacts.reason,
    },
  ];
}
